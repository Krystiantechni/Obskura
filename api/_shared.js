// Wspólne helpery dla Vercel serverless functions w /api/*.

export function methodGuard(req, res, allowed = ["POST"]) {
  if (!allowed.includes(req.method)) {
    res.setHeader("Allow", allowed.join(", "));
    res.status(405).json({ error: `Metoda ${req.method} niedozwolona.` });
    return false;
  }
  return true;
}

// Vercel zwraca req.body już zparsowany dla JSON contenttype. Fallback do raw read na wszelki wypadek.
export async function readJSON(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

export function badRequest(res, errors) {
  res.status(400).json({ error: "Walidacja nieudana.", errors });
}

// Wysyłka maila przez Resend (https://resend.com). RESEND_API_KEY w env.
// Jeśli brak klucza → log do konsoli i return success (dev fallback / przed konfiguracją).
export async function sendEmail({ to, subject, html, text, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = from || process.env.MAIL_FROM || "OBSKURA <no-reply@obskura.app>";

  if (!apiKey) {
    console.info("[sendEmail] RESEND_API_KEY niezdefiniowany — log w konsoli zamiast wysyłki:", { to, subject });
    return { id: "dev-mock", mock: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: sender, to, subject, html, text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Resend ${res.status}`);
  return data;
}
