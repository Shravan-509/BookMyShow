import { describe, expect, test } from "vitest";
import { axiosInstance } from ".";

describe("shared axios instance", () => {
  test("sends browser credentials for cookie-authenticated API calls", () => {
    expect(axiosInstance.defaults.withCredentials).toBe(true);
  });
});
