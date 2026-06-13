import { test, expect } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { build } from "../build.ts";

// Pin a UTC-negative timezone so date-rendering regressions reproduce anywhere.
process.env.TZ = "America/Chicago";

// Build an isolated fixture: a temp dir with a single post package that has
// a colocated asset folder with an image referenced from the prose.
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ssg-test-"));
  const postsDir = path.join(root, "posts");
  const distDir = path.join(root, "dist");

  const pkg = path.join(postsDir, "sample-post", "cover-image");
  fs.mkdirSync(pkg, { recursive: true });

  fs.writeFileSync(
    path.join(postsDir, "sample-post", "index.md"),
    `---
title: "Sample Post"
date: 2026-06-08
---

Body text with an [inline image](cover-image/image.png).
`,
  );
  fs.writeFileSync(path.join(pkg, "image.png"), "PNGDATA");

  return { root, postsDir, distDir };
}

test("post package builds to dist/posts/<slug>/index.html", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  expect(fs.existsSync(path.join(distDir, "posts", "sample-post", "index.html"))).toBe(true);
});

test("cover/tags frontmatter is ignored — no figure, caption, or tags render", () => {
  const { distDir, postsDir } = makeFixture();
  fs.writeFileSync(
    path.join(postsDir, "sample-post", "index.md"),
    `---
title: "Sample Post"
date: 2026-06-08
tags: [demo]
cover: cover-image/image.png
coverCaption: "A caption"
---

Body text.
`,
  );
  build({ distDir, postsDir });
  const html = fs.readFileSync(
    path.join(distDir, "posts", "sample-post", "index.html"),
    "utf-8",
  );
  expect(html).not.toMatch(/<figure/);
  expect(html).not.toMatch(/A caption/);
  expect(html).not.toMatch(/demo/);
});

test("colocated assets are copied alongside the post HTML", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const asset = path.join(distDir, "posts", "sample-post", "cover-image", "image.png");
  expect(fs.existsSync(asset)).toBe(true); // asset should be copied into the output package dir
  expect(fs.readFileSync(asset, "utf-8")).toBe("PNGDATA");
});

test("index.md is not copied into the output as an asset", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  // index.md is the content source, not a copied asset
  expect(fs.existsSync(path.join(distDir, "posts", "sample-post", "index.md"))).toBe(false);
});

test("dates render as written in frontmatter, not shifted by timezone", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(
    path.join(distDir, "posts", "sample-post", "index.html"),
    "utf-8",
  );
  expect(html).toMatch(/June 8, 2026/);
  expect(html).not.toMatch(/June 7, 2026/);
});

test("index page lists posts oldest first", () => {
  const { distDir, postsDir } = makeFixture();
  // makeFixture's sample-post is dated 2026-06-08; add an older one.
  fs.mkdirSync(path.join(postsDir, "older-post"), { recursive: true });
  fs.writeFileSync(
    path.join(postsDir, "older-post", "index.md"),
    `---
title: "Older Post"
date: 2026-06-01
---

Old words.
`,
  );
  build({ distDir, postsDir });
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
  // older post should be listed before newer post
  expect(html.indexOf("Older Post")).toBeLessThan(html.indexOf("Sample Post"));
});

test("header shows theme-swapping logos and a toggle, and no nav", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
  expect(html).toMatch(/Molus_Logo_Horizontal_Black\.png/);
  expect(html).toMatch(/Molus_Logo_Horizontal_White\.png/);
  expect(html).toMatch(/class="theme-toggle"/);
  expect(html).toMatch(/aria-label="Dark mode"/);
  expect(html).toMatch(/aria-pressed/);
  expect(html).not.toMatch(/<nav/);
});

test("theme is initialized in <head> before first paint", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
  expect(html).toMatch(/localStorage\.getItem\("theme"\)/);
  expect(html).toMatch(/prefers-color-scheme/);
  // theme-init script must run in <head>
  expect(html.indexOf("localStorage.getItem")).toBeLessThan(html.indexOf("</head>"));
  expect(html).toMatch(/:root\[data-theme="dark"\][\s\S]*?--bg: #1c1917;/);
  // moonlight blue accent in light mode, sunlight amber in dark mode
  expect(html).toMatch(
    /--accent: #3069a6;[\s\S]*?:root\[data-theme="dark"\][\s\S]*?--accent: #f59e0b;/,
  );
});

test("back link sits below the post content", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(
    path.join(distDir, "posts", "sample-post", "index.html"),
    "utf-8",
  );
  // back link should come after the prose
  expect(html.indexOf('class="back-link"')).toBeGreaterThan(html.indexOf("Body text"));
});

test("footer has slashed copyright, year, and the configured links", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
  expect(html).toMatch(/class="copyleft"/);
  // footer should show only the founding year after the symbol
  expect(html.includes("</span> 2026</span>")).toBe(true);
  expect(html).toMatch(/href="https:\/\/github\.com\/molus-app\/molus\.app-src"/);
  expect(html).toMatch(/href="mailto:contact@molus\.app"/);
});
