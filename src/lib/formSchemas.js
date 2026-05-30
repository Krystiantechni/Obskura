import { z } from "zod";

// Schematy Zod współdzielone client + serverless API (Vercel api/*).
// Defaultowe komunikaty po polsku — tłumaczenie przez i18n na poziomie UI (opcjonalnie).

export const newsletterSchema = z.object({
  email: z.string().trim().email("Nieprawidłowy adres e-mail."),
  freq: z.enum(["week", "big", "month"], { errorMap: () => ({ message: "Wybierz częstotliwość." }) }).default("week"),
  consent: z.literal(true, { errorMap: () => ({ message: "Wymagana zgoda na otrzymywanie wiadomości." }) }),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Nieprawidłowy adres e-mail."),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków."),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Nieprawidłowy adres e-mail."),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków.")
    .regex(/[A-Z]/, "Hasło musi zawierać wielką literę.")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę."),
  name: z.string().trim().min(2, "Imię musi mieć min. 2 znaki.").max(60),
  terms: z.literal(true, { errorMap: () => ({ message: "Wymagana akceptacja regulaminu." }) }),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Imię jest wymagane.").max(60),
  email: z.string().trim().email("Nieprawidłowy adres e-mail."),
  category: z.string().trim().min(1, "Wybierz kategorię."),
  message: z.string().trim().min(10, "Wiadomość musi mieć min. 10 znaków.").max(5000),
});

// Helper: zod issues → płaski mapowanie { fieldName: "komunikat" } dla UI.
export function flattenErrors(error) {
  if (!error?.issues) return {};
  return error.issues.reduce((acc, issue) => {
    const key = issue.path.join(".") || "_form";
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}
