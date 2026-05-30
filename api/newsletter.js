import { newsletterSchema, flattenErrors } from "../src/lib/formSchemas.js";
import { methodGuard, readJSON, badRequest, sendEmail } from "./_shared.js";

// POST /api/newsletter — zapisuje email + częstotliwość, wysyła potwierdzenie.
// Aktualnie tylko email + log. Docelowo: zapis do Resend Audience / Vercel KV / Supabase.
export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJSON(req);
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) return badRequest(res, flattenErrors(parsed.error));

    const { email, freq } = parsed.data;
    await sendEmail({
      to: email,
      subject: "Potwierdź subskrypcję OBSKURY",
      html: `<p>Cześć,</p><p>kliknij link, żeby potwierdzić subskrypcję newslettera (częstotliwość: <strong>${freq}</strong>).</p><p>OBSKURA</p>`,
      text: `Cześć,\n\nKliknij link, żeby potwierdzić subskrypcję newslettera (częstotliwość: ${freq}).\n\nOBSKURA`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/newsletter]", err);
    res.status(500).json({ error: err.message || "Błąd serwera." });
  }
}
