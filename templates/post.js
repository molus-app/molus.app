export function post(p) {
  const cover = p.cover
    ? `<figure class="post-cover">
    <img src="${p.cover}" alt="${p.coverCaption ?? p.title}">
    ${p.coverCaption ? `<figcaption>${p.coverCaption}</figcaption>` : ""}
  </figure>`
    : "";

  return `<article class="prose">
  ${cover}
  <h1>${p.title}</h1>
  <div class="post-meta">${p.dateFormatted}${p.tags?.length ? ` · ${p.tags.join(", ")}` : ""}</div>
  ${p.html}
  <a class="back-link" href="/">← Back</a>
</article>`;
}
