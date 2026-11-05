// Alpha-weighted ink coverage of logo artwork, printed per file: the `cover` that
// figures and image blocks use to size marks by optical weight. Measured offline
// because a file:// image taints the canvas. Decodes 8-bit non-interlaced PNG.
//
//   bun run core/tools/mark-coverage.js <file|folder>...   // a folder means every .png in it
import { readFileSync, readdirSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

// Parse IHDR + concatenated IDAT, inflate, and undo the per-row filters.
function decode(file) {
  const buf = readFileSync(file);
  let off = 8, idat = [], ihdr = null;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], color: data[9], interlace: data[12] };
    } else if (type === "IDAT") idat.push(data);
    off += 12 + len;
  }
  if (!ihdr) throw new Error(`${file}: no IHDR`);
  if (ihdr.depth !== 8 || ihdr.interlace !== 0) {
    throw new Error(`${file}: only 8-bit non-interlaced PNG is supported (depth ${ihdr.depth}, interlace ${ihdr.interlace})`);
  }
  const ch = CHANNELS[ihdr.color];
  const raw = inflateSync(Buffer.concat(idat));
  const stride = ihdr.w * ch;
  const out = Buffer.alloc(ihdr.h * stride);
  let p = 0;
  for (let y = 0; y < ihdr.h; y++) {
    const filter = raw[p++];
    const line = raw.subarray(p, p + stride); p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 255;
    }
  }
  return { ihdr, ch, px: out, stride };
}

// Coverage weighted by alpha, so a soft-edged mark isn't over- or under-counted
// the way a hard >threshold test would make it.
function coverage(file) {
  const { ihdr, ch, px, stride } = decode(file);
  if (ihdr.color !== 6 && ihdr.color !== 4) return 1;   // no alpha channel: fully covered
  let sum = 0;
  for (let y = 0; y < ihdr.h; y++) {
    for (let x = 0; x < ihdr.w; x++) sum += px[y * stride + x * ch + (ch - 1)] / 255;
  }
  return sum / (ihdr.w * ihdr.h);
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: bun run core/tools/mark-coverage.js <file|folder>...");
  process.exit(1);
}
const files = args.flatMap((p) => statSync(p).isDirectory()
  ? readdirSync(p).filter((f) => f.endsWith(".png")).map((f) => `${p}/${f}`)
  : [p]);

for (const file of files) {
  const { ihdr } = decode(file);
  console.log(
    file.split("/").pop().padEnd(26),
    `${ihdr.w}x${ihdr.h}`.padEnd(10),
    `cover: ${coverage(file).toFixed(3)}`
  );
}
