export const DIFFICULTY = {
  A1: { label: 'Nybörjare',      emoji: '🌱', color: '#7BAE86' },
  A2: { label: 'Grundläggande',  emoji: '🌿', color: '#5B9EA0' },
  B1: { label: 'Medelnivå',      emoji: '📖', color: '#C4873A' },
  B2: { label: 'Övre medelnivå', emoji: '🎓', color: '#9B7FC4' },
}

export const articles = [
  // Add your articles here. Example shape:
  // {
  //   id: 'my-article',          // used for audio file matching: public/audio/my-article.mp3
  //   topic: 'kultur',
  //   topicLabel: 'Kultur',
  //   topicEmoji: '🎭',
  //   difficulty: 'A2',          // A1 | A2 | B1 | B2
  //   title: 'Artikelns titel',
  //   summary: 'Short English description shown in the library.',
  //   content: [
  //     { id: 'my-article-1', text: 'Första stycket...', translation: 'First paragraph...' },
  //   ],
  //   keyVocab: [
  //     { word: 'exempelord', def: 'example word' },
  //   ],
  // },

  // ─────────────────────────────────────────────────────────
  {
    id: 'arbetsloshet',
    audioFile: 'arbetsloshet.m4a',
    topic: 'samhälle',
    topicLabel: 'Samhälle',
    topicEmoji: '📊',
    difficulty: 'B1',
    title: 'Arbetslösheten sjunker bland kvinnor födda utanför Europa',
    summary: 'Statistics from the Swedish Employment Agency show unemployment falling among foreign-born women with low education — and a Gothenburg project giving them a path into work.',
    content: [
      {
        id: 'arbetsloshet-1',
        text: 'Arbetslösheten bland kvinnor födda utanför Europa och som har låg utbildning, sjunker och ligger nu på 35 procent. Under samma period 2025 var det 37 procent i denna grupp som var arbetslösa. Det visar statistik från Arbetsförmedlingen.',
        translation: 'Unemployment among women born outside Europe who have low education is falling and now stands at 35 percent. During the same period in 2025, 37 percent of this group were unemployed. This is shown by statistics from the Swedish Public Employment Service.',
      },
      {
        id: 'arbetsloshet-2',
        text: 'Göteborgs kommun och fastighetsbolaget Familjebostäder har i området Bergsjön satsat på att flera boende som varit arbetslösa länge ska få jobb. De ska få testa att jobba som gårdsvärdar, alltså att städa trapphus och lokaler i området. De kommer även få utbildning i svenska.',
        translation: 'The City of Gothenburg and the property company Familjebostäder have invested in the Bergsjön area to help several long-term unemployed residents find jobs. They will get to try working as caretakers — meaning cleaning stairwells and premises in the area. They will also receive education in Swedish.',
      },
      {
        id: 'arbetsloshet-3',
        text: 'En av dem är Foos. Hon har sex barn och gick aldrig i skolan i sitt hemland Somalia. Hon behövde leva på bidrag i mer än tio år. Hon sökte många jobb men säger att hon inte fick något på grund av att hon inte hade utbildning. Men nu har hon fått ett jobb som gårdsvärd genom satsningen. Hon säger att hon är glad över att själv kunna betala hyran och spara pengar till sina barn.',
        translation: 'One of them is Foos. She has six children and never went to school in her home country Somalia. She needed to live on welfare benefits for more than ten years. She applied for many jobs but says she did not get any because she did not have an education. But now she has gotten a job as a caretaker through the initiative. She says she is happy to be able to pay the rent herself and save money for her children.',
      },
      {
        id: 'arbetsloshet-4',
        text: '– Viktigast är att lära sig någonting och jag kan själv betala min hyra.',
        translation: '– The most important thing is to learn something, and I can pay my rent myself.',
      },
      {
        id: 'arbetsloshet-5',
        text: 'Anders Johansson jobbar på Göteborgs kommun. Han säger att de som inte gått i skolan så länge i sina hemländer, ska få chansen att plugga här så de får ungefär lika hög utbildning som de flesta i Sverige.',
        translation: 'Anders Johansson works at the City of Gothenburg. He says that those who have not attended school for very long in their home countries should get the chance to study here so they get roughly the same level of education as most people in Sweden.',
      },
      {
        id: 'arbetsloshet-6',
        text: '– De har kanske bara två till sex år från sina hemländer i skolan och på något sätt måste vi ju stärka upp dem så de har ungefär likvärdig utbildning som alla vi har i Sverige och det är det vi försöker bygga.',
        translation: '– They perhaps only have two to six years of schooling from their home countries, and somehow we need to strengthen them so they have roughly equivalent education to all of us in Sweden — and that is what we are trying to build.',
      },
    ],
    keyVocab: [
      { word: 'arbetslöshet',       def: 'unemployment' },
      { word: 'Arbetsförmedlingen', def: 'the Swedish Public Employment Service' },
      { word: 'fastighetsbolaget',  def: 'the property company' },
      { word: 'gårdsvärd',          def: 'caretaker / building janitor (lit. yard guardian)' },
      { word: 'trapphus',           def: 'stairwell' },
      { word: 'bidrag',             def: 'welfare benefit, allowance' },
      { word: 'satsningen',         def: 'the initiative, the investment (in a project)' },
      { word: 'hyran',              def: 'the rent' },
      { word: 'hemland',            def: 'home country' },
      { word: 'likvärdig',          def: 'equivalent, of equal value' },
      { word: 'stärka upp',         def: 'to strengthen, to build up (skills/qualifications)' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'horseltest',
    audioFile: 'horseltest.m4a',
    topic: 'hälsa',
    topicLabel: 'Hälsa',
    topicEmoji: '🦻',
    difficulty: 'B1',
    title: 'Uppsala inför självtest för hörsel',
    summary: 'Uppsala becomes the third region in Sweden to offer self-administered hearing tests, aiming to cut waiting times and prioritise those most in need.',
    content: [
      {
        id: 'horseltest-1',
        text: 'Uppsala blir nu den tredje regionen i Sverige där man kan göra ett hörseltest själv. Målet är att väntetiden för att få hörselhjälpmedel ska bli kortare, särskilt för dem som behöver hjälp mest.',
        translation: 'Uppsala is now becoming the third region in Sweden where you can take a hearing test yourself. The goal is for the waiting time to get hearing aids to become shorter, especially for those who need help the most.',
      },
      {
        id: 'horseltest-2',
        text: 'Anna Sundequist Steen är en av de första som provat testet i Uppsala. Hon säger till P4 Uppland att det var enkelt att göra.',
        translation: 'Anna Sundequist Steen is one of the first people to try the test in Uppsala. She tells P4 Uppland that it was easy to do.',
      },
      {
        id: 'horseltest-3',
        text: '– Alltså, jag tyckte det här var fantastiskt smidigt. Enkelt, pedagogiskt. Det var jättebra.',
        translation: '– Well, I thought this was fantastically smooth. Simple and easy to follow. It was really great.',
      },
      {
        id: 'horseltest-4',
        text: 'Hon kom dit eftersom hon tycker att hörseln har blivit lite sämre och ville kontrollera den. Testet görs genom att man tar på sig hörlurar. När man hör en ton markerar man det på en skärm.',
        translation: 'She came there because she feels her hearing has gotten a little worse and wanted to check it. The test is done by putting on headphones. When you hear a tone you mark it on a screen.',
      },
      {
        id: 'horseltest-5',
        text: 'Örebro var först i landet med den här typen av självtest. Sen kom Västmanland. Nu har Uppsala också infört testet.',
        translation: 'Örebro was the first in the country with this type of self-test. Then came Västmanland. Now Uppsala has also introduced the test.',
      },
      {
        id: 'horseltest-6',
        text: 'Testet ska användas för att sortera patienter, så att de som behöver hjälp snabbast kan få det. I Uppsala är väntetiden just nu upp till tio månader för att göra hörseltest, säger Agneta Nilsson Palm på hörselmottagningen. Tidigare har alla fått vänta lika länge. Nu ska mottagningen i stället kunna se vilka som har störst behov och ge dem hjälp först. Genom att patienter själva kan testa sin hörsel.',
        translation: 'The test will be used to sort patients so that those who need help most urgently can get it. In Uppsala the waiting time is currently up to ten months to have a hearing test, says Agneta Nilsson Palm at the hearing clinic. Previously everyone had to wait equally long. Now the clinic will instead be able to see who has the greatest need and give them help first — by having patients test their own hearing.',
      },
      {
        id: 'horseltest-7',
        text: '– Nu kan vi se vilka som har de största behoven och prioritera dem.',
        translation: '– Now we can see who has the greatest needs and prioritise them.',
      },
    ],
    keyVocab: [
      { word: 'hörseltest',         def: 'hearing test' },
      { word: 'hörselhjälpmedel',   def: 'hearing aid(s)' },
      { word: 'väntetiden',         def: 'the waiting time' },
      { word: 'smidigt',            def: 'smooth, effortless' },
      { word: 'pedagogiskt',        def: 'easy to follow, well-explained (lit. pedagogical)' },
      { word: 'hörlurar',           def: 'headphones, earphones' },
      { word: 'ton',                def: 'tone, sound signal' },
      { word: 'hörselmottagningen', def: 'the hearing clinic / audiology unit' },
      { word: 'sortera',            def: 'to sort, to triage' },
      { word: 'prioritera',         def: 'to prioritise' },
      { word: 'störst behov',       def: 'greatest need' },
    ],
  },
]

export function estimateReadMinutes(article) {
  const words = article.content.reduce((n, p) => n + p.text.split(/\s+/).length, 0)
  return Math.max(1, Math.round(words / 120))
}

export function getArticlesForDate(dateStr) {
  const seed = dateStr.split('-').reduce((acc, n) => acc + parseInt(n), 0)
  const shuffled = [...articles].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) * 17 + a.id.length) % 1000
    const hb = ((seed * 31 + b.id.charCodeAt(0)) * 17 + b.id.length) % 1000
    return ha - hb
  })
  return shuffled.slice(0, 4)
}

export function sentencesOf(text) {
  return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) ?? [text]
}
