export const getResolvedTotalSeats = (show) => show?.screen?.capacity ?? show?.totalSeats ?? 0;

export const getAvailableSeats = (show) => getResolvedTotalSeats(show) - (show?.bookedSeats?.length || 0);
