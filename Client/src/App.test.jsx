import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import App from "./App";
import { renderWithProviders } from "./test/renderWithProviders";

vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(() => undefined),
  },
}));

vi.mock("./components/MainLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("./features/auth/pages/AuthTabs", () => ({
  default: () => <div>Auth Tabs</div>,
}));

vi.mock("./features/home/pages/Home", () => ({
  default: () => <div>Home Page</div>,
}));

vi.mock("./features/movies/pages/SeatSelection", () => ({
  default: () => <div>Seat Selection Page</div>,
}));

vi.mock("./features/movies/pages/Bookings", () => ({
  default: () => <div>Bookings Page</div>,
}));

vi.mock("./features/profile/pages/Profile", () => ({
  default: () => <div>Profile Page</div>,
}));

vi.mock("./features/admin/pages/Admin", () => ({
  default: () => <div>Admin Page</div>,
}));

vi.mock("./features/partner/pages/Partner", () => ({
  default: () => <div>Partner Page</div>,
}));

vi.mock("./features/movies/pages/MovieDetails", () => ({
  default: () => <div>Movie Details Page</div>,
}));

vi.mock("./features/auth/pages/ResetPassword", () => ({
  default: () => <div>Reset Password Page</div>,
}));

describe("App routing", () => {
  test("redirects unauthenticated protected route to public auth screen", async () => {
    renderWithProviders(<App />, {
      route: "/booking/show-1",
      preloadedState: {
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          checkingAuth: false,
          error: null,
        },
      },
    });

    expect(await screen.findByText("Auth Tabs")).toBeInTheDocument();
    expect(screen.queryByText("Seat Selection Page")).not.toBeInTheDocument();
  });
});
