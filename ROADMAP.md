# OBSKURA — Roadmap / Backlog

Living-doc z zadaniami i pomysłami. **Ty wybierasz** co robimy (po ID, np. „zrób T3").
Claude **aktualizuje** ten plik na bieżąco: przenosi do „Zrobione", dopisuje nowe pomysły.

Przy każdym zadaniu jest **„Co to da"** napisane po ludzku — żebyś wiedział, co zmiana
realnie wniesie, zanim ją wybierzesz.

**Status:** ⬜ do zrobienia · 🟡 w toku · ✅ zrobione · 💡 pomysł
**Nakład:** S (szybkie) · M (średnie) · L (duże) — **Wartość:** ⭐–⭐⭐⭐

_Ostatnia aktualizacja: 2026-05-27_

---

## 🔝 Priorytet (rekomendowana kolejność)

### T1 · Lżejsze, szybciej ładujące się obrazy ⭐⭐⭐ · S · ⬜
**Co to da:** strona wczytuje się wyraźnie szybciej, zwłaszcza na telefonie i wolniejszym
necie. Zdjęcia (potwór, karty historii) ważą dziś ~36 MB — to najcięższa rzecz na stronie.
Po zmianie ważyłyby kilka razy mniej, bez widocznej utraty jakości. Mniej „mrugania" przy
wchodzeniu, lepszy wynik w Google.
<sub>Tech: konwersja PNG→WebP/AVIF, responsywne `srcset`, lazy poza foldem.</sub>

### T2 · Ładny podgląd przy udostępnianiu + widoczność w Google ⭐⭐⭐ · S–M · ⬜
**Co to da:** gdy ktoś wrzuci link do OBSKURY na Facebooka / Discorda / iMessage, pokaże się
key-art potwora z tytułem i opisem zamiast gołego linka. Każda podstrona dostaje własny tytuł
i opis — lepiej wygląda w wyszukiwarce i kusi do kliknięcia.
<sub>Tech: per-route `<title>`/`<meta>`/Open Graph + obrazek OG.</sub>

### T3 · Strona się nie „wykłada" po aktualizacji ⭐⭐ · S · ⬜
**Co to da:** dziś, jeśli ktoś ma otwartą starą kartę i wgramy nową wersję, kliknięcie w inną
podstronę może pokazać białą/pustą stronę. Po zmianie zobaczy zamiast tego czytelny komunikat
„coś poszło nie tak — spróbuj ponownie" z przyciskiem odświeżenia. Mniej zgubionych userów.
<sub>Tech: ErrorBoundary wokół lazy-tras z retry.</sub>

### T4 · Player nie zasłania stopki ⭐ · S · ⬜
**Co to da:** odtwarzacz na dole obecnie nachodzi na ostatni kawałek treści/stopki. Drobny
fix, ale strona wygląda dopracowanie — nic nie jest „przykryte" paskiem gracza.
<sub>Tech: dolny padding treści, gdy ścieżka aktywna.</sub>

### T5 · Pełny odtwarzacz pokazuje prawdziwy postęp nagrania ⭐⭐ · M · ⬜
**Co to da:** strona `/player` (ta duża, immersyjna z transkryptem) działa teraz „na niby" —
oś czasu i przesuwające się napisy są symulowane. Po zmianie będą zgrane z realnym dźwiękiem:
napisy lecą w rytm tego, co faktycznie słychać, suwak działa naprawdę.
<sub>Tech: spiąć transkrypt/rozdziały z `currentTime` z PlayerContext.</sub>

### T6 · „Moja biblioteka" — ulubione w jednym miejscu ⭐⭐ · M · ⬜
**Co to da:** serduszka, które user klika, już są zapamiętywane — ale nie ma ekranu, gdzie by
je zobaczył. Po zmianie w „Koncie" pojawi się lista zapisanych odcinków, gotowa do odtworzenia
jednym kliknięciem. Daje poczucie, że to realna platforma, nie makieta.
<sub>Tech: widok z `favorites` (localStorage) + `getTrack`, spięty z Konto.</sub>

### T7 · Formularze, które naprawdę działają ⭐⭐ · M · ⬜
**Co to da:** zapis do newslettera, rejestracja, kontakt są dziś tylko „na pokaz" — nic się nie
wysyła. Po zmianie dane faktycznie gdzieś trafiają (mail/baza), z walidacją i potwierdzeniem.
Niezbędne, jeśli strona ma kiedyś ruszyć na żywo.
<sub>Tech: funkcje serverless na Vercelu (`api/*`) + walidacja.</sub>

### T8 · Dźwięki tła i muzyka pod narrację ⭐⭐ · M · ⬜
**Co to da:** zamiast samego głosu lektora — pełna atmosfera: cichy ambient w tle, efekty
(mgła, plusk, oddech, infradźwięk) w konkretnych momentach. To właśnie to, co robi „ciarki"
na platformie audio-horror. Generowane i miksowane automatycznie w jeden plik.
<sub>Tech: generator SFX/muzyki (jak narracja) + mix warstw ffmpegiem; wymaga scope'ów na kluczu ElevenLabs.</sub>

### T9 · Strony prawne tłumaczą się na inne języki ⭐⭐ · M · ⬜
**Co to da:** masz 40 języków, ale Regulamin / Stany / Mailingi są zapisane na sztywno po
polsku i nie przełączają się. Obcojęzyczny user widzi tam polski tekst. Po zmianie tłumaczą się
jak reszta strony.
<sub>Tech: wyciągnąć teksty do `public/locales/*/translation.json`.</sub>

### T10 · Zabezpieczenie przed psuciem tego, co działa ⭐⭐ · M · ⬜
**Co to da:** automatyczne testy pilnują, że logika playera (kolejka, wznawianie, sleep timer)
i strony nie popsują się przy kolejnych zmianach. Mniej „działało wczoraj, dziś nie wiadomo
czemu". Spokój przy dalszym rozwoju.
<sub>Tech: Vitest + RTL — najpierw PlayerContext, potem smoke-testy tras.</sub>

---

## 💡 Pomysły / parking (do oceny)

- **Linki social w stopce** prowadzą donikąd (`#`) — podpiąć realne profile przed startem.
- **Drobny błąd na telefonie (375 px):** waveform na stronie `/player` wystaje ~5 px poza ekran.
- **Lepsze polskie głosy narracji** — po wykupieniu planu ElevenLabs wracamy do głosów z Library (mam je zapisane). Teraz głosy darmowe mają lekki angielski akcent.
- **Różne głosy postaci w pełnych odcinkach** — rozbudowa dialogów (mamy już mechanizm).
- **Skrót „przejdź do treści"** dla osób korzystających z klawiatury (dostępność).
- **Zgoda na ciasteczka / analityka** — gdy strona pójdzie na produkcję.
- **Animowana scena 3D w hero** — efektowne pierwsze 3 sekundy, ale duży nakład i ryzyko spowolnienia.
- **Baner „słuchaj dalej"** na stronie głównej — wraca do miejsca, w którym user przerwał (dane już zapisujemy).

---

## ✅ Zrobione

- **Naprawiony „holograficzny" nagłówek hero** — czysty czerwony neon zamiast rozmazanej plamy, spokojniejszy glitch.
- **Filmowe przejścia między stronami** — płynne fade zamiast przeskoku.
- **Przegląd jakości 22 stron** — widoczny focus klawiatury, czytelny kontrast, poprawki na telefonie.
- **Globalny odtwarzacz** — pasek na dole grający bez przerwy przy zmianie stron, kolejka, wznawianie po odświeżeniu, sleep timer, ulubione.
- **Przyspieszenie ładowania** — strona wczytuje tylko to, co potrzebne (główna paczka 724→398 KB).
- **Narracja głosowa (ElevenLabs)** — 7 odcinków, finał (ep-12) z kilkoma głosami w dialogu.
