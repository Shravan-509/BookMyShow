# Diagram Catalog

This file collects the core Mermaid diagrams reviewers expect for the project.

## System Architecture

```mermaid
flowchart TB
    User["User / Admin / Partner"] --> Client["React + Vite SPA"]
    Client --> API["Express API /bms/v1"]
    API --> MongoDB[("MongoDB Atlas")]
    API --> Razorpay["Razorpay"]
    API --> Brevo["Brevo"]
    API --> PDF["PDFKit + QRCode"]
```

## Frontend Architecture

```mermaid
flowchart LR
    App["App.jsx"] --> Routes["React Router"]
    Routes --> Pages["Feature Pages"]
    Pages --> Hooks["Custom Hooks"]
    Hooks --> Redux["Redux Toolkit Store"]
    Redux --> Sagas["Redux-Saga"]
    Sagas --> API["API Classes"]
```

## Backend Architecture

```mermaid
flowchart LR
    Request["Request"] --> Middleware["Middleware Stack"]
    Middleware --> Routes["Routes"]
    Routes --> Controllers["Controllers"]
    Controllers --> Models["Mongoose Models"]
    Models --> DB[("MongoDB")]
    Controllers --> Integrations["Razorpay / Brevo / PDFKit"]
```

## JWT Flow

```mermaid
sequenceDiagram
    Client->>Auth: Login credentials
    Auth->>Auth: Verify password and 2FA
    Auth-->>Client: HTTP-only access_token cookie
    Client->>API: Protected request with cookie
    API->>API: validateJWT
    API-->>Client: Protected response
```

## Booking and Payment Flow

```mermaid
sequenceDiagram
    Client->>Booking: validateSeats
    Booking->>MongoDB: Check bookedSeats
    Client->>Booking: createOrder
    Booking->>Razorpay: Create order
    Client->>Razorpay: Checkout
    Razorpay-->>Client: payment id + signature
    Client->>Booking: bookSeat
    Booking->>Booking: Verify signature
    Booking->>MongoDB: Atomic seat reservation + booking save
    Booking->>Brevo: Ticket email
```

## Email Verification and 2FA

```mermaid
flowchart TD
    UserAction["Register/Login"] --> CreateCode["Create verification record"]
    CreateCode --> Email["Send Brevo template"]
    Email --> Submit["User submits code"]
    Submit --> Validate["Validate code and expiry"]
    Validate --> Complete["Verify email or issue JWT"]
```

## Deployment Architecture

```mermaid
flowchart LR
    GitHub["GitHub"] --> Netlify["Netlify Client"]
    GitHub --> Render["Render API"]
    Netlify --> Render
    Render --> Atlas[("MongoDB Atlas")]
    Render --> External["Razorpay + Brevo"]
```

