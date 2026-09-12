# API Reference

Base path: `/bms/v1`

Authentication: all groups except `/auth` require a valid JWT in the HTTP-only `access_token` cookie, `Authorization: Bearer <token>`, or `x-auth-token`.

Common response shape:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

Error responses commonly use:

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

## Auth

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ name, email, phone, password }` | Creates a user with bcrypt-hashed password and sends an email verification code |
| `POST` | `/auth/verify-email` | `{ userId?, email?, code }` | Verifies email or reverification code |
| `POST` | `/auth/resend-verification` | `{ userId?, email }` | Resends email verification for an unverified account |
| `POST` | `/auth/request-reverification` | `{ email }` | Starts reverification for an existing unverified account |
| `POST` | `/auth/login` | `{ email, password }` | Validates credentials; returns 2FA requirement or sets JWT cookie |
| `POST` | `/auth/verify-2fa` | `{ userId?, email?, code }` | Validates 2FA code and sets JWT cookie |
| `POST` | `/auth/resend-2fa` | `{ email }` plus `req.userId` expectation | Resends 2FA verification code |
| `POST` | `/auth/logout` | none | Clears `access_token` cookie |
| `POST` | `/auth/forgot-password` | `{ email }` | Stores reset token and emails reset URL |
| `POST` | `/auth/reset-password` | `{ token, newPassword }` | Verifies reset token and updates password |

## Users

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/users/profile` | none | Returns authenticated user without password/reset fields |
| `PUT` | `/users/update-profile` | `{ name, phone }` | Updates profile after phone format validation |
| `PUT` | `/users/change-password` | `{ currentPassword, newPassword }` | Validates current password, hashes new password, clears cookie |
| `POST` | `/users/request-email-change` | `{ newEmail, password }` | Validates password and sends verification code to new email |
| `POST` | `/users/verify-email-change` | `{ code, newEmail }` | Applies pending email change, notifies old/new addresses, clears cookie |
| `PUT` | `/users/toggle-2fa` | none | Toggles `twoFactorEnabled` for authenticated user |
| `DELETE` | `/users/delete-account` | `{ password }` | Deletes user after password confirmation and cascades verification/bookings/theatres |
| `GET` | `/users/admin/all` | none | Returns all users without sensitive fields |

## Movies

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/movies` | Movie document | Adds a movie after duplicate `movieName` check |
| `GET` | `/movies` | none | Returns movies sorted by `releaseDate` descending; cached for 60 seconds |
| `GET` | `/movies/:id` | none | Returns one movie by id |
| `PATCH` | `/movies/:id` | Partial movie document | Updates movie |
| `DELETE` | `/movies/:id` | none | Deletes movie |

Movie body fields:

```json
{
  "movieName": "Inception",
  "description": "Movie description",
  "duration": 148,
  "genre": ["Sci-Fi", "Thriller"],
  "language": ["English"],
  "releaseDate": "2010-07-16",
  "poster": "https://example.com/poster.jpg"
}
```

## Theatres

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/theatres` | Theatre document | Adds a theatre after duplicate `name` check and validates optional active `city` reference |
| `GET` | `/theatres` | none | Returns all theatres for admin or owned theatres for partner, with owner and optional city populated |
| `PATCH` | `/theatres/:id` | Partial theatre document | Updates theatre and validates optional active `city` reference |
| `DELETE` | `/theatres/:id` | none | Deletes theatre |

Theatre body fields:

```json
{
  "name": "PVR Forum",
  "address": "Koramangala, Bengaluru",
  "phone": 9876543210,
  "email": "pvr@example.com",
  "owner": "USER_OBJECT_ID",
  "city": "CITY_OBJECT_ID",
  "isActive": true
}
```

`city` is optional for backward compatibility with existing theatre records.

## Cities

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/cities` | none | Returns active cities; admins may pass `?includeInactive=true` |
| `GET` | `/cities/:id` | none | Returns one city |
| `POST` | `/cities` | `{ cityName, state, country, cityCode?, tier?, location?, isActive? }` | Admin-only city creation |
| `PATCH` | `/cities/:id` | Partial city document | Admin-only city update |
| `DELETE` | `/cities/:id` | none | Admin-only soft deactivation by setting `isActive=false` |

City records are protected by a compound unique index on `cityName`, `state`, and `country`, and an optional unique sparse `cityCode` index. `location`, when supplied, must be a GeoJSON Point with coordinates in `[longitude, latitude]` order. `tier` accepts `TIER_1`, `TIER_2`, or `TIER_3`; it is not used for pricing in the current implementation.

## Screens

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/screens` | none | Lists screens visible to the caller; admins see all, partners see owned-theatre screens |
| `GET` | `/screens/:id` | none | Returns one screen after Theatre ownership validation |
| `GET` | `/theatres/:theatreId/screens` | none | Lists screens for one Theatre; supports `?activeOnly=true` |
| `POST` | `/screens` | `{ theatre, name, screenNumber, capacity, isActive? }` | Creates a screen for an active Theatre |
| `PATCH` | `/screens/:id` | Partial screen document | Updates screen metadata or active status |
| `DELETE` | `/screens/:id` | none | Hard-deletes unreferenced screens; deactivates screens referenced by Shows |

