import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ShowTime from "./ShowTime";
import { getTheatresWithShowsByMovieRequest } from "../../../redux/slices/showSlice";

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockUseSelector = vi.fn();
const mockUseParams = vi.fn();

vi.mock("react-redux", async () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => mockUseSelector(selector),
}));

vi.mock("react-router-dom", async () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

const showState = (overrides = {}) => ({
  show: {
    loading: false,
    error: null,
    show: [
      {
        _id: "theatre-1",
        name: "Sangam Theatre 4K Dolby Atmos",
        address: "Dwaraka Nagar, Visakhapatnam, Andhra Pradesh",
        city: { cityName: "Visakhapatnam" },
        shows: [
          {
            _id: "show-late",
            time: "21:30",
            ticketPrice: 240,
            screen: { _id: "screen-2", name: "Screen 2", capacity: 450 },
          },
          {
            _id: "show-early",
            time: "14:30",
            ticketPrice: 220,
            ticketPricing: { STANDARD: 220, PREMIUM: 300 },
            screen: { _id: "screen-1", name: "Screen 1", capacity: 320 },
          },
        ],
      },
    ],
    ...overrides,
  },
});

const renderShowTime = (state = showState(), params = { id: "movie-1", date: "20260912" }) => {
  mockUseSelector.mockImplementation((selector) => selector(state));
  mockUseParams.mockReturnValue(params);
  return render(<ShowTime />);
};

describe("ShowTime redesign", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-12T08:00:00.000Z"));
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    mockUseSelector.mockReset();
    mockUseParams.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("fetches theatres using the selected route date", async () => {
    renderShowTime();

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        getTheatresWithShowsByMovieRequest({ movie: "movie-1", date: "2026-09-12" }),
      );
    });
  });

  test("changing the date updates route and fetch payload", async () => {
    renderShowTime();

    fireEvent.click(screen.getByLabelText("Select Tomorrow, Sep 13"));

    expect(mockNavigate).toHaveBeenCalledWith("/movie/movie-1/20260913");
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        getTheatresWithShowsByMovieRequest({ movie: "movie-1", date: "2026-09-13" }),
      );
    });
  });

  test("renders theatre, screen-aware showtime chips, and preserves booking navigation", () => {
    renderShowTime();

    expect(screen.getByRole("heading", { name: "Choose Show" })).toBeInTheDocument();
    expect(screen.getByText("Sangam Theatre 4K Dolby Atmos")).toBeInTheDocument();
    expect(screen.getByText("Visakhapatnam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Book 02:30 PM at Sangam Theatre 4K Dolby Atmos/i })).toBeInTheDocument();
    expect(screen.getByText("Screen 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Book 02:30 PM/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/booking/show-early");
  });

  test("renders legacy shows without Screen metadata safely", () => {
    renderShowTime(showState({
      show: [
        {
          _id: "theatre-2",
          name: "Legacy Theatre",
          address: "Vizag",
          shows: [{ _id: "legacy-show", time: "18:00", ticketPrice: 180 }],
        },
      ],
    }));

    expect(screen.getByText("Legacy Theatre")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Book 06:00 PM at Legacy Theatre/i })).toBeInTheDocument();
  });

  test("does not infer city from an address ending in a ZIP code", () => {
    renderShowTime(showState({
      show: [
        {
          _id: "theatre-zip",
          name: "Beach Road Theatre",
          address: "Beach Road, Visakhapatnam, 530003",
          city: "city-1",
          shows: [{ _id: "show-zip", time: "18:00", ticketPrice: 180 }],
        },
      ],
    }));

    expect(screen.getByText("Beach Road Theatre")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Current city/i)).not.toBeInTheDocument();
    expect(screen.queryByText("530003")).not.toBeInTheDocument();
    expect(screen.queryByText("city-1")).not.toBeInTheDocument();
  });

  test("missing city renders safely without undefined or ObjectId-style location text", () => {
    renderShowTime(showState({
      show: [
        {
          _id: "theatre-no-city",
          name: "No City Theatre",
          address: "Complex Road, 560001",
          shows: [{ _id: "show-no-city", time: "12:00", ticketPrice: 150 }],
        },
      ],
    }));

    expect(screen.getByText("No City Theatre")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Current city/i)).not.toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
    expect(screen.queryByText("560001")).not.toBeInTheDocument();
  });

  test("renders error state from the show slice", () => {
    renderShowTime(showState({ error: "Network error", show: [] }));

    expect(screen.getByText("Unable to Load Show Times")).toBeInTheDocument();
  });

  test("renders empty state after a successful empty show response", () => {
    renderShowTime(showState({ show: [] }));

    expect(screen.getByText("No shows available for this date")).toBeInTheDocument();
  });
});
