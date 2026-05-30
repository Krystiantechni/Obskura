// Kanoniczna lista ścieżek dla globalnego playera.
// Audio generowane przez ElevenLabs do /public/audio/ep-{id}.mp3 (npm run narration).
//
// Opcjonalne pola per track:
//   chapters: [{ n, key, t, time, sec }]  — rozdziały (Player /player render listy + skok)
//   transcript: [{ key, sec?, speaker?, text } | { key, marker, text }]
//     — napisy. sec=czas wejścia (highlight aktywny segment). marker dla wpisów bez czasu
//     (SFX bookmark, chapter divider). Jeśli pole brakuje → tab "Transkrypt wkrótce".

export const TRACKS = [
  {
    id: "12", num: "12", title: "Mgła nad", em: "Wisłoujściem",
    meta: "S03 · E12 · Finał", cover: "/images/monster.webp", src: "/audio/ep-12.mp3",
    chapters: [
      { n: 1, key: "ch1", t: "Powrót po 23 latach", time: "00:00", sec: 0 },
      { n: 2, key: "ch2", t: "Listy ojca", time: "04:18", sec: 258 },
      { n: 3, key: "ch3", t: "Wywiad z Marią P.", time: "11:02", sec: 662 },
      { n: 4, key: "ch4", t: "Pierwszy raz przy molo nocą", time: "19:43", sec: 1183 },
      { n: 5, key: "ch5", t: "Mgła wchodzi do miasta", time: "27:14", sec: 1634 },
      { n: 6, key: "ch6", t: "Oddech pod wodą", time: "31:48", sec: 1908 },
      { n: 7, key: "ch7", t: "Co naprawdę widział ojciec", time: "36:22", sec: 2182 },
      { n: 8, key: "ch8", t: "Decyzja Elizy", time: "41:05", sec: 2465 },
      { n: 9, key: "ch9", t: "Co zostaje rano", time: "44:30", sec: 2670 },
    ],
    transcript: [
      { key: "t1", sec: 1145, speaker: "narratorka", text: "Wisłoujście, sierpień 1907 roku. Mgła wchodzi do portu o czwartej po południu." },
      { key: "t2", sec: 1158, speaker: "narratorka", text: "Rybacy wracają wcześniej niż zwykle. Nikt nie tłumaczy dlaczego." },
      { key: "m1", marker: "sfx", text: "SFX · Foghorn w oddali · Plusk wody o pal" },
      { key: "t3", sec: 1183, speaker: "archiwum", text: "„Tego dnia mój dziadek wrócił o trzeciej, choć siatki były puste. Powiedział żonie tylko: nie wychodź dziś z dziećmi nad wodę. Nigdy więcej nic nie wyjaśnił.”" },
      { key: "t4", sec: 1208, speaker: "narratorka", text: "Eliza wraca do Wisłoujścia po dwudziestu trzech latach. Ostatni raz była tu, gdy umarł jej ojciec. Zostawiła wtedy klucze do domu pod kamieniem przy bramie. Jeszcze tam są." },
      { key: "m2", marker: "chapter", text: "// CHAPTER 04 · Pierwszy raz przy molo nocą" },
      { key: "t5", sec: 1247, speaker: "narratorka", text: "Molo o północy. Latarnia portowa pulsuje co cztery sekundy. Eliza naciska record." },
      { key: "t6", sec: 1263, speaker: "eliza", text: "...test, raz, dwa. Jest dwudziesta trzecia czterdzieści siedem. Jestem na molo zachodnim w Wisłoujściu. Wiatr czternaście węzłów z północy. Mgła gęstnieje." },
      { key: "t7", sec: 1289, speaker: "eliza", text: "Słyszę... coś. Nie jestem pewna co. Jakby... oddech. Ale to chyba moja wyobraźnia." },
      { key: "m3", marker: "sfx", text: "SFX · Niski dźwięk infradźwięku (17.8 Hz) · Słychać tylko na słuchawkach" },
      { key: "t8", sec: 1322, speaker: "narratorka", text: "O tym, że na nagraniu jest jeszcze jeden głos, dowie się dopiero w domu, gdy odsłucha plik na komputerze. Głos, który nie należy do niej." },
      { key: "t9", sec: 1348, speaker: "narratorka", text: "I nie należy do nikogo żywego." },
    ],
  },
  { id: "2", num: "02", title: "Ostatnie", em: "światło", meta: "Psychological · 52:08", cover: "/images/img-hallway.webp", src: "/audio/ep-2.mp3" },
  { id: "3", num: "03", title: "Coś patrzy", em: "z lasu", meta: "Folk horror · 1:14:33", cover: "/images/img-forest.webp", src: "/audio/ep-3.mp3" },
  { id: "4", num: "04", title: "Dom przy ul.", em: "Cisowej 7", meta: "True horror · 38:21", cover: "/images/img-creature.webp", src: "/audio/ep-4.mp3" },
  { id: "5", num: "05", title: "Sygnał", em: "z orbity", meta: "Cosmic dread · 1:02:47", cover: "/images/img-orbs.webp", src: "/audio/ep-5.mp3" },
  { id: "6", num: "06", title: "Pod", em: "betonem", meta: "Cyber horror · 58:02", cover: "/images/img-tunnel.webp", src: "/audio/ep-6.mp3" },
  { id: "7", num: "07", title: "Fenrir", em: "", meta: "Mitologia · 1:22:55", cover: "/images/img-wolf.webp", src: "/audio/ep-7.mp3" },
];

// Ścieżka wiodąca (hero / featured).
export const HERO_TRACK = TRACKS[0];

export const getTrack = (id) => TRACKS.find((t) => t.id === String(id));
