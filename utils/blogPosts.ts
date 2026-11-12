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
    slug: 'sinterklaasgedicht-beginnen-en-afsluiten',
    title: 'Hoe begin je een sinterklaasgedicht? Openingszinnen en slotzinnen',
    description: 'Zit je vast bij de eerste regel of het slot? Bekijk handige manieren om te starten en meer dan 20 rijmende openings- en slotzinnen.',
    published: '2026-11-10',
    modified: '2026-11-12',
    readMinutes: 6,
    related: ['rijmwoorden-sinterklaas', 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht', 'kort-sinterklaasgedicht'],
  },
  {
    slug: 'rijmwoorden-sinterklaas',
    title: 'Rijmwoorden voor Sinterklaas: handige rijmwoordenlijst en tips',
    description: 'Vind snel de juiste rijmwoorden voor Sinterklaas, Sint en cadeaus, en schrijf met onze praktische tips een soepel sinterklaasgedicht.',
    published: '2026-11-10',
    modified: '2026-11-12',
    readMinutes: 9,
    related: ['rijm-en-ritme-sinterklaasgedicht', 'sinterklaasgedicht-beginnen-en-afsluiten', 'grappige-sinterklaasgedichten-tips'],
  },
  {
    slug: 'kort-sinterklaasgedicht',
    title: 'Een kort sinterklaasgedicht schrijven: tips en voorbeelden',
    description: 'Weinig tijd of een berg cadeaus? Schrijf een krachtig, kort sinterklaasgedicht van 4 of 8 regels. Bekijk voorbeelden en praktische tips.',
    published: '2026-11-10',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['sinterklaasgedicht-beginnen-en-afsluiten', 'rijmwoorden-sinterklaas', 'sinterklaasgedicht-voor-kinderen'],
  },
  {
    slug: 'sinterklaasgedicht-opa-oma',
    title: 'Sinterklaasgedicht voor opa en oma: tips en voorbeelden',
    description: 'Tips en voorbeelden voor een warm sinterklaasgedicht voor opa en oma. Zo schrijf je een rijm dat prettig voorleest en herinneringen ophaalt.',
    published: '2026-11-10',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['kort-sinterklaasgedicht', 'ouderwets-sinterklaasgedicht', 'sinterklaasgedicht-beginnen-en-afsluiten'],
  },
  {
    slug: 'sinterklaasgedicht-partner',
    title: 'Sinterklaasgedicht voor je partner: tips en voorbeelden',
    description: 'Tips en voorbeelden voor een sinterklaasgedicht voor je partner. Van romantisch tot gevat, passend bij wie er meeluistert op pakjesavond.',
    published: '2026-11-10',
    modified: '2026-11-12',
    readMinutes: 6,
    related: ['grappige-sinterklaasgedichten-tips', 'pikant-sinterklaasgedicht', 'sinterklaasgedicht-opa-oma'],
  },
  {
    slug: 'sinterklaasgedicht-voor-kinderen',
    title: 'Sinterklaasgedicht voor kinderen: tips en voorbeelden per leeftijd',
    description: 'Tips en voorbeelden voor een sinterklaasgedicht voor kinderen per leeftijd: van peuter en kleuter tot basisschoolkind en tiener.',
    published: '2026-11-10',
    modified: '2026-11-12',
    readMinutes: 6,
    related: ['kort-sinterklaasgedicht', 'sinterklaas-tradities', 'sinterklaasgedicht-opa-oma'],
  },
  {
    slug: 'sinterklaasgedicht-in-het-engels',
    title: 'Sinterklaasgedicht in het Engels schrijven: tips en voorbeelden',
    description: 'Vier je pakjesavond met internationale vrienden of collega\'s? Lees tips en voorbeelden voor een Engels of tweetalig sinterklaasgedicht.',
    published: '2026-11-10',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['sinterklaas-tradities', 'sinterklaas-op-het-werk', 'rijm-en-ritme-sinterklaasgedicht'],
  },
  {
    slug: 'lootjes-trekken-tips',
    title: 'Lootjes trekken voor Sinterklaas: regels, tips en valkuilen',
    description: 'Eerlijk lootjes trekken voor Sinterklaas zonder dat iemand zichzelf trekt. Lees handige afspraken over budget, surprises en de spelregels.',
    published: '2026-11-05',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['sinterklaas-op-het-werk', 'surprise-maken-ideeen', 'sinterklaasgedicht-beginnen-en-afsluiten'],
  },
  {
    slug: 'sinterklaasgedicht-stijlen',
    title: 'Welke stijl past bij je sinterklaasgedicht? Zes stijlen vergeleken',
    description: 'Twijfel je tussen grappig, klassiek of een roast? Bekijk zes stijlen met voorbeelden voor Tante Ria en lees welke toon past bij jouw publiek.',
    published: '2026-11-03',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['klassiek-sinterklaasgedicht', 'ironisch-sinterklaasgedicht', 'pikant-sinterklaasgedicht'],
  },
  {
    slug: 'pikant-sinterklaasgedicht',
    title: 'Pikant sinterklaasgedicht schrijven: tips en voorbeelden',
    description: 'Tips en voorbeelden voor een pikant sinterklaasgedicht met een knipoog. Maak het ondeugend en dubbelzinnig, zonder dat het grof wordt.',
    published: '2026-10-30',
    modified: '2026-11-12',
    readMinutes: 4,
    related: ['sinterklaasgedicht-stijlen', 'sinterklaasgedicht-partner', 'ironisch-sinterklaasgedicht'],
  },
  {
    slug: 'sinterklaas-op-het-werk',
    title: 'Sinterklaasgedicht collega: tips voor een geslaagd gedicht op kantoor',
    description: 'Praktische tips voor het schrijven van een sinterklaasgedicht voor een collega en het organiseren van een gezellige sinterklaasviering op kantoor.',
    published: '2026-10-27',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['lootjes-trekken-tips', 'roast-sinterklaasgedicht-zonder-te-kwetsen', 'sinterklaasgedicht-in-het-engels'],
  },
  {
    slug: 'ironisch-sinterklaasgedicht',
    title: 'Een ironisch sinterklaasgedicht schrijven: tips en voorbeelden',
    description: 'Wil je een droog of sarcastisch sinterklaasgedicht schrijven? Leer hoe je ironie doseert en bekijk handige technieken en voorbeelden.',
    published: '2026-10-22',
    modified: '2026-11-12',
    readMinutes: 6,
    related: ['sinterklaasgedicht-stijlen', 'roast-sinterklaasgedicht-zonder-te-kwetsen', 'sinterklaas-op-het-werk'],
  },
  {
    slug: 'roast-sinterklaasgedicht-zonder-te-kwetsen',
    title: 'Roast sinterklaasgedicht: stevig plagen zonder te kwetsen',
    description: 'Iemand op de hak nemen met Sinterklaas? Lees hoe je een stevig roast sinterklaasgedicht schrijft dat grappig blijft en warm eindigt.',
    published: '2026-10-18',
    modified: '2026-11-12',
    readMinutes: 6,
    related: ['grappige-sinterklaasgedichten-tips', 'sinterklaas-op-het-werk', 'sinterklaasgedicht-stijlen'],
  },
  {
    slug: 'klassiek-sinterklaasgedicht',
    title: 'Zo schrijf je een warm en klassiek sinterklaasgedicht',
    description: 'Lees hoe je een traditioneel en lief sinterklaasgedicht maakt met de bekende elementen, een warme toon en duidelijke voorbeelden.',
    published: '2026-10-14',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['sinterklaasgedicht-stijlen', 'ouderwets-sinterklaasgedicht', 'sinterklaasgedicht-voor-kinderen'],
  },
  {
    slug: 'surprise-maken-ideeen',
    title: 'Een surprise maken: van idee tot afwerking in simpele stappen',
    description: 'Van originele ideeën en papier-maché tot het verstoppen van het cadeau: zo maak je stap voor stap een geslaagde sinterklaassurprise.',
    published: '2026-10-09',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['lootjes-trekken-tips', 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht', 'sinterklaas-tradities'],
  },
  {
    slug: 'ouderwets-sinterklaasgedicht',
    title: 'Een ouderwets sinterklaasgedicht schrijven met zwier',
    description: 'Geef je rijm een plechtige draai met deftig taalgebruik. Lees hier tips, ouderwetse woorden en voorbeelden voor een geslaagd gedicht.',
    published: '2026-10-05',
    modified: '2026-11-12',
    readMinutes: 5,
    related: ['sinterklaasgedicht-stijlen', 'klassiek-sinterklaasgedicht', 'sinterklaasgedicht-opa-oma'],
  },
  {
    slug: 'rijm-en-ritme-sinterklaasgedicht',
    title: 'Rijmschema sinterklaasgedicht: uitleg, vormen en tips',
    description: 'Welk rijmschema past bij jouw sinterklaasgedicht? Lees hoe je ritme opbouwt met heffingen, kies uit vier vaste schema\'s en vermijd veelgemaakte valkuilen.',
    published: '2026-09-30',
    modified: '2026-11-12',
    readMinutes: 6,
    related: ['rijmwoorden-sinterklaas', 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht', 'grappige-sinterklaasgedichten-tips'],
  },
  {
    slug: 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
    title: 'Sinterklaasgedicht schrijven: handig stappenplan en tips',
    description: 'Zelf een sinterklaasgedicht schrijven? Volg dit stappenplan voor rijm, ritme en een origineel verhaal over de ontvanger.',
    published: '2025-11-17',
    modified: '2026-11-12',
    readMinutes: 8,
    related: ['sinterklaasgedicht-beginnen-en-afsluiten', 'rijm-en-ritme-sinterklaasgedicht', 'rijmwoorden-sinterklaas'],
  },
  {
    slug: 'grappige-sinterklaasgedichten-tips',
    title: 'Hoe schrijf je een grappig sinterklaasgedicht?',
    description: 'Wil je een grappig sinterklaasgedicht schrijven? Gebruik deze technieken, voorbeelden en praktische tips voor een lach op pakjesavond.',
    published: '2025-11-17',
    modified: '2026-11-12',
    readMinutes: 8,
    related: ['roast-sinterklaasgedicht-zonder-te-kwetsen', 'sinterklaasgedicht-stijlen', 'sinterklaasgedicht-partner'],
  },
  {
    slug: 'sinterklaas-tradities',
    title: 'Sinterklaas tradities: van schoen zetten tot pakjesavond',
    description: 'Wat zijn de bekendste sinterklaas tradities? Van de intocht en schoen zetten tot surprises en het gedicht op pakjesavond.',
    published: '2025-11-17',
    modified: '2026-11-12',
    readMinutes: 6,
    related: ['surprise-maken-ideeen', 'sinterklaasgedicht-in-het-engels', 'sinterklaasgedicht-voor-kinderen'],
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
