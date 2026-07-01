import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Providers } from "@/components/providers";
import { Dashboard } from "@/components/dashboard";

describe("Dashboard", () => {
  it("renders household priorities and bill information", () => {
    render(<Providers><Dashboard /></Providers>);
    expect(screen.getByRole("heading", { name: /flat7 at a glance/i })).toBeInTheDocument();
    expect(screen.getByText("Care completion")).toBeInTheDocument();
    expect(screen.getByText("Upcoming bills")).toBeInTheDocument();
    expect(screen.getByText(/Profit & Loss/)).toBeInTheDocument();
    expect(screen.getByText("Still to collect")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /record payment received from/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("Household care this week")).toBeInTheDocument();
  });
});
