export const getScreenDisplayName = (screen) => {
  if (!screen) {
    return "";
  }

  if (typeof screen === "string") {
    return "";
  }

  const name = typeof screen.name === "string" ? screen.name.trim() : "";
  const screenNumber = screen.screenNumber ? `Screen ${screen.screenNumber}` : "";

  if (name && screenNumber && name.toLowerCase() !== screenNumber.toLowerCase()) {
    return `${name} / ${screenNumber}`;
  }

  return name || screenNumber;
};

export const getBookingScreenDisplayName = (booking) => {
  const screenName = typeof booking?.screenName === "string" ? booking.screenName.trim() : "";
  const screenNumber = booking?.screenNumber ? `Screen ${booking.screenNumber}` : "";

  if (screenName && screenNumber && !screenName.toLowerCase().includes(screenNumber.toLowerCase())) {
    return `${screenName} / ${screenNumber}`;
  }

  return screenName || screenNumber;
};
