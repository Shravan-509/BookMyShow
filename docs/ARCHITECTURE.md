# BookMyShow Architecture

This document describes the architecture implemented in the current codebase. For full onboarding documentation, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).

## System Context

```mermaid
flowchart TB

    %% ==================================================
    %% Actors
    %% ==================================================

    Customer["Customer"]
    Admin["Admin"]
    Partner["Theatre Partner"]

    %% ==================================================
    %% Presentation Layer
    %% ==================================================

    subgraph PRESENTATION["Presentation Layer"]
        Client["React + Vite SPA"]
    end

    %% ==================================================
    %% Application Layer
    %% ==================================================

    subgraph APPLICATION["Application Layer"]

        API["Express REST API"]

        BookingService["Booking Service"]

        AuthService["Authentication Service"]

        PaymentService["Payment Service"]

        TicketService["Ticket Service"]
    end

    %% ==================================================
    %% Data Layer
    %% ==================================================

    subgraph DATA["Data Layer"]
        MongoDB[("MongoDB Atlas")]
    end

    %% ==================================================
    %% External Integrations
    %% ==================================================

    subgraph INTEGRATIONS["External Integrations"]

        Razorpay["Razorpay"]

        Brevo["Brevo Email"]

        PDF["PDFKit + QR Code"]
    end

    %% ==================================================
    %% User Interactions
    %% ==================================================

    Customer --> Client
    Admin --> Client
    Partner --> Client

    %% ==================================================
    %% Frontend to Backend
    %% ==================================================

    Client --> API

    %% ==================================================
    %% Internal Services
    %% ==================================================

    API --> AuthService
    API --> BookingService
    API --> PaymentService
    API --> TicketService

    %% ==================================================
    %% Database Access
    %% ==================================================

    AuthService --> MongoDB
    BookingService --> MongoDB
    PaymentService --> MongoDB
    TicketService --> MongoDB

    %% ==================================================
    %% Third-Party Integrations
    %% ==================================================

    PaymentService --> Razorpay

    TicketService --> PDF

    TicketService --> Brevo
```


## Application Layers

| Layer | Main files | Responsibility |
| --- | --- | --- |
| Presentation | `Client/src/features`, `Client/src/components`, `Client/src/App.jsx` | UI, route guards, role-aware navigation, booking screens |
| Client state | `Client/src/redux` | Redux Toolkit slices, persisted root reducer, Redux-Saga side effects |
| API client | `Client/src/api` | Axios calls grouped by backend domain |
| HTTP API | `Server/server.js`, `Server/routes` | Middleware and route mounting |
| Business logic | `Server/controllers`, `Server/services` | Auth, users, movies, theatres, screens, seats, shows, bookings, payments, and incremental service-backed domain logic |
| Data model | `Server/models`, `Server/repositories` | Mongoose schemas and relations; City, Screen, Seat, and ShowSeat use repository-backed domain operations |
| Integrations | `Server/utils/email.js`, `Server/utils/ticket-pdf.js`, Razorpay SDK | Email, PDF ticket, payment gateway |

## Domain Architecture

```mermaid
flowchart TD
    City["City"] --> Theatre["Theatre"]
    Theatre --> Screen["Screen"]
    Screen --> Seat["Seat"]
    Movie["Movie"] --> Show["Show"]
    Show --> Screen
    Show --> ShowSeat["ShowSeat"]
    ShowSeat --> Seat
    Show --> Pricing["ticketPricing"]
    Show --> Booking["Booking"]
    Booking --> BookingPricing["ticketAmount + seatPricing[]"]
```

Seat represents persistent physical Screen configuration. ShowSeat represents the per-Show inventory snapshot copied from those physical Seats. Each Screen owns its own layout, so two Screens may both contain `A1`, but a single Screen cannot contain duplicate `A1` or duplicate row/column positions.

Example:

```text
Theatre
├── Screen 1
│   ├── A1
│   ├── A2
│   └── ...
└── Screen 2
    ├── A1
    ├── A2
    └── ...
```

