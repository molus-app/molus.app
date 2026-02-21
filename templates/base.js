export function base(config, { title, content, currentPath = "/" }) {
  const s = config.style;
  const pageTitle = title ? `${title} — ${config.name}` : config.name;

  function isActiveNav(href) {
    if (href === "/") {
      return currentPath === "/" || currentPath.startsWith("/posts/");
    }
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ${s.fontBody};
      background: ${s.colorBg};
      color: ${s.colorText};
      line-height: 1.7;
      padding: 2rem 1.5rem;
      max-width: ${s.maxWidth};
      margin: 0 auto;
    }

    header { margin-bottom: 3rem; }
    header .site-name { font-size: 1.1rem; font-weight: 600; text-decoration: none; color: ${s.colorText}; }
    header .tagline { color: ${s.colorMuted}; font-size: 0.9rem; margin-top: 0.15rem; }
    nav { margin-top: 0.5rem; display: flex; gap: 1rem; }
    nav a { color: ${s.colorMuted}; text-decoration: none; font-size: 0.9rem; }
    nav a.active { color: ${s.colorText}; font-weight: 700; }
    nav a:hover { color: ${s.colorAccent}; }

    main { min-height: 60vh; }

    /* Post list */
    .post-list { list-style: none; }
    .post-list li { margin-bottom: 1.5rem; }
    .post-list a { text-decoration: none; color: ${s.colorText}; font-weight: 600; }
    .post-list a:hover { color: ${s.colorAccent}; }
    .post-list time { display: block; color: ${s.colorMuted}; font-size: 0.85rem; }

    /* Prose */
    .prose h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .prose h2 { font-size: 1.25rem; margin-top: 2rem; margin-bottom: 0.5rem; }
    .prose h3 { font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .prose p { margin-bottom: 1rem; }
    .prose a { color: ${s.colorAccent}; }
    .prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.5rem; }
    .prose li { margin-bottom: 0.25rem; }
    .prose blockquote {
      border-left: 3px solid ${s.colorAccent};
      padding-left: 1rem;
      color: ${s.colorMuted};
      margin: 1.5rem 0;
    }
    .prose code {
      font-family: ${s.fontMono};
      background: ${s.colorCodeBg};
      padding: 0.15em 0.35em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    .prose pre {
      background: ${s.colorCodeBg};
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    .prose pre code { background: none; padding: 0; }
    .prose img { max-width: 100%; border-radius: 6px; margin: 1rem 0; }

    .post-meta { color: ${s.colorMuted}; font-size: 0.85rem; margin-bottom: 2rem; }
    .back-link { display: inline-block; margin-top: 2rem; color: ${s.colorMuted}; text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { color: ${s.colorAccent}; }

    footer {
      margin-top: 4rem;
      padding-top: 1.5rem;
      border-top: 1px solid ${s.colorCodeBg};
      color: ${s.colorMuted};
      font-size: 0.8rem;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    footer a { color: ${s.colorMuted}; text-decoration: none; }
    footer a:hover { color: ${s.colorAccent}; }
    .footer-links { display: flex; gap: 1rem; }
  </style>
</head>
<body>
  <header>
    <a class="site-name" href="${config.baseUrl}/">${config.name}</a>
    <div class="tagline">${config.tagline}</div>
    <nav>
      ${config.nav
        .map((l) => {
          const active = isActiveNav(l.href);
          return `<a href="${config.baseUrl}${l.href}"${active ? ' class="active" aria-current="page"' : ""}>${l.label}</a>`;
        })
        .join("\n      ")}
    </nav>
  </header>
  <main>
    ${content}
  </main>
  <footer>
    <span>&copy; ${new Date().getFullYear()} ${config.author}</span>
    <span class="footer-links">
      ${config.links.map((l) => `<a href="${l.href}">${l.label}</a>`).join("\n      ")}
    </span>
  </footer>
</body>
</html>`;
}