Screen authorization derives from Theatre ownership. Partners can manage screens only for their own Theatres. `screenNumber` is unique within a Theatre. `Screen.capacity` is the physical capacity source of truth and cannot be reduced below the number of active physical Seats already configured for that Screen.

## Seats

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/seats/:id` | none | Returns one Seat after resolving Screen -> Theatre ownership |
| `GET` | `/screens/:screenId/seats` | none | Lists all Seats for a Screen and returns capacity/layout summary metadata |
| `POST` | `/seats` | `{ screen, seatNumber, row, column, seatType, isActive? }` | Creates one physical Seat for an active Screen |
| `PATCH` | `/seats/:id` | Partial Seat document | Updates Seat row/column/type/status; Seat `screen` cannot be changed |
| `DELETE` | `/seats/:id` | none | Logically disables a Seat by setting `isActive=false` |
| `POST` | `/screens/:screenId/seats/bulk` | `{ rows }` | Creates a validated physical layout from row definitions |

Single Seat body example:

```json
{
  "screen": "SCREEN_OBJECT_ID",
  "seatNumber": "A1",
  "row": "A",
  "column": 1,
  "seatType": "STANDARD",
  "isActive": true
}
```

Bulk Seat body example:

```json
{
  "rows": [
    {
      "row": "A",
      "startColumn": 1,
      "endColumn": 12,
      "seatType": "STANDARD",
      "excludedColumns": [5, 6]
    }
  ]
}
```

Seat numbers are normalized and must match `row + column`, for example `A + 1 = A1` and `AA + 15 = AA15`. `seatType` accepts `STANDARD`, `PREMIUM`, and `RECLINER`. Bulk creation validates the complete proposed layout before insertion and rejects duplicates or capacity overflow without intentionally creating partial layouts. The frontend supports Manual Rows and Sequential Rows; Sequential Rows are converted into this same canonical bulk row-definition payload before submission. Admins can manage Seats for any Screen; partners can manage Seats only for Screens under their owned Theatres; normal users are denied.

## Shows

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/shows` | Show document | Adds a show; screen-aware creation initializes ShowSeat inventory transactionally |
| `GET` | `/shows/:id` | none | Returns show with populated movie, theatre, and screen; cached for 30 seconds |
| `GET` | `/shows/:showId/seats` | none | Returns customer-safe ShowSeat availability for a Show |
| `GET` | `/shows/theatre/:id` | none | Returns shows for a theatre with populated movie and screen; cached for 30 seconds |
| `POST` | `/shows/theatres/movie` | `{ movie, date }` | Groups shows by theatre for a selected movie/date |
| `PATCH` | `/shows/:id` | Partial show document | Updates show; changing `screen` is rejected after ShowSeat inventory exists |
| `DELETE` | `/shows/:id` | none | Hard-deletes show; initialized Shows remove ShowSeats in the same transaction |

Show body fields:

```json
{
  "name": "Evening Show",
  "date": "2026-05-12",
  "time": "19:30",
  "movie": "MOVIE_OBJECT_ID",
  "ticketPrice": 250,
  "ticketPricing": {
    "STANDARD": 250,
    "PREMIUM": 350,
    "RECLINER": 550
  },
  "theatre": "THEATRE_OBJECT_ID",
  "screen": "SCREEN_OBJECT_ID"
}
```

`Show.theatre` remains required for booking compatibility. `Show.screen` is optional for legacy no-screen Shows, but when supplied the backend validates that the Screen exists, is active, belongs to the selected Theatre, and has a complete physical Seat layout (`activeSeatCount === Screen.capacity`). For screen-aware Shows, the backend derives `Show.totalSeats` from `Screen.capacity`, creates the Show and ShowSeats in one MongoDB transaction, and all new ShowSeats start as `AVAILABLE`. Transaction support is required for screen-aware creation.

`ticketPrice` remains required and is the default per-seat price. `ticketPricing` is optional and may provide positive numeric overrides for `STANDARD`, `PREMIUM`, and `RECLINER`. Missing seat-type overrides fall back to `ticketPrice`.

The scheduler-compatible payload omits `totalSeats`; the backend derives it:

