import { registerSchema, flattenErrors } from "../../src/lib/formSchemas.js";
import { methodGuard, readJSON, badRequest } from "../_shared.js";

// POST /api/auth/register — STUB. Po dodaniu backendu (Supabase/Auth.js):
// hash hasła (argon2/bcrypt), zapis do DB, wysłanie email verify (sendEmail), session cookie.
export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJSON(req);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return badRequest(res, flattenErrors(parsed.error));

    // TODO: real registration — Supabase / Auth.js / Clerk.
    res.status(501).json({ error: "Rejestracja wymaga skonfigurowanego backendu." });
  } catch (err) {
    console.error("[api/auth/register]", err);
    res.status(500).json({ error: err.message || "Błąd serwera." });
  }
}