`Screen.capacity` remains the physical capacity source of truth. Active Seat count must satisfy `activeSeatCount <= Screen.capacity`; create, bulk-create, re-enable, and Screen capacity update flows enforce that invariant. Reducing capacity from `500` to `499` is rejected when `500` active Seats exist, while increasing capacity or reducing it to exactly the active Seat count is allowed.

Layout completeness is derived, not stored: `INCOMPLETE` means active Seat count is below capacity, and `COMPLETE` means it equals capacity. The invalid state where active Seat count exceeds capacity is prevented.

Phase 4B switches initialized screen-aware customer booking to ShowSeat availability while preserving the string seat-label contract. `SeatSelection.jsx` fetches sanitized ShowSeat inventory, `SeatLayout.jsx` renders actual physical rows/columns/gaps, and `Booking.seats` plus `Show.bookedSeats` remain string arrays for compatibility. Legacy no-screen Shows continue using generated labels and `Show.bookedSeats` only.

## Backend Request Flow

```mermaid
sequenceDiagram
    autonumber

    actor Client

    participant Express as Express Server
    participant Middleware as Middleware Pipeline
    participant Controller as Controller Layer
    participant Model as Mongoose Models
    participant MongoDB as MongoDB Atlas

    %% ==========================================
    %% Request Processing
    %% ==========================================

    Note over Client,Middleware: Request Processing

    Client->>Express: HTTP Request
    activate Express

    Express->>Middleware: Execute Middleware Chain
    activate Middleware

    Note over Middleware: body-parser<br/>helmet<br/>cors<br/>compression<br/>rate-limit

    %% ==========================================
    %% Authentication
    %% ==========================================

    Note over Middleware,Controller: Authentication & Authorization

    Middleware->>Middleware: validateJWT()
    Middleware->>Middleware: validateRole() for privileged route groups
    Middleware->>Controller: Controller ownership checks where applicable

    Middleware->>Controller: Forward Request
    deactivate Middleware

    %% ==========================================
    %% Business Logic
    %% ==========================================

    Note over Controller,MongoDB: Business Logic & Persistence

    activate Controller

    Controller->>Model: Query / Update Data
    activate Model

    Model->>MongoDB: Read / Write Operation
    activate MongoDB

    MongoDB-->>Model: Documents
    deactivate MongoDB

    Model-->>Controller: Domain Data
    deactivate Model

    %% ==========================================
    %% Response Generation
    %% ==========================================

    Note over Controller,Client: Response Lifecycle

    Controller-->>Express: JSON Response

    Express-->>Client: HTTP Response

    deactivate Controller
    deactivate Express
```


## Frontend Request Flow

```mermaid
sequenceDiagram
    autonumber

    participant Component as React Component
    participant Store as Redux Store
    participant Saga as Redux Saga
    participant Service as API Service
    participant Axios as Axios Client
    participant API as Express API

    Note over Component,API: User Initiated Request

    Component->>Store: Dispatch Action

    Store->>Saga: Notify Saga

    activate Saga

    Saga->>Service: Execute Service Method

    activate Service

    Service->>Axios: Send HTTP Request

    activate Axios

    Axios->>API: REST API Call

    activate API

    API-->>Axios: JSON Response

    deactivate API

    Axios-->>Service: Response Payload

    deactivate Axios

    Service-->>Saga: Parsed Response

    deactivate Service

    alt Success Response

        Saga->>Store: Dispatch Success Action

        Store-->>Component: Updated State

    else Error Response

        Saga->>Store: Dispatch Failure Action

        Store-->>Component: Error State

    end

    deactivate Saga
```


## Authentication Flow

#### Registration & Email Verification Flow

