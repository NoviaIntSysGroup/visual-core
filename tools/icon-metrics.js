// Measure the ink box of every icon in icons.js, to check or regenerate the recorded
// boxes (Bun): bun run core/tools/icon-metrics.js
// Prints the ink box (geometry + stroke) and where each icon lands in the 100-unit
// box. A recorded box may differ on purpose, to exclude a light detail: those show as
// DIFF.
import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
globalThis.window = {};
new Function(readFileSync(ROOT + "drawing-kit/icons/icons.js", "utf8"))();
const { icons: ICONS, FIT } = globalThis.window.Icons;

// Stroke widths in authoring units, mirroring the fallbacks in icons.css.
const STROKE = { line: 6, thin: 5, detail: 4 };
function strokeFor(classes) {
  const c = ` ${classes.join(" ")} `;
  if (/ icon-robot-(ant|mouth) /.test(c)) return STROKE.detail;
  if (/ icon-fill | icon-person | icon-robot-(head|accent|screen|face) /.test(c)) return 0;
  if (/ icon-line-thin /.test(c)) return STROKE.thin;
  if (/ icon-line | icon-card /.test(c)) return STROKE.line;
  return 0;
}

// --- affine transforms: [a, b, c, d, e, f] ---
const I = [1, 0, 0, 1, 0, 0];
const mul = (m, k) => [
  m[0] * k[0] + m[2] * k[1], m[1] * k[0] + m[3] * k[1],
  m[0] * k[2] + m[2] * k[3], m[1] * k[2] + m[3] * k[3],
  m[0] * k[4] + m[2] * k[5] + m[4], m[1] * k[4] + m[3] * k[5] + m[5],
];
const apply = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
const scaleOf = (m) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));

function parseTransform(str) {
  let m = I;
  for (const [, op, argStr] of str.matchAll(/(translate|scale|rotate)\s*\(([^)]*)\)/g)) {
    const a = argStr.trim().split(/[\s,]+/).map(Number);
    if (op === "translate") m = mul(m, [1, 0, 0, 1, a[0], a[1] || 0]);
    else if (op === "scale") m = mul(m, [a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0]);
    else {
      const r = (a[0] * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
      let rm = [c, s, -s, c, 0, 0];
      if (a.length === 3) rm = mul(mul([1, 0, 0, 1, a[1], a[2]], rm), [1, 0, 0, 1, -a[1], -a[2]]);
      m = mul(m, rm);
    }
  }
  return m;
}

