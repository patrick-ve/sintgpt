export default {
  header: {
    title: 'SintGPT',
    subtitle1: 'Maak gepersonaliseerde Sinterklaasgedichten en laat AI het rijmen doen.',
    subtitle2: 'Snel & makkelijk. Klaar binnen 30 seconden!',
  },
  form: {
    title: 'Details voor het gedicht',
    name: {
      label: 'Naam ontvanger',
      placeholder: 'Sint Nicolaas',
    },
    present: {
      label: 'Sinterklaascadeau',
      placeholder: 'Een boek, speelgoed, kookgerei, etc.',
    },
    revealPresent: {
      label: 'Cadeau vermelden?',
      yes: 'Ja, vermeldt het cadeau in het gedicht',
      no: 'Nee, houd het cadeau geheim (vaag omschrijven)',
    },
    funFacts: {
      label: 'Leuke weetjes over de ontvanger',
      placeholder: 'Vertel zo uitgebreid mogelijk over hobby\'s, werk, sport, interesses of andere anekdotes...',
      help: 'Deze informatie wordt gebruikt om het gedicht persoonlijker te maken',
    },
    style: {
      label: 'Gedichtstijl',
      funny: '😄 Grappig',
      classic: '📜 Klassiek',
      ironic: '😏 Ironisch',
      oldFashioned: '🎩 Ouderwets',
    },
    rhymeScheme: {
      label: 'Rijmschema',
      aabb: 'AABB (Rijmparen)',
      abba: 'ABBA (Omarmend)',
      limerick: 'Limerick',
    },
    language: {
      label: 'Taal',
      dutch: '🇳🇱 Nederlands',
      english: '🇬🇧 Engels',
    },
    lines: {
      label: 'Aantal regels',
      min: 'regels',
      max: 'regels',
      limerickNote: 'Limericks zijn altijd 5 regels (AABBA rijmschema)',
    },
    submit: {
      generate: 'Genereer gedicht',
      generating: 'Gedicht genereren...',
    },
    required: '*',
  },
  poem: {
    title: 'Gedicht voor {name}',
    defaultTitle: 'Jouw gedicht',
    copy: 'Kopieer',
    copied: 'Gekopieerd!',
    loading: 'Jouw gepersonaliseerde gedicht wordt gemaakt...',
    error: 'Fout',
    empty: 'Vul het formulier in om een gedicht te genereren',
  },
  footer: {
    copyright: 'Copyright {year} SintGPT. Alle rechten voorbehouden.',
  },
  error: {
    title: 'Oeps! Er ging iets mis.',
    message: 'Er is een fout opgetreden bij het weergeven van dit gedeelte van de pagina.',
    label: 'Fout',
    retry: 'Probeer opnieuw',
  },
  seo: {
    title: 'SintGPT - Maak gepersonaliseerde Sinterklaasgedichten met AI. Snel, makkelijk en klaar binnen 30 seconden!',
    description: 'SintGPT maakt voor jou een perfect Sinterklaasgedicht. Snel, makkelijk en klaar binnen 30 seconden!',
    ogTitle: 'SintGPT - Maak gepersonaliseerde Sinterklaasgedichten met AI',
    ogDescription: 'SintGPT maakt voor jou een perfect Sinterklaasgedicht. Snel, makkelijk en klaar binnen 30 seconden!',
    ogImageAlt: 'SintGPT - AI Sinterklaasgedichten Generator',
  },
};
