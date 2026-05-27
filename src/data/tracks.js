// Kanoniczna lista ścieżek dla globalnego playera.
// Audio generowane przez ElevenLabs do /public/audio/ep-{id}.mp3 (npm run narration).
export const TRACKS = [
  { id: "12", num: "12", title: "Mgła nad", em: "Wisłoujściem", meta: "S03 · E12 · Finał", cover: "/images/monster.png", src: "/audio/ep-12.mp3" },
  { id: "2", num: "02", title: "Ostatnie", em: "światło", meta: "Psychological · 52:08", cover: "/images/img-hallway.png", src: "/audio/ep-2.mp3" },
  { id: "3", num: "03", title: "Coś patrzy", em: "z lasu", meta: "Folk horror · 1:14:33", cover: "/images/img-forest.png", src: "/audio/ep-3.mp3" },
  { id: "4", num: "04", title: "Dom przy ul.", em: "Cisowej 7", meta: "True horror · 38:21", cover: "/images/img-creature.png", src: "/audio/ep-4.mp3" },
  { id: "5", num: "05", title: "Sygnał", em: "z orbity", meta: "Cosmic dread · 1:02:47", cover: "/images/img-orbs.png", src: "/audio/ep-5.mp3" },
  { id: "6", num: "06", title: "Pod", em: "betonem", meta: "Cyber horror · 58:02", cover: "/images/img-tunnel.png", src: "/audio/ep-6.mp3" },
  { id: "7", num: "07", title: "Fenrir", em: "", meta: "Mitologia · 1:22:55", cover: "/images/img-wolf.png", src: "/audio/ep-7.mp3" },
];

// Ścieżka wiodąca (hero / featured).
export const HERO_TRACK = TRACKS[0];

export const getTrack = (id) => TRACKS.find((t) => t.id === String(id));
