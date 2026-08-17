import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ReminderSettingsTab from "./ReminderSettingsTab";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { saveReminderSettings, cancelReminder } from "../../../utils/reminderUtils";

vi.mock("../../../utils/reminderUtils", () => ({
  getReminderSettings: vi.fn(() => ({
    emailReminders: true,
    pushReminders: false,
    reminderTiming: "1hour",
  })),
  saveReminderSettings: vi.fn(),
  getUpcomingReminders: vi.fn(() => [
    {
      bookingId: "BMS1234",
      movieTitle: "Dune",
      theatreName: "PVR Forum",
      showDate: "2026-08-17",
      showTime: "18:00",
      reminderTime: "2026-08-17T16:00:00Z",
      seats: ["A1", "A2"],
    },
  ]),
  cancelReminder: vi.fn(),
}));

vi.mock("../../../utils/notificationUtils", () => ({
  notify: vi.fn(),
}));

describe("ReminderSettingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("updates reminder settings", async () => {
    renderWithProviders(<ReminderSettingsTab />);
    const user = userEvent.setup();

    const switches = screen.getAllByRole("switch");
    await user.click(switches[0]);

    expect(saveReminderSettings).toHaveBeenCalledWith(expect.objectContaining({
      emailReminders: false,
      pushReminders: false,
      reminderTiming: "1hour",
    }));
  });

  test("cancels an upcoming reminder", async () => {
    renderWithProviders(<ReminderSettingsTab />);
    const user = userEvent.setup();

    expect(screen.getByText("Dune")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(cancelReminder).toHaveBeenCalledWith("BMS1234");
    });
  });
});
