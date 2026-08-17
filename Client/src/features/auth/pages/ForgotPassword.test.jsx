import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import ForgotPassword from "./ForgotPassword";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { forgotPasswordSuccess } from "../../../redux/slices/forgotPasswordSlice";

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

const openModalState = {
  ui: {
    activeTab: "login",
    loginError: "",
    showForgotPasswordModal: true,
  },
};

describe("ForgotPassword", () => {
  test("validates email before reset request", async () => {
    renderWithProviders(<ForgotPassword />, { preloadedState: openModalState });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Enter your email"), "invalid");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("Please enter a valid email!")).toBeInTheDocument();
  });

  test("shows success state after reset email succeeds", async () => {
    const { store } = renderWithProviders(<ForgotPassword />, { preloadedState: openModalState });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Enter your email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    act(() => {
      store.dispatch(forgotPasswordSuccess());
    });

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  test("closing modal resets state", async () => {
    const { store } = renderWithProviders(<ForgotPassword />, {
      preloadedState: {
        ...openModalState,
        forgotPassword: {
          loading: false,
          resetLoading: false,
          error: "Previous error",
          resetError: null,
          emailSent: false,
          resetSuccess: false,
        },
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /back to login/i }));

    await waitFor(() => {
      expect(store.getState().ui.showForgotPasswordModal).toBe(false);
    });
    expect(store.getState().forgotPassword.error).toBe(null);
  });
});
