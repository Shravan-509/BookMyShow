const AUTH_COOKIE_NAME = "access_token";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const isProduction = () => process.env.NODE_ENV === "production";

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "none" : "lax",
  path: "/",
});

const getAuthCookieSetOptions = () => ({
  ...getAuthCookieOptions(),
  maxAge: ONE_DAY_MS,
});

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieSetOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
};

module.exports = {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getAuthCookieSetOptions,
  setAuthCookie,
  clearAuthCookie,
};