```mermaid
sequenceDiagram
    autonumber

    actor User

    participant Client as React Client
    participant API as Express API
    participant UserDB as User Collection
    participant VerificationDB as Verification Collection
    participant Email as Brevo Email Service

    Note over User,Email: User Registration

    User->>Client: Register Account

    Client->>API: POST /auth/register

    activate API

    API->>API: Hash Password (bcrypt)

    API->>UserDB: Create User

    API->>VerificationDB: Generate Verification Code

    API->>Email: Send Verification Email

    API-->>Client: verificationRequired=true

    deactivate API

    Note over User,VerificationDB: Email Verification

    User->>Client: Submit Verification Code

    Client->>API: POST /auth/verify-email

    activate API

    API->>VerificationDB: Fetch Active Verification

    VerificationDB-->>API: Verification Record

    alt Valid & Not Expired

        API->>UserDB: Set emailVerified=true

        API->>VerificationDB: Mark Verification Used

        API-->>Client: Email Verified

    else Invalid or Expired

        API-->>Client: Verification Failed

    end

    deactivate API
```

#### Login & Authentication Flow

```mermaid
sequenceDiagram
    autonumber

    actor User

    participant Client as React Client
    participant API as Express API
    participant UserDB as User Collection

    Note over User,UserDB: User Authentication

    User->>Client: Login

    Client->>API: POST /auth/login

    activate API

    API->>UserDB: Find User By Email

    UserDB-->>API: User Record

    API->>API: Validate Password (bcrypt.compare)

    alt User Not Found

        API-->>Client: Invalid Credentials

    else Invalid Password

        API-->>Client: Invalid Credentials

    else Email Not Verified

        API-->>Client: UNVERIFIED_ACCOUNT

    else Authentication Success

        API->>API: Generate JWT

        API-->>Client: HTTP-only JWT Cookie

    end

    deactivate API
```

#### Two-Factor Authentication Flow

```mermaid
sequenceDiagram
    autonumber

    actor User

    participant Client as React Client
    participant API as Express API
    participant Email as Brevo Email Service

    Note over User,Email: Two-Factor Authentication

    User->>Client: Login

    Client->>API: POST /auth/login

    activate API

    API->>API: Validate Credentials

    API->>API: Generate OTP

    API->>Email: Send OTP

    Email-->>User: Verification Code

    deactivate API

    User->>Client: Submit OTP

    Client->>API: POST /auth/verify-otp

    activate API

    API->>API: Validate OTP

    alt Valid OTP

        API->>API: Generate JWT

        API-->>Client: HTTP-only JWT Cookie

    else Invalid OTP

        API-->>Client: OTP Verification Failed

    end

    deactivate API
```

#### Authorization & Protected Route Flow
```mermaid
sequenceDiagram
    autonumber

    actor User

    participant Client as React Client
    participant API as Express API
    participant Auth as JWT Middleware
    participant Controller as Protected Controller

    Note over User,Controller: Protected Resource Access

    User->>Client: Open Protected Page

    Client->>API: Request Resource + JWT Cookie

    activate API

    API->>Auth: Validate JWT

    activate Auth

    alt Valid Token

        Auth->>Controller: Forward Request

        activate Controller

        Controller-->>API: Protected Data

        deactivate Controller

        API-->>Client: Success Response

    else Invalid Token

        Auth-->>API: Unauthorized

        API-->>Client: 401 Unauthorized

    end

    deactivate Auth

    deactivate API
```


## Payment and Booking Flow

```mermaid
sequenceDiagram
    autonumber

    actor User

    participant UI as Checkout UI
    participant API as Express API
    participant Booking as Booking Service
    participant Razorpay as Razorpay Gateway
    participant DB as MongoDB
    participant Notify as Notification Service

    Note over User,Notify: Seat Validation & Booking Workflow

    User->>UI: Select Seats

    UI->>API: Validate Seats

    activate API

    API->>Booking: Check Seat Availability

    activate Booking

    Booking->>DB: Read show.bookedSeats labels

    activate DB

    DB-->>Booking: Label availability

    deactivate DB

    alt Seats Available

        Booking->>DB: Atomically reserve selected labels

        activate DB

        DB-->>Booking: bookedSeats updated

        deactivate DB

        Booking-->>API: Validation Successful

        API-->>UI: Seats Available

    else Seats Unavailable

        Booking-->>API: Validation Failed

        API-->>UI: Seats No Longer Available

    end

    deactivate Booking
    deactivate API

    User->>UI: Proceed To Payment

    UI->>API: Create Payment Order with showId, seats, feePerTicket

    activate API

    API->>API: Load show ticket price and recalculate total
    API->>Razorpay: Create Order with server-calculated amount

    activate Razorpay

    Razorpay-->>API: Order Details

    deactivate Razorpay

    API-->>UI: Order Information

    deactivate API

    UI->>Razorpay: Launch Checkout

    User->>Razorpay: Complete Payment

    Razorpay-->>UI: Payment Result

    UI->>API: Confirm Payment

    activate API

    API->>API: Verify payment signature and expected amount

    alt Payment Successful

        API->>Booking: Confirm Booking

        activate Booking

        Booking->>DB: Mark Seats Booked

        Booking->>DB: Create Booking Record

        activate DB

        DB-->>Booking: Booking Saved

        deactivate DB

        Booking-->>API: Booking Confirmed

        deactivate Booking

        API->>Notify: Send Ticket

        activate Notify

        Notify-->>User: Email + PDF Ticket

        deactivate Notify

        API-->>UI: Booking Success

    else Payment Failed

        API->>Booking: Roll back reserved labels if needed

        Booking->>DB: Pull labels from bookedSeats

        API-->>UI: Payment Failed

    end

    deactivate API
```

