import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "../RequireAuth.jsx";

let mockStatus = "guest";
vi.mock("../../../context/AuthContext.jsx", () => ({
  useAuth: () => ({ status: mockStatus }),
}));

function renderAt(status) {
  mockStatus = status;
  return render(
    <MemoryRouter initialEntries={["/account"]}>
      <Routes>
        <Route path="/account" element={<RequireAuth><div>SEKRET</div></RequireAuth>} />
        <Route path="/login" element={<div>STRONA LOGOWANIA</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  it("authed → renderuje dzieci", () => {
    renderAt("authed");
    expect(screen.getByText("SEKRET")).toBeInTheDocument();
  });

  it("guest → przekierowuje na /login", () => {
    renderAt("guest");
    expect(screen.getByText("STRONA LOGOWANIA")).toBeInTheDocument();
    expect(screen.queryByText("SEKRET")).not.toBeInTheDocument();
  });

  it("loading → nie renderuje dzieci ani redirectu", () => {
    renderAt("loading");
    expect(screen.queryByText("SEKRET")).not.toBeInTheDocument();
    expect(screen.queryByText("STRONA LOGOWANIA")).not.toBeInTheDocument();
  });
});
