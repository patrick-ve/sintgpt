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
  /** The word after the logo; defaults to "Blog". */
  label?: string;
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
    name: 'voorbeelden',
    kind: 'article',
    label: 'Voorbeelden',
    title: 'Voorbeelden van sinterklaas\u00ADgedichten',
    subtitle: 'Grappig, klassiek, ironisch, ouderwets, pikant en roast',
  },
  {
    name: 'lootjes',
    kind: 'article',
    label: 'Lootjes',
    title: 'Lootjes trekken voor Sinterklaas',
    subtitle: 'Gratis, op één telefoon, en niemand trekt zichzelf',
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
  {
    name: 'blog-rijm-en-ritme-sinterklaasgedicht',
    kind: 'article',
    title: 'Rijm en ritme in je sinterklaas­gedicht',
    subtitle: 'Heffingen tellen, rijmschema\'s en de bekendste valkuilen',
  },
  {
    name: 'blog-lootjes-trekken-tips',
    kind: 'article',
    title: 'Lootjes trekken zonder gedoe',
    subtitle: 'Eerlijk trekken en heldere afspraken over budget en gedicht',
  },
  {
    name: 'blog-surprise-maken-ideeen',
    kind: 'article',
    title: 'Een surprise maken',
    subtitle: 'Materialen, technieken en ideeën per persoon',
  },
  {
    name: 'blog-roast-sinterklaasgedicht-zonder-te-kwetsen',
    kind: 'article',
    title: 'Roasten zonder te kwetsen',
    subtitle: 'Stevig plagen in je gedicht, met een warm slot',
  },
  {
    name: 'blog-sinterklaas-op-het-werk',
    kind: 'article',
    title: 'Sinterklaas op het werk',
    subtitle: 'Lootjes, budget en gedichten over collega\'s',
  },
];