## Middleware Stack

| Order | Middleware | Purpose |
| --- | --- | --- |
| 1 | `express.json`, `express.urlencoded`, `cookieParser` | Request body and cookie parsing |
| 2 | Helmet security headers | CSP, frameguard, HSTS, no-sniff, referrer policy |
| 3 | Compression | Gzip compression for responses larger than 1KB |
| 4 | Response-time and request logging | `X-Response-Time` plus console request duration logs |
| 5 | Static/API cache headers | Static asset cache headers and private no-store API defaults |
| 6 | General rate limiter | Global request throttling |
| 7 | CORS | Allows `PUBLIC_APP_URL` with credentials |
| 8 | Route-specific middleware | Auth limiter, JWT validation, role checks, booking limiter, selected shared catalogue cache |
| 9 | Error handler | Final JSON error response |

## BookMyShow v2 City, Screen, Seat, and ShowSeat Architecture

Phase 1 introduces City as the first incremental service/repository-backed domain while preserving the existing controller-driven architecture for established modules. Phase 1.1 enriches City with optional `cityCode`, `tier`, and GeoJSON `location` metadata. Phase 2 introduces Screen as the physical auditorium under Theatre. Phase 3 introduces persistent physical Seat configuration under Screen. Phase 4A introduces per-Show ShowSeat inventory snapshots initialized from physical Seats. Phase 4B connects customer booking to ShowSeat availability and adds per-show seat-type pricing display backed by server-side pricing authority. It does not introduce temporary locking, lock expiry, TTL cleanup, or Phase 5 hold behavior.

```mermaid
flowchart LR
    Admin["Admin UI"] --> CityRedux["citySlice + citySaga"]
    TheatreForm["Theatre Form"] --> CityRedux
    CityRedux --> CityAPI["Client CityAPI"]
    CityAPI --> CityRoutes["/bms/v1/cities"]
    CityRoutes --> CityController["CityController"]
    CityController --> CityService["cityService"]
    CityService --> CityRepository["cityRepository"]
    CityRepository --> CityModel["City model"]
    CityModel --> MongoDB[("MongoDB")]
    TheatreController["TheatreController"] --> CityService
    TheatreUI["Theatre Table"] --> ScreenModal["Screen Management"]
    ScreenModal --> ScreenRedux["screenSlice + screenSaga"]
    ShowForm["Show Form"] --> ScreenRedux
    ScreenRedux --> ScreenAPI["Client ScreenAPI"]
    ScreenAPI --> ScreenRoutes["/bms/v1/screens + /bms/v1/theatres/:id/screens"]
    ScreenRoutes --> ScreenController["ScreenController"]
    ScreenController --> ScreenService["screenService"]
    ScreenService --> ScreenRepository["screenRepository"]
    ScreenRepository --> ScreenModel["Screen model"]
    ScreenModel --> MongoDB
    ScreenModal --> SeatModal["Seat Management"]
    SeatModal --> SeatRedux["seatSlice + seatSaga"]
    SeatRedux --> SeatAPI["Client SeatAPI"]
    SeatAPI --> SeatRoutes["/bms/v1/seats + /bms/v1/screens/:id/seats"]
    SeatRoutes --> SeatController["SeatController"]
    SeatController --> SeatService["seatService"]
    SeatService --> SeatRepository["seatRepository"]
    SeatRepository --> SeatModel["Seat model"]
    SeatModel --> MongoDB
    ShowController["ShowController"] --> ScreenService
    ShowController --> ShowSeatService["showSeatService"]
    ShowSeatService --> ShowSeatRepository["showSeatRepository"]
    ShowSeatRepository --> ShowSeatModel["ShowSeat model"]
    ShowSeatModel --> MongoDB
```

