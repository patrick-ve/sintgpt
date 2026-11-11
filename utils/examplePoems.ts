// Example poems for the home page and /voorbeelden. Written by SintGPT with
// scripts/generate-example-poems.ts from the inputs below; the people are
// made up. Keep each poem next to the input it was written from.

export type ExampleStyle = 'funny' | 'classic' | 'ironic' | 'old-fashioned' | 'spicy' | 'roast';

export interface ExamplePoemInput {
  id: string;
  request: {
    name: string;
    present?: string;
    revealPresent?: boolean;
    funFacts?: string;
    writtenBy?: string;
    writtenForAudience?: string;
    style: ExampleStyle;
    rhymeScheme: 'AABB' | 'ABAB' | 'ABBA' | 'Limerick';
    lines: number;
    language: 'dutch' | 'english';
  };
}

export interface ExamplePoem extends ExamplePoemInput {
  poem: string;
}

export const EXAMPLE_POEMS: ExamplePoem[] = [
  {
    id: 'opa-kees',
    request: {
      name: 'Opa Kees',
      present: 'een verrekijker',
      funFacts: 'Kijkt elke ochtend naar de vogels in de tuin. Noemt elke merel Henk. Valt elke avond in slaap bij het journaal.',
      style: 'funny',
      rhymeScheme: 'AABB',
      lines: 12,
      language: 'dutch',
    },
    poem: `Elke vroege ochtend zit jij al paraat, beste Opa Kees,
Speurend naar een vink, een duif of een mees.
Wipt er weer een zwarte merel vrolijk op het hek,
Dan roep jij meteen: "Hé Henk, wat een fijne plek!"

Maar als 's avonds het journaal begint op de tv,
Vecht je tegen de slaap, maar dat valt echt niet mee.
De nieuwslezer vertelt wat er speelde in het land,
Terwijl jij al ligt te dromen met de gids in je hand.

Om al die Henken in de tuin nóg beter te bespieden,
Wil de goede Sint jou graag wat extra scherpte bieden.
Pak dit pakje snel maar uit en kijk eens in het rond,
Met deze verrekijker mis je geen vogel op de grond!`,
  },
  {
    id: 'lotte',
    request: {
      name: 'Lotte',
      present: 'een tekenset',
      funFacts: 'Is 8 jaar. Tekent overal paarden op, ook op haar huiswerk. Wil later dierenarts worden.',
      style: 'classic',
      rhymeScheme: 'ABAB',
      lines: 12,
      language: 'dutch',
    },
    poem: `Sint weet dat Lotte nu acht jaren telt,
en overal met veel plezier iets kleurt.
Een passie die haar hele hart versnelt,
waarbij er met een paard steeds iets gebeurt.

Zelfs op je huiswerk galoppeert een paard,
want dierenarts zijn is jouw grote wens.
Die mooie droom is voor de Sint veel waard,
je bent een liefdevol, bijzonder mens.

Voor al het schetsen bracht de goede Sint,
een prachtige en nieuwe tekenset.
Zodat jij vrolijk aan de slag begint,
en steeds weer op de mooiste lijnen let.`,
  },
  {
    id: 'mark',
    request: {
      name: 'Mark',
      present: 'een grote koffiemok',
      funFacts: 'Drinkt zes koppen koffie voor tien uur. Zegt in elke vergadering "nog één kort puntje". Zijn korte puntjes duren twintig minuten.',
      writtenForAudience: 'de collega\'s op het kantoorfeest',
      style: 'ironic',
      rhymeScheme: 'AABB',
      lines: 12,
      language: 'dutch',
    },
    poem: `Om tien uur 's ochtends zit de vaart er bij jou al in,
Zes koppen koffie Mark, dat noem jij pas een goed begin.
Je stuitert vrolijk door het kantoor van hot naar her,
En bent met al die cafeïne veruit onze grootste ster.

"Nog één heel kort puntje," roep jij dan altijd vief,
Al blijkt dat begrip bij jou toch uiterst relatief.
Want twintig minuten later ben je nog steeds aan het woord,
Terwijl de hele vergadering verbluft naar je hoort.

Om loopjes naar het koffiezetapparaat te beperken,
En zodat wij misschien ook nog toekomen aan werken,
Krijg jij vandaag een grote koffiemok cadeau,
Voor nóg een 'kort' puntje op hetzelfde niveau.`,
  },
  {
    id: 'tante-els',
    request: {
      name: 'Tante Els',
      present: 'breiwol',
      revealPresent: false,
      funFacts: 'Breit sjaals voor de hele familie, ook in juli. Haar kat heet Truus en slaapt in de wollen mand.',
      style: 'old-fashioned',
      rhymeScheme: 'AABB',
      lines: 16,
      language: 'dutch',
    },
    poem: `O waarde Tante Els, aanschouw deez' goede Sint,
Die hedenavond wederom Uw woning vindt.
De Goedheiligman bemerkte reeds van verre,
Hoe gij steeds bezig zijt bij 't schijnsel van een sterre.

Zelfs als de hete zon in juli fel mocht branden,
Rust nimmer het getik van Uwe vlijt'ge handen.
Eenieder in de maagschap draagt een warme das,
Alsof het heden reeds de barre winter was.

Wanneer de trouwe Truus zich vleiend nederzet,
Is vaak Uw ronde mand haar allerliefste bed.
Zij sluimert op het dons dat straks gevormd zal worden,
Tot heuse meesterwerken van de hoogste orden.

Sint schenkt U thans iets zachts, gewikkeld in een kluwen,
Waarmee gij weer de kou uit ons bestaan kunt duwen.
Ontrafel dit geheim met vaardigheid en vlijt,
Zodat het onze lieden van de kilte bevrijdt.`,
  },
  {
    id: 'daan',
    request: {
      name: 'Daan',
      present: 'een wekker',
      funFacts: 'Komt overal te laat, ook op zijn eigen verjaardag. Heeft een sportschoolabonnement en gaat nooit. Zegt altijd "ik ben er over vijf minuten".',
      writtenBy: 'zijn zus',
      style: 'roast',
      rhymeScheme: 'AABB',
      lines: 12,
      language: 'dutch',
    },
    poem: `Lieve Daan, als jouw zus ken ik al jouw smoezen wel,
"Ik ben er over vijf minuten!" roep je steevast veel te snel.
Zelfs op je eigen feestje kwam je hopeloos te laat,
terwijl de hele kamer vol met taart te wachten staat.

De sportschool vangt jouw geld, al zien ze jou daar nooit,
jouw dure sportschoenen zijn vast ver weggegooid.
Jij ligt liever prinsheerlijk tot de middag in je nest,
en van al je goede voornemens vergeet je snel de rest.

Dus krijg je van je zusje nu een loeiend luide wekker,
want dat schaamteloze snoozen vind je veel te lekker.
Sint plaagt je flink, maar met een dikke knipoog en een lach,
omdat ik jou als broer voor geen goud missen mag!`,
  },
  {
    id: 'jeroen',
    request: {
      name: 'Jeroen',
      present: 'een kookboek',
      funFacts: 'Kookt alleen pasta, maar noemt zichzelf chef. Zingt onder de douche. Is al tien jaar samen met Sanne, die dit gedicht schrijft.',
      writtenBy: 'zijn vriendin Sanne',
      style: 'spicy',
      rhymeScheme: 'ABAB',
      lines: 12,
      language: 'dutch',
    },
    poem: `Al tien jaar zet jij, lieve Jeroen, mijn lijf in de fik,
vooral wanneer je zingend onder de douche staat.
Van jouw kletsnatte aanblik geniet ik ieder ogenblik,
al weet ik wel waar jouw diepste verlangen naar uitgaat.

Je noemt jezelf een chef met hete drang,
al kook je enkel pasta, keer op keer.
Maar met dat soepele gekneed al tien jaar lang,
smaakt elk vurig toetje telkens naar veel meer.

Dit kookboek brengt wat kruiden in de nacht,
voor stoute hoogstandjes aan het fornuis.
Laat zien wat jij voor jouw Sanne hebt bedacht,
en proef me vanavond maar weer lekker thuis.`,
  },
  {
    id: 'buurman-gerrit',
    request: {
      name: 'Buurman Gerrit',
      present: 'een robotmaaier',
      funFacts: 'Maait zijn gras elke zaterdag om acht uur, ook als het regent. Zijn gazon is het mooiste van de straat.',
      style: 'funny',
      rhymeScheme: 'Limerick',
      lines: 10,
      language: 'dutch',
    },
    poem: `Om acht uur staat buurman Gerrit paraat,
Met 't groenste gazon van de hele straat.
Al plenst het van regen,
Dat houdt hem niet tegen,
Hij maait elke zaterdag strak langs de naad!

Sint dacht: "Gerrit verdient op z'n tijd wat meer rust,"
Zodat hij op zaterdags 't kussen weer kust.
Blijf lekker in bed,
Met koffie gezet,
Want een robotmaaier klaart de klus vol van lust!`,
  },
  {
    id: 'sem',
    request: {
      name: 'Sem',
      present: 'een speelgoedstoomboot',
      funFacts: 'Is 6 jaar. Zet elke avond zijn schoen met een wortel voor het paard. Wil later Pietje op de stoomboot worden en oefent al met klimmen op de bank.',
      style: 'classic',
      rhymeScheme: 'AABB',
      lines: 12,
      language: 'dutch',
    },
    poem: `Lieve Sem, zes jaar oud en altijd blij,
De Sint rijdt jouw huisje zeker niet voorbij.
Elke avond zet jij je schoentje al klaar,
Met een wortel voor het paard, wat een mooi gebaar!

Je klautert en klimt al dapper op de bank,
Het paard eet alles op met grote dank.
Want jij wilt later een echte Pietje zijn,
Mee op de stoomboot, stoer en reuzefijn.

Daarom brengt Sint jou vandaag iets mee,
Voor al jouw dromen over de grote zee.
Pak deze speelgoedstoomboot nu maar uit,
En vaar met volle kracht vooruit!`,
  },
  {
    id: 'emma',
    request: {
      name: 'Emma',
      present: 'running shoes',
      funFacts: 'Signed up for a marathon in April. Has been on two runs so far. Celebrates every run with a large stroopwafel.',
      style: 'funny',
      rhymeScheme: 'AABB',
      lines: 12,
      language: 'english',
    },
    poem: `Dear Emma, you signed up for April’s big race,
To tackle a marathon, keeping the pace.
Though training is crucial to conquer the test,
You’ve done just two runs and then taken a rest!

For every short jog that you finish with pride,
You put all the healthy nutrition aside.
A giant stroopwafel rewards every mile,
And brings to your face a victorious smile.

So Sint has a present to help you prepare,
And show all the runners how fast you can fare.
Put on these new running shoes, tie them up tight,
And sprint to the bakery with all of your might!`,
  },
];

