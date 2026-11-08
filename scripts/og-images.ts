// Single source of truth for the generated Open Graph images.
// Pages refer to them by `name` via useOgImage(); `npm run build:og`
// renders each one to public/og/<name>.jpg.

/** public/sint.png at full height, at the 400:630 ratio of the images' right third. */
export const SINT_PORTRAIT = { left: 400, top: 0, width: 650, height: 1024 };

export interface OgHomeImage {
  name: string;
  kind: 'home';
  hook: string;
  headline: string;
  claim: string;
}

export interface OgArticleImage {
  name: string;
  kind: 'article';
  title: string;
  subtitle: string;
}

export type OgImageSpec = OgHomeImage | OgArticleImage;

export const OG_IMAGES: OgImageSpec[] = [
  {
    name: 'home',
    kind: 'home',
    hook: 'ChatGPT kan niet rijmen…',
    headline: 'SintGPT wél!',
    claim: 'Gedicht klaar in 30 seconden',
  },
  {
    name: 'blog',
    kind: 'article',
    title: 'Tips & inspiratie voor sinterklaasgedichten',
    subtitle: 'Voorbeelden, technieken en ideeën voor het perfecte gedicht',
  },
  {
    name: 'blog-sinterklaas-tradities',
    kind: 'article',
    title: 'Sinterklaas tradities & geschiedenis',
    subtitle: 'Van de oorsprong tot pakjesavond: alles over het feest',
  },
  {
    name: 'blog-grappige-sinterklaasgedichten-tips',
    kind: 'article',
    title: 'Grappige sinterklaas\u00ADgedichten schrijven',
    subtitle: 'Technieken die gegarandeerd voor een lach zorgen',
  },
  {
    name: 'blog-hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
    kind: 'article',
    title: 'Hoe schrijf je het perfecte sinterklaas\u00ADgedicht?',
    subtitle: 'Praktische tips voor een gedicht dat indruk maakt',
  },
];
