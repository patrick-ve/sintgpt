// The one list of blog posts. The blog index, the "Lees ook" block under each
// post (components/BlogPost.vue) and the links on the home page read it.
// Each post page passes the same title, dates and reading time to BlogPost;
// a unit test checks that they match. Newest first.

export interface BlogPostSummary {
  slug: string;
  /** The h1 of the post. */
  title: string;
  /** One or two sentences for the cards. */
  description: string;
  /** YYYY-MM-DD */
  published: string;
  /** YYYY-MM-DD, when the text last changed in a way that matters to readers. */
  modified?: string;
  readMinutes: number;
  /** Slugs shown under "Lees ook", most related first. */
  related: string[];
}

export const BLOG_POSTS: BlogPostSummary[] = [
  {
    slug: 'lootjes-trekken-tips',
    title: 'Lootjes trekken: zo organiseer je het eerlijk en zonder gedoe',
    description: 'Eerlijk trekken zonder dat iemand zichzelf trekt, en de afspraken over budget, gedicht en surprise die ruzie voorkomen.',
    published: '2026-11-05',
    readMinutes: 6,
    related: ['sinterklaas-op-het-werk', 'surprise-maken-ideeen', 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht'],
  },
  {
    slug: 'sinterklaas-op-het-werk',
    title: 'Sinterklaas op het werk: lootjes, gedichten en een feest voor iedereen',
    description: 'Vrijwillig meedoen, een eerlijk budget en gedichten over collega\'s die leuk blijven, ook op maandag.',
    published: '2026-10-27',
    readMinutes: 6,
    related: ['lootjes-trekken-tips', 'roast-sinterklaasgedicht-zonder-te-kwetsen', 'sinterklaas-tradities'],
  },
  {
    slug: 'roast-sinterklaasgedicht-zonder-te-kwetsen',
    title: 'Een roast-gedicht schrijven zonder iemand te kwetsen',
    description: 'Stevig plagen met liefde: waar je wel en geen grappen over maakt, de check vooraf en een warm slot.',
    published: '2026-10-18',
    readMinutes: 6,
    related: ['grappige-sinterklaasgedichten-tips', 'sinterklaas-op-het-werk', 'rijm-en-ritme-sinterklaasgedicht'],
  },
  {
    slug: 'surprise-maken-ideeen',
    title: 'Een surprise maken: materialen, technieken en ideeën per persoon',
    description: 'Van het idee tot papier-maché: zo maak je een surprise die bij de ontvanger en bij je gedicht past.',
    published: '2026-10-09',
    readMinutes: 7,
    related: ['lootjes-trekken-tips', 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht', 'sinterklaas-tradities'],
  },
  {
    slug: 'rijm-en-ritme-sinterklaasgedicht',
    title: 'Rijm en ritme: zo klinkt je sinterklaasgedicht als een echt gedicht',
    description: 'Heffingen tellen, staand en slepend rijm, en de vier rijmschema\'s met voorbeelden. Zo leest je gedicht lekker voor.',
    published: '2026-09-30',
    readMinutes: 7,
    related: ['hoe-schrijf-je-het-perfecte-sinterklaasgedicht', 'grappige-sinterklaasgedichten-tips', 'roast-sinterklaasgedicht-zonder-te-kwetsen'],
  },
  {
    slug: 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
    title: 'Hoe schrijf je het perfecte sinterklaasgedicht in 2026?',
    description: 'Praktische tips om een sinterklaasgedicht te schrijven dat indruk maakt: voorbereiding, rijmschema, toon, het cadeau en een sterk slot.',
    published: '2025-11-17',
    modified: '2026-11-08',
    readMinutes: 5,
    related: ['rijm-en-ritme-sinterklaasgedicht', 'grappige-sinterklaasgedichten-tips', 'surprise-maken-ideeen'],
  },
  {
    slug: 'grappige-sinterklaasgedichten-tips',
    title: 'Grappige sinterklaasgedichten: tips en voorbeelden',
    description: 'Zo voeg je humor toe aan je sinterklaasgedicht, met woordspelingen, overdrijving, een limerick en voorbeelden.',
    published: '2025-11-17',
    readMinutes: 4,
    related: ['roast-sinterklaasgedicht-zonder-te-kwetsen', 'rijm-en-ritme-sinterklaasgedicht', 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht'],
  },
  {
    slug: 'sinterklaas-tradities',
    title: 'Sinterklaastradities: van gedichten tot surprises',
    description: 'De geschiedenis en betekenis van het sinterklaasgedicht, de surprise en de andere gebruiken rond pakjesavond.',
    published: '2025-11-17',
    readMinutes: 6,
    related: ['surprise-maken-ideeen', 'lootjes-trekken-tips', 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht'],
  },
];

export const findBlogPost = (slug: string): BlogPostSummary | undefined =>
  BLOG_POSTS.find(post => post.slug === slug);

export const relatedBlogPosts = (slug: string): BlogPostSummary[] =>
  (findBlogPost(slug)?.related ?? [])
    .map(findBlogPost)
    .filter((post): post is BlogPostSummary => Boolean(post));

const MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

/** "17 november 2025", formatted from the string so server and browser agree. */
export const formatDutchDate = (iso: string): string => {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month! - 1]} ${year}`;
};
