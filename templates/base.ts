import type { Config } from "../types.ts";

export function base(
  config: Config,
  { title, content }: { title: string | null; content: string },
): string {
  const s = config.style;
  const pageTitle = title ? `${title} — ${config.name}` : config.name;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <script>
    var theme;
    try { theme = localStorage.getItem("theme"); } catch (e) {}
    document.documentElement.dataset.theme =
      theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${s.light.bg};
      --text: ${s.light.text};
      --muted: ${s.light.muted};
      --accent: ${s.light.accent};
      --code-bg: ${s.light.codeBg};
      color-scheme: light;
    }
    :root[data-theme="dark"] {
      --bg: ${s.dark.bg};
      --text: ${s.dark.text};
      --muted: ${s.dark.muted};
      --accent: ${s.dark.accent};
      --code-bg: ${s.dark.codeBg};
      color-scheme: dark;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ${s.fontBody};
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      padding: 2rem 1.5rem;
      max-width: ${s.maxWidth};
      margin: 0 auto;
      transition: background 0.2s ease, color 0.2s ease;
    }

    /* Header: logo left, theme switch right */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3rem;
    }
    .site-logo img { height: 1.75rem; width: auto; display: block; }
    .site-logo .logo-dark { display: none; }
    :root[data-theme="dark"] .site-logo .logo-light { display: none; }
    :root[data-theme="dark"] .site-logo .logo-dark { display: block; }

    .theme-toggle {
      display: flex;
      align-items: center;
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      color: var(--muted);
    }
    .theme-toggle:hover, .theme-toggle:focus-visible { color: var(--accent); }
    .theme-toggle .icon-sun { display: none; }
    :root[data-theme="dark"] .theme-toggle .icon-moon { display: none; }
    :root[data-theme="dark"] .theme-toggle .icon-sun { display: block; }

    main { min-height: 60vh; }

    /* Post list */
    .post-list { list-style: none; }
    .post-list li { margin-bottom: 1.5rem; }
    .post-list a { text-decoration: none; color: var(--text); font-weight: 600; }
    .post-list a:hover { color: var(--accent); }
    .post-list time { display: block; color: var(--muted); font-size: 0.85rem; }

    /* Prose */
    .prose h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .prose h2 { font-size: 1.25rem; margin-top: 2rem; margin-bottom: 0.5rem; }
    .prose h3 { font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .prose p { margin-bottom: 1rem; }
    .prose a { color: var(--accent); }
    .prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.5rem; }
    .prose li { margin-bottom: 0.25rem; }
    .prose blockquote {
      border-left: 3px solid var(--accent);
      padding-left: 1rem;
      color: var(--muted);
      margin: 1.5rem 0;
    }
    .prose code {
      font-family: ${s.fontMono};
      background: var(--code-bg);
      padding: 0.15em 0.35em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    .prose pre {
      background: var(--code-bg);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    .prose pre code { background: none; padding: 0; }
    .prose img { max-width: 100%; height: auto; border-radius: 6px; margin: 1rem 0; }

    .post-meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 2rem; }
    a.back-link { display: inline-block; margin-top: 2rem; color: var(--muted); text-decoration: none; font-size: 0.9rem; }
    a.back-link:hover { color: var(--accent); }

    footer {
      margin-top: 4rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--code-bg);
      color: var(--muted);
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    footer a { color: var(--muted); text-decoration: none; }
    footer a:hover { color: var(--accent); }
    .footer-links { display: flex; gap: 1rem; }

    /* Creative Commons CC0 (public domain dedication) badge */
    .cc-license { display: inline-flex; line-height: 0; }
    .cc-license svg { height: 1.5em; width: auto; }
  </style>
</head>
<body>
  <header>
    <a class="site-logo" href="${config.baseUrl}/" aria-label="${config.name} — home">
      <img class="logo-light" src="${config.baseUrl}/assets/Molus_Logo_Horizontal_Black.png" alt="${config.name}" width="271" height="84">
      <img class="logo-dark" src="${config.baseUrl}/assets/Molus_Logo_Horizontal_White.png" alt="${config.name}" width="271" height="84">
    </a>
    <button class="theme-toggle" aria-label="Dark mode" aria-pressed="false">
      <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    </button>
  </header>
  <main>
    ${content}
  </main>
  <footer>
    <a class="cc-license" href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="license noopener noreferrer" aria-label="CC0 1.0 — no rights reserved, dedicated to the public domain">
      <svg viewBox="0 0 46 22" aria-hidden="true">
        <circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <text x="11" y="11" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="600" fill="currentColor">CC</text>
        <circle cx="35" cy="11" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <text x="35" y="11" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="600" fill="currentColor">0</text>
      </svg>
    </a>
    <span class="footer-links">
      ${config.links.map((l) => `<a href="${l.href}">${l.label}</a>`).join("\n      ")}
    </span>
  </footer>
  <script>
    const toggle = document.querySelector(".theme-toggle");
    const syncToggle = () =>
      toggle.setAttribute("aria-pressed", document.documentElement.dataset.theme === "dark");
    syncToggle();
    toggle.addEventListener("click", () => {
      const root = document.documentElement;
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncToggle();
    });
  </script>
</body>
</html>`;
}
