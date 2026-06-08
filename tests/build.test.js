import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { build } from "../build.js";

// Build an isolated fixture: a temp dir with a single post package that has
// a cover image, an inline asset, and a colocated asset folder.
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ssg-test-"));
  const postsDir = path.join(root, "posts");
  const pagesDir = path.join(root, "pages");
  const distDir = path.join(root, "dist");

  const pkg = path.join(postsDir, "sample-post", "cover-image");
  fs.mkdirSync(pkg, { recursive: true });
  fs.mkdirSync(pagesDir, { recursive: true });

  fs.writeFileSync(
    path.join(postsDir, "sample-post", "index.md"),
    `---
title: "Sample Post"
date: 2026-06-08
tags: [demo]
cover: cover-image/image.png
coverCaption: "A caption"
---

Body text with an [inline image](cover-image/image.png).
`,
  );
  fs.writeFileSync(path.join(pkg, "image.png"), "PNGDATA");

  return { root, postsDir, pagesDir, distDir };
}

test("post package builds to dist/posts/<slug>/index.html", () => {
  const { distDir, postsDir, pagesDir } = makeFixture();
  build({ distDir, postsDir, pagesDir });
  assert.ok(fs.existsSync(path.join(distDir, "posts", "sample-post", "index.html")));
});

test("cover image and caption render in the post HTML", () => {
  const { distDir, postsDir, pagesDir } = makeFixture();
  build({ distDir, postsDir, pagesDir });
  const html = fs.readFileSync(
    path.join(distDir, "posts", "sample-post", "index.html"),
    "utf-8",
  );
  assert.match(html, /<figure class="post-cover">/);
  assert.match(html, /<img src="cover-image\/image\.png"/);
  assert.match(html, /<figcaption>A caption<\/figcaption>/);
});

test("colocated assets are copied alongside the post HTML", () => {
  const { distDir, postsDir, pagesDir } = makeFixture();
  build({ distDir, postsDir, pagesDir });
  const asset = path.join(distDir, "posts", "sample-post", "cover-image", "image.png");
  assert.ok(fs.existsSync(asset), "asset should be copied into the output package dir");
  assert.equal(fs.readFileSync(asset, "utf-8"), "PNGDATA");
});

test("index.md is not copied into the output as an asset", () => {
  const { distDir, postsDir, pagesDir } = makeFixture();
  build({ distDir, postsDir, pagesDir });
  assert.ok(
    !fs.existsSync(path.join(distDir, "posts", "sample-post", "index.md")),
    "index.md is the content source, not a copied asset",
  );
});

test("a post without a cover renders no figure", () => {
  const { distDir, postsDir, pagesDir } = makeFixture();
  fs.writeFileSync(
    path.join(postsDir, "sample-post", "index.md"),
    `---
title: "No Cover"
date: 2026-06-08
---

Just text.
`,
  );
  build({ distDir, postsDir, pagesDir });
  const html = fs.readFileSync(
    path.join(distDir, "posts", "sample-post", "index.html"),
    "utf-8",
  );
  // The .post-cover class always appears in the inlined stylesheet; assert the
  // figure element itself is absent.
  assert.doesNotMatch(html, /<figure class="post-cover">/);
});
