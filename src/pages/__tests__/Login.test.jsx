import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Login from "../Login.jsx";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k, d) => d || k }) }));
const loginSpy = vi.fn();
let authState = { login: loginSpy, status: "guest" };
vi.mock("../../context/AuthContext.jsx", () => ({ useAuth: () => authState }));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

// Uwaga: reset mocka robimy w ciele testu, NIE w beforeEach. Wywołanie
// loginSpy.mockReset() z hooka beforeEach powoduje, że Vitest 2.1.9 flaguje
// odrzucony promise z kolejnego testu jako "unhandled" (mimo że onSubmit go łapie).
// Reset w ciele testu omija ten artefakt środowiska.
describe("Login", () => {
  it("submit z poprawnymi danymi woła useAuth().login", async () => {
    authState = { login: loginSpy, status: "guest" };
    loginSpy.mockReset();
    loginSpy.mockResolvedValue({ display_name: "Mara" });
    renderLogin();
    fireEvent.change(screen.getByLabelText("login.email_label"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("login.password_label"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /login\.submit/ }));
    await waitFor(() => expect(loginSpy).toHaveBeenCalledWith({ email: "a@b.co", password: "Password1" }));
  });

  it("błąd serwera renderuje komunikat (role=alert)", async () => {
    authState = { login: loginSpy, status: "guest" };
    loginSpy.mockReset();
    const err = new Error("Nieprawidłowy e-mail lub hasło.");
    err.fieldErrors = null;
    loginSpy.mockImplementation(() => Promise.reject(err));
    renderLogin();
    fireEvent.change(screen.getByLabelText("login.email_label"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("login.password_label"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /login\.submit/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nieprawidłowy e-mail lub hasło.");
  });

  it("gdy status==='authed' przekierowuje na location.state.from", async () => {
    authState = { login: loginSpy, status: "authed" };
    loginSpy.mockReset();
    render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: "/account" } }]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<div>KONTO MARKER</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("KONTO MARKER")).toBeInTheDocument();
  });
});
