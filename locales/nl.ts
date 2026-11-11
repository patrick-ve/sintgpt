export default {
  header: {
    title: 'SintGPT',
    subtitle1:
      'Maak gepersonaliseerde Sinterklaasgedichten en laat AI het rijmen doen.',
    subtitle2: 'Snel & makkelijk. Klaar binnen 30 seconden!',
  },
  hero: {
    question: 'Wil het rijmen met ChatGPT maar niet lukken?',
    answer: 'SintGPT schrijft je sinterklaasgedicht in 30 seconden.',
    subtitle: 'Persoonlijk, grappig of flink op de hak. In het Nederlands of Engels, en het rijmt echt.',
    cta: 'Begin met rijmen',
    moreInfo: 'Hoe werkt het?',
    photoAlt: 'Sinterklaas wijst met een knipoog naar zijn slaap',
    photoCaption: 'Ook de Sint rijmt niet altijd vanzelf.',
    note: 'Je eerste gedicht is gratis. Daarna schrijf je voor eenmalig €6,99 gedichten voor het hele gezin, of 3 gedichten voor €3,99.',
  },
  countdown: {
    days: 'Nog {count} dag tot pakjesavond | Nog {count} dagen tot pakjesavond',
    tomorrow: 'Morgen is het pakjesavond',
    today: 'Vanavond is het pakjesavond',
    hint: 'Op het laatste moment? Binnen 30 seconden heb je een gedicht.',
  },
  form: {
    title: 'Schrijf je sinterklaasgedicht in drie stappen',
    steps: {
      who: 'Voor wie is het?',
      special: 'Wat maakt hen bijzonder?',
      tone: 'Hoe moet het klinken?',
    },
    more: 'Meer opties: wie schrijft het en voor welk publiek?',
    name: {
      label: 'Naam ontvanger',
      placeholder: 'Sint Nicolaas',
      required: 'Vul de naam van de ontvanger in.',
    },
    present: {
      label: 'Sinterklaascadeau',
      placeholder: 'Een boek, speelgoed, kookgerei, etc.',
    },
    revealPresent: {
      label: 'Cadeau vermelden?',
      yes: 'Noem het cadeau',
      no: 'Houd het geheim',
    },
    funFacts: {
      label: 'Leuke weetjes over de ontvanger',
      placeholder:
        "Vertel zo uitgebreid mogelijk over hobby's, werk, sport, interesses of andere anekdotes.\n\nBijvoorbeeld: Sinterklaas is een echte paardenliefhebber en brengt uren door met zijn trouwe schimmel Amerigo. Hij houdt van pepernoten en speculaas, maar heeft een hekel aan dropjes. In zijn vrije tijd leest hij graag brieven van kinderen en hij vergeet vaak waar hij zijn mijter heeft neergelegd...",
      help: 'Hoe meer je vertelt, hoe persoonlijker het gedicht.',
    },
    writtenBy: {
      label: 'Geschreven door',
      placeholder:
        'Bijvoorbeeld: een 8-jarig kind, een collega, een familielid...',
      help: 'Het gedicht klinkt alsof deze persoon het schreef.',
    },
    writtenForAudience: {
      label: 'Voor welk publiek',
      placeholder:
        'Bijvoorbeeld: groep 5/6 van de basisschool, volwassen werkplek, familie...',
      help: 'Het gedicht past bij de mensen die het horen.',
    },
    style: {
      label: 'Gedichtstijl',
      funny: '😄 Grappig',
      classic: '📜 Klassiek',
      ironic: '😏 Ironisch',
      oldFashioned: '🎩 Ouderwets',
      spicy: '🌶️ Pikant',
      roast: '🔥 Roast',
    },
    rhymeScheme: {
      label: 'Rijmschema',
      aabb: 'AABB',
      abab: 'ABAB',
      abba: 'ABBA',
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
      limerickNote:
        'Limericks zijn altijd 5 regels (AABBA rijmschema)',
    },
    submit: {
      generate: 'Schrijf mijn gedicht',
      generating: 'De Sint schrijft…',
      time: 'Klaar in ongeveer 30 seconden.',
    },
    required: '*',
  },
  poem: {
    title: 'Gedicht voor {name}',
    defaultTitle: 'Jouw gedicht',
    copy: 'Kopieer gedicht',
    copied: 'Gekopieerd!',
    copyLink: 'Kopieer link',
    savePdf: 'Opslaan als PDF',
    pdfError: 'Het opslaan is niet gelukt. Probeer het nog eens.',
    pdfDesign: {
      title: 'Kies een ontwerp',
      intro: 'Zo komt je gedicht in de PDF te staan.',
      download: 'PDF opslaan',
      cancel: 'Annuleren',
      perkament: { name: 'Perkament', description: 'Een klassieke rol met lakzegel' },
      pakjesavond: { name: 'Pakjesavond', description: 'Sterren en daken bij nacht' },
      cadeaupapier: { name: 'Cadeaupapier', description: 'Rood papier met een gouden strik' },
      schoolschrift: { name: 'Schoolschrift', description: 'Met de hand op lijntjes geschreven' },
      goudfolie: { name: 'Goudfolie', description: 'Goud op fluweelrood, met mijter' },
      stoomboot: { name: 'Stoomboot', description: 'De pakjesboot op zee bij maanlicht' },
      unlock: 'Bekijk Hele familie',
    },
    linkCopied: 'Link gekopieerd!',
    linkPrivacy: 'Iedereen met de link kan dit gedicht lezen. We bewaren het daarvoor 90 dagen.',
    shareWhatsApp: 'Deel op WhatsApp',
    shareEmail: 'Verstuur via e-mail',
    shareFacebook: 'Deel op Facebook',
    loading: 'De Sint schrijft je gedicht…',
    ready: 'Je gedicht is klaar.',
    error: 'Dat ging mis',
    freeComplete: 'Dit gratis gedicht is helemaal van jou: deel het, kopieer het of bewaar het als PDF.',
    sample: 'Voorbeeld',
    sampleTitle: 'Gedicht voor Daan (7)',
    sampleSignature: 'Sint en Piet',
    regenerate: 'Herschrijf dit gedicht',
    regenerateWithHint: 'Herschrijf met deze wens',
    hint: {
      open: 'Zeg wat er anders moet',
      label: 'Wat moet er anders?',
      placeholder: 'Bijv. korter, of meer over zijn nieuwe fiets',
      suggestions: 'Snelle wensen',
      chips: ['Korter', 'Grappiger', 'Liever', 'Meer over het cadeau', 'Beter rijm'],
      close: 'Sluiten',
    },
    edit: {
      open: 'Pas aan',
      label: 'Gedicht aanpassen',
      hint: 'Verander gerust een woord of een regel. Verander je veel, dan krijgt het gedicht geen deellink meer. Kopiëren en opslaan als PDF blijven werken.',
      done: 'Klaar',
      cancel: 'Annuleren',
      revert: 'Terug naar origineel',
      saving: 'Bewaren…',
      empty: 'Het gedicht is leeg. Schrijf iets, of kies Annuleren.',
      noLink: 'Dit gedicht is te veel veranderd voor een deellink. Je kunt het wel kopiëren, als tekst delen of opslaan als PDF.',
      saved: 'Je aanpassing is bewaard.',
    },
    rating: {
      question: 'Hoe vind je dit gedicht?',
      up: 'Goed gedicht',
      down: 'Niet goed gedicht',
      thanksUp: 'Fijn! Dank je wel.',
      thanksDown: 'Jammer. Zeg wat er anders moet en laat het herschrijven.',
      thanksDownNoRewrite: 'Jammer. Dank je wel, hiermee maken we SintGPT beter.',
    },
    surprise: {
      button: 'Bedenk een surprise',
      loading: 'De Sint denkt na…',
      title: 'Surprise-ideeën voor {name}',
      materials: 'Nodig',
      error: 'Het bedenken lukte niet. Probeer het nog eens.',
    },
    wait: 'Even geduld: je kunt over {seconds} seconden een nieuw gedicht maken.',
    fairUse: 'Je hebt de afgelopen 24 uur 100 gedichten gemaakt. Dat is het maximum per dag. Probeer het later opnieuw.',
    sampleText:
      'Daan is al zeven en een held in het doel,\nals keeper bij de F-jes houd jij het hoofd koel.\nEn na elke wedstrijd eet jij voor de trek,\neen berg pannenkoeken met stroop tot je nek!\n\nDe Pieten stonden te juichen langs de lijn,\nwant ballen tegenhouden vind jij reuze fijn.\nDaarom brengt de Sint nu iets moois voor op het veld:\neen prachtige voetbal voor deze grote held!',
  },
  share: {
    heading: 'Iemand deelde dit gedicht met je',
    partial: 'De rest van dit gedicht kon niet worden gecontroleerd en wordt daarom niet getoond.',
    cta: 'Maak je eigen gedicht',
  },
  history: {
    open: 'Mijn gedichten',
    title: 'Mijn gedichten',
    description: 'Alleen opgeslagen op dit apparaat',
    empty: 'Nog geen gedichten',
    emptyHint: 'Elk gedicht dat je maakt, verschijnt hier.',
    deleteAria: 'Verwijder gedicht voor {name}',
    clearAll: 'Alles wissen',
    confirmClear: 'Ja, wis alles',
    cancel: 'Annuleren',
    lines: '{n} regels',
    count: '{count} gedicht | {count} gedichten',
    previous: 'Eerdere gedichten',
  },
  siteLinks: {
    home: 'Sinterklaasgedicht maken',
    blog: 'Blog',
  },
  footer: {
    copyright: 'Copyright {year} SintGPT. Alle rechten voorbehouden.',
    contact: 'Neem contact op',
    nav: 'Voettekst',
    blog: 'Blog: tips en inspiratie',
    examples: 'Voorbeelden',
    lootjes: 'Lootjes trekken',
    privacy: 'Privacy',
    terms: 'Voorwaarden',
  },
  error: {
    title: 'Oeps! Er ging iets mis.',
    message:
      'Dit deel van de pagina lukt even niet.',
    label: 'Fout',
    retry: 'Probeer opnieuw',
  },
  seo: {
    title: "Sinterklaasgedicht maken met AI: gratis generator | SintGPT",
    description: "Maak in 30 seconden een persoonlijk sinterklaasgedicht dat echt rijmt: grappig, klassiek of een roast, in het Nederlands of Engels. Je eerste gedicht is gratis.",
    ogTitle: 'SintGPT: je sinterklaasgedicht in 30 seconden',
    ogDescription:
      'Persoonlijke sinterklaasgedichten die echt rijmen. Klaar in 30 seconden, en je eerste gedicht is gratis.',
    ogImageAlt:
      'SintGPT: ChatGPT kan niet rijmen, SintGPT wél',
  },
  tips: {
    title: 'Tips voor je sinterklaasgedicht',
    all: 'Alle tips op het blog →',
  },
  faq: {
    title: 'Veelgestelde vragen',
    questions: [
      {
        question: 'Hoe maak ik een sinterklaasgedicht met SintGPT?',
        answer:
          'Vul de naam van de ontvanger in en vertel iets over hobby\'s, werk of grappige gewoontes. Kies een stijl en een rijmschema, en klik op "Schrijf mijn gedicht". Binnen 30 seconden heb je een gedicht dat echt over die persoon gaat.',
      },
      {
        question: 'Is SintGPT gratis?',
        answer:
          'Je eerste gedicht is gratis, met alles erop en eraan: delen, kopiëren en opslaan als PDF. Daarna kies je wat bij je past, met één betaling inclusief btw: 3 gedichten voor €3,99, Gezin voor €6,99 (een jaar lang zoveel gedichten als je wilt, ook herschrijven) of Hele familie voor €12,99 (alles van Gezin tot en met pakjesavond volgend jaar, met 2 extra PDF-ontwerpen en surprise-ideeën). Bij 7 gedichten kost Gezin minder dan €1 per gedicht.',
      },
      {
        question:
          'Welke stijlen sinterklaasgedichten zijn beschikbaar?',
        answer:
          "Je kiest uit 6 stijlen: Grappig (met humor en woordspelingen), Klassiek (traditioneel en sfeervol), Ironisch (met een knipoog en sarcasme), Ouderwets (in oude Nederlandse stijl), Pikant (met gewaagde knipogen) en Roast (neem je vrienden flink op de hak). Je kunt ook kiezen uit verschillende rijmschema's zoals AABB, ABBA of Limerick.",
      },
      {
        question: 'Voor wie kan ik een sinterklaasgedicht maken?',
        answer:
          'Voor iedereen over wie je iets kunt vertellen: je opa of oma, je partner, een kind, een collega of de buren. Vul ook in wie het gedicht schrijft en voor welk publiek het is. Dan past SintGPT de toon daarop aan. Bij de voorbeelden zie je gedichten voor opa, een kind, een collega en de buurman.',
      },
      {
        question: 'Kan ik een kort sinterklaasgedicht maken?',
        answer:
          'Ja. Je kiest zelf de lengte, van 8 tot 40 regels. Een gedicht van 8 regels lees je in een halve minuut voor. Handig als er veel pakjes zijn. Kies je een limerick, dan bestaat het gedicht uit coupletten van 5 regels.',
      },
      {
        question: 'Hoe persoonlijk worden de gedichten?',
        answer:
          "Hoe meer je vertelt, hoe persoonlijker het gedicht. Noem hobby's, werk, gewoontes of een grappige anekdote. SintGPT verwerkt die details in een gedicht dat alleen bij deze persoon past.",
      },
      {
        question: 'Kan ik het cadeau geheim houden in het gedicht?',
        answer:
          'Ja! Je kunt kiezen of je het cadeau expliciet wilt vermelden of dat het gedicht het cadeau vaag omschrijft, zodat het een verrassing blijft. Perfect voor als je het cadeau nog niet wilt onthullen!',
      },
      {
        question: 'In welke talen kan SintGPT gedichten maken?',
        answer:
          'SintGPT schrijft sinterklaasgedichten in het Nederlands en het Engels. Handig voor Nederlandse families in het buitenland, en voor vrienden die de traditie net leren kennen.',
      },
      {
        question: 'Hoe lang duurt het om een gedicht te schrijven?',
        answer:
          'Gemiddeld 20 tot 30 seconden. Je ziet het gedicht regel voor regel verschijnen.',
      },
      {
        question:
          'Kan ik een gedicht aanpassen of opnieuw laten schrijven?',
        answer:
          'Ja. Met "Herschrijf dit gedicht" krijg je een nieuwe versie met dezelfde gegevens. Dat zit in Gezin en Hele familie. Wil je zelf iets veranderen? Kopieer het gedicht en pas het aan waar je wilt.',
      },
      {
        question: 'Worden mijn gegevens opgeslagen?',
        answer:
          'SintGPT bewaart je gedichten niet, tenzij je ze deelt. Ze staan op je eigen apparaat, onder Mijn gedichten. Om een gedicht te schrijven sturen we wat je invult naar de partijen die de gedichten voor ons schrijven. Vul dus geen gevoelige gegevens in. Deel je een gedicht met een link, dan bewaren we het 90 dagen, en daarna verdwijnt het vanzelf. Iedereen met die link kan het lezen. De eerste twee regels kunnen in onze logboeken terechtkomen. In de privacyverklaring lees je welke partijen dat zijn.',
      },
      {
        question:
          'Ik heb hulp nodig, want er is iets misgegaan met het maken van een gedicht',
        answer:
          'Vervelend om te horen! Stuur een e-mail naar patrick@sintgpt.com en we helpen je zo snel mogelijk verder.',
      },
    ],
  },
  payment: {
    title: 'Kies hoe je verder schrijft',
    nextStep: 'Je gratis gedicht is klaar. Wat je invulde, blijft staan: na het betalen schrijf je meteen verder.',
    limitReached: 'Het gratis gedicht is al gebruikt',
    limitReason: 'Op deze internetverbinding is de afgelopen 24 uur al een gratis gedicht geschreven.',
    description: 'Wil je voor meer mensen schrijven? Vanaf €3,99 schrijf je verder. Voor eenmalig €6,99 schrijf je gedichten voor het hele gezin.',
    oneTimePayment: 'Eenmalig betalen',
    includesVAT: 'incl. btw',
    intro: {
      rewriteTier: 'Gedichten herschrijven met AI zit in Gezin en Hele familie. Wat je invulde, blijft staan.',
      credits: 'Je 3 gedichten zijn geschreven. Wil je verder schrijven? Wat je invulde, blijft staan.',
      surprise: 'Surprise-ideeën bij je gedicht horen bij Hele familie.',
      design: 'Dit PDF-ontwerp hoort bij Hele familie.',
    },
    tiers: {
      legend: 'Kies wat je wilt kopen',
      recommended: 'Aanbevolen',
      owned: 'Dit heb je al',
      notIncluded: 'Niet inbegrepen',
      perPoem: '{price} per gedicht',
      nudge: 'Voor {difference} meer schrijf je met Gezin zoveel gedichten als je wilt.',
      drie: {
        name: '3 gedichten',
        note: '',
        features: ['3 gedichten, voor wie je maar wilt', "Alle stijlen en rijmschema's", 'Tot en met pakjesavond {season}'],
        missing: ['Gedichten herschrijven met AI'],
      },
      gezin: {
        name: 'Gezin',
        note: 'Bij 7 gedichten minder dan €1 per gedicht',
        features: ['Zoveel gedichten als je wilt', 'Gedichten herschrijven met AI', 'Een jaar lang'],
        missing: [],
      },
      familie: {
        name: 'Hele familie',
        note: 'Ook volgend jaar',
        features: ['Alles van Gezin', 'Tot en met pakjesavond {nextSeason}', '2 extra PDF-ontwerpen', 'Surprise-ideeën bij elk gedicht'],
        missing: [],
      },
    },
    payNow: 'Verder met {tier} · {price}',
    processing: 'Even geduld…',
    securePayment: 'Veilig betalen via Dodo Payments',
    error: 'Het betalen lukte niet. Probeer het nog eens.',
    errorTitle: 'Dat ging mis',
    dismiss: 'Melding sluiten',
    restore: {
      title: 'Al betaald? Ga verder met je betalings-ID',
      label: 'Betalings-ID',
      submit: 'Verder',
      checking: 'Even kijken…',
      help: 'Een betalings-ID begint met pay_. Kun je het niet vinden? Mail ons, dan zoeken we het op.',
      invalid: 'Dit is geen geldig betalings-ID. Het begint met pay_.',
      failed: 'We vonden geen geslaagde betaling met dit ID. Kijk het ID nog eens na, of mail ons.',
      pending: 'Deze betaling is nog niet afgerond. Probeer het over een paar minuten opnieuw.',
      expired: 'Deze betaling is verlopen. Kies hierboven opnieuw hoe je verder schrijft.',
    },
    successTitle: 'Gelukt! Je kunt verder schrijven',
    giftTitle: 'Je hebt Hele familie cadeau gekregen',
    giftFailedTitle: 'Deze cadeaulink werkt niet',
    giftFailedMessage: 'De link is verlopen of niet compleet. Vraag degene die hem stuurde om een nieuwe.',
    successMessage: 'Schrijf zoveel gedichten als je wilt, voor het hele gezin.',
    successMessageDrie: 'Je kunt nog 3 gedichten schrijven, tot en met pakjesavond.',
    successMessageFamilie: 'Schrijf zoveel gedichten als je wilt, ook volgend jaar. Bij elk gedicht kun je surprise-ideeën vragen.',
    successDraft: 'Wat je invulde, staat nog in het formulier.',
    successNext: 'Schrijf het gedicht',
    pendingTitle: 'Even je betaling nakijken…',
    pendingMessage:
      'We kijken je betaling na. Dat kan even duren. Vernieuw de pagina als je geen bevestiging krijgt.',
    failedTitle: 'Betaling niet gelukt',
    failedMessage:
      'We vonden geen geslaagde betaling. Probeer het opnieuw, of mail ons.',
    cancelledTitle: 'Je hebt niet betaald',
    cancelledMessage:
      'Geen probleem. Je kunt het op elk moment opnieuw proberen.',
    remainingPoems: '{count} gratis gedicht over | {count} gratis gedichten over',
    unlimitedAccess: 'Kies hoe je verder schrijft',
    unlimitedUnlocked: 'Je schrijft zoveel gedichten als je wilt.',
    poemsLeft: 'Je kunt nog {count} gedicht schrijven. | Je kunt nog {count} gedichten schrijven.',
    creditsUsedTitle: 'Je 3 gedichten zijn geschreven',
    creditsUsedMessage: 'Wil je verder schrijven? Met Gezin schrijf je zoveel gedichten als je wilt.',
    unavailable: {
      title: 'Betalen lukt nu even niet',
      message: 'Onze betaalpagina werkt op dit moment niet. Tot die weer werkt, mag je vandaag tot 3 gedichten gratis maken.',
      continue: 'Verder met een gratis gedicht',
      hint: 'Betalen lukt nu even niet, dus je mag vandaag tot 3 gedichten gratis maken.',
      limitTitle: 'Je hebt de gratis gedichten van vandaag gebruikt',
      limitMessage: 'Betalen lukt nu even niet. Morgen kun je weer gratis gedichten maken. Lukt het niet? Mail naar patrick@sintgpt.com.',
    },
    legal: {
      before: 'Je betaalt aan Dodo Payments. Je kunt direct verder schrijven, dus het herroepingsrecht vervalt zodra je betaald hebt. Lees de',
      terms: 'voorwaarden',
      middle: 'en de',
      privacy: 'privacyverklaring',
      after: '.',
    },
  },
  pdfShowcase: {
    title: 'Print je gedicht in een mooi ontwerp',
    intro: 'Download je gedicht als PDF, in een van deze ontwerpen.',
    alt: 'Ontwerp {design} met het gedicht voor {name}',
    cta: 'Schrijf je gedicht',
  },
  examples: {
    title: 'ChatGPT vs SintGPT',
    chatgpt: 'ChatGPT',
    sintgpt: 'SintGPT',
    chatgptPoem: 'Gedicht van ChatGPT',
    request: 'Vraag',
    fault: 'fout',
    showLabel: 'Welk gedicht',
    readSintgpt: 'Lees het gedicht van SintGPT',
    styleLabel: 'Kies een stijl',
    for: 'Voor',
    present: 'Cadeau',
    secret: 'geheim gehouden',
    facts: 'Weetjes',
    writtenBy: 'Geschreven door',
    audience: 'Publiek',
    rhyme: 'Rijmschema',
    lines: '{count} regels',
    english: 'Engels',
    more: 'Bekijk alle voorbeelden',
    cta: 'Schrijf je eigen gedicht',
    pageTitle: 'Voorbeelden van sinterklaasgedichten',
    seoTitle: 'Voorbeelden van sinterklaasgedichten: grappig tot roast | SintGPT',
    description: 'Acht voorbeelden van sinterklaasgedichten: grappig voor opa, klassiek voor een kind, ironisch voor een collega, een roast voor je broer en meer. Met de gegevens erbij.',
    indexTitle: 'Kies een voorbeeld',
    headings: {
      'opa-kees': 'Grappig sinterklaasgedicht voor opa',
      lotte: 'Klassiek sinterklaasgedicht voor een kind',
      mark: 'Ironisch sinterklaasgedicht voor een collega',
      'tante-els': 'Ouderwets sinterklaasgedicht voor je tante',
      daan: 'Roast-gedicht voor je broer',
      jeroen: 'Pikant sinterklaasgedicht voor je vriend',
      'buurman-gerrit': 'Grappig sinterklaasgedicht voor de buurman',
      emma: 'Sinterklaasgedicht in het Engels',
    },
    pageIntro: 'SintGPT schreef deze gedichten met de gegevens die erbij staan. De mensen zijn verzonnen. Zo zie je wat elke stijl doet.',
    ctaText: 'Je eerste gedicht is gratis. Daarna schrijf je voor eenmalig €6,99 gedichten voor het hele gezin, of 3 gedichten voor €3,99.',
  },
  lootjes: {
    seoTitle: 'Lootjes trekken online: gratis en zonder e-mail | SintGPT',
    description: 'Trek gratis lootjes voor Sinterklaas, zonder account of e-mailadressen. Niemand trekt zichzelf. Geef de telefoon door: iedereen ziet alleen zijn eigen lootje.',
    title: 'Lootjes trekken voor Sinterklaas',
    intro: 'Vul de namen in en trek de lootjes. Geef dan de telefoon door: iedereen tikt op zijn eigen naam en ziet alleen zijn eigen lootje.',
    namesLabel: 'Namen, één per regel',
    namesHelp: 'Minstens 3 namen. Niemand trekt zichzelf.',
    placeholder: 'Sanne\nDaan\nOpa Kees',
    draw: 'Trek lootjes',
    tooFew: 'Vul minstens 3 namen in.',
    tooMany: 'Vul hooguit 50 namen in.',
    duplicate: 'Elke naam mag maar één keer voorkomen. Maak ze verschillend, bijvoorbeeld "Sanne B." en "Sanne K.".',
    pass: 'Geef de telefoon door. Tik op je eigen naam.',
    seen: 'gezien',
    youDrew: '{name}, jij hebt het lootje van',
    hide: 'Verberg en geef door',
    progress: '{seen} van de {total} hebben hun lootje gezien.',
    again: 'Nieuwe trekking',
    confirmAgain: 'De lootjes van nu verdwijnen. Weet je het zeker?',
    confirmYes: 'Ja, trek opnieuw',
    cancel: 'Annuleren',
    ctaTitle: 'Lootje binnen? Nu nog een gedicht',
    cta: 'Schrijf een gedicht',
    privacy: 'De namen blijven op dit apparaat. We sturen ze niet naar een server.',
    howTitle: 'Zo werkt lootjes trekken op SintGPT',
    steps: [
      'Vul de namen in, één per regel. Je hebt minstens 3 en hooguit 50 namen nodig.',
      'Druk op "Trek lootjes". De pagina trekt in één keer voor iedereen een lootje.',
      'Geef de telefoon door. Iedereen tikt op de eigen naam, ziet het lootje en verbergt het weer voor de volgende.',
      'Achter elke naam die zijn lootje heeft gezien, staat "gezien". Zo weet je wanneer iedereen klaar is.',
    ],
    faqTitle: 'Vragen over lootjes trekken',
    faq: [
      {
        question: 'Kan iemand zichzelf trekken?',
        answer: 'Nee. Niemand trekt zichzelf, en twee mensen trekken nooit elkaar. Alle lootjes vormen samen één kring, dus opnieuw trekken is nooit nodig.',
      },
      {
        question: 'Waar blijven de namen?',
        answer: 'Op deze telefoon. We sturen de namen niet naar een server. De trekking blijft bewaard tot je op "Nieuwe trekking" drukt, ook als je de pagina sluit.',
      },
      {
        question: 'Wat als iemand zijn lootje vergeet?',
        answer: 'Open de pagina weer op dezelfde telefoon. De trekking staat er nog, dus die persoon tikt gewoon opnieuw op de eigen naam.',
      },
      {
        question: 'Kunnen we partners uitsluiten?',
        answer: 'Nee, de pagina let alleen op de regel dat niemand zichzelf trekt. Trekt een stel elkaar toch, trek dan voor de hele groep opnieuw, zodat niemand ziet wie het was.',
      },
      {
        question: 'Kan het ook als we niet bij elkaar zijn?',
        answer: 'De pagina werkt met één telefoon die rondgaat. Woont de familie verspreid, laat dan één persoon trekken die zelf niet meedoet en ieder lootje apart doorstuurt.',
      },
      {
        question: 'Wat kost het?',
        answer: 'Niets. Lootjes trekken is gratis, en je hoeft geen account te maken.',
      },
    ],
    moreTips: 'Meer over budget, afspraken en etiquette lees je in',
    moreTipsLink: 'Lootjes trekken: zo organiseer je het eerlijk',
  },
  video: {
    title: 'Sinterklaas over sintgpt.com',
  },
  legal: {
    back: 'Terug naar SintGPT',
    updated: 'Laatst bijgewerkt: 9 november 2026',
    privacy: {
      title: 'Privacyverklaring',
      seoTitle: 'Privacyverklaring | SintGPT',
      description: 'Welke gegevens SintGPT gebruikt om je sinterklaasgedicht te maken, waar ze heen gaan en hoe lang we ze bewaren.',
      intro: 'SintGPT maakt sinterklaasgedichten met AI. We gebruiken zo min mogelijk gegevens. Hier lees je welke, waarvoor en hoe lang.',
      sections: [
        {
          heading: 'Wie we zijn',
          body: [
            'SintGPT (sintgpt.com) is verantwoordelijk voor de gegevens in deze verklaring. Je bereikt ons via patrick@sintgpt.com.',
          ],
        },
        {
          heading: 'Wat je invult voor een gedicht',
          body: [
            'Om een gedicht te schrijven sturen we wat je in het formulier invult (zoals de naam, het cadeau en de weetjes, en bij herschrijven je wens en het vorige gedicht) naar onze AI-diensten: Vercel AI Gateway en het AI-model van Google. Bij een storing gebruiken we het model van OpenAI. Deze diensten kunnen de gegevens buiten de Europese Unie verwerken.',
            'SintGPT bewaart wat je invult niet op een server. We schrijven het ook niet in onze logs. Vul geen gevoelige gegevens in, zoals gezondheid, geloof of adressen.',
            'Grondslag: het uitvoeren van de dienst waar je om vraagt.',
          ],
        },
        {
          heading: 'Op je eigen apparaat',
          body: [
            'Je gedichten, je taalkeuze en het aantal gratis gedichten dat je gebruikte staan in de opslag van je browser (localStorage). Ze verlaten je apparaat niet. Je wist ze met "Alles wissen" onder Mijn gedichten, of door de websitegegevens in je browser te wissen.',
            'Ga je betalen, dan bewaren we ook wat je in het formulier invulde, zodat het er nog staat als je terugkomt. We wissen het zodra je terug bent. Kom je niet binnen 2 uur terug, dan gebruiken we het niet meer en wissen we het bij je volgende bezoek.',
            'Trek je lootjes op sintgpt.com/lootjes, dan staan de namen en de lootjes alleen op je apparaat, tot je een nieuwe trekking begint. We sturen ze niet naar een server.',
          ],
        },
        {
          heading: 'Gedeelde gedichten',
          body: [
            'Deel je een gedicht met een korte link, dan bewaren we het gedicht 90 dagen bij Cloudflare (Workers KV). Daarna verdwijnt het vanzelf. Iedereen met de link kan het lezen. Bij een lange link staat het gedicht in de link zelf. De eerste regels kunnen dan in de serverlogs komen. Pas je een gedicht aan, dan stuurt je browser het aangepaste en het oorspronkelijke gedicht naar onze server, zodat de deellink blijft werken. We bewaren ze daarbij niet.',
          ],
        },
        {
          heading: 'Je IP-adres',
          body: [
            'Gratis gebruikers mogen 1 gedicht per dag maken, of 3 als betalen tijdelijk niet werkt. Om dat te tellen gebruiken we je IP-adres. We bewaren het niet zelf: Cloudflare bewaart alleen een versleutelde afgeleide (een hash) en een teller. Die verdwijnen na hooguit 24 uur. Voor betalende gebruikers tellen we op dezelfde manier per betaling, met een maximum van 100 gedichten per dag. Bij 3 gedichten tellen we per betaling hoeveel gedichten je schreef; die teller verdwijnt na pakjesavond.',
            'Cloudflare host de website en houdt technische logs bij, zoals het tijdstip en het adres van een aanvraag. Die logs bewaren we hooguit 7 dagen, om storingen en misbruik op te sporen.',
            'Grondslag: ons gerechtvaardigd belang om de dienst betaalbaar, veilig en beschikbaar te houden.',
          ],
        },
        {
          heading: 'Betalen',
          body: [
            'Je betaalt bij Dodo Payments. Dodo is de verkoper (merchant of record) en verwerkt je naam, e-mailadres en betaalgegevens volgens zijn eigen privacybeleid. SintGPT krijgt alleen het betalings-ID, de status en het product van je betaling te zien.',
            'Na een geslaagde betaling, of als je een cadeaulink opent, zetten we het cookie "sintgpt-access" in je browser. Het bevat je betalings-ID en een handtekening, zodat we weten dat je betaald hebt. Het bevat ook wat je kocht en tot wanneer het geldt, en het verloopt dan (na hooguit 400 dagen). Het is nodig voor de dienst die je kocht.',
            'Grondslag: het uitvoeren van de overeenkomst.',
          ],
        },
        {
          heading: 'Statistieken',
          body: [
            'We tellen bezoeken en een paar handelingen, zoals "gedicht gemaakt" en "PDF opgeslagen". Dat doen we zelf, met Cloudflare Workers Analytics Engine. Per handeling bewaren we wat het was, de pagina, je taalkeuze, je land, de website waar je vandaan kwam, de campagnecode in de link (zoals utm_source), de instellingen van het gedicht (zoals stijl en lengte), of je velden zoals de weetjes hebt ingevuld (niet wat erin staat), hoe lang het schrijven duurde, of je het gedicht goed of niet goed vond, het hoeveelste gedicht op je apparaat het is, of je betaald hebt en wat je kocht. Cloudflare leidt je land af uit je IP-adres; het IP-adres zelf bewaren we niet.',
            'We bewaren geen namen, geen ingevulde teksten, geen betalings-ID en geen IP-adres. We gebruiken er geen cookies voor en volgen je niet over andere websites. Cloudflare wist deze gegevens na 3 maanden.',
            'Grondslag: ons gerechtvaardigd belang om de website te verbeteren.',
          ],
        },
        {
          heading: 'Cookies',
          body: [
            'SintGPT gebruikt geen tracking- of advertentiecookies. Het enige cookie is "sintgpt-access", na een betaling of een cadeaulink. Daarom tonen we geen cookiemelding.',
          ],
        },
        {
          heading: 'E-mail',
          body: [
            'Mail je ons, dan gebruiken we je e-mailadres en je bericht alleen om je te helpen. We verwijderen de mail als we hem niet meer nodig hebben.',
          ],
        },
        {
          heading: 'Je rechten',
          body: [
            'Je mag ons vragen welke gegevens we van je hebben, en vragen om ze te verbeteren of te verwijderen. Je mag ook bezwaar maken tegen het gebruik. Mail daarvoor naar patrick@sintgpt.com. We antwoorden binnen een maand.',
            'Ben je het niet eens met hoe we met je gegevens omgaan? Dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.',
          ],
        },
      ],
    },
    terms: {
      title: 'Voorwaarden',
      seoTitle: 'Voorwaarden | SintGPT',
      description: 'De voorwaarden voor het gebruik van SintGPT en voor wat je kunt kopen: 3 gedichten, Gezin en Hele familie.',
      intro: 'Deze voorwaarden gelden als je SintGPT gebruikt. Ze zijn kort, en we hebben ze zo duidelijk mogelijk geschreven.',
      sections: [
        {
          heading: 'De dienst',
          body: [
            'SintGPT schrijft met AI sinterklaasgedichten op basis van wat je invult. Je kunt de gedichten kopiëren, delen en als PDF opslaan.',
          ],
        },
        {
          heading: 'Gratis gebruik',
          body: [
            'Je eerste gedicht is gratis. Per internetaansluiting kun je hooguit 1 gratis gedicht per 24 uur maken. Werkt betalen tijdelijk niet, dan zijn dat er 3.',
          ],
        },
        {
          heading: 'Wat je kunt kopen',
          body: [
            'Na je gratis gedicht kies je uit drie mogelijkheden. Je betaalt één keer; de prijzen zijn inclusief btw. Er is geen abonnement.',
            '3 gedichten kost €3,99. Je schrijft 3 gedichten, tot en met de eerstvolgende pakjesavond (5 december). Gedichten herschrijven met AI hoort er niet bij.',
            'Gezin kost €6,99. Je schrijft een jaar lang, gerekend vanaf je betaling, zoveel gedichten als je wilt, en je kunt gedichten herschrijven.',
            'Hele familie kost €12,99. Je krijgt alles van Gezin, tot en met de tweede pakjesavond na je betaling: betaal je vóór 6 december 2026, dan tot en met 5 december 2027. Je krijgt ook 2 extra PDF-ontwerpen en surprise-ideeën bij je gedichten.',
            'Bij Gezin en Hele familie schrijf je zoveel gedichten als je redelijkerwijs nodig hebt, met een maximum van 100 gedichten per 24 uur; surprise-ideeën tellen mee. Zo houden we de dienst betaalbaar.',
            'Je schrijft in de browser waarmee je betaalde. In een andere browser ga je verder met je betalings-ID. Wil je later meer, dan koop je een andere mogelijkheid los; wat je al betaalde, verrekenen we niet.',
            'Je betaalt aan Dodo Payments. Dodo is de verkoper (merchant of record) en stuurt je de factuur. Voor de betaling gelden ook de voorwaarden van Dodo.',
          ],
        },
        {
          heading: 'Herroepingsrecht',
          body: [
            'Wat je koopt, is een digitale dienst die direct na de betaling begint. Als je betaalt, vraag je om die directe levering. Daardoor vervalt je herroepingsrecht van 14 dagen zodra je verder kunt schrijven.',
            'Werkt er iets niet zoals het hoort? Mail naar patrick@sintgpt.com, dan zoeken we samen een oplossing.',
          ],
        },
        {
          heading: 'Gedichten van AI',
          body: [
            'De gedichten worden door AI geschreven. Ze kunnen fouten bevatten, niet goed rijmen of niet passen bij de ontvanger. Lees een gedicht dus altijd na voordat je het gebruikt.',
            'Je bent zelf verantwoordelijk voor wat je invult en voor wat je met een gedicht doet. Houd het leuk, ook bij Roast en Pikant: gebruik SintGPT niet om iemand te kwetsen, te bedreigen of te discrimineren.',
            'Vul alleen gegevens over anderen in als je weet dat zij dat goed vinden, en vul nooit gevoelige gegevens in.',
          ],
        },
        {
          heading: 'Gebruik van de gedichten',
          body: [
            'Je mag de gedichten die je maakt vrij gebruiken, aanpassen en delen. De website zelf, met de teksten, afbeeldingen en code, blijft van SintGPT.',
          ],
        },
        {
          heading: 'Beschikbaarheid en aansprakelijkheid',
          body: [
            'We doen ons best om SintGPT altijd te laten werken, maar we beloven dat niet. We kunnen de dienst aanpassen of tijdelijk stopzetten, bijvoorbeeld bij onderhoud of een storing bij een AI-dienst.',
            'Onze aansprakelijkheid is beperkt tot het bedrag dat je aan SintGPT betaalde, behalve bij opzet of grove nalatigheid.',
          ],
        },
        {
          heading: 'Overig',
          body: [
            'Op deze voorwaarden is Nederlands recht van toepassing. We kunnen de voorwaarden aanpassen. De datum bovenaan laat zien wanneer dat voor het laatst gebeurde. Vragen? Mail naar patrick@sintgpt.com.',
          ],
        },
      ],
    },
  },
};
