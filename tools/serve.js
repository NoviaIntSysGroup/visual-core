// Static file server with live-reload for previewing decks (Bun).
//   bun run core/tools/serve.js   serves the project root on :8099 (or $PORT)
//   bun run tools/serve.js        from core: serves the core; / redirects to
//   /example/
// Each request reads from disk, so a manual refresh always shows the latest.
import { watch } from "node:fs";

const ROOT = process.cwd().replace(/\\/g, "/") + "/";
const PORT = Number(process.env.PORT || 8099);
const OWN_ORIGINS = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`];

const TYPES = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  md: "text/markdown; charset=utf-8",
};

// Tiny client that polls a version number and reloads when it changes. Polling, not
// SSE: a held-open stream per tab saturates the browser's ~6 connections per origin
// and stalls page loads. Self-removing, so it never lands in the editor's saved
// snapshot.
const RELOAD_SNIPPET =
  '<script>(function(){window.DEV_SERVER=true;var s=document.currentScript;var v=null;' +
  'function poll(){fetch("/__livereload",{cache:"no-store"}).then(function(r){return r.text();})' +
  '.then(function(t){if(v===null){v=t;}else if(t!==v){location.reload();}}).catch(function(){});}' +
  "setInterval(poll,1000);poll();if(s)s.remove();})()</script>";

// A monotonic version the client polls. Each detected change bumps it; the next
// poll (within ~1 s) sees a different value and reloads. No held connections, no
// per-client bookkeeping.
let version = 0;

// Watch the tree, debounced, ignoring noise (.git, the editor's own writes are fine).
// 150 ms trailing debounce so a multi-file or editor atomic-save sequence
// coalesces into a single version bump after writes settle.
let timer = null;
let lastChanged = "";
watch(ROOT, { recursive: true }, (_event, filename) => {
  if (filename && (filename.includes(".git") || filename.includes("node_modules"))) return;
  if (filename) lastChanged = filename;
  clearTimeout(timer);
  timer = setTimeout(() => {
    version++;
    console.log(`change #${version} ← ${lastChanged}`);
  }, 150);
});

Bun.serve({
  port: PORT,
  hostname: "localhost",
  async fetch(req) {
    const url = new URL(req.url);

    // Live-reload version probe. Returns the current version immediately and
    // closes — the client polls this and reloads when the number changes.
    if (url.pathname === "/__livereload") {
      return new Response(String(version), {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }

    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = Bun.file(ROOT + path);

    // The deck editor saves here when RELOAD_SNIPPET has set window.DEV_SERVER.
    // Only this server's own pages may write, and only over an existing .html file.
    if (req.method === "PUT") {
      const allowed = OWN_ORIGINS.includes(req.headers.get("origin"))
        && path.endsWith(".html") && !path.includes("..") && (await file.exists());
      if (!allowed) return new Response("Forbidden", { status: 403 });
      await Bun.write(file, await req.text());
      return new Response(null, { status: 204 });
    }

    if (!(await file.exists())) {
      // The core alone has no root index.html, so / goes to the example's landing page.
      if (url.pathname === "/") return Response.redirect(new URL("/example/", url).href, 302);
      return new Response("Not found", { status: 404 });
    }

    const ext = path.split(".").pop().toLowerCase();
    const type = TYPES[ext] || "application/octet-stream";
    const headers = { "content-type": type, "cache-control": "no-store" };

    // Inject the live-reload client at the end of HTML documents — but not into
    // `?thumb` previews. Those are landing-page iframes; a poller in each would
    // reload every nested doc independently and add needless requests. The
    // landing page itself carries the snippet, and reloading it re-creates the
    // thumbnail iframes, so thumbnails refresh through the parent.
    if (ext === "html" && !url.searchParams.has("thumb")) {
      let html = await file.text();
      html = html.includes("</body>")
        ? html.replace("</body>", RELOAD_SNIPPET + "</body>")
        : html + RELOAD_SNIPPET;
      return new Response(html, { headers });
    }
    return new Response(file, { headers });
  },
});

console.log(`serving ${ROOT} on http://localhost:${PORT} (live-reload on)`);
