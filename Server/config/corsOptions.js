const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, "");

const getAllowedOrigins = () => {
  const configuredOrigins = [
    process.env.PUBLIC_APP_URL,
    process.env.CORS_ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

  const localOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  return [...new Set([...configuredOrigins, ...localOrigins])];
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (getAllowedOrigins().includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
};

module.exports = {
  corsOptions,
  getAllowedOrigins,
};
