/**
 * Redux Selectors with Reselect Memoization
 * 
 * Prevents unnecessary component re-renders by memoizing selector outputs.
 * Only computes new values when input selectors change.
 * 
 * Usage:
 * import { selectAuthenticatedUser } from './reduxSelectors';
 * const user = useSelector(selectAuthenticatedUser);
 */

import { createSelector } from 'reselect';

// ============================================
// BASE SELECTORS (simple state slices)
// ============================================

const selectAuthState = state => state.auth;
const selectMovieState = state => state.movie;
const selectShowState = state => state.show;
const selectTheatreState = state => state.theatre;
const selectBookingState = state => state.booking;
const selectUserState = state => state.user;

// ============================================
// MEMOIZED SELECTORS (prevent re-renders)
// ============================================

/**
 * Select authenticated user
 * Memoizes user data - only changes when auth state changes
 */
export const selectAuthenticatedUser = createSelector(
  [selectAuthState],
  auth => auth?.user ?? null
);

/**
 * Select auth loading state
 */
export const selectIsAuthLoading = createSelector(
  [selectAuthState],
  auth => auth?.checkingAuth ?? false
);

/**
 * Select auth error
 */
export const selectAuthError = createSelector(
  [selectAuthState],
  auth => auth?.error ?? null
);

/**
 * Select is authenticated
 */
export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  auth => auth?.isAuthenticated ?? false
);

/**
 * Select user role
 */
export const selectUserRole = createSelector(
  [selectAuthenticatedUser],
  user => user?.role ?? null
);

/**
 * Select user ID
 */
export const selectUserId = createSelector(
  [selectAuthenticatedUser],
  user => user?.id ?? null
);

/**
 * Select all movies (filtered)
 */
export const selectAllMovies = createSelector(
  [selectMovieState],
  movies => movies?.list ?? []
);

/**
 * Select only active movies
 */
export const selectActiveMovies = createSelector(
  [selectAllMovies],
  movies => movies.filter(movie => movie.isActive)
);

/**
 * Select movies count
 */
export const selectMoviesCount = createSelector(
  [selectActiveMovies],
  movies => movies.length
);

/**
 * Select movie by ID
 */
export const selectMovieById = (movieId) =>
  createSelector(
    [selectAllMovies],
    movies => movies.find(m => m.id === movieId) ?? null
  );

/**
 * Select movie genres (unique)
 */
export const selectGenres = createSelector(
  [selectAllMovies],
  movies => {
    const genres = new Set();
    movies.forEach(movie => {
      if (movie.genre) {
        const genreArray = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
        genreArray.forEach(g => genres.add(g));
      }
    });
    return Array.from(genres).sort();
  }
);

/**
 * Select movies filtered by genre
 */
export const selectMoviesByGenre = (genre) =>
  createSelector(
    [selectActiveMovies],
    movies => {
      if (!genre) return movies;
      return movies.filter(movie => {
        const movieGenres = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
        return movieGenres.includes(genre);
      });
    }
  );

/**
 * Select all shows
 */
export const selectAllShows = createSelector(
  [selectShowState],
  shows => shows?.list ?? []
);

/**
 * Select available shows (not cancelled)
 */
export const selectAvailableShows = createSelector(
  [selectAllShows],
  shows => shows.filter(show => show.status !== 'cancelled')
);

/**
 * Select shows by movie ID
 */
export const selectShowsByMovie = (movieId) =>
  createSelector(
    [selectAvailableShows],
    shows => shows.filter(show => show.movieId === movieId)
  );

/**
 * Select show by ID
 */
export const selectShowById = (showId) =>
  createSelector(
    [selectAllShows],
    shows => shows.find(show => show.id === showId) ?? null
  );

/**
 * Select all theatres
 */
export const selectAllTheatres = createSelector(
  [selectTheatreState],
  theatres => theatres?.list ?? []
);

/**
 * Select active theatres
 */
export const selectActiveTheatres = createSelector(
  [selectAllTheatres],
  theatres => theatres.filter(t => t.isActive)
);

/**
 * Select theatres by city
 */
export const selectTheatresByCity = (city) =>
  createSelector(
    [selectActiveTheatres],
    theatres => {
      if (!city) return theatres;
      return theatres.filter(t => t.city === city);
    }
  );

/**
 * Select theatre by ID
 */
