export const DIFFICULTY = {
  A1: { label: 'Nybörjare',        emoji: '🌱', color: '#7BAE86' },
  A2: { label: 'Grundläggande',    emoji: '🌿', color: '#5B9EA0' },
  B1: { label: 'Medelnivå',        emoji: '📖', color: '#C4873A' },
  B2: { label: 'Övre medelnivå',   emoji: '🎓', color: '#9B7FC4' },
}

export const articles = [
  {
    id: 'fika',
    topic: 'mat',
    topicLabel: 'Mat & Dryck',
    topicEmoji: '☕',
    difficulty: 'A1',
    title: 'Fika – en del av det svenska livet',
    summary: 'Why the Swedish coffee break is more than just a cup of coffee.',
    content: [
      { id: 'p1', text: 'Fika är mycket mer än en kafferast. Det är en del av den svenska kulturen och en viktig del av vardagen.' },
      { id: 'p2', text: 'Att fika betyder att dricka kaffe eller te och äta något gott tillsammans. Det kan vara en bulle, en kaka eller en bit tårta. Det viktigaste är inte vad man äter eller dricker – det viktigaste är att man tar en paus och umgås med andra.' },
      { id: 'p3', text: 'I Sverige fikar man på jobbet, hemma och med vänner. Många svenska arbetsplatser har obligatorisk fika på förmiddagen och eftermiddagen. Det är en tid att prata, skratta och slappna av.' },
      { id: 'p4', text: 'Ordet "fika" är faktiskt ett gammalt slangord. Det kommer från "kaffi" – ett äldre ord för kaffe – med omvända stavelser. Idag är fika ett officiellt ord i svenska ordböcker.' },
      { id: 'p5', text: 'Om du vill uppleva riktig svensk kultur, ta en fika med en svensk vän. Det är ett bra sätt att lära känna Sverige!' },
    ],
    keyVocab: [
      { word: 'fika',       def: 'coffee break; a Swedish cultural institution' },
      { word: 'vardagen',   def: 'everyday life, daily routine' },
      { word: 'umgås',      def: 'to socialize, spend time together' },
      { word: 'bulle',      def: 'sweet bun, typically cinnamon' },
      { word: 'slappna av', def: 'to relax' },
      { word: 'stavelser',  def: 'syllables' },
    ],
  },
  {
    id: 'norrsken',
    topic: 'natur',
    topicLabel: 'Natur',
    topicEmoji: '🌌',
    difficulty: 'A2',
    title: 'Norrsken – himlens dans',
    summary: 'The science and magic behind the aurora borealis in Sweden.',
    content: [
      { id: 'p1', text: 'En av de mest magiska upplevelserna i Sverige är att se norrsken. Det kallas också "aurora borealis" på latin, men på svenska säger vi bara norrsken.' },
      { id: 'p2', text: 'Norrsken uppstår när energetiska partiklar från solen träffar jordens atmosfär. När partiklarna kolliderar med gasmolekyler skapas vackert ljus i olika färger – grönt, rosa, violett och ibland rött.' },
      { id: 'p3', text: 'För att se norrsken behöver du vara på rätt plats vid rätt tid. I Sverige är de bästa platserna i norr, speciellt i Lappland. Kiruna och Abisko är kända som perfekta ställen för norrskensturism.' },
      { id: 'p4', text: 'Det bästa sättet att se norrsken är under klara, mörka nätter mellan september och mars. Du behöver komma bort från stadslyset och vänta tålmodigt.' },
      { id: 'p5', text: 'Samerna, som länge har levt i norra Sverige, har många berättelser om norrsken. Enligt en gammal legend är norrsken själarna av de döda som dansar på himlen.' },
    ],
    keyVocab: [
      { word: 'norrsken',    def: 'aurora borealis, northern lights' },
      { word: 'uppstår',     def: 'arises, occurs' },
      { word: 'partiklar',   def: 'particles' },
      { word: 'atmosfären',  def: 'the atmosphere' },
      { word: 'tålmodigt',   def: 'patiently' },
      { word: 'legend',      def: 'legend, folk tale' },
    ],
  },
  {
    id: 'spotify',
    topic: 'teknik',
    topicLabel: 'Teknik',
    topicEmoji: '🎵',
    difficulty: 'B1',
    title: 'Hur en startup från Stockholm förändrade musikvärlden',
    summary: 'The story of how Daniel Ek and Spotify revolutionized the way the world listens to music.',
    content: [
      { id: 'p1', text: 'År 2006 satt två unga svenskar i Stockholm och funderade på ett stort problem: musikpiratkopiering. Daniel Ek och Martin Lorentzon ville hitta ett sätt att göra musik tillgänglig för alla, lagligt och enkelt.' },
      { id: 'p2', text: 'Deras lösning hette Spotify. Den 7 oktober 2008 lanserades tjänsten för allmänheten i Europa. Idén var enkel men revolutionerande: istället för att köpa eller ladda ner musik, skulle användarna kunna streama miljontals låtar direkt på sin enhet.' },
      { id: 'p3', text: 'I början var det inte lätt. Skivbolagen var skeptiska och förhandlingarna var långa och komplicerade. Men Daniel Ek var övertygad om att den gamla modellen var bruten och att streaming var framtiden.' },
      { id: 'p4', text: 'Idag har Spotify över 600 miljoner aktiva användare i mer än 180 länder. Företaget är noterat på New York-börsen och värderas till miljarder dollar. Från ett litet kontor i Stockholms gamla stan har Spotify blivit ett av världens mest värdefulla teknologibolag.' },
      { id: 'p5', text: 'Sverige, landet med bara tio miljoner invånare, har gett världen många stora musikakter – ABBA, Avicii, Robyn. Men kanske är Spotify det svenska bidrag som påverkat hur hela världen lyssnar på musik.' },
    ],
    keyVocab: [
      { word: 'piratkopiering', def: 'piracy (copying without permission)' },
      { word: 'tillgänglig',    def: 'available, accessible' },
      { word: 'lanserades',     def: 'was launched' },
      { word: 'förhandlingarna',def: 'the negotiations' },
      { word: 'övertygad',      def: 'convinced, certain' },
      { word: 'värderas',       def: 'is valued' },
    ],
  },
  {
    id: 'atervinning',
    topic: 'samhalle',
    topicLabel: 'Samhälle',
    topicEmoji: '♻️',
    difficulty: 'B1',
    title: 'Sverige och det cirkulära samhället',
    summary: 'How Sweden\'s recycling culture and deposit system make it one of the world\'s most sustainable countries.',
    content: [
      { id: 'p1', text: 'Sverige är känt för att vara ett av världens mest miljömedvetna länder. Men det handlar inte bara om solpaneler och elbilar – det handlar om en djupgående kultur av återvinning och hållbarhet.' },
      { id: 'p2', text: 'I Sverige källsorterar de flesta hushåll sina sopor i flera kategorier: matavfall, papper, plast, glas, metall och restavfall. I städerna finns återvinningsstationer på gångavstånd från de flesta bostäder.' },
      { id: 'p3', text: 'Det mest imponerande är kanske det svenska pantesystemet. När man köper en plastflaska eller aluminiumburk ingår en pant – en liten extra avgift. Lämnar man tillbaka förpackningen i en butik får man pengarna tillbaka. Systemet har gjort att Sverige återvinner nästan 90 procent av alla dryckesförpackningar.' },
      { id: 'p4', text: 'Men Sverige nöjer sig inte med det. Landet har som mål att bli ett "cirkulärt samhälle" – ett samhälle där ingenting slängs och allt återanvänds. Det innebär bland annat att man reparerar saker istället för att köpa nytt, och att gamla kläder och möbler doneras eller säljs vidare.' },
      { id: 'p5', text: 'Nästa gång du dricker en läsk i Sverige – glöm inte panten!' },
    ],
    keyVocab: [
      { word: 'miljömedveten',  def: 'environmentally conscious' },
      { word: 'källsorterar',   def: 'sorts waste by source/category' },
      { word: 'hushåll',        def: 'household' },
      { word: 'pant',           def: 'deposit (on bottles/cans)' },
      { word: 'förpackningen',  def: 'the packaging' },
      { word: 'cirkulärt',      def: 'circular (as in circular economy)' },
    ],
  },
  {
    id: 'abba',
    topic: 'kultur',
    topicLabel: 'Kultur',
    topicEmoji: '🌟',
    difficulty: 'B2',
    title: 'ABBA – ett globalt fenomen från Skandinavien',
    summary: 'From Brighton 1974 to virtual concerts today — how four Swedes changed pop music forever.',
    content: [
      { id: 'p1', text: 'Det var den 6 april 1974 i Brighton, England. Fyra unga svenskar klädda i glittrande scenplagg framförde låten "Waterloo" för den europeiska publiken. De vann Eurovision Song Contest och inledde en karriär som skulle förändra popmusiken för alltid.' },
      { id: 'p2', text: 'ABBA – Agnetha, Björn, Benny och Anni-Frid – kombinerade melodisk pop med sofistikerad harmoni och producerade under 1970-talet en rad hitlåtar som "Dancing Queen", "Mamma Mia" och "The Winner Takes It All".' },
      { id: 'p3', text: 'Det som skilde ABBA från sina samtida var inte bara deras catchy melodier utan också Björn Ulvaeus och Benny Anderssons förmåga att skriva låtar på engelska med en naturlighet som var ovanlig för icke-infödda talare.' },
      { id: 'p4', text: 'Gruppen upplöstes 1982 men deras musik lever vidare. Musikalfilmen "Mamma Mia!" från 2008 och dess uppföljare introducerade ABBA för nya generationer. År 2021 lanserade gruppen sitt första nya album på 40 år – "Voyage" – och skapade en revolutionerande virtuell konsertupplevelse i London.' },
      { id: 'p5', text: 'ABBAs inflytande på popmusiken är svårt att överskatta. De banade väg för senare skandinaviska artister och producenter som kommit att dominera den globala musikindustrin. Från Max Martin till Robyn bär de alla ett arv från de fyra från Stockholm.' },
    ],
    keyVocab: [
      { word: 'scenplagg',    def: 'stage costumes' },
      { word: 'inledde',      def: 'initiated, began' },
      { word: 'samtida',      def: 'contemporaries (people of the same era)' },
      { word: 'förmåga',      def: 'ability, capability' },
      { word: 'upplöstes',    def: 'was dissolved, broke up' },
      { word: 'inflytande',   def: 'influence' },
      { word: 'banade väg',   def: 'paved the way' },
    ],
  },
  {
    id: 'zlatan',
    topic: 'sport',
    topicLabel: 'Sport',
    topicEmoji: '⚽',
    difficulty: 'A2',
    title: 'Zlatan Ibrahimović – lejonets resa',
    summary: 'From the streets of Malmö to the biggest clubs in the world — the story of Sweden\'s greatest footballer.',
    content: [
      { id: 'p1', text: 'Zlatan Ibrahimović är en av Sveriges mest kända idrottspersoner. Han är känd inte bara för sina mål, utan också för sin starka personlighet och sina berömda uttalanden.' },
      { id: 'p2', text: 'Zlatan föddes den 3 oktober 1981 i Malmö. Hans familj kom ursprungligen från Bosnien och Kroatien. Som ung spelade han fotboll på gatorna i Rosengård, en förort till Malmö. Där lärde han sig att spela med hårdhet och kreativitet.' },
      { id: 'p3', text: 'Hans karriär startade i Malmö FF och sedan gick han till Ajax i Nederländerna. Därefter spelade han för många stora europeiska klubbar, bland annat Juventus, Inter Milan, Barcelona, Paris Saint-Germain och Manchester United.' },
      { id: 'p4', text: 'Zlatan är känd för sina spektakulära mål. Hans kanske mest minnesvärda mål kom mot England år 2012, när han avslutade matchen med en otrolig bakspark från nästan 30 meter. Målet utsågs till årets mål i världen.' },
      { id: 'p5', text: 'Idag är Zlatan mer än en fotbollsspelare – han är ett varumärke och en kulturikon. Hans självbiografi heter "Jag är Zlatan" och har sålts i miljontals exemplar världen över.' },
    ],
    keyVocab: [
      { word: 'idrottsperson',  def: 'athlete, sportsperson' },
      { word: 'uttalanden',     def: 'statements, quotes' },
      { word: 'ursprungligen',  def: 'originally' },
      { word: 'förort',         def: 'suburb' },
      { word: 'minnesvärda',    def: 'memorable' },
      { word: 'varumärke',      def: 'brand' },
    ],
  },
  {
    id: 'stockholm',
    topic: 'resor',
    topicLabel: 'Resor',
    topicEmoji: '🏙️',
    difficulty: 'A2',
    title: 'Stockholm – staden som flödar på vattnet',
    summary: 'A stroll through Europe\'s most beautiful island capital — from medieval Gamla Stan to modern Södermalm.',
    content: [
      { id: 'p1', text: 'Stockholm är en av Europas vackraste städer. Den svenska huvudstaden ligger på fjorton öar och halvöar vid Mälarens utlopp i Östersjön. Var du än går i Stockholm är du aldrig långt från vattnet.' },
      { id: 'p2', text: 'Stadens historia börjar på 1200-talet. Det äldsta området heter Gamla Stan och är en av Europas bäst bevarade medeltida stadskärnor. Smala gränder, färgglada hus och den imponerande Kungliga slottet gör Gamla Stan till ett måste för alla besökare.' },
      { id: 'p3', text: 'Stockholm är också en modern och innovativ stad. Det är hem för många globala teknologiföretag, och Sverige kallas ibland "Silicon Valley of Europe". Kvarteret Södermalm är känt för sin bohemiska atmosfär, sina kaféer och sin livliga konstscen.' },
      { id: 'p4', text: 'Om du besöker Stockholm på sommaren kan du bada i rent vatten mitt i stadskärnan. Vattentemperaturen är visserligen inte tropisk, men det är en unik upplevelse att simma i en europeisk huvudstad.' },
      { id: 'p5', text: 'En sak är säker: Stockholm är en stad som stannar kvar i minnet länge efter att du lämnat.' },
    ],
    keyVocab: [
      { word: 'halvöar',      def: 'peninsulas' },
      { word: 'utlopp',       def: 'outlet (where a lake meets the sea)' },
      { word: 'bevarade',     def: 'preserved' },
      { word: 'medeltida',    def: 'medieval' },
      { word: 'gränder',      def: 'narrow alleys, lanes' },
      { word: 'bohemisk',     def: 'bohemian, free-spirited' },
    ],
  },
  {
    id: 'uppfinningar',
    topic: 'vetenskap',
    topicLabel: 'Vetenskap',
    topicEmoji: '💡',
    difficulty: 'B1',
    title: 'Sverige – uppfinnarnas land',
    summary: 'From dynamite to Bluetooth — the surprisingly long list of world-changing inventions from a tiny Scandinavian nation.',
    content: [
      { id: 'p1', text: 'Trots sin lilla befolkning har Sverige gett världen en häpnadsväckande mängd uppfinningar och innovationer. Från sprängämnen till trådlösa nätverk – svenska uppfinnare har satt sina spår i historien.' },
      { id: 'p2', text: 'Alfred Nobel är kanske den mest berömde svenske uppfinnaren. Han uppfann dynamit år 1867, vilket revolutionerade byggindustrin och gruvdriften. Nobel, som blev enormt rik på sin uppfinning, donerade hela sin förmögenhet till det berömda Nobelpriset som delas ut varje år den 10 december.' },
      { id: 'p3', text: 'Men det slutar inte där. Bluetooth-tekniken, som idag används av miljarder människor, uppfanns av Ericsson-ingenjören Jaap Haartsen i Sverige under 1990-talet. Tekniken namngavs efter den danske vikingakungen Harald Blåtand – på engelska "Bluetooth" – som enade Danmark och Norge.' },
      { id: 'p4', text: 'Zipper-låset, som man hittar på nästan alla kläder och väskor, uppfanns av Gideon Sundbäck, en svensk-amerikanare, i början av 1900-talet. Tetrapak, förpackningssystemet som revolutionerade matindustrin, skapades av Ruben Rausing i Lund år 1951.' },
      { id: 'p5', text: 'Vad är hemligheten bakom all denna kreativitet? Många pekar på det svenska utbildningssystemet som uppmuntrar till kritiskt tänkande, och en kultur som värdesätter praktisk problemlösning.' },
    ],
    keyVocab: [
      { word: 'häpnadsväckande', def: 'astonishing, amazing' },
      { word: 'sprängämnen',     def: 'explosives' },
      { word: 'gruvdriften',     def: 'mining operations' },
      { word: 'förmögenhet',     def: 'fortune, wealth' },
      { word: 'enade',           def: 'united' },
      { word: 'uppmuntrar',      def: 'encourages' },
    ],
  },
]

// Deterministically pick 4 articles for a given date string (YYYY-MM-DD)
export function getArticlesForDate(dateStr) {
  const seed = dateStr.split('-').reduce((acc, n) => acc + parseInt(n), 0)
  const shuffled = [...articles].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) * 17 + a.id.length) % 1000
    const hb = ((seed * 31 + b.id.charCodeAt(0)) * 17 + b.id.length) % 1000
    return ha - hb
  })
  return shuffled.slice(0, 4)
}

export function estimateReadMinutes(article) {
  const words = article.content.reduce((n, p) => n + p.text.split(' ').length, 0)
  return Math.max(1, Math.round(words / 120))
}
