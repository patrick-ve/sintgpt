// Briefs for the blog posts that scripts/write-blog-posts.ts has the default
// poem model write. One brief per post; the slug is the URL and never changes.
// SITE_FACTS is the only source for what the post may say about SintGPT.

export interface BlogBrief {
  slug: string;
  /** The search term the post is for. */
  keyword: string;
  /** Related searches the post should also answer. */
  secondary: string[];
  /** What the reader wants, and what the post must cover. */
  angle: string;
  /** Extra material the post must use (checked facts, rhyme lists). */
  material?: string;
  /** Where the SintGPT call to action sends the reader. */
  cta: '/' | '/lootjes';
}

export const SITE_FACTS = `
- SintGPT (sintgpt.com) schrijft in ongeveer 30 seconden een persoonlijk sinterklaasgedicht, in het Nederlands of het Engels.
- Je vult in: de naam van de ontvanger, het cadeau (en of het cadeau geheim blijft), weetjes over de ontvanger, wie het gedicht schrijft en voor welk publiek het is.
- Zes stijlen: Grappig, Klassiek, Ironisch, Ouderwets, Pikant en Roast. Rijmschema's: AABB, ABAB, ABBA en limerick. Lengte: 8 tot 40 regels.
- Wat elke stijl op SintGPT schrijft: Grappig is speels en luchtig; Klassiek is traditioneel, warm en respectvol; Ironisch is geestig en subtiel sarcastisch; Ouderwets is formeel en traditioneel in taal en toon; Pikant heeft suggestieve dubbelzinnigheden en gewaagde knipogen, maar blijft smaakvol en is nooit expliciet; Roast is een genadeloze maar liefdevolle roast.
- De stijl Roast neemt de ontvanger flink op de hak op basis van wat jij invult, en maakt geen grappen over afkomst, geloof, geaardheid, gender, handicap, ziekte, lichaam, gewicht, overleden naasten of geldzorgen. Een roast eindigt warm.
- Je eerste gedicht is gratis. Noem geen andere prijzen.
- Je kunt een gedicht delen met een link, kopiëren of opslaan als PDF.
- Op sintgpt.com/lootjes trek je gratis lootjes, zonder account en zonder e-mailadressen. Je vult 3 tot 50 namen in. Niemand trekt zichzelf, en met 3 of meer namen trekken twee mensen nooit elkaar. Eén telefoon gaat rond: iedereen tikt op de eigen naam en ziet alleen het eigen lootje. De namen blijven op die telefoon. Partners uitsluiten kan niet.
- Op sintgpt.com/voorbeelden staan voorbeeldgedichten in alle zes stijlen, voor verzonnen personen.
`.trim();

export const STYLE_RULES = `
- Schrijf in helder, warm Nederlands voor gewone lezers. Spreek de lezer aan met "je". Gebruik korte zinnen en de actieve vorm.
- Geen overdreven woorden zoals "ontdek", "ultiem", "hilarisch", "geweldig", "perfect" of "magisch". Geen emoji. Geen uitroeptekens, behalve in voorbeeldgedichten.
- Gebruik "schrijven" en niet "genereren". Noem SintGPT geen "tool". Schrijf niet "AI-gegenereerd". Noem geen AI-model, geen AI-bedrijf en geen ChatGPT.
- Verzin geen cijfers, onderzoeken, citaten, bronnen of jaartallen. Over geschiedenis schrijf je alleen algemeen bekende feiten, zonder precieze data die je niet zeker weet.
- Voorbeeldgedichten schrijf je zelf, voor verzonnen personen. Ze hebben een duidelijk ritme en echt rijm (volrijm, geen halfrijm). Lees elk rijmpaar na: de klank moet vanaf de laatste beklemtoonde klinker gelijk zijn.
- Wat je over SintGPT schrijft, komt alleen uit de feiten hieronder. Noem SintGPT hooguit twee keer in de tekst, plus de afsluitende oproep.
- SEO: het zoekwoord staat in de titel, in de lead, in de eerste tussenkop en een paar keer natuurlijk in de tekst. Geen opsomming van zoekwoorden. Tussenkoppen zijn beschrijvend of een vraag die mensen echt stellen.
- Lengte: 900 tot 1400 woorden. Geef praktische, concrete hulp: stappen, voorbeelden, valkuilen.
- Gebruik 2 tot 4 links naar andere pagina's van de site, alleen uit de lijst met toegestane links, in de vorm [linktekst](/pad). De linktekst beschrijft waar de link heen gaat, nooit "klik hier".
- Vet (**zo**) alleen voor een paar kernbegrippen.
- Schrijf foutloos Nederlands. Controleer elke zin op spelling en grammatica.
- Schrijf over taal en uitspraak alleen wat je zeker weet.
- Beschrijf de stijl Roast nooit als mild: die neemt de ontvanger flink op de hak.
- Maak geen aparte sectie die SintGPT aanprijst. Daarvoor is de afsluitende oproep.
- Woorden die niet mogen: ontdek, ultiem, hilarisch, geweldig, magisch, genereren, tool, AI-gegenereerd, ChatGPT.
`.trim();

