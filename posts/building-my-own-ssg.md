---
title: "Building My Own Static Site Generator"
date: 2026-02-21
tags: [dev, meta]
---

I got tired of looking at SSG options and just built one. It's under 200 lines of JavaScript.

## Why

Every existing tool was either too minimal or too much. I wanted:

- Markdown files in a folder
- A config file I could tweak to change the whole vibe
- Zero magic, zero plugins

## How it works

1. Drop `.md` files in `posts/` or `pages/`
2. Run `npm run build`
3. Deploy `dist/` anywhere

That's it. The entire engine is one `build.js` file.

```js
// This is the whole content pipeline
const { data, content } = matter(raw);
const html = marked(content);
```

> The best tool is the one you understand completely.
