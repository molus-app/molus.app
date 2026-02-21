export function page(p) {
  return `<article class="prose">
  ${p.title ? `<h1>${p.title}</h1>` : ""}
  ${p.html}
</article>`;
}
