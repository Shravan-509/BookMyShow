import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import Partner from "./Partner";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";

vi.mock("recharts", () => {
  const Chart = ({ children }) => <div>{children}</div>;
  const Primitive = ({ children }) => <div>{children}</div>;

  return {
    BarChart: Chart,
    Bar: Primitive,
    XAxis: Primitive,
    YAxis: Primitive,
    CartesianGrid: Primitive,
    Tooltip: Primitive,
    Legend: Primitive,
    ResponsiveContainer: Chart,
    LineChart: Chart,
    Line: Primitive,
    PieChart: Chart,
    Pie: Chart,
    Cell: Primitive,
  };
});

vi.mock("./TheatreList", () => ({
  default: () => <div>Theatres Pane</div>,
}));

vi.mock("./TheatreBooking", () => ({
  default: () => <div>Theatre Bookings Pane</div>,
}));

const bookingState = {
  loading: false,
  error: null,
  validationResult: null,
  bookingData: null,
  userBookings: [],
  allBookings: [],
  theatreBookings: [],
  revenueData: null,
  razorpayOrder: null,
  isPaymentProcessing: false,
  paymentError: null,
};

describe("Partner dashboard revenue tab", () => {
  test("mounts Revenue Tracking on tab activation and dispatches revenue fetch", async () => {
    const store = setupStore({
      auth: {
        user: { _id: "partner-1", role: "partner" },
        token: null,
        isAuthenticated: true,
        loading: false,
        checkingAuth: false,
        error: null,
      },
      booking: bookingState,
    });
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);
    const user = userEvent.setup();

    renderWithProviders(<Partner />, { store });

    expect(await screen.findByText("Theatres Pane")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Revenue Tracking" }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "booking/getRevenueDataRequest",
        payload: "partner-1",
      }));
    });
  });

  test("Theatre Bookings tab remains available", async () => {
    const store = setupStore({
      auth: {
        user: { _id: "partner-1", role: "partner" },
        token: null,
        isAuthenticated: true,
        loading: false,
        checkingAuth: false,
        error: null,
      },
      booking: bookingState,
    });
    const user = userEvent.setup();

    renderWithProviders(<Partner />, { store });

    await user.click(screen.getByRole("tab", { name: "Theatre Bookings" }));

    expect(await screen.findByText("Theatre Bookings Pane")).toBeInTheDocument();
  });
});
