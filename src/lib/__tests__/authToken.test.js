import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, clearToken } from "../authToken.js";

describe("src/lib/authToken.js", () => {
  beforeEach(() => localStorage.clear());

  it("zwraca null gdy brak tokenu", () => {
    expect(getToken()).toBeNull();
  });

  it("zapisuje i odczytuje token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    expect(localStorage.getItem("obskura_auth_token")).toBe("abc123");
  });

  it("czyści token", () => {
    setToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("nie rzuca gdy localStorage niedostępny", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("blocked"); };
    expect(() => setToken("x")).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