Current target relationships:

```text
City -> Theatre -> Screen -> Seat
Movie -> Show -> Screen
Show -> ShowSeat -> Seat
Show -> ticketPricing
Show -> Booking
Booking -> seats String[]
Booking -> ticketAmount + seatPricing[]
```

Every Theatre conceptually has at least one Screen. A single-screen Theatre is represented as `Theatre -> Screen 1`, while multiplexes create multiple Screen records. Each Screen has its own Seat layout; Seat labels are unique within a Screen, not globally. `Show.theatre` remains required for booking compatibility and `Show.screen` remains optional for legacy Shows.

Seat Management supports individual Seat create/edit, logical disable/re-enable, manual bulk rows for irregular layouts, and sequential rows for large regular auditoriums. Sequential rows use spreadsheet-style continuation after `Z` (`AA`, `AB`, `AZ`, `BA`) and submit generated row definitions through the same bulk Seat API used by manual mode.

`Screen.capacity` is the physical capacity source of truth. Active Seat count cannot exceed capacity, and Screen capacity cannot be reduced below the active Seat count. A layout is `INCOMPLETE` when active Seat count is below capacity and `COMPLETE` when it equals capacity.

ShowSeat inventory is a per-Show snapshot of the active physical Seat layout. Each ShowSeat stores `show`, `seat`, `seatNumber`, `row`, `column`, `seatType`, `status`, optional `bookedAt`, optional `booking`, and timestamps. The current statuses are `AVAILABLE` and `BOOKED`; there is no `LOCKED` status, lock owner, lock expiry, or TTL index yet.

Historical Phase 4A migration initialized 382 Shows into 243,728 ShowSeat documents, including 13 `BOOKED` ShowSeats mapped from legacy booked labels. The final audit state is 382 `ALREADY_INITIALIZED`, 0 `READY`, and 0 errors or warnings.

For new screen-aware Shows, `ShowController` requires a complete physical Seat layout before persistence. `Show` and `ShowSeat` creation run in a single MongoDB transaction, `Show.totalSeats` remains a compatibility snapshot derived from `Screen.capacity`, and all new ShowSeats start as `AVAILABLE`. Screen-aware Show creation requires transaction-capable MongoDB. Legacy no-screen Show creation remains temporarily compatible and does not create ShowSeats.

ShowSeat is a snapshot, so changing `Show.screen` after ShowSeat inventory exists is rejected. The backend does not automatically delete/recreate or re-sync ShowSeats during Show updates. Hard-deleting an initialized Show removes its ShowSeats in the same transaction.

Customer booking is driven by ShowSeat inventory for initialized screen-aware Shows. `GET /bms/v1/shows/:showId/seats` returns customer-safe fields only: `showSeatId`, `seatId`, `seatNumber`, `row`, `column`, `seatType`, and `status`. The frontend still submits selected seat labels such as `["A1", "B11"]`; it does not submit ShowSeat ids or authoritative prices.

Show remains the pricing owner. Required `Show.ticketPrice` is the default price and optional `Show.ticketPricing.STANDARD`, `PREMIUM`, and `RECLINER` override physical seat types. ShowSeat snapshots `seatType` but does not store price. `Booking.ticketAmount` and `Booking.seatPricing[]` preserve the purchased-seat price snapshot for history, PDF tickets, and email confirmation. Revenue aggregation continues using `Booking.amount`.

