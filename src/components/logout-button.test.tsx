import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LogoutButton } from "@/components/logout-button";

describe("LogoutButton", () => {
  it("asks for confirmation before ending the device session", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByRole("dialog", { name: "Log out of this household?" })).toBeInTheDocument();
    expect(screen.getByText(/will not be deleted/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });
});
