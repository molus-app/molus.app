import fs from "fs";
import path from "path";
import { marked } from "marked";
import matter from "gray-matter";
import config from "./config.ts";
import { base } from "./templates/base.ts";
import { index } from "./templates/index.ts";
import { post as postTemplate } from "./templates/post.ts";
import type { PostFrontmatter, RawPost, Post } from "./types.ts";

const DIST = "dist";
const POSTS_DIR = "posts";

// ── Helpers ──────────────────────────────────────────────

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Read post packages: each post is a folder `<slug>/` containing an `index.md`
// (frontmatter + prose) plus any colocated asset files/folders.
function readPostPackages(dir: string): RawPost[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry): RawPost | null => {
      const slug = entry.name;
      const packageDir = path.join(dir, slug);
      const indexPath = path.join(packageDir, "index.md");
      if (!fs.existsSync(indexPath)) {
        console.warn(`  skip: posts/${slug} has no index.md`);
        return null;
      }
      const raw = fs.readFileSync(indexPath, "utf-8");
      const { data, content } = matter(raw);
      const frontmatter = data as PostFrontmatter;
      const html = marked(content, { async: false });

      if (!frontmatter.title) console.warn(`  warn: posts/${slug} is missing 'title'`);
      if (!frontmatter.date) console.warn(`  warn: posts/${slug} is missing 'date'`);

      return { ...frontmatter, slug, html, packageDir };
    })
    .filter((p): p is RawPost => p !== null);
}

// Copy a post package's assets (everything except index.md) into its output dir.
// Relative asset paths in the markdown then resolve as-is against the HTML file.
function copyPackageAssets(srcDir: string, destDir: string): void {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name === "index.md") continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      ensureDir(destPath);
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Build ────────────────────────────────────────────────

export function build(
  { distDir = DIST, postsDir = POSTS_DIR }: { distDir?: string; postsDir?: string } = {},
): { posts: Post[] } {
  console.log("Building...");
  ensureDir(distDir);

  // 1. Build post packages
  const posts: Post[] = readPostPackages(postsDir)
    .map((p): Post => {
      // gray-matter yields Date (unquoted) or string (quoted); a missing date
      // falls through to an Invalid Date exactly as before (warned above).
      const rawDate = p.date as string | Date;
      return {
        ...p,
        url: `${config.baseUrl}/posts/${p.slug}`,
        date: new Date(rawDate),
        dateFormatted: formatDate(rawDate),
      };
    })
    .sort((a, b) => +a.date - +b.date);

  for (const p of posts) {
    const dir = path.join(distDir, "posts", p.slug);
    ensureDir(dir);
    const content = postTemplate(p);
    const html = base(config, { title: p.title ?? null, content });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    copyPackageAssets(p.packageDir, dir);
    console.log(`  post: ${p.slug}`);
  }

  // 2. Build index
  const indexContent = index(posts);
  const indexHtml = base(config, { title: null, content: indexContent });
  fs.writeFileSync(path.join(distDir, "index.html"), indexHtml);
  console.log("  index");

  // 3. Copy static files
  if (fs.existsSync("static")) {
    copyDirSync("static", distDir);
    console.log("  static assets");
  }

  console.log(`Done! ${posts.length} posts → ./${distDir}/`);
  return { posts };
}

function copyDirSync(src: string, dest: string): void {
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

// Run the build only when executed directly (`bun build.ts`), not when imported.
if (import.meta.main) {
  build();
}
