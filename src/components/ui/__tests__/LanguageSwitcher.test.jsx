import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Hoisted spy żeby test mógł sprawdzić wywołanie changeLanguage.
const { changeLanguageSpy } = vi.hoisted(() => ({
  changeLanguageSpy: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, fb, opts) => {
      if (opts && opts.code) return (fb || k).replace("{{code}}", opts.code);
      return fb || k;
    },
    i18n: { language: "pl", changeLanguage: changeLanguageSpy },
  }),
}));

// Import po vi.mock żeby mock zadziałał.
import LanguageSwitcher from "../LanguageSwitcher";

beforeEach(() => {
  changeLanguageSpy.mockClear();
});

describe("LanguageSwitcher", () => {
  it("renderuje przycisk z kodem aktualnego języka (PL) gdy dropdown zamknięty", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /Język: PL/i });
    expect(button).toBeInTheDocument();
    expect(within(button).getByText("PL")).toBeInTheDocument();
    // Dropdown nie jest jeszcze otwarty — search nie istnieje.
    expect(screen.queryByPlaceholderText(/Search language/i)).not.toBeInTheDocument();
  });

  it("klik przycisku otwiera dropdown (lista języków pojawia się w DOM)", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("button", { name: /Język: PL/i }));
    expect(screen.getByPlaceholderText(/Search language/i)).toBeInTheDocument();
    // Co najmniej jedna pozycja na liście (Polski + inne).
    expect(screen.getByRole("button", { name: /Polski/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /English/i })).toBeInTheDocument();
  });

  it("mousedown poza komponentem zamyka dropdown", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("button", { name: /Język: PL/i }));
    expect(screen.getByPlaceholderText(/Search language/i)).toBeInTheDocument();

    // Mousedown poza komponentem — handler nasłuchuje na document.
    fireEvent.mouseDown(document.body);

    expect(screen.queryByPlaceholderText(/Search language/i)).not.toBeInTheDocument();
  });

  it("wpisanie w search filtruje listę języków", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("button", { name: /Język: PL/i }));

    const search = screen.getByPlaceholderText(/Search language/i);
    await user.type(search, "polski");

    // Polski pozostaje, inne (np. English, Deutsch) znikają z listy.
    expect(screen.getByRole("button", { name: /Polski/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Deutsch/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Français/i })).not.toBeInTheDocument();
  });

  it("klik na inny język wywołuje i18n.changeLanguage z poprawnym kodem", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("button", { name: /Język: PL/i }));

    // Filtrujemy do English żeby uniknąć ambiguity (samo "English" jest też w EU).
    const search = screen.getByPlaceholderText(/Search language/i);
    await user.type(search, "english");

    const englishOption = screen.getByRole("button", { name: /English/i });
    await user.click(englishOption);

    expect(changeLanguageSpy).toHaveBeenCalledTimes(1);
    expect(changeLanguageSpy).toHaveBeenCalledWith("en");
  });

  it("aria-label przycisku głównego zawiera kod aktualnego języka (PL)", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /Język: PL, kliknij aby zmienić/i });
    expect(button).toHaveAttribute(
      "aria-label",
      "Język: PL, kliknij aby zmienić",
    );
  });
});