const RHYMES = `
Gecontroleerde rijmwoorden (volrijm). Gebruik deze lijsten en voeg alleen woorden toe waarvan je zeker bent:
- Sint: kind, vindt, wint, begint, lint, print, bemint, blind, wind, tint
- Sinterklaas: baas, kaas, haas, dwaas, vaas, gaas, verbaas, geraas
- Piet: niet, ziet, verdriet, lied, riet, geniet, biedt, gebied
- cadeau: zo, bureau, niveau, plateau, tableau
- pakje: zakje, takje, dakje, plakje, vlakje
- boek: zoek, hoek, broek, koek, doek, bezoek, onderzoek
- gedicht: licht, zicht, dicht, gezicht, plicht, bericht, verplicht
- schoen: doen, zoen, groen, toen, fatsoen, miljoen, kampioen, citroen
- paard en baard: waard, haard, aard, bewaard, gespaard, verklaard
- dak: zak, pak, gemak, vak, tak, plak
- schoorsteen: steen, heen, alleen, geen, been, meteen, gemeen
- pepernoot en stoomboot: groot, boot, brood, rood, schoot, poot, genoot, sloot
- chocolade: schade, genade, salade, parade, ballade, marmelade, limonade
- marsepein: fijn, klein, zijn, trein, plein, lijn, konijn, gordijn
- Spanje: oranje, kastanje
- staf: af, straf, laf, draf
- roe: moe, toe, doe, hoe, koe
- zoet: goed, doet, moet, voet, groet, hoed
- sokken: lokken, rokken, brokken, jokken, klokken, vlokken
- sjaal: taal, verhaal, maal, schaal, normaal, totaal, allemaal
Lastig om op te rijmen: "december", "pakjesavond", "surprise". Zet zulke woorden niet aan het eind van een regel.
`.trim();

const AABB_ONLY = 'Schrijf elk voorbeeldgedicht en elk voorbeeldcouplet in rijmschema AABB (rijmparen), want dat kiezen de meeste mensen.';

