import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import MovieShows from "./MovieShows";
import { getAvailableSeats, getResolvedTotalSeats } from "./showCapacityUtils";
import { renderWithProviders, setupStore } from "../../../test/renderWithProviders";

const theatre = {
  _id: "theatre-1",
  name: "Sree Rama Theatre",
  isActive: true,
};

const theatreTwo = {
  _id: "theatre-2",
  name: "Multiplex Theatre",
  isActive: true,
};

const movie = {
  _id: "movie-1",
  movieName: "Dune",
};

const screenOne = {
  _id: "screen-1",
  theatre: "theatre-1",
  name: "Screen 1",
  screenNumber: 1,
  capacity: 650,
  isActive: true,
};

const screenTwo = {
  _id: "screen-2",
  theatre: "theatre-1",
  name: "Screen 2",
  screenNumber: 2,
  capacity: 250,
  isActive: true,
};

const screenThree = {
  _id: "screen-3",
  theatre: "theatre-2",
  name: "Screen 3",
  screenNumber: 3,
  capacity: 180,
  isActive: true,
};

const screenFour = {
  _id: "screen-4",
  theatre: "theatre-2",
  name: "Screen 4",
  screenNumber: 4,
  capacity: 220,
  isActive: true,
};

const buildStore = (screens = [], shows = []) => {
  const screensByTheatre = Array.isArray(screens)
    ? { "theatre-1": screens }
    : screens;

  return setupStore({
  show: {
    loading: false,
    error: null,
    show: shows,
    selectedShow: null,
    success: false,
  },
  movie: {
    loading: false,
    error: null,
    movie: [movie],
    selectedMovie: null,
  },
  screen: {
    loading: false,
    error: null,
    screensByTheatre,
  },
});
};

