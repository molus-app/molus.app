import type { Post } from "../types.ts";

export function index(posts: Post[]): string {
  if (posts.length === 0) return `<p>No posts yet.</p>`;

  return `<ul class="post-list">
${posts
  .map(
    (p) => `  <li>
    <a href="${p.url}">${p.title}</a>
    <time>${p.dateFormatted}</time>
  </li>`
  )
  .join("\n")}
</ul>`;
}
