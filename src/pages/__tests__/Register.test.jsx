import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "../Register.jsx";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k, d) => d || k }) }));
const registerSpy = vi.fn();
vi.mock("../../context/AuthContext.jsx", () => ({ useAuth: () => ({ register: registerSpy }) }));

function renderRegister() {
  return render(<MemoryRouter><Register /></MemoryRouter>);
}

describe("Register", () => {
  beforeEach(() => registerSpy.mockReset());

  it("przejście kreatorem → finalny submit woła register z {email,password,name,terms}", async () => {
    registerSpy.mockResolvedValue({ display_name: "Mara" });
    renderRegister();

    // Krok 1
    fireEvent.change(screen.getByPlaceholderText("register.email_placeholder"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByPlaceholderText("register.password_placeholder"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /register\.next/ }));

    // Krok 2 (domyślne gatunki ["psy","folk"] spełniają canStep2)
    fireEvent.click(screen.getByRole("button", { name: /register\.next/ }));

    // Krok 3
    fireEvent.change(screen.getByPlaceholderText("register.name_placeholder"), { target: { value: "Mara" } });
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // terms
    fireEvent.click(screen.getByRole("button", { name: /register\.submit/ }));

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        email: "a@b.co",
        password: "Password1",
        name: "Mara",
        terms: true,
      }),
    );
  });
});
