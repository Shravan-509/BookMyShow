import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import PersonalInfoTab from "./Personal_InfoTab";
import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

const profileState = {
  profile: {
    profile: {
      name: "User One",
      email: "user@example.com",
      phone: "9876543210",
    },
    loading: false,
    saving: false,
    error: null,
    profileUpdateLoading: false,
    profileUpdateError: null,
    passwordChangeLoading: false,
    passwordChangeError: null,
    emailChangeLoading: false,
    emailChangeError: null,
    showEmailVerificationModal: false,
    pendingEmailChange: null,
    securityLoading: false,
    securityError: null,
    deleteAccountLoading: false,
    deleteAccountError: null,
    showReauthModal: false,
    reauthMessage: "",
  },
};

describe("PersonalInfoTab", () => {
  test("validates personal information before update", async () => {
    const { store } = renderWithProviders(<PersonalInfoTab />, { preloadedState: profileState });
    const user = userEvent.setup();

    await user.clear(screen.getByPlaceholderText("Enter your phone number"));
    await user.type(screen.getByPlaceholderText("Enter your phone number"), "12345");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Please enter a valid phone number")).toBeInTheDocument();
    expect(store.getState().profile.profileUpdateLoading).toBe(false);
  });

  test("dispatches sanitized profile update for valid personal information", async () => {
    const { store } = renderWithProviders(<PersonalInfoTab />, { preloadedState: profileState });
    const user = userEvent.setup();

    await user.clear(screen.getByPlaceholderText("Enter your full name"));
    await user.type(screen.getByPlaceholderText("Enter your full name"), "  Updated User  ");
    await user.clear(screen.getByPlaceholderText("Enter your phone number"));
    await user.type(screen.getByPlaceholderText("Enter your phone number"), "9876543211");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(store.getState().profile.profileUpdateLoading).toBe(true);
    });
  });

  test("shows backend profile update error", () => {
    renderWithProviders(<PersonalInfoTab />, {
      preloadedState: {
        profile: {
          ...profileState.profile,
          profileUpdateError: "Phone already exists",
        },
      },
    });

    expect(screen.getByText("Update Failed")).toBeInTheDocument();
    expect(screen.getByText("Phone already exists")).toBeInTheDocument();
  });
});