describe("MovieShows screen selection", () => {
  test("resolves capacity from Screen before legacy totalSeats", () => {
    const screenAwareShow = {
      totalSeats: 999,
      bookedSeats: ["A1", "A2"],
      screen: { _id: "screen-1", name: "Screen 1", capacity: 250 },
    };
    const legacyShow = {
      totalSeats: 650,
      bookedSeats: ["A1"],
    };

    expect(getResolvedTotalSeats(screenAwareShow)).toBe(250);
    expect(getAvailableSeats(screenAwareShow)).toBe(248);
    expect(getResolvedTotalSeats(legacyShow)).toBe(650);
    expect(getAvailableSeats(legacyShow)).toBe(649);
  });

  test("shows a zero-screen warning and disables new Show submission", () => {
    const store = buildStore();
    store.dispatch = vi.fn();

    renderWithProviders(
      <MovieShows
        isShowModalOpen
        setIsShowModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    fireEvent.click(screen.getByRole("button", { name: /add show/i }));

    expect(screen.getByText(/no screens are configured for this theatre/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^add show$/i })).toBeDisabled();
  });

  test("single active Screen is preselected, visible, and explicitly submitted", async () => {
    const store = buildStore([screenOne]);
    store.dispatch = vi.fn();

    renderWithProviders(
      <MovieShows
        isShowModalOpen
        setIsShowModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    fireEvent.click(screen.getByRole("button", { name: /add show/i }));

    expect(await screen.findByText("Screen 1 (650 seats)")).toBeInTheDocument();
    expect(await screen.findByText("Screen: Screen 1")).toBeInTheDocument();
    expect(screen.getByText("Capacity: 650 seats")).toBeInTheDocument();
    expect(screen.queryByLabelText(/total seats/i)).not.toBeInTheDocument();
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "screen/fetchScreensByTheatreRequest",
      payload: { theatreId: "theatre-1", activeOnly: true },
    }));

    fireEvent.change(screen.getByLabelText(/show name/i), { target: { value: "Morning Show" } });
    fireEvent.change(screen.getByLabelText(/show date/i), { target: { value: "2026-09-03" } });
    fireEvent.change(screen.getByLabelText(/show timing/i), { target: { value: "10:30" } });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /select the movie/i }));
    fireEvent.click(await screen.findByText("Dune"));
    fireEvent.change(screen.getByRole("spinbutton", { name: /ticket price/i }), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: /^add show$/i }));

    await waitFor(() => expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "show/addShowRequest",
      payload: expect.objectContaining({
        screen: "screen-1",
        theatre: "theatre-1",
      }),
    })));
  }, 10000);

  test("multi-screen Theatre keeps selected Screen visible and submits its ObjectId", async () => {
    const store = buildStore([screenOne, screenTwo]);
    store.dispatch = vi.fn();

    renderWithProviders(
      <MovieShows
        isShowModalOpen
        setIsShowModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    fireEvent.click(screen.getByRole("button", { name: /add show/i }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /select screen/i }));

    expect(await screen.findByText("Screen 1 (650 seats)")).toBeInTheDocument();
    fireEvent.click(await screen.findByText("Screen 2 (250 seats)"));

    expect(await screen.findByText("Screen: Screen 2")).toBeInTheDocument();
    expect(screen.getByText("Capacity: 250 seats")).toBeInTheDocument();
    expect(screen.getAllByText("Screen 2 (250 seats)").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/show name/i), { target: { value: "Evening Show" } });
    fireEvent.change(screen.getByLabelText(/show date/i), { target: { value: "2026-09-03" } });
    fireEvent.change(screen.getByLabelText(/show timing/i), { target: { value: "18:30" } });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /select the movie/i }));
    fireEvent.click(await screen.findByText("Dune"));
    fireEvent.change(screen.getByRole("spinbutton", { name: /ticket price/i }), { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: /^add show$/i }));

    await waitFor(() => expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "show/addShowRequest",
      payload: expect.objectContaining({
        screen: "screen-2",
        theatre: "theatre-1",
      }),
    })));
  }, 10000);

  test("legacy Show without Screen renders safely", () => {
    const store = buildStore([], [{
      _id: "show-1",
      name: "Legacy Show",
      date: "2026-09-03",
      time: "18:00",
      movie,
      ticketPrice: 200,
      totalSeats: 650,
      bookedSeats: [],
      theatre: "theatre-1",
    }]);
    store.dispatch = vi.fn();

    renderWithProviders(
      <MovieShows
        isShowModalOpen
        setIsShowModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    expect(screen.getByText("Legacy / Unassigned")).toBeInTheDocument();
    expect(screen.getAllByText("650").length).toBeGreaterThan(0);
  });

  test("Show with Screen displays Screen name and uses Screen capacity for totals", () => {
    const store = buildStore([], [{
      _id: "show-1",
      name: "Screen Show",
      date: "2026-09-03",
      time: "18:00",
      movie,
      ticketPrice: 275,
      totalSeats: 650,
      bookedSeats: ["A1", "A2", "A3"],
      theatre: "theatre-1",
      screen: {
        _id: "screen-1",
        name: "Screen 1",
        screenNumber: 1,
        capacity: 250,
      },
    }]);
    store.dispatch = vi.fn();

    renderWithProviders(
      <MovieShows
        isShowModalOpen
        setIsShowModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    expect(screen.getByText("Screen 1")).toBeInTheDocument();
    expect(screen.getByText("275")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("247")).toBeInTheDocument();
    expect(screen.queryByText("650")).not.toBeInTheDocument();
  });

  test("edit Show normalizes populated Screen object to ObjectId and shows selection", async () => {
    const store = buildStore([screenOne, screenTwo], [{
      _id: "show-1",
      name: "Screen Show",
      date: "2026-09-03",
      time: "18:00",
      movie,
      ticketPrice: 275,
      totalSeats: 650,
      bookedSeats: [],
      theatre: "theatre-1",
      screen: screenTwo,
    }]);
    store.dispatch = vi.fn();

    renderWithProviders(
      <MovieShows
        isShowModalOpen
        setIsShowModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    expect((await screen.findAllByText("Screen 2 (250 seats)")).length).toBeGreaterThan(0);
    expect(screen.getByText("Screen: Screen 2")).toBeInTheDocument();
  });

  test("legacy Show edit starts empty and can be assigned a Screen", async () => {
    const user = userEvent.setup();
    const store = buildStore([screenOne], [{
      _id: "show-1",
      name: "Legacy Show",
      date: "2026-09-03",
      time: "18:00",
      movie,
      ticketPrice: 200,
      totalSeats: 650,
      bookedSeats: [],
      theatre: "theatre-1",
    }]);
    store.dispatch = vi.fn();

    renderWithProviders(
      <MovieShows
        isShowModalOpen
        setIsShowModalOpen={vi.fn()}
        selectedTheatre={theatre}
        setSelectedTheatre={vi.fn()}
      />,
      { store }
    );

    await user.click(await screen.findByRole("button", { name: /^edit$/i }));

    expect(screen.queryByText("Screen: Screen 1")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("combobox", { name: /select screen/i }));
    await user.click(await screen.findByText("Screen 1 (650 seats)"));

    expect(await screen.findByText("Screen: Screen 1")).toBeInTheDocument();
  });

  test("Theatre change clears invalid old Screen selection for multiplex Theatre", async () => {
    const store = buildStore({
      "theatre-1": [screenOne, screenTwo],
      "theatre-2": [screenThree, screenFour],
    });
    store.dispatch = vi.fn();

    const props = {
      isShowModalOpen: true,
      setIsShowModalOpen: vi.fn(),
      selectedTheatre: theatre,
      setSelectedTheatre: vi.fn(),
    };

    const { rerender } = renderWithProviders(<MovieShows {...props} />, { store });

    fireEvent.click(screen.getByRole("button", { name: /add show/i }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /select screen/i }));
    fireEvent.click(await screen.findByText("Screen 2 (250 seats)"));

    expect(await screen.findByText("Screen: Screen 2")).toBeInTheDocument();

    rerender(<MovieShows {...props} selectedTheatre={theatreTwo} />);

    await waitFor(() => expect(screen.queryByText("Screen: Screen 2")).not.toBeInTheDocument());
  });

  test("loaded active Screens do not reset a valid user selection", async () => {
    const user = userEvent.setup();
    const store = buildStore([screenOne, screenTwo]);
    store.dispatch = vi.fn();

    const props = {
      isShowModalOpen: true,
      setIsShowModalOpen: vi.fn(),
      selectedTheatre: theatre,
      setSelectedTheatre: vi.fn(),
    };

    const { rerender } = renderWithProviders(<MovieShows {...props} />, { store });

    await user.click(await screen.findByRole("button", { name: /add show/i }));
    await user.click(await screen.findByRole("combobox", { name: /select screen/i }));
    await user.click(await screen.findByText("Screen 2 (250 seats)"));

    expect(await screen.findByText("Screen: Screen 2")).toBeInTheDocument();

    rerender(<MovieShows {...props} />);

    expect(await screen.findByText("Screen: Screen 2")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Screen 2 (250 seats)").length).toBeGreaterThan(0));
  });
});
