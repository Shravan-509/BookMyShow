const express = require("express");
const cors = require("cors");
const request = require("supertest");

const withNodeEnv = async (nodeEnv, callback) => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;

  try {
    return await callback();
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
};

describe("auth cookie options", () => {
  test("uses secure cross-site attributes in production", async () => {
    await withNodeEnv("production", () => {
      const { getAuthCookieSetOptions } = require("../../utils/authCookie");

      expect(getAuthCookieSetOptions()).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
    });
  });

  test("uses local-development compatible attributes outside production", async () => {
    await withNodeEnv("development", () => {
      const { getAuthCookieSetOptions } = require("../../utils/authCookie");

      expect(getAuthCookieSetOptions()).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
    });
  });

  test("logout clears the cookie with matching production attributes", async () => {
    await withNodeEnv("production", async () => {
      const { logoutUser } = require("../../controllers/AuthController");
      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      await logoutUser({}, res, jest.fn());

      expect(res.clearCookie).toHaveBeenCalledWith("access_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

describe("cors configuration", () => {
  const buildCorsApp = () => {
    jest.resetModules();
    process.env.PUBLIC_APP_URL = "https://bkmyshow.netlify.app";
    process.env.CORS_ALLOWED_ORIGINS = "https://preview.example.com";

    const { corsOptions } = require("../../config/corsOptions");
    const app = express();
    app.use(cors(corsOptions));
    app.get("/health", (_req, res) => res.json({ success: true }));
    return app;
  };

  test("allows configured frontend origin with credentials", async () => {
    const response = await request(buildCorsApp())
      .get("/health")
      .set("Origin", "https://bkmyshow.netlify.app");

    expect(response.headers["access-control-allow-origin"]).toBe("https://bkmyshow.netlify.app");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("does not allow unconfigured origins", async () => {
    const response = await request(buildCorsApp())
      .get("/health")
      .set("Origin", "https://malicious.example.com");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
  });
});
