import { screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import RevenueTracking from "./RevenueTracking";
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

const bookingState = (overrides = {}) => ({
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
  ...overrides,
});

const authState = (user) => ({
  user,
  token: null,
  isAuthenticated: true,
  loading: false,
  checkingAuth: false,
  error: null,
});

describe("RevenueTracking", () => {
  test("dispatches revenue fetch with rehydrated auth _id and does not show empty state before request", async () => {
    const store = setupStore({
      auth: authState({ _id: "partner-1", role: "partner" }),
      booking: bookingState(),
    });
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);

    renderWithProviders(<RevenueTracking />, { store });

    expect(screen.queryByText("No revenue data available")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "booking/getRevenueDataRequest",
        payload: "partner-1",
      }));
    });
  });

  test("dispatches revenue fetch with login auth id", async () => {
    const store = setupStore({
      auth: authState({ id: "partner-login-id", role: "partner" }),
      booking: bookingState(),
    });
    const originalDispatch = store.dispatch;
    store.dispatch = vi.fn(originalDispatch);

    renderWithProviders(<RevenueTracking />, { store });

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "booking/getRevenueDataRequest",
        payload: "partner-login-id",
      }));
    });
  });

  test("shows empty state only after an empty revenue response shape is present", async () => {
    const store = setupStore({
      auth: authState({ _id: "partner-1", role: "partner" }),
      booking: bookingState({ revenueData: {} }),
    });
    store.dispatch = vi.fn();

    renderWithProviders(<RevenueTracking />, { store });

    expect(await screen.findByText("No revenue data available")).toBeInTheDocument();
  });

  test("renders revenue data from a successful response", async () => {
    const store = setupStore({
      auth: authState({ _id: "partner-1", role: "partner" }),
      booking: bookingState({
        revenueData: {
          summary: {
            totalRevenue: 703.1,
            totalBookings: 2,
            totalTickets: 3,
            averageBookingValue: 351.55,
          },
          revenueByTheatre: [{ theatreName: "INOX", revenue: 703.1, bookings: 2, tickets: 3 }],
          revenueByMonth: [{ month: "2026-09", revenue: 703.1 }],
        },
      }),
    });
    store.dispatch = vi.fn();

    renderWithProviders(<RevenueTracking />, { store });

    expect(await screen.findByText("Revenue by Month (Last 6 Months)")).toBeInTheDocument();
    expect(screen.getByText("Revenue by Theatre")).toBeInTheDocument();
  });
});
