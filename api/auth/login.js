import { loginSchema, flattenErrors } from "../../src/lib/formSchemas.js";
import { methodGuard, readJSON, badRequest } from "../_shared.js";

// POST /api/auth/login — STUB (bez prawdziwego backendu auth).
// Po wybraniu providera (Supabase Auth / Auth.js / Clerk) tutaj wpiąć weryfikację hasła
// + zwrócić session cookie (httpOnly, Secure, SameSite=Lax) + ewentualnie JWT.
export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  try {
    const body = await readJSON(req);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return badRequest(res, flattenErrors(parsed.error));

    // TODO: real auth — Supabase / Auth.js / Clerk.
    res.status(501).json({ error: "Logowanie wymaga skonfigurowanego backendu (Supabase/Auth.js)." });
  } catch (err) {
    console.error("[api/auth/login]", err);
    res.status(500).json({ error: err.message || "Błąd serwera." });
  }
}
