import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import EmailChangeModal from "./EmailChangeModal";
import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

const openEmailModalState = {
  profile: {
    profile: { name: "User", email: "old@example.com", phone: "9876543210" },
    loading: false,
    saving: false,
    error: null,
    profileUpdateLoading: false,
    profileUpdateError: null,
    passwordChangeLoading: false,
    passwordChangeError: null,
    emailChangeLoading: false,
    emailChangeError: null,
    showEmailVerificationModal: true,
    pendingEmailChange: "new@example.com",
    securityLoading: false,
    securityError: null,
    deleteAccountLoading: false,
    deleteAccountError: null,
    showReauthModal: false,
    reauthMessage: "",
  },
};

describe("EmailChangeModal", () => {
  test("shows pending email change and error display", () => {
    renderWithProviders(<EmailChangeModal />, {
      preloadedState: {
        profile: {
          ...openEmailModalState.profile,
          emailChangeError: "Invalid or expired verification code",
        },
      },
    });

    expect(screen.getByText("Verify Email Change")).toBeInTheDocument();
    expect(screen.getByText("new@example.com")).toBeInTheDocument();
    expect(screen.getByText("Invalid or expired verification code")).toBeInTheDocument();
  });

  test("cancel closes modal and clears email-change errors", async () => {
    const { store } = renderWithProviders(<EmailChangeModal />, {
      preloadedState: {
        profile: {
          ...openEmailModalState.profile,
          emailChangeError: "Invalid code",
        },
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(store.getState().profile.showEmailVerificationModal).toBe(false);
    });
    expect(store.getState().profile.emailChangeError).toBe(null);
  });
});
