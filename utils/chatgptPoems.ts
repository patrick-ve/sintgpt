// ChatGPT's poems for the comparison on the home page (components/ExamplePoems.vue).
// Each one answers the plain request in `prompt`, built from the input of the
// example poem with the same id in utils/examplePoems.ts.
//
// Source: GPT-5.6 Luna, the default model of free ChatGPT in November 2026,
// asked through the API (AI Gateway) on 10 Nov 2026 with only the prompt, no
// system message. Five runs per style; the site owner chose the version shown.
// The poems are not edited, apart from removing spaces at line ends.
// Do not put the model name in a string: it would reach the public page.
//
// `faults` marks the lines the page underlines (0-based, counting empty lines).
// The notes are for whoever maintains this; the page does not show them.

export interface ChatGptPoem {
  exampleId: string;
  prompt: string;
  poem: string;
  faults: { line: number; note: string }[];
}

export const CHATGPT_POEMS: ChatGptPoem[] = [
  {
    exampleId: 'opa-kees',
    prompt: 'Schrijf een grappig sinterklaasgedicht voor Opa Kees. Hij krijgt een verrekijker. Hij kijkt elke ochtend naar de vogels in de tuin, noemt elke merel Henk en valt elke avond in slaap bij het journaal. 12 regels, rijmschema AABB.',
    poem: `Beste Opa Kees, Sint zag je turen naar de tuin,
met je oude bril keek zelfs de buurkat nog schuin.
Daarom krijg je een verrekijker, prachtig en fijn,
voor Henk, zijn snavel en zijn staartje klein.

Elke ochtend zit je klaar, pontificaal voor het raam,
bij de eerste merel klinkt het luid: “Henk, aangenaam!”
Of het een mus is, een spreeuw of een kraai,
jij noemt ze allemaal Henk — consequentie is fraai.

Maar ’s avonds bij het journaal, na weerbericht en stand,
is Opa Kees verdwenen naar dromenland.
Sint wenst je veel kijkplezier met Henk in elke boom,
maar zet voor het journaal alvast een wekker in je droom.`,
    faults: [
      { line: 1, note: '‘met je oude bril keek zelfs de buurkat nog schuin’ means nothing; the facts name no glasses' },
      { line: 8, note: 'made up: Opa calls only blackbirds Henk; ‘consequentie is fraai’ is there for the rhyme' },
      { line: 10, note: '‘na weerbericht en stand’ is filler for the rhyme' },
      { line: 11, note: 'switches from ‘je’ to ‘Opa Kees’' },
      { line: 13, note: '‘een wekker in je droom’ means nothing' },
    ],
  },
  {
    exampleId: 'lotte',
    prompt: 'Schrijf een klassiek sinterklaasgedicht voor Lotte. Ze krijgt een tekenset. Ze is 8 jaar, tekent overal paarden op, ook op haar huiswerk, en wil later dierenarts worden. 12 regels, rijmschema ABAB.',
    poem: `Lieve Lotte, Sint zag wat jij tekent, keer op keer,
Op ieder vel verschijnt een paardje, groot of klein.
Zelfs op je huiswerk staat een ros met veel plezier,
Want later wil jij dierenarts voor ieder dier zijn.

In je sommen draaft een merrie door de kant,
Een pony huppelt vrolijk in de marge fijn.
Ook tussen alle letters ligt een paardenland,
Maar Sint vindt dat juist heel knap en reuze fijn.

Daarom krijg je nu een tekenset, kleur na kleur,
Teken een stal, een veulen, groot of klein.
Misschien verzorg jij later elk gewond dier,
Dan zal jij een dierenarts vol liefde zijn!`,
    faults: [
      { line: 0, note: 'her age (8) is missing' },
      { line: 2, note: '‘keer’ and ‘plezier’ should rhyme (ABAB) and do not' },
      { line: 5, note: '‘draaft een merrie door de kant’ means nothing' },
      { line: 6, note: '‘in de marge fijn’: word order bent for the rhyme' },
      { line: 8, note: '‘fijn’ rhymes with ‘fijn’' },
      { line: 12, note: '‘kleur’ and ‘dier’ do not rhyme' },
    ],
  },
  {
    exampleId: 'mark',
    prompt: `Schrijf een ironisch sinterklaasgedicht voor Mark, voor de collega's op het kantoorfeest. Hij krijgt een grote koffiemok. Hij drinkt zes koppen koffie voor tien uur, zegt in elke vergadering "nog één kort puntje" en zijn korte puntjes duren twintig minuten. 12 regels, rijmschema AABB.`,
    poem: `Sint zag Mark al om acht uur met zijn eerste koffie klaar,
Voor tienen zijn het er al zes — “Ach,” zegt hij, “dat is toch niet raar.”

In elke vergadering klinkt: “Nog één kort puntje, heel beknopt,”
Maar twintig minuten later is de agenda opgepropt.

Daarom krijgt hij deze mok, van vorstelijk formaat,
Waar zelfs koffie nummer zeven naast nummer zes nog staat.

Want zonder cafeïne is elk probleem een zwaar karwei,
Maar met deze beker blijft Mark de hele ochtend blij.

En zegt hij weer: “Nog één kort puntje,” dan zucht men in de gang,
Want iedereen weet inmiddels: dat duurt weer twintig minuten lang.

Dus hef die mok, beste Mark, en drink hem lekker leeg,
En zeg daarna eens: “Mijn puntje is kort” — waarna je werkelijk zweeg.`,
    faults: [
      { line: 1, note: 'lines of 13 to 17 syllables: reading aloud stumbles' },
      { line: 7, note: 'coffee number seven ‘next to number six’ in one mug makes no sense' },
      { line: 12, note: 'the ‘kort puntje’ joke is told twice' },
      { line: 16, note: 'tenses mixed: ‘zeg daarna eens … waarna je zweeg’' },
    ],
  },
  {
    exampleId: 'tante-els',
    prompt: 'Schrijf een ouderwets sinterklaasgedicht voor Tante Els. Ze krijgt breiwol, maar verklap het cadeau niet. Ze breit sjaals voor de hele familie, ook in juli. Haar kat heet Truus en slaapt in de wollen mand. 16 regels, rijmschema AABB.',
    poem: `Sint schreef in zijn boek: “Dat is Tante Els, o zo blij,
Want voor elk familielid breit zij iets moois erbij.

Zelfs midden in juli gaat zij rustig voort,
Met naalden die tikken, een lust voor het oor.

Voor neef en voor nicht maakt zij menige baan,
Geen schouder blijft koud, geen hals hoeft bloot te staan.

En Truus, haar kat, ziet alles aan met koninklijke pret,
Daarna slaapt zij in haar wollen mandje, zo net.

De Sint heeft iets uitgezocht, heel zacht en fijn,
Dat straks in haar handen vast welkom zal zijn.

Maar wat het precies is, dat blijft nog wat blauw,
Want Piet en de Sint bewaren hun trouw.

Dus neem dit pakje aan met een glimlach en beleid,
En denk aan wie straks weer een warme sjaal verblijdt.

Voor Tante Els klinkt nu het vrolijke refrein:
Veel breiplezier gewenst, en een feest dat prachtig moge zijn!`,
    faults: [
      { line: 0, note: 'the quotation mark after ‘boek:’ is never closed' },
      { line: 4, note: '‘voort’ and ‘oor’ do not rhyme' },
      { line: 10, note: '‘zo net’ is there for the rhyme' },
      { line: 15, note: '‘dat blijft nog wat blauw’ means nothing' },
      { line: 16, note: '‘Piet en de Sint bewaren hun trouw’ means nothing' },
      { line: 19, note: 'the sentence does not work: who pleases whom with a scarf?' },
      { line: 22, note: 'hardly old-fashioned: no ‘gij’ or ‘Uw’, only this one ‘moge’' },
    ],
  },
  {
    exampleId: 'jeroen',
    prompt: 'Schrijf een pikant sinterklaasgedicht voor Jeroen, geschreven door zijn vriendin Sanne. Hij krijgt een kookboek. Hij kookt alleen pasta maar noemt zichzelf chef, zingt onder de douche, en ze zijn al tien jaar samen. 12 regels, rijmschema ABAB.',
    poem: `Lieve Jeroen, al tien jaar laat jij mijn hart nog sneller slaan,
Met alleen pasta op het menu, trots achter het fornuis te staan.
Jij roept: “Ik ben chef!” en blijft zelfverzekerd staan,
Maar na jouw chef-gebaar voelt zelfs die pasta als thuis aan.

Onder de douche zing jij luidkeels, helemaal vrij,
En toch krijg jij met één blik mijn vlam weer aan.
Na tien jaar maakt jouw charme mij nog steeds blij,
Dus kom na je optreden verleidelijk naast me staan.

Daarom geeft Sint dit kookboek: ontdek wat je kunt leren,
Met een snufje pikant maak jij mij extra blij.
Dan kan zelfs jouw pasta straks de sterren inspireren,
En als jij kookt, staat jouw Sanne verleidelijk dichtbij.`,
    faults: [
      { line: 0, note: 'ABAB was asked; the first verse rhymes on ‘-aan’ four times' },
      { line: 1, note: '‘trots achter het fornuis te staan’ hangs loose' },
      { line: 2, note: '‘staan’ is the rhyme word twice in the first verse, and again in the second' },
      { line: 3, note: '‘voelt zelfs die pasta als thuis aan’ means nothing' },
      { line: 11, note: '‘blij’ is the rhyme word twice' },
    ],
  },
  {
    exampleId: 'daan',
    prompt: `Schrijf een roast sinterklaasgedicht voor Daan, geschreven door zijn zus. Hij krijgt een wekker. Hij komt overal te laat, ook op zijn eigen verjaardag. Hij heeft een sportschoolabonnement en gaat nooit. Hij zegt altijd "ik ben er over vijf minuten". 12 regels, rijmschema AABB.`,
    poem: `Daan, zegt je zus, jij bent te laat op ieder feest,
Zelfs op je eigen verjaardag ben je als laatste geweest.

“Over vijf minuten ben ik er!” roep je vrolijk en paraat,
Maar als jij binnenkomt, is het feest al bijna afgegaan.

Je sportschoolabonnement ligt ongebruikt te verstoffen thuis,
De enige gewichten die jij tilt, zijn je dekbed en je muis.

Je planning is een wonder: geen afspraak blijft ooit op tijd,
Want ergens onderweg ben jij steevast je minuten kwijt.

Daarom geeft Sint dit klokje, met een oorverdovend kabaal,
Zodat je niet weer te laat verschijnt bij elk Sinterklaasverhaal.

En zeg je weer: “Ik ben er zo,” dan roep ik luid: “Geen gein!”
Met deze wekker moet je zelfs eens vóór de start aanwezig zijn!`,
    faults: [
      { line: 0, note: '‘Daan, zegt je zus’: the sister talks about herself, later as ‘ik’' },
      { line: 4, note: '‘paraat’ and ‘afgegaan’ do not rhyme, and a party does not ‘go off’' },
      { line: 6, note: 'a subscription does not gather dust at home' },
      { line: 9, note: '‘geen afspraak blijft ooit op tijd’ means nothing' },
      { line: 13, note: '‘bij elk Sinterklaasverhaal’ is filler for the rhyme' },
    ],
  },
];
