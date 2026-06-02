import { describe, it, expect, beforeEach, vi } from "vitest";
import { request, ApiError, auth } from "../apiClient.js";
import { setToken, getToken } from "../authToken.js";

function mockFetch(status, body, { ok } = {}) {
  return vi.fn().mockResolvedValue({
    status,
    ok: ok ?? (status >= 200 && status < 300),
    json: () => Promise.resolve(body),
  });
}

describe("src/lib/apiClient.js — request", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("dokleja nagłówek tokenu gdy auth:true i token jest", async () => {
    setToken("tok42");
    global.fetch = mockFetch(200, { ok: true });
    await request("GET", "accounts/me", { auth: true });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe("Token tok42");
  });

  it("NIE dokleja tokenu gdy auth:false", async () => {
    setToken("tok42");
    global.fetch = mockFetch(200, { ok: true });
    await request("POST", "auth/login", { body: { email: "a@b.co" } });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it("mapuje 400 DRF na fieldErrors", async () => {
    global.fetch = mockFetch(400, { email: ["Konto już istnieje."], password: ["Za krótkie."] });
    await expect(request("POST", "auth/register", { body: {} })).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: "Konto już istnieje.", password: "Za krótkie." },
    });
  });

  it("używa `detail` jako message (np. 401 z login)", async () => {
    global.fetch = mockFetch(401, { detail: "Nieprawidłowy e-mail lub hasło." });
    await expect(request("POST", "auth/login", { body: {} })).rejects.toMatchObject({
      status: 401,
      message: "Nieprawidłowy e-mail lub hasło.",
    });
    expect(getToken()).toBeNull();
  });

  it("401 dla żądania auth:true czyści token i emituje auth:logout", async () => {
    setToken("tok42");
    const onLogout = vi.fn();
    window.addEventListener("auth:logout", onLogout);
    global.fetch = mockFetch(401, { detail: "Invalid token." });
    await expect(request("GET", "accounts/me", { auth: true })).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(onLogout).toHaveBeenCalledTimes(1);
    window.removeEventListener("auth:logout", onLogout);
  });

  it("network error → ApiError(0) z polskim komunikatem", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(request("GET", "accounts/me", {})).rejects.toMatchObject({
      status: 0,
      message: "Brak połączenia z serwerem.",
    });
  });

  it("204 zwraca null bez parsowania", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 204, ok: true, json: () => Promise.reject(new Error("no body")) });
    await expect(request("POST", "auth/logout", { auth: true })).resolves.toBeNull();
  });

  it("auth.login woła POST auth/login bez tokenu", async () => {
    global.fetch = mockFetch(200, { user: { id: 1 }, token: "t" });
    const res = await auth.login({ email: "a@b.co", password: "x" });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/login$/);
    expect(opts.method).toBe("POST");
    expect(res.token).toBe("t");
  });
});
