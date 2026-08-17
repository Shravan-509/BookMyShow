import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import UserManagement from "./UserManagement";
import { renderWithProviders } from "../../../test/renderWithProviders";

const users = [
  {
    _id: "user-1",
    name: "Regular User",
    email: "user@example.com",
    phone: "9876543210",
    role: "user",
    emailVerified: true,
    twoFactorEnabled: true,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-02T10:00:00Z",
  },
  {
    _id: "partner-1",
    name: "Partner One",
    email: "partner@example.com",
    phone: "9876543211",
    role: "partner",
    emailVerified: false,
    twoFactorEnabled: false,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-02T10:00:00Z",
  },
];

describe("UserManagement", () => {
  test("filters admin user table by search text", async () => {
    renderWithProviders(<UserManagement />, {
      preloadedState: {
        user: {
          user: null,
          allUsers: users,
          loading: false,
          error: null,
        },
      },
    });
    const user = userEvent.setup();

    expect(screen.getByText("Regular User")).toBeInTheDocument();
    expect(screen.getByText("Partner One")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search by name, email, phone, or role"), "partner");

    expect(screen.queryByText("Regular User")).not.toBeInTheDocument();
    expect(screen.getByText("Partner One")).toBeInTheDocument();
  });
});
