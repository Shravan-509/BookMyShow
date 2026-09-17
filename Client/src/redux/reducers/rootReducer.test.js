import { describe, expect, test } from "vitest";
import { logout } from "../slices/authSlice";
import { acquireSeatLockSuccess } from "../slices/showSeatSlice";
import rootReducer from "./rootReducer";

describe("rootReducer authentication reset", () => {
  test("clears the in-memory ShowSeat lock token on logout", () => {
    const lock = {
      showId: "show-1",
      seats: ["A1"],
      lockToken: "server-token",
      lockExpiresAt: "2026-09-17T10:07:00.000Z",
    };
    let state = rootReducer(undefined, { type: "initial" });
    state = rootReducer(state, acquireSeatLockSuccess(lock));

    expect(state.showSeat.lock).toEqual(lock);

    state = rootReducer(state, logout());

    expect(state.showSeat.lock).toBe(null);
    expect(state.auth.isAuthenticated).toBe(false);
  });
});
