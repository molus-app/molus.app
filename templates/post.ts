import type { Post } from "../types.ts";

export function post(p: Post): string {
  return `<article class="prose">
  <h1>${p.title}</h1>
  <div class="post-meta">${p.dateFormatted}</div>
  ${p.html}
  <a class="back-link" href="/">← Back</a>
</article>`;
}
