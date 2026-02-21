import fs from "fs";
import path from "path";
import { marked } from "marked";
import matter from "gray-matter";
import config from "./config.js";
import { base } from "./templates/base.js";
import { index } from "./templates/index.js";
import { post as postTemplate } from "./templates/post.js";
import { page as pageTemplate } from "./templates/page.js";

const DIST = "dist";
const POSTS_DIR = "posts";
const PAGES_DIR = "pages";

// ── Helpers ──────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function slugFromFilename(filename) {
  return path.basename(filename, ".md");
}

function readMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
      const { data, content } = matter(raw);
      const html = marked(content);
      const slug = slugFromFilename(filename);
      return { ...data, slug, html, filename };
    });
}

// ── Build ────────────────────────────────────────────────

function build() {
  console.log("Building...");
  ensureDir(DIST);

  // 1. Build posts
  const posts = readMarkdownFiles(POSTS_DIR)
    .map((p) => ({
      ...p,
      url: `${config.baseUrl}/posts/${p.slug}`,
      date: new Date(p.date),
      dateFormatted: formatDate(p.date),
    }))
    .sort((a, b) => b.date - a.date);

  for (const p of posts) {
    const dir = path.join(DIST, "posts", p.slug);
    ensureDir(dir);
    const content = postTemplate(p);
    const html = base(config, { title: p.title, content, currentPath: `/posts/${p.slug}` });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    console.log(`  post: ${p.slug}`);
  }

  // 2. Build static pages
  const pages = readMarkdownFiles(PAGES_DIR);

  for (const p of pages) {
    const dir = path.join(DIST, p.slug);
    ensureDir(dir);
    const content = pageTemplate(p);
    const html = base(config, { title: p.title, content, currentPath: `/${p.slug}` });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    console.log(`  page: ${p.slug}`);
  }

  // 3. Build index
  const indexContent = index(posts);
  const indexHtml = base(config, { title: null, content: indexContent, currentPath: "/" });
  fs.writeFileSync(path.join(DIST, "index.html"), indexHtml);
  console.log("  index");

  // 4. Copy static files
  if (fs.existsSync("static")) {
    copyDirSync("static", DIST);
    console.log("  static assets");
  }

  console.log(`Done! ${posts.length} posts, ${pages.length} pages → ./${DIST}/`);
}

function copyDirSync(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      ensureDir(destPath);
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

build();
