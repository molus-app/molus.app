import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { build } from "../build.js";

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
  assert.ok(fs.existsSync(path.join(distDir, "posts", "sample-post", "index.html")));
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
  assert.doesNotMatch(html, /<figure/);
  assert.doesNotMatch(html, /A caption/);
  assert.doesNotMatch(html, /demo/);
});

test("colocated assets are copied alongside the post HTML", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const asset = path.join(distDir, "posts", "sample-post", "cover-image", "image.png");
  assert.ok(fs.existsSync(asset), "asset should be copied into the output package dir");
  assert.equal(fs.readFileSync(asset, "utf-8"), "PNGDATA");
});

test("index.md is not copied into the output as an asset", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  assert.ok(
    !fs.existsSync(path.join(distDir, "posts", "sample-post", "index.md")),
    "index.md is the content source, not a copied asset",
  );
});

test("dates render as written in frontmatter, not shifted by timezone", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(
    path.join(distDir, "posts", "sample-post", "index.html"),
    "utf-8",
  );
  assert.match(html, /June 8, 2026/);
  assert.doesNotMatch(html, /June 7, 2026/);
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
  assert.ok(
    html.indexOf("Older Post") < html.indexOf("Sample Post"),
    "older post should be listed before newer post",
  );
});

test("header shows theme-swapping logos and a toggle, and no nav", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
  assert.match(html, /Molus_Logo_Horizontal_Black\.png/);
  assert.match(html, /Molus_Logo_Horizontal_White\.png/);
  assert.match(html, /class="theme-toggle"/);
  assert.match(html, /aria-label="Dark mode"/);
  assert.match(html, /aria-pressed/);
  assert.doesNotMatch(html, /<nav/);
});

test("theme is initialized in <head> before first paint", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
  assert.match(html, /localStorage\.getItem\("theme"\)/);
  assert.match(html, /prefers-color-scheme/);
  assert.ok(
    html.indexOf("localStorage.getItem") < html.indexOf("</head>"),
    "theme-init script must run in <head>",
  );
  assert.match(html, /:root\[data-theme="dark"\][\s\S]*?--bg: #1c1917;/);
});

test("back link sits below the post content", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(
    path.join(distDir, "posts", "sample-post", "index.html"),
    "utf-8",
  );
  assert.ok(
    html.indexOf('class="back-link"') > html.indexOf("Body text"),
    "back link should come after the prose",
  );
});

test("footer has slashed copyright, year, and the configured links", () => {
  const { distDir, postsDir } = makeFixture();
  build({ distDir, postsDir });
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
  assert.match(html, /class="copyleft"/);
  assert.ok(
    html.includes("</span> 2026</span>"),
    "footer should show only the founding year after the symbol",
  );
  assert.match(html, /href="https:\/\/github\.com\/molus-app\/molus\.app-src"/);
  assert.match(html, /href="mailto:contact@molus\.app"/);
});
