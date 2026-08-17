import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import Login from "./Login";
import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

describe("Login", () => {
  test("validates invalid login input before dispatching login", async () => {
    const { store } = renderWithProviders(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Email"), "bad-email");
    await user.type(screen.getByPlaceholderText("Password"), "short");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText("Please enter a valid email!")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters!")).toBeInTheDocument();
    expect(store.getState().auth.loading).toBe(false);
  });

  test("shows failed login error and verify action", () => {
    renderWithProviders(<Login />, {
      preloadedState: {
        ui: {
          activeTab: "login",
          loginError: "Please verify your account before logging in",
          showForgotPasswordModal: false,
        },
      },
    });

    expect(screen.getByText("Account Not Verified")).toBeInTheDocument();
    expect(screen.getByText("Please verify your account before logging in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify now/i })).toBeInTheDocument();
  });

  test("opens forgot password modal and resets prior password state", async () => {
    const { store } = renderWithProviders(<Login />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    await waitFor(() => {
      expect(store.getState().ui.showForgotPasswordModal).toBe(true);
    });
    expect(store.getState().forgotPassword.emailSent).toBe(false);
  });
});