export const BLOG_BRIEFS: BlogBrief[] = [
  // Posts about the poem styles (November 2026).
  {
    slug: 'sinterklaasgedicht-stijlen',
    keyword: 'soorten sinterklaasgedichten',
    secondary: ['stijl sinterklaasgedicht', 'welke toon voor een sinterklaasgedicht', 'sinterklaasgedicht grappig of klassiek'],
    angle: `Een overzicht van de zes stijlen die SintGPT kent: Grappig, Klassiek, Ironisch, Ouderwets, Pikant en Roast. Per stijl: hoe hij klinkt, voor wie en welk publiek hij past, waar je op let, en een kort voorbeeld van vier regels voor dezelfde verzonnen ontvanger (Tante Ria, 58, die elke week een nieuwe hobby begint en een fondueset krijgt), zodat de lezer de stijlen kan vergelijken. Daarna: hoe je kiest (wie is de ontvanger, wie luistert er mee, hoe goed ken je elkaar), en welke stijlen je beter niet kiest voor kinderen, collega's of schoonfamilie. Link bij elke stijl naar het artikel over die stijl: /blog/grappige-sinterklaasgedichten-tips, /blog/klassiek-sinterklaasgedicht, /blog/ironisch-sinterklaasgedicht, /blog/ouderwets-sinterklaasgedicht, /blog/pikant-sinterklaasgedicht en /blog/roast-sinterklaasgedicht-zonder-te-kwetsen. Je mag voor dit artikel 6 tot 8 links gebruiken. ${AABB_ONLY}`,
    cta: '/',
  },
  {
    slug: 'klassiek-sinterklaasgedicht',
    keyword: 'klassiek sinterklaasgedicht',
    secondary: ['traditioneel sinterklaasgedicht', 'lief sinterklaasgedicht', 'sinterklaasgedicht voorbeeld klassiek'],
    angle: `Het klassieke gedicht: de Sint spreekt, met het grote boek, Piet en de stoomboot, warm en respectvol, met een compliment en een kleine plagerij. Wanneer het past (kinderen die nog geloven, opa en oma, een gemengd gezelschap). Vaste onderdelen: de Sint die alles weet, wat goed ging dit jaar, een klein werkpuntje, het cadeau. Hoe je het persoonlijk maakt in plaats van een rijtje clichés, en hoe je het niet stoffig laat klinken. Met een compleet voorbeeldgedicht van 12 tot 16 regels en een paar losse coupletten. ${AABB_ONLY}`,
    cta: '/',
  },
  {
    slug: 'ironisch-sinterklaasgedicht',
    keyword: 'ironisch sinterklaasgedicht',
    secondary: ['sarcastisch sinterklaasgedicht', 'droog sinterklaasgedicht', 'sinterklaasgedicht met een knipoog'],
    angle: `Het ironische gedicht: zeggen wat je niet bedoelt, droog en subtiel. Technieken: overdreven lof voor iets kleins, doen alsof een slechte gewoonte een talent is, understatement, een droge slotregel. Het verschil met grappig en met roast. Voor wie het werkt (volwassenen, collega's, vrienden die je goed kent) en voor wie niet (jonge kinderen begrijpen ironie vaak niet). Hoe je het voorleest zodat de ironie aankomt. Met voorbeelden per techniek en een compleet voorbeeldgedicht van 12 tot 16 regels. ${AABB_ONLY}`,
    cta: '/',
  },
  {
    slug: 'ouderwets-sinterklaasgedicht',
    keyword: 'ouderwets sinterklaasgedicht',
    secondary: ['sinterklaasgedicht in oude stijl', 'deftig sinterklaasgedicht', 'formeel sinterklaasgedicht'],
    angle: `Het ouderwetse gedicht: formele, plechtige taal zoals vroeger, met aanspreekvormen als "Gij" en "Uwe", "Hooggeachte", "alzo" en "derhalve". Waarom het grappig werkt als contrast met een modern onderwerp (een smartphone, een sportschool, een thuiswerkdag). Woorden en zinswendingen die je kunt gebruiken, hoe je het niet onleesbaar maakt, en hoe je voorleest met een plechtige stem. Voor wie het past. Met een woordenlijstje, losse voorbeeldcoupletten en een compleet voorbeeldgedicht van 12 tot 16 regels. ${AABB_ONLY}`,
    cta: '/',
  },
  {
    slug: 'pikant-sinterklaasgedicht',
    keyword: 'pikant sinterklaasgedicht',
    secondary: ['ondeugend sinterklaasgedicht', 'sinterklaasgedicht voor volwassenen', 'dubbelzinnig sinterklaasgedicht'],
    angle: `Het pikante gedicht: suggestief en dubbelzinnig, een knipoog, nooit expliciet. Dubbelzinnigheid werkt doordat de luisteraar zelf de tweede betekenis invult. Voor wie het past (je partner, een vriendengroep van volwassenen) en wanneer niet (kinderen erbij, collega's, schoonfamilie, iemand die zich ongemakkelijk voelt). Een check vooraf: zou de ontvanger dit zelf ook grappig vinden met dit publiek erbij? Technieken: dubbelzinnige woorden rond het cadeau, een onschuldige tweede betekenis, de suggestie stoppen voordat het grof wordt. Geef voorbeeldcoupletten die netjes genoeg zijn voor een gemengd volwassen gezelschap. Niets seksueel expliciets, geen lichaamsdelen. ${AABB_ONLY}`,
    cta: '/',
  },
  // Posts from 10 November 2026.
  {
    slug: 'sinterklaasgedicht-beginnen-en-afsluiten',
    keyword: 'begin sinterklaasgedicht',
    secondary: ['hoe begin je een sinterklaasgedicht', 'openingszin sinterklaasgedicht', 'slotzin sinterklaasgedicht', 'einde sinterklaasgedicht'],
    angle: 'De lezer zit vast bij de eerste regel of weet niet hoe het gedicht moet eindigen. Leg uit waarom begin en slot zo belangrijk zijn bij het voorlezen. Geef manieren om te beginnen (het grote boek van de Sint, een gebeurtenis, de ontvanger aanspreken, meteen de grap) en om te eindigen (het cadeau aankondigen, warm afsluiten, terugkomen op het begin). Geef minstens 15 openingszinnen en minstens 8 slotzinnen als rijmende tweeregelige voorbeelden, gegroepeerd per toon (klassiek, grappig, voor kinderen, voor collega\'s, ouderwets). Gebruik [naam] als plek voor de naam.',
    cta: '/',
  },
  {
    slug: 'rijmwoorden-sinterklaas',
    keyword: 'rijmwoorden sinterklaas',
    secondary: ['wat rijmt op Sinterklaas', 'wat rijmt op Piet', 'wat rijmt op cadeau', 'rijmwoorden sinterklaasgedicht'],
    angle: 'Een naslagartikel met rijmwoorden voor de woorden die in bijna elk sinterklaasgedicht voorkomen, per woord een lijst. Leg kort uit wanneer woorden rijmen (klank, niet spelling; staand en slepend rijm), wat je doet als een woord geen goed rijm heeft (zin omdraaien, ander woord kiezen) en hoe je stoplappen vermijdt. Geef bij een paar woorden een rijmend voorbeeld van twee regels.',
    material: RHYMES,
    cta: '/',
  },
  {
    slug: 'kort-sinterklaasgedicht',
    keyword: 'kort sinterklaasgedicht',
    secondary: ['korte sinterklaasgedichten', 'sinterklaasgedicht 4 regels', 'sinterklaasgedicht 8 regels', 'kort sinterklaasgedicht voorbeeld'],
    angle: 'Voor wie weinig tijd heeft of een avond met veel pakjes. Leg uit wanneer kort beter is, hoe je in 4 of 8 regels toch persoonlijk bent (één weetje, het cadeau, een slotgrap) en wat je weglaat. Geef minstens 6 korte voorbeeldgedichten van 4 tot 8 regels voor verschillende ontvangers.',
    cta: '/',
  },
  {
    slug: 'sinterklaasgedicht-opa-oma',
    keyword: 'sinterklaasgedicht opa en oma',
    secondary: ['sinterklaasgedicht voor opa', 'sinterklaasgedicht voor oma', 'gedicht voor grootouders'],
    angle: 'Een gedicht voor opa of oma: onderwerpen die goed werken (gewoontes, verhalen van vroeger, de kleinkinderen), een toon die warm is en plaagt zonder te kwetsen, een rustig ritme dat goed voorleest en aandacht voor slechthorende luisteraars (duidelijk voorlezen, korte regels). Geef minstens 3 voorbeeldcoupletten.',
    cta: '/',
  },
  {
    slug: 'sinterklaasgedicht-partner',
    keyword: 'sinterklaasgedicht voor je partner',
    secondary: ['sinterklaasgedicht vriend', 'sinterklaasgedicht vriendin', 'romantisch sinterklaasgedicht'],
    angle: 'Een gedicht voor je vriend, vriendin, man of vrouw. Lief, grappig of een beetje pikant: wat past bij welk publiek (alleen samen, met de kinderen erbij, met schoonfamilie). Hoe je gedeelde herinneringen en kleine gewoontes gebruikt. Waar de grens ligt bij pikant als er anderen meeluisteren. Geef minstens 3 voorbeeldcoupletten in verschillende tonen, nooit expliciet.',
    cta: '/',
  },
  {
    slug: 'sinterklaasgedicht-voor-kinderen',
    keyword: 'sinterklaasgedicht voor kinderen',
    secondary: ['sinterklaasgedicht kind', 'sinterklaasgedicht peuter', 'sinterklaasgedicht tiener'],
    angle: 'Gedichten voor kinderen per leeftijd: kleine kinderen (kort, eenvoudige woorden, de Sint en Piet die alles zien), kinderen die nog in de Sint geloven (laat de Sint spreken, verraad niets, prijs wat goed gaat, geen roe-dreigementen), en tieners (plagen mag, met humor over hun eigen wereld). Geef per groep een kort voorbeeld.',
    cta: '/',
  },
  {
    slug: 'sinterklaasgedicht-in-het-engels',
    keyword: 'sinterklaasgedicht in het Engels',
    secondary: ['Sinterklaas poem in English', 'Engels sinterklaasgedicht', 'Sinterklaas uitleggen aan internationals'],
    angle: 'Voor gezinnen en teams met mensen die geen Nederlands spreken. Leg uit wanneer een Engels gedicht handig is, hoe je de traditie in een paar regels uitlegt, wat er anders is aan rijmen in het Engels, en hoe je een tweetalig gedicht maakt. Geef minstens 2 Engelse voorbeeldcoupletten en een tweetalig voorbeeld. De tekst van het artikel is Nederlands.',
    cta: '/',
  },
  // Rewrites of the existing posts.
  {
    slug: 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
    keyword: 'sinterklaasgedicht schrijven',
    secondary: ['hoe schrijf je een sinterklaasgedicht', 'sinterklaasgedicht tips', 'sinterklaasgedicht maken'],
    angle: 'De complete handleiding in stappen: informatie verzamelen, toon en rijmschema kiezen, het cadeau verwerken (ook geheim houden), ritme en lengte, concrete details, een sterk slot, hardop nalezen. Met een voorbeeldgedicht en veelgemaakte fouten.',
    cta: '/',
  },
  {
    slug: 'grappige-sinterklaasgedichten-tips',
    keyword: 'grappig sinterklaasgedicht',
    secondary: ['grappige sinterklaasgedichten', 'grappig sinterklaasgedicht voorbeeld', 'humor in een sinterklaasgedicht'],
    angle: 'Technieken voor humor: woordspelingen, overdrijving, een herkenbare gebeurtenis, zelfspot, de limerick en een verrassend einde. Met voorbeelden per techniek, een compleet voorbeeldgedicht en wat je beter niet doet.',
    cta: '/',
  },
  {
    slug: 'sinterklaas-tradities',
    keyword: 'sinterklaas tradities',
    secondary: ['sinterklaastradities', 'geschiedenis van Sinterklaas', 'pakjesavond tradities', 'schoen zetten'],
    angle: 'De bekendste tradities en waar ze voor dienen: de intocht, schoen zetten, het grote boek, pepernoten en andere lekkernijen, pakjesavond op 5 december, surprises en het gedicht. Hoe families het feest nu vieren, en hoe je het uitlegt aan iemand die het niet kent. Blijf bij algemeen bekende feiten.',
    cta: '/',
  },
  {
    slug: 'rijm-en-ritme-sinterklaasgedicht',
    keyword: 'rijmschema sinterklaasgedicht',
    secondary: ['rijm en ritme sinterklaasgedicht', 'AABB rijmschema', 'heffingen tellen', 'staand en slepend rijm'],
    angle: 'Hoe een gedicht lekker voorleest: heffingen tellen, staand en slepend rijm, volrijm en halfrijm, de vier rijmschema\'s AABB, ABAB, ABBA en de limerick (AABBA) met een voorbeeld per schema, de bekendste valkuilen (stoplappen, gewrongen zinsbouw) en hardop nalezen.',
    cta: '/',
  },
  {
    slug: 'surprise-maken-ideeen',
    keyword: 'surprise maken',
    secondary: ['surprise ideeën', 'sinterklaas surprise', 'surprise maken tips', 'papier-maché surprise'],
    angle: 'Van idee tot afwerking: begin bij de persoon, materialen en gereedschap, technieken (dozen, papier-maché met droogtijd, het cadeau verstoppen), surprise en gedicht laten samenwerken, ideeën per type ontvanger, natte of vieze surprises alleen na overleg, en een planning.',
    cta: '/',
  },
  {
    slug: 'roast-sinterklaasgedicht-zonder-te-kwetsen',
    keyword: 'roast sinterklaasgedicht',
    secondary: ['sinterklaasgedicht plagen', 'gemeen sinterklaasgedicht', 'iemand op de hak nemen in een gedicht'],
    angle: 'Stevig plagen zonder te kwetsen: plaag wat iemand doet, niet wie iemand is; onderwerpen die wel en niet kunnen; een check vooraf; overdrijven; je publiek kennen (familie, werk); altijd warm eindigen; voorlezen met de juiste toon. Leg uit wat de stijl Roast op SintGPT doet, alleen met de feiten hieronder.',
    cta: '/',
  },
  {
    slug: 'sinterklaas-op-het-werk',
    keyword: 'sinterklaasgedicht collega',
    secondary: ['sinterklaas op het werk', 'sinterklaas op kantoor', 'lootjes trekken met collega\'s'],
    angle: 'Sinterklaas vieren met collega\'s: meedoen is vrijwillig, lootjes trekken, een laag en gelijk budget, een gedicht over een collega dat leuk blijft (goede onderwerpen en wat je laat liggen), een inclusieve toon voor collega\'s die het feest niet kennen, en de viering zelf. Geef een voorbeeldcouplet over een collega.',
    cta: '/',
  },
  {
    slug: 'lootjes-trekken-tips',
    keyword: 'lootjes trekken',
    secondary: ['lootjes trekken sinterklaas', 'lootjes trekken online', 'lootjes trekken regels', 'lootjes trekken op afstand'],
    angle: 'Eerlijk lootjes trekken: waarom de hoed met briefjes vaak misgaat (iemand trekt zichzelf), afspraken vooraf (budget, gedicht en surprise, verlanglijstje, datum), partners, jonge kinderen en groepen op afstand, etiquette, en de avond zelf. Leg uit hoe de lootjespagina van SintGPT werkt, alleen met de feiten hieronder.',
    cta: '/lootjes',
  },
];
