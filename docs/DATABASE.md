# Database Documentation

The canonical schema reference is [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md). This file exists as the reviewer-facing database entry point requested in the project checklist.

## Database Technology

| Item | Value |
| --- | --- |
| Database | MongoDB / MongoDB Atlas |
| ODM | Mongoose |
| Connection | `Server/config/db.js` |
| Environment variable | `MONGODB_CONNECTION_STRING` |

## Collections

| Collection | Model file | Purpose |
| --- | --- | --- |
| `users` | `Server/models/userSchema.js` | Users, roles, password hash, verification state, 2FA state |
| `movies` | `Server/models/movieSchema.js` | Movie catalog records |
| `cities` | `Server/models/citySchema.js` | Active/inactive city catalog records for theatre mapping |
| `theatres` | `Server/models/theatreSchema.js` | Theatre records owned by partners |
| `screens` | `Server/models/screenSchema.js` | Physical auditoriums configured under theatres |
| `seats` | `Server/models/seatSchema.js` | Persistent physical Seat layout records under Screens |
| `shows` | `Server/models/showSchema.js` | Scheduled movie shows and booked seats |
| `bookings` | `Server/models/bookingSchema.js` | Confirmed ticket bookings and payment metadata |
| `verification` | `Server/models/verificationSchema.js` | Email verification, 2FA, reverification, and email-change codes |

## ER Diagram

```mermaid
erDiagram
    users ||--o{ theatres : owns
    cities ||--o{ theatres : contains
    theatres ||--o{ screens : contains
    screens ||--o{ seats : contains
    users ||--o{ bookings : creates
    users ||--o{ verification : receives
    movies ||--o{ shows : scheduled_for
    theatres ||--o{ shows : hosts
    screens ||--o{ shows : scheduled_in
    shows ||--o{ bookings : booked_for
```

## Data Integrity Notes

- Seat booking uses an atomic `Show.findOneAndUpdate` condition so the same seat cannot be booked twice during concurrent payment callbacks.
- `cities` uses a compound unique index on `cityName`, `state`, and `country`, an optional unique sparse `cityCode` index, and a `2dsphere` index for GeoJSON `location`.
- `cities.cityCode`, `cities.tier`, and `cities.location` are optional Phase 1.1 metadata fields so existing Phase 1 city documents remain valid before backfill.
- `theatres.city` is optional for backward compatibility with existing theatre documents and is not required until a future migration policy makes it safe.
- Every Theatre conceptually has at least one Screen; Screen records must be manually configured with actual capacity.
- `screens` uses a unique compound index on `theatre` and `screenNumber`.
- `seats` stores one physical Seat per document under a Screen. Seat labels are unique within a Screen through `{ screen, seatNumber }`, and row/column positions are unique through `{ screen, row, column }`.
- Active Seat count must remain less than or equal to `screens.capacity`. Screen capacity cannot be reduced below the number of active Seats, and Seats are not automatically deleted or disabled during capacity changes.
- Seat layout status is `INCOMPLETE` when active Seat count is below capacity and `COMPLETE` when it exactly matches capacity.
- `shows.screen` is optional for legacy compatibility while `shows.theatre` remains required for booking flows.
- `bookingId` is unique and indexed for public ticket references.
- Account deletion cascades verification records, bookings, and theatres owned by the deleted user.
- Movie, theatre, and show deletion currently do not cascade dependent records; this is a known limitation and future improvement area.

Phase 3 physical Seats are Admin/Partner configuration data. The current customer booking flow still uses generated seat labels from `SeatLayout.jsx`; `Booking.seats` and `Show.bookedSeats` remain string arrays until a future ShowSeat inventory phase.