// --- sample each primitive into points; isotropic stroke padding around every
//     point is exactly a round cap/join, which is what the icons use ---
const N = 64;
const arc = (cx, cy, rx, ry, a0, a1) =>
  Array.from({ length: N + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / N;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

function rectPts(x, y, w, h, rx, ry) {
  rx = Math.min(rx || ry || 0, w / 2);
  ry = Math.min(ry || rx || 0, h / 2);
  if (!rx && !ry) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const H = Math.PI / 2;
  return [
    ...arc(x + w - rx, y + h - ry, rx, ry, 0, H),         // bottom-right
    ...arc(x + rx, y + h - ry, rx, ry, H, 2 * H),         // bottom-left
    ...arc(x + rx, y + ry, rx, ry, 2 * H, 3 * H),         // top-left
    ...arc(x + w - rx, y + ry, rx, ry, 3 * H, 4 * H),     // top-right
  ];
}

function pathPts(d) {
  const pts = [];
  const toks = d.match(/[MLHVQCZmlhvqcz]|-?\d*\.?\d+/g) || [];
  let i = 0, cur = [0, 0], start = [0, 0];
  const num = () => parseFloat(toks[i++]);
  const bez = (P) => {
    for (let t = 0; t <= 1.0001; t += 1 / N) {
      let q = P.map((p) => p.slice());
      while (q.length > 1) {
        const next = [];
        for (let k = 0; k < q.length - 1; k++)
          next.push([q[k][0] + (q[k + 1][0] - q[k][0]) * t, q[k][1] + (q[k + 1][1] - q[k][1]) * t]);
        q = next;
      }
      pts.push(q[0]);
    }
  };
  while (i < toks.length) {
    const c = toks[i++];
    if (c === "M") { cur = [num(), num()]; start = cur; pts.push(cur); }
    else if (c === "L") { cur = [num(), num()]; pts.push(cur); }
    else if (c === "H") { cur = [num(), cur[1]]; pts.push(cur); }
    else if (c === "V") { cur = [cur[0], num()]; pts.push(cur); }
    else if (c === "Q") { const p1 = [num(), num()], p2 = [num(), num()]; bez([cur, p1, p2]); cur = p2; }
    else if (c === "C") { const p1 = [num(), num()], p2 = [num(), num()], p3 = [num(), num()]; bez([cur, p1, p2, p3]); cur = p3; }
    else if (c === "Z" || c === "z") cur = start;
    else { i--; cur = [num(), num()]; pts.push(cur); }
  }
  return pts;
}

function inkBox(svg) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (pts, m, sw) => {
    const pad = (sw / 2) * scaleOf(m);
    for (const p of pts) {
      const [qx, qy] = apply(m, p);
      x0 = Math.min(x0, qx - pad); x1 = Math.max(x1, qx + pad);
      y0 = Math.min(y0, qy - pad); y1 = Math.max(y1, qy + pad);
    }
  };
  const stack = [{ m: I, cls: [] }];
  for (const [, close, tag, attrStr] of svg.matchAll(/<(\/?)(g|circle|ellipse|rect|line|path)\b([^>]*)>/g)) {
    if (close) { stack.pop(); continue; }
    const at = Object.fromEntries(
      [...attrStr.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
    const top = stack[stack.length - 1];
    const m = at.transform ? mul(top.m, parseTransform(at.transform)) : top.m;
    const cls = top.cls.concat((at.class || "").split(/\s+/).filter(Boolean));
    if (tag === "g") { stack.push({ m, cls }); continue; }
    const sw = strokeFor(cls);
    const f = (k) => parseFloat(at[k] || 0);
    if (tag === "circle") add(arc(f("cx"), f("cy"), f("r"), f("r"), 0, 2 * Math.PI), m, sw);
    else if (tag === "ellipse") add(arc(f("cx"), f("cy"), f("rx"), f("ry"), 0, 2 * Math.PI), m, sw);
    else if (tag === "rect") add(rectPts(f("x"), f("y"), f("width"), f("height"), f("rx"), f("ry")), m, sw);
    else if (tag === "line") add([[f("x1"), f("y1")], [f("x2"), f("y2")]], m, sw);
    else if (tag === "path") add(pathPts(at.d), m, sw);
  }
  return [x0, y0, x1 - x0, y1 - y0].map((v) => Math.round(v * 10) / 10);
}

const p = (v, w = 6) => v.toFixed(1).padStart(w);
console.log(`FIT = ${FIT}\n`);
console.log("icon        measured ink box          recorded box              fitted extent in the 100 box");
for (const [name, icon] of Object.entries(ICONS)) {
  const ink = inkBox(`<g>${icon.svg}</g>`);
  const b = icon.box;
  const same = ink.every((v, i) => Math.abs(v - b[i]) < 0.2);
  const s = FIT / Math.max(b[2], b[3]);
  const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2;
  // where the real ink lands once the recorded box is fitted and centred
  const fx0 = 50 + (ink[0] - cx) * s, fy0 = 50 + (ink[1] - cy) * s;
  const fx1 = fx0 + ink[2] * s, fy1 = fy0 + ink[3] * s;
  console.log(
    name.padEnd(11) +
    ink.map((v) => p(v)).join(" ") + "  " +
    b.map((v) => p(v)).join(" ") + (same ? "   " : " ! ") +
    `x ${p(fx0)}–${p(fx1)}  y ${p(fy0)}–${p(fy1)}`);
}
console.log("\n! = recorded box differs from the ink box (deliberate: excludes a light detail from the fit)");
