export const SEAT_TYPES = Object.freeze({
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
  RECLINER: "RECLINER",
});

export const SEAT_TYPE_LABELS = Object.freeze({
  STANDARD: "Standard",
  PREMIUM: "Premium",
  RECLINER: "Recliner",
});

export const SUPPORTED_SEAT_TYPES = Object.freeze(Object.values(SEAT_TYPES));

export const formatCurrency = (amount) => (
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
);

export const normalizeSeatType = (seatType) => (
  typeof seatType === "string" ? seatType.trim().toUpperCase() : SEAT_TYPES.STANDARD
);

export const getSeatTypeLabel = (seatType) => (
  SEAT_TYPE_LABELS[normalizeSeatType(seatType)] || SEAT_TYPE_LABELS.STANDARD
);

export const isPositivePrice = (value) => (
  typeof value === "number" && Number.isFinite(value) && value > 0
);

export const resolveSeatTypePrice = (show, seatType) => {
  const normalizedSeatType = normalizeSeatType(seatType);
  const explicitPrice = show?.ticketPricing?.[normalizedSeatType];

  if (isPositivePrice(explicitPrice)) {
    return explicitPrice;
  }

  return Number(show?.ticketPrice || 0);
};

export const buildSelectedSeatPricing = (show, showSeats = [], selectedSeats = []) => {
  const seatsByNumber = new Map(
    (showSeats || []).map((seat) => [
      String(seat.seatNumber || "").trim().toUpperCase(),
      seat,
    ])
  );

  const seatPricing = (selectedSeats || []).map((seatNumber) => {
    const normalizedSeatNumber = String(seatNumber || "").trim().toUpperCase();
    const showSeat = seatsByNumber.get(normalizedSeatNumber);
    const seatType = normalizeSeatType(showSeat?.seatType);
    const price = resolveSeatTypePrice(show, seatType);

    return {
      seatNumber: normalizedSeatNumber,
      seatType,
      seatTypeLabel: getSeatTypeLabel(seatType),
      price,
    };
  });

  const ticketAmount = Number(
    seatPricing.reduce((sum, seat) => sum + Number(seat.price || 0), 0).toFixed(2)
  );

  return {
    ticketAmount,
    seatPricing,
  };
};

export const groupSeatPricing = (seatPricing = []) => (
  Object.values(
    seatPricing.reduce((groups, seat) => {
      const seatType = normalizeSeatType(seat.seatType);
      const key = `${seatType}:${seat.price}`;

      if (!groups[key]) {
        groups[key] = {
          seatType,
          seatTypeLabel: getSeatTypeLabel(seatType),
          price: seat.price,
          count: 0,
          seats: [],
          total: 0,
        };
      }

      groups[key].count += 1;
      groups[key].seats.push(seat.seatNumber);
      groups[key].total = Number((groups[key].total + Number(seat.price || 0)).toFixed(2));

      return groups;
    }, {})
  )
);

export const getBookingTicketAmount = (booking) => {
  if (Number.isFinite(booking?.ticketAmount)) {
    return Number(booking.ticketAmount);
  }

  return Number(((booking?.ticketPrice || 0) * (booking?.seats?.length || 0)).toFixed(2));
};

export const getBookingPaidTotal = (booking) => {
  if (Number.isFinite(booking?.amount)) {
    return Number(booking.amount);
  }

  return Number((getBookingTicketAmount(booking) + Number(booking?.convenienceFee || 0)).toFixed(2));
};

export const getBookingSeatPricing = (booking) => {
  if (Array.isArray(booking?.seatPricing) && booking.seatPricing.length > 0) {
    return booking.seatPricing.map((seat) => ({
      seatNumber: seat.seatNumber,
      seatType: normalizeSeatType(seat.seatType),
      seatTypeLabel: getSeatTypeLabel(seat.seatType),
      price: Number(seat.price || 0),
    }));
  }

  const fallbackPrice = Number(booking?.ticketPrice || 0);
  const fallbackSeatType = normalizeSeatType(booking?.seatType);

  return (booking?.seats || []).map((seatNumber) => ({
    seatNumber,
    seatType: SUPPORTED_SEAT_TYPES.includes(fallbackSeatType) ? fallbackSeatType : SEAT_TYPES.STANDARD,
    seatTypeLabel: getSeatTypeLabel(fallbackSeatType),
    price: fallbackPrice,
  }));
};
