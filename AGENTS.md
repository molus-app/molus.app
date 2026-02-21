# Repository Guidelines

## Project Structure & Module Organization
This repo is a minimal Node-based static site generator.
- `build.js`: build pipeline (Markdown + front matter to HTML in `dist/`).
- `dev.js`: local dev server, file watching, and live reload.
- `config.js`: site identity, navigation, links, and visual style tokens.
- `templates/`: HTML template modules (`base.js`, `index.js`, `post.js`, `page.js`).
- `posts/*.md` and `pages/*.md`: source content. Filenames become URL slugs.
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy workflow.

Treat `dist/` as generated output; do not hand-edit files there.

## Build, Test, and Development Commands
- `npm ci`: install locked dependencies.
- `npm run build`: generate the static site into `dist/`.
- `npm run dev`: rebuild on file changes and serve locally (default `http://localhost:3000`).
- `PORT=4173 npm run dev`: run dev server on a custom port.

Before opening a PR, run `npm run build` and verify output pages in `dist/`.

## Coding Style & Naming Conventions
- Use modern ESM JavaScript (`"type": "module"`), 2-space indentation, semicolons, and double quotes.
- Keep templates small and composable with named exports.
- Prefer clear constants for directory names and config keys.
- Markdown files should be kebab-case (example: `building-my-own-ssg.md`).
- Post front matter should include `title` and `date`; `tags` is optional.

## Testing Guidelines
There is no automated test suite yet. Use manual validation:
- Build check: `npm run build` exits cleanly and writes expected routes.
- Content check: confirm one post and one page render correctly.
- Dev check: run `npm run dev`, edit a Markdown/template file, and verify live reload.

If you add non-trivial build logic, include targeted tests before merging.

## Commit & Pull Request Guidelines
This checkout does not include `.git` history, so follow the project’s Ludus convention:
- Commit format: `<type>: <emoji> <subject>` (imperative, no trailing period, <= 65 chars).
- Common types: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `build`, `ci`, `chore`, `perf`, `revert`, `wip`.
- Sign commits with DCO: `git commit -s`.
- Stage only files you changed.

PRs should include: purpose, scope, linked issue/discussion, local validation steps, and screenshots for visual changes.
