import { contactSchema, flattenErrors } from "../src/lib/formSchemas.js";
import { methodGuard, readJSON, badRequest, sendEmail } from "./_shared.js";

// POST /api/contact — wysyła wiadomość kontaktową na adres OBSKURY.
export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJSON(req);
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return badRequest(res, flattenErrors(parsed.error));

    const { name, email, category, message } = parsed.data;
    const to = process.env.CONTACT_INBOX || "kontakt@obskura.app";

    await sendEmail({
      to,
      subject: `[OBSKURA] Kontakt: ${category}`,
      html: `<p><strong>Od:</strong> ${name} &lt;${email}&gt;</p><p><strong>Kategoria:</strong> ${category}</p><hr/><p>${message.replace(/\n/g, "<br/>")}</p>`,
      text: `Od: ${name} <${email}>\nKategoria: ${category}\n\n${message}`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/contact]", err);
    res.status(500).json({ error: err.message || "Błąd serwera." });
  }
}
