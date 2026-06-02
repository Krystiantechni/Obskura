import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext.jsx";

vi.mock("../../lib/apiClient.js", () => ({
  auth: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), logoutAll: vi.fn() },
}));
vi.mock("../../lib/authToken.js", () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

import { auth } from "../../lib/apiClient.js";
import { getToken, setToken, clearToken } from "../../lib/authToken.js";

function Probe() {
  const { status, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.display_name || "—"}</span>
      <button onClick={() => login({ email: "a@b.co", password: "Password1" })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const renderApp = () => render(<AuthProvider><Probe /></AuthProvider>);

describe("AuthContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("brak tokenu → status guest", async () => {
    getToken.mockReturnValue(null);
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    expect(auth.me).not.toHaveBeenCalled();
  });

  it("token + me 200 → authed z userem", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockResolvedValue({ display_name: "Mara" });
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    expect(screen.getByTestId("user")).toHaveTextContent("Mara");
  });

  it("token + me 401 → guest, token wyczyszczony", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockRejectedValue(new Error("401"));
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    expect(clearToken).toHaveBeenCalled();
  });

  it("login sukces → zapis tokenu + authed", async () => {
    getToken.mockReturnValue(null);
    auth.login.mockResolvedValue({ user: { display_name: "Mara" }, token: "newtok" });
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    await act(async () => { screen.getByText("login").click(); });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    expect(setToken).toHaveBeenCalledWith("newtok");
    expect(screen.getByTestId("user")).toHaveTextContent("Mara");
  });

  it("logout czyści stan nawet gdy API rzuci", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockResolvedValue({ display_name: "Mara" });
    auth.logout.mockRejectedValue(new Error("network"));
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    await act(async () => { screen.getByText("logout").click(); });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    expect(clearToken).toHaveBeenCalled();
  });

  it("zdarzenie auth:logout przełącza na guest i czyści token", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockResolvedValue({ display_name: "Mara" });
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    clearToken.mockClear();
    await act(async () => { window.dispatchEvent(new Event("auth:logout")); });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    expect(clearToken).toHaveBeenCalled();
  });

  it("register sukces → zapis tokenu + authed", async () => {
    getToken.mockReturnValue(null);
    auth.register.mockResolvedValue({ user: { display_name: "Nowa" }, token: "regtok" });
    function RegProbe() {
      const { status, register } = useAuth();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={() => register({ email: "a@b.co", password: "Password1", name: "Nowa", terms: true })}>reg</button>
        </div>
      );
    }
    render(<AuthProvider><RegProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    await act(async () => { screen.getByText("reg").click(); });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    expect(setToken).toHaveBeenCalledWith("regtok");
  });
});