```json
{
  "name": "Morning Show",
  "date": "2026-09-10",
  "time": "10:30",
  "movie": "MOVIE_OBJECT_ID",
  "ticketPrice": 175,
  "theatre": "THEATRE_OBJECT_ID",
  "screen": "SCREEN_OBJECT_ID"
}
```

### ShowSeat Availability

`GET /bms/v1/shows/:showId/seats` is a JWT-protected customer-accessible read endpoint. It is not restricted to admin/partner roles and does not repair, create, or mutate inventory.

Success response for initialized screen-aware Shows:

```json
{
  "success": true,
  "message": "Show seats fetched successfully",
  "data": {
    "showId": "SHOW_OBJECT_ID",
    "screenId": "SCREEN_OBJECT_ID",
    "screenName": "Screen 2",
    "screenNumber": 2,
    "capacity": 250,
    "layoutStatus": "INITIALIZED",
    "seats": [
      {
        "showSeatId": "SHOWSEAT_OBJECT_ID",
        "seatId": "SEAT_OBJECT_ID",
        "seatNumber": "A1",
        "row": "A",
        "column": 1,
        "seatType": "STANDARD",
        "status": "AVAILABLE"
      }
    ]
  }
}
```

Legacy no-screen Shows return `layoutStatus: "LEGACY"` with an empty `seats` array and capacity from the legacy Show capacity snapshot. Partial or inconsistent ShowSeat inventory returns `409 SHOWSEAT_INVENTORY_NOT_READY`. Malformed show ids return `400`, and missing Shows return `404`. The response intentionally excludes booking references, booked timestamps, users, payment data, transaction/order ids, timestamps, and `__v`.

## Bookings

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/bookings/validateSeats` | `{ showId, seats }` | Checks initialized ShowSeat availability or legacy `show.bookedSeats` availability |
| `POST` | `/bookings/createOrder` | `{ showId, seats, feePerTicket }` | Resolves authoritative seat-type pricing, validates the ₹15-₹20 fee, recalculates GST/total, and creates a Razorpay INR order in paise |
| `POST` | `/bookings/bookSeat` | Booking confirmation payload | Verifies Razorpay signature and expected order/payment amount, synchronizes ShowSeat/Show booking state, saves booking, sends ticket |
| `GET` | `/bookings/:id` | none | Returns simplified bookings only when `:id` matches the authenticated JWT user |
| `GET` | `/bookings/admin/all` | none | Admin-only simplified booking list for all users |
| `GET` | `/bookings/theatre/:theatreId` | none | Admin/partner route; partners can access only owned theatre bookings |
| `GET` | `/bookings/revenue/:ownerId` | none | Admin/partner route; partners can access only their own revenue summary |

Booking confirmation payload:

```json
{
  "transactionId": "razorpay_payment_id",
  "orderId": "razorpay_order_id",
  "signature": "razorpay_signature",
  "seats": ["A1", "A2"],
  "show": "SHOW_OBJECT_ID",
  "seatType": "Standard",
  "feePerTicket": 18,
  "gstPercent": 18,
  "paymentMethod": "UPI",
  "receipt": "BMS_TICKET_..."
}
```

Important booking behavior:

| Step | Detail |
| --- | --- |
| Seat validation | Initialized Shows validate requested labels against ShowSeat documents with `AVAILABLE` status and `show.bookedSeats`; legacy Shows use `show.bookedSeats` only |
| Payment verification | `bookSeat` computes HMAC SHA256 with `RAZORPAY_KEY_SECRET`, fetches Razorpay order/payment details, and verifies the paid amount against server-calculated pricing |
| Seat reservation | Initialized Shows update `Show.bookedSeats`, `ShowSeat.status`, and `Booking` in a MongoDB transaction; legacy Shows keep the conditional `$nin` / `$push` update |
| Booking save | Booking stores Razorpay ids, receipt, generated booking id, `ticketAmount`, `seatPricing[]`, final `amount`, fees, GST, payment method, and status |
| Ticket side effects | Booking history, PDF, and email prefer Booking price snapshots; PDF/email failures are logged but do not undo the booking |

Frontend checkout pricing is display-only. The backend recomputes ticket totals from selected seat labels, ShowSeat seat types, `Show.ticketPricing`, and `Show.ticketPrice` fallback during both order creation and final booking confirmation. `feePerTicket` remains a bounded compatibility input used to compute the convenience fee and 18% GST component.

Simplified booking responses include legacy fields such as `seats`, `ticketPrice`, `seatType`, and `convenienceFee`, and now include `ticketAmount` plus `seatPricing[]` when present. Booking history, generated PDF tickets, and email confirmations should prefer those stored Booking snapshots rather than recomputing historical prices from the current Show.
