import fs from "fs";
import path from "path";

const DIST = "dist";
const PORT = Number(process.env.PORT ?? 3000);
const WATCH_DIRS = ["posts", "templates", "static"];
const WATCH_FILES = ["config.ts", "build.ts"];

// ── SSE clients for live reload ─────────────────────────

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

function notifyReload(): void {
  const msg = new TextEncoder().encode("data: reload\n\n");
  for (const controller of clients) {
    try {
      controller.enqueue(msg);
    } catch {
      clients.delete(controller);
    }
  }
}

// ── Rebuild ─────────────────────────────────────────────

async function rebuild(): Promise<boolean> {
  try {
    await Bun.$`bun build.ts`.quiet();
    console.log(`  rebuilt @ ${new Date().toLocaleTimeString()}`);
    return true;
  } catch (e) {
    const err = e as import("bun").$.ShellError;
    console.error("  build error:", err.stderr?.toString() || err.message);
    return false;
  }
}

// ── File watcher ────────────────────────────────────────

let debounce: ReturnType<typeof setTimeout> | null = null;

function onChange(): void {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    void rebuild().then((ok) => {
      if (ok) notifyReload();
    });
  }, 100);
}

for (const dir of WATCH_DIRS) {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, onChange);
  }
}

for (const file of WATCH_FILES) {
  if (fs.existsSync(file)) {
    // Use stat polling for root files because many editors save via atomic
    // replace, which can break path-based fs.watch listeners.
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

// ── Request handler ─────────────────────────────────────

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = decodeURIComponent(url.pathname);

  // SSE endpoint for live reload
  if (pathname === "/__reload") {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        clients.add(controller);
        req.signal.addEventListener("abort", () => {
          clients.delete(controller);
          try {
            controller.close();
          } catch {
            // stream already closed
          }
        });
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Resolve file path, trying /dir/index.html then .html for clean URLs
  let filePath = path.join(DIST, pathname === "/" ? "index.html" : pathname);
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + "/index.html")) {
      filePath = filePath + "/index.html";
    } else if (fs.existsSync(filePath + ".html")) {
      filePath = filePath + ".html";
    }
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return new Response("404", { status: 404 });
  }

  // Inject the reload script into HTML; stream everything else verbatim.
  if (file.type.startsWith("text/html")) {
    const html = (await file.text()).replace("</body>", `${RELOAD_SNIPPET}\n</body>`);
    return new Response(html, { headers: { "Content-Type": file.type } });
  }
  return new Response(file);
}

// ── Start ───────────────────────────────────────────────

// Bind to PORT, scanning upward for the first open port (like Next/Vite).
function startServer(port: number, attemptsLeft = 20): ReturnType<typeof Bun.serve> {
  try {
    return Bun.serve({ port, fetch: handle });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`  port ${port} in use, trying ${port + 1}...`);
      return startServer(port + 1, attemptsLeft - 1);
    }
    throw e;
  }
}

await rebuild();
const server = startServer(PORT);
console.log(`\n  dev server → http://localhost:${server.port}`);
console.log(`  watching for changes...\n`);