export const selectTheatreById = (theatreId) =>
  createSelector(
    [selectAllTheatres],
    theatres => theatres.find(t => t.id === theatreId) ?? null
  );

/**
 * Select unique cities
 */
export const selectCities = createSelector(
  [selectActiveTheatres],
  theatres => {
    const cities = new Set(theatres.map(t => t.city).filter(Boolean));
    return Array.from(cities).sort();
  }
);

/**
 * Select booking state
 */
export const selectBookingData = createSelector(
  [selectBookingState],
  booking => ({
    selectedSeats: booking?.selectedSeats ?? [],
    selectedShow: booking?.selectedShow ?? null,
    totalPrice: booking?.totalPrice ?? 0,
    bookingStatus: booking?.status ?? null,
  })
);

/**
 * Select selected seats
 */
export const selectSelectedSeats = createSelector(
  [selectBookingState],
  booking => booking?.selectedSeats ?? []
);

/**
 * Select number of selected seats
 */
export const selectSelectedSeatsCount = createSelector(
  [selectSelectedSeats],
  seats => seats.length
);

/**
 * Select total booking price
 */
export const selectTotalPrice = createSelector(
  [selectBookingState],
  booking => booking?.totalPrice ?? 0
);

/**
 * Select seat layout for current show
 */
export const selectSeatLayout = createSelector(
  [selectBookingState],
  booking => booking?.seatLayout ?? {}
);

/**
 * Select booking summary
 */
export const selectBookingSummary = createSelector(
  [selectUserState],
  user => ({
    totalBookings: user?.bookings?.length ?? 0,
    upcomingBookings: user?.bookings?.filter(b => new Date(b.showDate) > new Date())?.length ?? 0,
    pastBookings: user?.bookings?.filter(b => new Date(b.showDate) <= new Date())?.length ?? 0,
  })
);

/**
 * Select user bookings
 */
export const selectUserBookings = createSelector(
  [selectUserState],
  user => user?.bookings ?? []
);

/**
 * Select upcoming bookings
 */
export const selectUpcomingBookings = createSelector(
  [selectUserBookings],
  bookings => bookings.filter(b => new Date(b.showDate) > new Date())
);

/**
 * Select past bookings
 */
export const selectPastBookings = createSelector(
  [selectUserBookings],
  bookings => bookings.filter(b => new Date(b.showDate) <= new Date())
);

/**
 * Select booking by ID
 */
export const selectBookingById = (bookingId) =>
  createSelector(
    [selectUserBookings],
    bookings => bookings.find(b => b.id === bookingId) ?? null
  );

/**
 * Complex selector: User's upcoming booking stats
 */
export const selectUserUpcomingStats = createSelector(
  [selectUpcomingBookings, selectMovieState, selectShowState],
  (bookings, movies, shows) => {
    const movieMap = new Map(movies?.list?.map(m => [m.id, m]) || []);
    const showMap = new Map(shows?.list?.map(s => [s.id, s]) || []);

    return bookings.map(booking => ({
      ...booking,
      movie: movieMap.get(booking.movieId),
      show: showMap.get(booking.showId),
    }));
  }
);

/**
 * Select loading states
 */
export const selectLoadingStates = createSelector(
  [selectAuthState, selectMovieState, selectShowState, selectTheatreState],
  (auth, movies, shows, theatres) => ({
    authLoading: auth?.checkingAuth ?? false,
    moviesLoading: movies?.loading ?? false,
    showsLoading: shows?.loading ?? false,
    theatresLoading: theatres?.loading ?? false,
  })
);

/**
 * Select if any major operation is loading
 */
export const selectIsAnyLoading = createSelector(
  [selectLoadingStates],
  loadingStates => Object.values(loadingStates).some(state => state === true)
);

/**
 * Select error messages
 */
export const selectErrorMessages = createSelector(
  [selectAuthState, selectMovieState, selectShowState, selectTheatreState],
  (auth, movies, shows, theatres) => ({
    authError: auth?.error ?? null,
    movieError: movies?.error ?? null,
    showError: shows?.error ?? null,
    theatreError: theatres?.error ?? null,
  })
);

/**
 * Select if there are any errors
 */
export const selectHasErrors = createSelector(
  [selectErrorMessages],
  errors => Object.values(errors).some(error => error !== null)
);
