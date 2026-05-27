// Rejestr głosów — nazwa roli → voiceId z panelu ElevenLabs (Voices → głos → "ID").
// W episodes.mjs odwołujesz się nazwą roli (np. voice: "narratorka").
// Pusty string ("") = użyj domyślnego ELEVENLABS_VOICE_ID z .env.
//
// Możesz też w episodes.mjs podać surowy voiceId zamiast nazwy roli — generator to rozpozna.
export const VOICES = {
  narratorka: "", // główny lektor / narrator
  eliza: "",      // bohaterka (nagrania z dyktafonu)
  archiwum: "",   // głos archiwalny / starszy
  obcy: "",       // „to, co nie należy do nikogo żywego"
};