The backend recalculates pricing during both Razorpay order creation and final booking confirmation. For initialized Shows, selected labels resolve to ShowSeat seat types, then to `Show.ticketPricing` or `Show.ticketPrice` fallback. `feePerTicket` remains a bounded compatibility input for convenience-fee calculation, and GST remains 18% on that fee component. Client-submitted pricing is display-only.

The scheduler remains compatible because it submits the existing `ticketPrice` field for screen-aware Shows. It does not explicitly configure seat-type pricing yet, so scheduled Shows without `ticketPricing` resolve every seat type to the base ticket price.

Phase 5 locking is not started. There is no `LOCKED` ShowSeat status, lock owner, lock expiry, TTL index, Razorpay checkout hold, or real-time lock refresh. The final booking transaction prevents double booking, but two customers can still see the same `AVAILABLE` seat before one booking succeeds.

## Route Groups

| Base path | Router | Protection |
| --- | --- | --- |
| `/bms/v1/auth` | `authRoute.js` | Public with auth rate limiter |
| `/bms/v1/users` | `userRoute.js` | JWT; admin role for user list |
| `/bms/v1/movies` | `movieRoute.js` | JWT; admin role for mutations |
| `/bms/v1/theatres` | `theatreRoute.js` | JWT; admin/partner role and partner ownership checks |
| `/bms/v1/screens` | `screenRoute.js` | JWT; admin/partner role and Theatre-derived ownership checks |
| `/bms/v1/seats` | `seatRoute.js` | JWT; admin/partner role and Screen -> Theatre ownership checks |
| `/bms/v1/shows` | `showRoute.js` | JWT; admin/partner role for management and partner ownership checks |
| `/bms/v1/bookings` | `bookingRoute.js` | JWT plus booking rate limiter; admin/partner roles and ownership checks on privileged booking views |

## Data Relationships

```mermaid
erDiagram

    USERS ||--o{ THEATRES : owns
    USERS ||--o{ BOOKINGS : creates
    USERS ||--o{ VERIFICATIONS : receives

    MOVIES ||--o{ SHOWS : scheduled
    THEATRES ||--o{ SHOWS : hosts
    THEATRES ||--o{ SCREENS : contains
    SCREENS ||--o{ SHOWS : scheduled_in
    SCREENS ||--o{ SEATS : contains

    SEATS ||--o{ SHOWSEATS : snapshotted_as
    SHOWS ||--o{ SHOWSEATS : initializes
    SHOWS ||--o{ BOOKINGS : booked_for
```

## Deployment Architecture

```mermaid
flowchart TB

    %% ==========================================
    %% Users
    %% ==========================================

    User["Users"]

    %% ==========================================
    %% Frontend
    %% ==========================================

    subgraph FRONTEND["Frontend"]
        Netlify["Netlify<br/>React + Vite"]
    end

    %% ==========================================
    %% Backend
    %% ==========================================

    subgraph BACKEND["Backend"]
        Render["Render<br/>Node.js + Express API"]
    end

    %% ==========================================
    %% Data Layer
    %% ==========================================

    subgraph DATA["Data Layer"]
        Atlas[("MongoDB Atlas")]
    end

    %% ==========================================
    %% External Integrations
    %% ==========================================

    subgraph INTEGRATIONS["External Services"]

        Razorpay["Razorpay<br/>Payments"]

        Brevo["Brevo<br/>Email Service"]
    end

    %% ==========================================
    %% Request Flow
    %% ==========================================

    User --> Netlify

    Netlify --> Render

    Render --> Atlas

    Render --> Razorpay

    Render --> Brevo
```

Required production alignment:

| Setting | Requirement |
| --- | --- |
| `PUBLIC_APP_URL` | Must match frontend origin for CORS and password reset links |
| `VITE_API_URL` | Use `/api` in production when Netlify proxies to the Render backend; use the local backend `/bms/v1` URL during development |
| HTTPS | Required for production secure cookies |
| Razorpay keys | Client public key and server secret must belong to same environment |
| Brevo sender | `BREVO_EMAIL_FROM` must be verified/configured |
