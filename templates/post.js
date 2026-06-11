export function post(p) {
  return `<article class="prose">
  <h1>${p.title}</h1>
  <div class="post-meta">${p.dateFormatted}</div>
  ${p.html}
  <a class="back-link" href="/">← Back</a>
</article>`;
}
