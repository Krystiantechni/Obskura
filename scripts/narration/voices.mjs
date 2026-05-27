// Rejestr głosów — nazwa roli → voiceId z panelu ElevenLabs (Voices → głos → "ID").
// W episodes.mjs odwołujesz się nazwą roli (np. voice: "narratorka").
// Pusty string ("") = użyj domyślnego ELEVENLABS_VOICE_ID z .env.
//
// UWAGA: poniżej NOWE głosy "Default" ElevenLabs — jedyne dozwolone na DARMOWYM planie
// przez API (klasyczne Rachel/Adam itd. są już w Library → free API je blokuje, błąd 402).
// Po polsku mają lekki angielski akcent — OK do testu, do finału upgrade + głosy z Library.
// Twoje library voices zachowane w komentarzu, by wrócić po upgradzie.
export const VOICES = {
  narratorka: "EXAVITQu4vr4xnSDxMaL", // Sarah — miękki kobiecy narrator      (library: uvear2FyfRVNE3AJh2sG)
  eliza: "pFZP5JQG7iQjIQuC4Bku",       // Lily — młodszy kobiecy               (library: NOWYzprzTwfZQqU76pBX)
  archiwum: "JBFqnCBsd6RMkjVDRZzb",    // George — cieplejszy starszy męski    (library: Sgu2YCTorC0ao3q8kFyk)
  obcy: "N2lVS1w4EtoT3dr4eOWO",        // Callum — intensywny, niepokojący     (library: Nh6FDy4azd3RiUZSHH4n)
};
