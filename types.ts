// Shared types for the static site generator.

export interface ThemeColors {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  codeBg: string;
}

export interface Config {
  name: string;
  links: { label: string; href: string }[];
  style: {
    fontBody: string;
    fontMono: string;
    maxWidth: string;
    light: ThemeColors;
    dark: ThemeColors;
  };
  baseUrl: string;
}

// Front-matter parsed from a post's index.md. gray-matter parses unquoted YAML
// dates to Date and quoted ones to string. Extra keys (tags, cover, …) are
// tolerated and ignored by the build.
export interface PostFrontmatter {
  title?: string;
  date?: string | Date;
  [key: string]: unknown;
}

// A post as first read from disk.
export interface RawPost extends PostFrontmatter {
  slug: string;
  html: string;
  packageDir: string;
}

// A post after enrichment in build(): url + normalized Date + formatted date.
export interface Post extends RawPost {
  url: string;
  date: Date;
  dateFormatted: string;
}
