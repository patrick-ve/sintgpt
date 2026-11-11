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
    name: 'blog-sinterklaasgedicht-beginnen-en-afsluiten',
    kind: 'article',
    title: 'Begin en einde van een sinterklaasgedicht',
    subtitle: 'Vind de juiste openingszin en slotzin voor pakjesavond',
  },
  {
    name: 'blog-rijmwoorden-sinterklaas',
    kind: 'article',
    title: 'Rijmwoorden voor Sinterklaas',
    subtitle: 'Handige rijmwoordenlijsten en praktische rijmtips',
  },
  {
    name: 'blog-kort-sinterklaasgedicht',
    kind: 'article',
    title: 'Kort sinterklaasgedicht schrijven',
    subtitle: 'In 4 of 8 regels raak en persoonlijk dichten',
  },
  {
    name: 'blog-sinterklaasgedicht-opa-oma',
    kind: 'article',
    title: 'Sinterklaasgedicht voor opa en oma',
    subtitle: 'Praktische schrijftips en voorbeeldgedichten',
  },
  {
    name: 'blog-sinterklaasgedicht-partner',
    kind: 'article',
    title: 'Sinterklaasgedicht voor je partner',
    subtitle: 'Van romantisch en lief tot gevat en een tikkeltje ondeugend',
  },
  {
    name: 'blog-sinterklaasgedicht-voor-kinderen',
    kind: 'article',
    title: 'Sinterklaasgedicht voor kinderen',
    subtitle: 'Tips en voorbeelden voor elke leeftijd',
  },
  {
    name: 'blog-sinterklaasgedicht-in-het-engels',
    kind: 'article',
    title: 'Sinterklaasgedicht in het Engels',
    subtitle: 'Tips en voorbeelden voor internationale gezelschappen',
  },
  {
    name: 'blog-lootjes-trekken-tips',
    kind: 'article',
    title: 'Eerlijk lootjes trekken voor Sinterklaas',
    subtitle: 'Praktische regels en handige afspraken voor pakjesavond',
  },
  {
    name: 'blog-sinterklaas-op-het-werk',
    kind: 'article',
    title: 'Sinterklaasgedicht voor een collega',
    subtitle: 'Tips en voorbeelden voor Sinterklaas op de werkvloer',
  },
  {
    name: 'blog-roast-sinterklaasgedicht-zonder-te-kwetsen',
    kind: 'article',
    title: 'Roast sinterklaasgedicht schrijven',
    subtitle: 'Stevig plagen op pakjesavond zonder iemand te kwetsen',
  },
  {
    name: 'blog-surprise-maken-ideeen',
    kind: 'article',
    title: 'Surprise maken voor Sinterklaas',
    subtitle: 'Stappen, handige technieken en creatieve ideeën',
  },
  {
    name: 'blog-rijm-en-ritme-sinterklaasgedicht',
    kind: 'article',
    title: 'Rijmschema sinterklaasgedicht kiezen',
    subtitle: 'Vier rijmvormen met voorbeelden en handige ritmetips',
  },
  {
    name: 'blog-hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
    kind: 'article',
    title: 'Zelf een sinterklaasgedicht schrijven',
    subtitle: 'Stap voor stap een persoonlijk gedicht maken',
  },
  {
    name: 'blog-grappige-sinterklaasgedichten-tips',
    kind: 'article',
    title: 'Grappig sinterklaasgedicht schrijven',
    subtitle: 'Technieken en voorbeelden voor humor op pakjesavond',
  },
  {
    name: 'blog-sinterklaas-tradities',
    kind: 'article',
    title: 'De bekendste sinterklaas tradities',
    subtitle: 'Alles over schoen zetten, surprises en pakjesavond',
  },
  {
    name: 'blog-sinterklaasgedicht-stijlen',
    kind: 'article',
    title: 'Welke stijl past bij je gedicht?',
    subtitle: 'Zes stijlen vergeleken, met voorbeelden',
  },
  {
    name: 'blog-klassiek-sinterklaasgedicht',
    kind: 'article',
    title: 'Klassiek sinterklaasgedicht schrijven',
    subtitle: 'Tips, vaste onderdelen en voorbeelden in rijm',
  },
  {
    name: 'blog-ironisch-sinterklaasgedicht',
    kind: 'article',
    title: 'Ironisch sinterklaasgedicht schrijven',
    subtitle: 'Tips, technieken en voorbeelden voor droge humor',
  },
  {
    name: 'blog-ouderwets-sinterklaasgedicht',
    kind: 'article',
    title: 'Ouderwets sinterklaasgedicht schrijven',
    subtitle: 'Tips en voorbeelden voor een deftig rijm in oude stijl',
  },
  {
    name: 'blog-pikant-sinterklaasgedicht',
    kind: 'article',
    title: 'Pikant sinterklaasgedicht schrijven',
    subtitle: 'Tips en voorbeelden voor een ondeugend gedicht',
  },
];
