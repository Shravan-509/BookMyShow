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
| `POST` | `/theatres` | Theatre document | Adds a theatre after duplicate `name` check |
| `GET` | `/theatres` | none | Returns all theatres for admin or owned theatres for partner; cached for 60 seconds |
| `PATCH` | `/theatres/:id` | Partial theatre document | Updates theatre |
| `DELETE` | `/theatres/:id` | none | Deletes theatre |

Theatre body fields:

```json
{
  "name": "PVR Forum",
  "address": "Koramangala, Bengaluru",
  "phone": 9876543210,
  "email": "pvr@example.com",
  "owner": "USER_OBJECT_ID",
  "isActive": true
}
```

## Shows

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/shows` | Show document | Adds a show |
| `GET` | `/shows/:id` | none | Returns show with populated movie and theatre; cached for 30 seconds |
| `GET` | `/shows/theatre/:id` | none | Returns shows for a theatre with populated movie; cached for 30 seconds |
| `POST` | `/shows/theatres/movie` | `{ movie, date }` | Groups shows by theatre for a selected movie/date |
| `PATCH` | `/shows/:id` | Partial show document | Updates show |
| `DELETE` | `/shows/:id` | none | Deletes show |

Show body fields:

```json
{
  "name": "Evening Show",
  "date": "2026-05-12",
  "time": "19:30",
  "movie": "MOVIE_OBJECT_ID",
  "ticketPrice": 250,
  "totalSeats": 150,
  "bookedSeats": [],
  "theatre": "THEATRE_OBJECT_ID"
}
```

## Bookings

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/bookings/validateSeats` | `{ showId, seats }` | Checks if selected seats are still available |
| `POST` | `/bookings/createOrder` | `{ amount }` | Creates a Razorpay INR order; amount is converted to paise |
| `POST` | `/bookings/bookSeat` | Booking confirmation payload | Verifies Razorpay signature, reserves seats atomically, saves booking, sends ticket |
| `GET` | `/bookings/:id` | none | Returns simplified bookings for a user id |
| `GET` | `/bookings/admin/all` | none | Returns simplified booking list for all users |
| `GET` | `/bookings/theatre/:theatreId` | none | Returns bookings for all shows in a theatre |
| `GET` | `/bookings/revenue/:ownerId` | none | Returns revenue summary, revenue by theatre, and six-month revenue trend |

Booking confirmation payload:

```json
{
  "transactionId": "razorpay_payment_id",
  "orderId": "razorpay_order_id",
  "signature": "razorpay_signature",
  "seats": ["A1", "A2"],
  "show": "SHOW_OBJECT_ID",
  "amount": 59000,
  "seatType": "Standard",
  "convenienceFee": 40,
  "gstPercent": 18,
  "paymentMethod": "UPI",
  "receipt": "BMS_TICKET_..."
}
```

Important booking behavior:

| Step | Detail |
| --- | --- |
| Seat validation | `validateSeats` returns unavailable seats if any requested seat is already in `show.bookedSeats` |
| Payment verification | `bookSeat` computes HMAC SHA256 with `RAZORPAY_KEY_SECRET` |
| Seat reservation | Seats are added with a conditional MongoDB update using `$nin` and `$push/$each` |
| Booking save | Booking stores Razorpay ids, receipt, generated booking id, amount, fees, GST, payment method, and status |
| Ticket side effects | PDF and email failures are logged but do not undo the booking |
