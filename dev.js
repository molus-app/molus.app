import fs from "fs";
import path from "path";
import http from "http";
import { execSync } from "child_process";

const DIST = "dist";
const PORT = process.env.PORT || 3000;
const WATCH_DIRS = ["posts", "pages", "templates", "static"];
const WATCH_FILES = ["config.js", "build.js"];

// ── SSE clients for live reload ─────────────────────────

let clients = [];

function notifyReload() {
  for (const res of clients) {
    res.write("data: reload\n\n");
  }
}

// ── Rebuild ─────────────────────────────────────────────

function rebuild() {
  try {
    execSync("node build.js", { stdio: "pipe" });
    console.log(`  rebuilt @ ${new Date().toLocaleTimeString()}`);
    return true;
  } catch (e) {
    console.error("  build error:", e.stderr?.toString() || e.message);
    return false;
  }
}

// ── File watcher ────────────────────────────────────────

let debounce = null;

function onChange() {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    if (rebuild()) notifyReload();
  }, 100);
}

for (const dir of WATCH_DIRS) {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, onChange);
  }
}

for (const file of WATCH_FILES) {
  if (fs.existsSync(file)) {
    // Use stat polling for root files because many editors save via
    // atomic replace, which can break path-based fs.watch listeners.
    fs.watchFile(file, { interval: 200 }, (curr, prev) => {
      if (curr.mtimeMs !== prev.mtimeMs || curr.size !== prev.size) {
        onChange();
      }
    });
  }
}

process.on("exit", () => {
  for (const file of WATCH_FILES) {
    fs.unwatchFile(file);
  }
});

// ── Inject reload script into HTML responses ────────────

const RELOAD_SNIPPET = `<script>
new EventSource("/__reload").onmessage = () => location.reload();
</script>`;

// ── Static file server ──────────────────────────────────

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function serve(req, res) {
  // SSE endpoint for live reload
  if (req.url === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    clients.push(res);
    req.on("close", () => {
      clients = clients.filter((c) => c !== res);
    });
    return;
  }

  // Resolve file path
  let filePath = path.join(DIST, req.url === "/" ? "index.html" : req.url);

  // Try /dir/index.html for clean URLs
  if (!path.extname(filePath) && fs.existsSync(filePath + "/index.html")) {
    filePath = filePath + "/index.html";
  } else if (!path.extname(filePath) && fs.existsSync(filePath + ".html")) {
    filePath = filePath + ".html";
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("404");
    return;
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || "application/octet-stream";
  let content = fs.readFileSync(filePath);

  // Inject reload script into HTML
  if (ext === ".html") {
    content = content.toString().replace("</body>", `${RELOAD_SNIPPET}\n</body>`);
  }

  res.writeHead(200, { "Content-Type": mime });
  res.end(content);
}

// ── Start ───────────────────────────────────────────────

rebuild();

http.createServer(serve).listen(PORT, () => {
  console.log(`\n  dev server → http://localhost:${PORT}`);
  console.log(`  watching for changes...\n`);
});
