# BookMyShow - Full Stack Movie Booking Application

A comprehensive full-stack movie booking platform built with React, Node.js/Express, and MongoDB. This application enables users to browse movies, select theatres, book seats, and complete payments with email confirmations and ticket generation.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technical Documentation](#technical-documentation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Development Workflow](#development-workflow)
- [API Overview](#api-overview)
- [Key Features](#key-features)
- [Getting Started](#getting-started)

---
<a name="project-overview"></a>
## 🎯 Project Overview

BookMyShow is a production-ready movie booking platform that connects users with theatres and enables seamless ticket booking. The application features:

- **User Management**: Registration, authentication, email verification, 2FA, password reset
- **Movie Catalog**: Browse movies with detailed information and ratings
- **Theatre Management**: Partner dashboard for theatre and show management
- **Seat Selection**: Interactive seat layout with real-time availability
- **Payment Integration**: Razorpay payment gateway integration
- **Email Notifications**: Transactional emails for confirmations and tickets
- **Admin Dashboard**: Movie and theatre management
- **User Profile**: Booking history, security settings, preferences

---
<a name="architecture"></a>
## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB

    %% =========================
    %% Frontend Layer
    %% =========================

    subgraph Frontend["Frontend Layer (Netlify)"]

        React["React + Vite"]
        Redux["Redux Toolkit + Redux-Saga"]
        AntD["Ant Design UI"]
        Axios["Axios HTTP Client"]

    end

    %% =========================
    %% Backend Layer
    %% =========================

    subgraph Backend["Backend Layer (Render)"]

        Express["Express.js API Server"]

        Auth["Authentication & Authorization"]

        Controllers["Controllers Layer"]

        Models["Mongoose Models"]

        Utils["Email + Payment Services"]

    end

    %% =========================
    %% External Services
    %% =========================

    subgraph External["External Services"]

        MongoDB["MongoDB Atlas"]

        Razorpay["Razorpay Payment Gateway"]

        EmailService["Brevo Transactional Email"]

    end

    %% =========================
    %% Frontend Flow
    %% =========================

    React -->|UI Rendering| AntD

    React -->|Dispatch Actions| Redux

    Redux -->|Async API Calls| Axios

    Axios -->|REST API| Express

    %% =========================
    %% Backend Flow
    %% =========================

    Express -->|Security Middleware| Auth

    Auth -->|Business Logic| Controllers

    Controllers -->|Database Operations| Models

    Models -->|Read / Write| MongoDB

    Controllers -->|Payment Processing| Razorpay

    Controllers -->|Email Notifications| EmailService

    %% =========================
    %% Professional Styling
    %% =========================

    classDef frontend fill:#1e293b,color:#ffffff,stroke:#334155,stroke-width:1px;
    classDef backend fill:#312e81,color:#ffffff,stroke:#4338ca,stroke-width:1px;
    classDef external fill:#14532d,color:#ffffff,stroke:#166534,stroke-width:1px;

    class React,Redux,AntD,Axios frontend;
    class Express,Auth,Controllers,Models,Utils backend;
    class MongoDB,Razorpay,EmailService external;
```

### Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber

    actor User

    participant Client as React Client
    participant API as Express API
    participant DB as MongoDB Atlas
    participant Razorpay as Razorpay Gateway
    participant Email as Brevo Email Service

    %% --------------------------------------------------
    %% Movie Discovery
    %% --------------------------------------------------

    Note over User,DB: Movie Discovery Flow

    User->>Client: Browse Movies
    activate Client

    Client->>API: GET /movies
    activate API

    API->>DB: Fetch available movies
    activate DB

    DB-->>API: Movie data
    deactivate DB

    API-->>Client: Movie response
    deactivate API

    Client-->>User: Render movie catalog
    deactivate Client

    %% --------------------------------------------------
    %% Booking Creation
    %% --------------------------------------------------

    Note over User,DB: Seat Selection & Booking

    User->>Client: Select show & seats
    activate Client

    Client->>API: POST /bookings/create
    activate API

    API->>DB: Create pending booking
    activate DB

    DB-->>API: Booking ID
    deactivate DB

    API-->>Client: Booking summary
    deactivate API

    Client-->>User: Display booking summary
    deactivate Client

    %% --------------------------------------------------
    %% Payment Flow
    %% --------------------------------------------------

    Note over User,Razorpay: Payment Processing

    User->>Client: Proceed to Payment
    activate Client

    Client->>Razorpay: Initialize Checkout
    activate Razorpay

    Razorpay-->>Client: Checkout Loaded

    User->>Razorpay: Complete Payment

    Razorpay-->>API: Payment Webhook
    deactivate Razorpay

    %% --------------------------------------------------
    %% Booking Confirmation
    %% --------------------------------------------------

    Note over API,Email: Booking Confirmation

    activate API

    API->>DB: Update booking status
    activate DB

    DB-->>API: Booking confirmed
    deactivate DB

    API->>Email: Send e-ticket
    activate Email

    Email-->>User: Ticket Confirmation
    deactivate Email

    API-->>Client: Booking Success
    deactivate API

    Client-->>User: Show Confirmation Screen
```


### Component Architecture
```mermaid
flowchart LR

    %% ==================================================
    %% Application Entry
    %% ==================================================

    App["App"]

    %% ==================================================
    %% Authentication
    %% ==================================================

    subgraph AUTH["Authentication"]
        AuthTabs["Auth"]
        Login["Login"]
        Register["Register"]
        Verify["Email Verification"]
        Forgot["Forgot Password"]
        TwoFA["2FA"]
    end

    %% ==================================================
    %% Movie Booking
    %% ==================================================

    subgraph BOOKING["Movie Booking"]
        Home["Home"]
        Details["Movie Details"]
        ShowTime["Show Time"]
        Seats["Seat Selection"]
        Checkout["Checkout"]
        Orders["Bookings"]
    end

    %% ==================================================
    %% User Profile
    %% ==================================================

    subgraph PROFILE["Profile"]
        Profile["Profile"]
        Personal["Personal Info"]
        Security["Security"]
        Email["Email Settings"]
        Password["Password Settings"]
    end

    %% ==================================================
    %% Admin
    %% ==================================================

    subgraph ADMIN["Admin"]
        AdminDashboard["Dashboard"]
        MovieForm["Movie Form"]
        MovieList["Movie List"]
        TheatreList["Theatre List"]
    end

    %% ==================================================
    %% Theatre Partner
    %% ==================================================

    subgraph PARTNER["Theatre Partner"]
        PartnerDashboard["Dashboard"]
        TheatreForm["Theatre Form"]
        MovieShows["Movie Shows"]
    end

    %% ==================================================
    %% Navigation
    %% ==================================================

    App --> AuthTabs
    App --> Home
    App --> Profile
    App --> AdminDashboard
    App --> PartnerDashboard

    %% Authentication Flow

    AuthTabs --> Login
    AuthTabs --> Register
    Register --> Verify
    Login --> TwoFA
    Forgot --> Verify

    %% Booking Flow

    Home --> Details
    Details --> ShowTime
    ShowTime --> Seats
    Seats --> Checkout
    Checkout --> Orders

    %% Profile Flow

    Profile --> Personal
    Profile --> Security
    Security --> Email
    Security --> Password

    %% Styling (Theme Friendly)

    classDef root stroke-width:3px
    classDef auth stroke-width:2px
    classDef booking stroke-width:2px
    classDef profile stroke-width:2px
    classDef admin stroke-width:2px
    classDef partner stroke-width:2px

    class App root

    class AuthTabs,Login,Register,Verify,Forgot,TwoFA auth
    class Home,Details,ShowTime,Seats,Checkout,Orders booking
    class Profile,Personal,Security,Email,Password profile
    class AdminDashboard,MovieForm,MovieList,TheatreList admin
    class PartnerDashboard,TheatreForm,MovieShows partner
```

---
<a name="technical-documentation"></a>
## 📚 Technical Documentation

The production onboarding documentation generated from the current codebase is available in:

| Document | Purpose |
|---------|---------|
| [Project Documentation](docs/PROJECT_DOCUMENTATION.md) | Complete technical project report covering architecture, frontend, backend, auth, Redux, payment, security, deployment, and setup |
| [API Reference](docs/API_REFERENCE.md) | Backend endpoint reference with request bodies and route behavior |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Mongoose model fields, relationships, and deletion behavior |
| [Architecture](docs/ARCHITECTURE.md) | Concise system architecture, flows, middleware, and deployment diagrams |

---
<a name="tech-stack"></a>
## 🛠️ Tech Stack

### Frontend (Client)
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI Framework |
| **Vite** | Build Tool & Dev Server |
| **Redux Toolkit** | State Management |
| **Redux-Saga** | Side Effects Management |
| **Ant Design** | UI Component Library |
| **Axios** | HTTP Client |
| **Tailwind CSS** | Styling |
| **React Router** | Client-side Routing |

### Backend (Server)
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime Environment |
| **Express.js** | Web Framework |
| **MongoDB** | NoSQL Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication |
| **Bcrypt** | Password Hashing |
| **Razorpay** | Payment Gateway |
| **Brevo** | Transactional Email Service |
| **PDFKit** | PDF Generation |

---
<a name="project-structure"></a>
## 📁 Project Structure

### Client Structure

```
Client/
├── src/
│   ├── api/                    # API integration layer
│   │   ├── index.js           # Axios instance configuration
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── movie.js           # Movie endpoints
│   │   ├── show.js            # Show endpoints
│   │   ├── theatre.js         # Theatre endpoints
│   │   ├── booking.js         # Booking endpoints
│   │   └── user.js            # User endpoints
│   │
│   ├── assets/                # Static assets
│   │   ├── cinema-background.png
│   │   ├── bookmyshow_light.svg
│   │   └── arm_chair.svg
│   │
│   ├── components/            # Reusable components
│   │   ├── MainLayout.jsx     # Main layout wrapper
│   │   ├── SeatLayout.jsx     # Seat selection component
│   │   └── SeatRecommendation.jsx
│   │
│   ├── features/              # Feature modules
│   │   ├── auth/              # Authentication pages
│   │   │   ├── AuthTabs.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── EmailVerification.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── TwoFactorAuthentication.jsx
│   │   │   └── ReverifyAccount.jsx
│   │   │
│   │   ├── home/              # Home page
│   │   │   └── Home.jsx
│   │   │
│   │   ├── movies/            # Movie booking flow
│   │   │   ├── MovieDetails.jsx
│   │   │   ├── ShowTime.jsx
│   │   │   ├── SeatSelection.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Bookings.jsx
│   │   │   ├── MovieSynopsis.jsx
│   │   │   └── NoBookings.jsx
│   │   │
│   │   ├── profile/           # User profile management
│   │   │   ├── Profile.jsx
│   │   │   ├── ProfileTabs.jsx
│   │   │   ├── Personal_InfoTab.jsx
│   │   │   ├── SecurityTab.jsx
│   │   │   ├── EmailTab.jsx
│   │   │   ├── PasswordTab.jsx
│   │   │   ├── ReminderSettingsTab.jsx
│   │   │   ├── DangerZoneTab.jsx
│   │   │   ├── EmailChangeModal.jsx
│   │   │   └── ReauthenticationModal.jsx
│   │   │
│   │   ├── admin/             # Admin dashboard
│   │   │   ├── Admin.jsx
│   │   │   ├── MovieForm.jsx
│   │   │   ├── MovieList.jsx
│   │   │   ├── DeleteMovie.jsx
│   │   │   └── TheatreList.jsx
│   │   │
│   │   └── partner/           # Theatre partner dashboard
│   │       ├── Partner.jsx
│   │       ├── TheatreForm.jsx
│   │       ├── TheatreList.jsx
│   │       ├── DeleteTheatre.jsx
│   │       └── MovieShows.jsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js         # Authentication hook
│   │   ├── useBooking.js      # Booking operations
│   │   ├── useProfile.js      # Profile management
│   │   ├── useUI.js           # UI state management
│   │   └── useVerification.js # Email verification
│   │
│   ├── redux/                 # Redux state management
│   │   ├── store.js           # Redux store configuration
│   │   ├── actions/           # Action creators
│   │   │   ├── authActions.js
│   │   │   ├── movieActions.js
│   │   │   ├── showActions.js
│   │   │   ├── theatreActions.js
│   │   │   └── userActions.js
│   │   ├── slices/            # Redux Toolkit slices
│   │   │   ├── authSlice.js
│   │   │   ├── movieSlice.js
│   │   │   ├── showSlice.js
│   │   │   ├── theatreSlice.js
│   │   │   ├── bookingSlice.js
│   │   │   ├── userSlice.js
│   │   │   ├── profileSlice.js
│   │   │   ├── loaderSlice.js
│   │   │   ├── uiSlice.js
│   │   │   ├── verificationSlice.js
│   │   │   └── forgotPasswordSlice.js
│   │   ├── reducers/          # Root reducer
│   │   │   └── rootReducer.js
│   │   └── sagas/             # Redux-Saga side effects
│   │       ├── index.js
│   │       ├── authSaga.js
│   │       ├── movieSaga.js
│   │       ├── showSaga.js
│   │       ├── theatreSaga.js
│   │       ├── bookingSaga.js
│   │       ├── profileSaga.js
│   │       ├── verificationSaga.js
│   │       └── forgotPasswordSaga.js
│   │
│   ├── utils/                 # Utility functions
│   │   ├── notificationUtils.js
│   │   ├── reminderUtils.js
│   │   └── format-duration.js
│   │
│   ├── App.jsx                # Root component
│   ├── App.css                # Global styles
│   ├── index.css              # Base styles
│   └── main.jsx               # Entry point
│
├── public/                    # Static files
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind CSS config
└── DOCUMENTATION.md           # Client documentation
```

### Server Structure

```
Server/
├── config/
│   └── db.js                  # MongoDB connection
│
├── controllers/               # Business logic
│   ├── AuthController.js      # Authentication logic
│   ├── UserController.js      # User management
│   ├── MovieController.js     # Movie operations
│   ├── TheatreController.js   # Theatre operations
│   ├── ShowController.js      # Show management
│   └── BookingController.js   # Booking operations
│
├── models/                    # MongoDB schemas
│   ├── userSchema.js          # User model
│   ├── movieSchema.js         # Movie model
│   ├── theatreSchema.js       # Theatre model
│   ├── showSchema.js          # Show model
│   ├── bookingSchema.js       # Booking model
│   └── verificationSchema.js  # Email verification
│
├── routes/                    # API routes
│   ├── authRoute.js           # Auth endpoints
│   ├── userRoute.js           # User endpoints
│   ├── movieRoute.js          # Movie endpoints
│   ├── theatreRoute.js        # Theatre endpoints
│   ├── showRoute.js           # Show endpoints
│   └── bookingRoute.js        # Booking endpoints
│
├── middlewares/               # Express middlewares
│   ├── authorization.js       # JWT verification
│   ├── errorHandler.js        # Error handling
│   └── cache.js               # Response caching
│
├── utils/                     # Utility functions
│   ├── email.js               # Email service
│   ├── idGenerator.js         # ID generation
│   ├── ticket-pdf.js          # PDF generation
│   └── email_templates/       # Email templates
│       ├── email-verification.html
│       ├── password-reset.html
│       ├── movie-ticket.html
│       ├── email-change.html
│       ├── password-changed.html
│       ├── email-changed.html
│       ├── account-deleted.html
│       ├── reverification.html
│       └── two-factor-auth.html
│
├── server.js                  # Express app setup
├── package.json               # Dependencies
├── .env.example               # Environment template
└── DOCUMENTATION.md           # Server documentation
```

---
<a name="environment-variables"></a>
## 🔐 Environment Variables

### Client Environment Variables

Create a `.env` file in the `Client/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/bms/v1
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**For Netlify Deployment:**
```env
VITE_API_URL=https://your-render-backend.onrender.com/bms/v1
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Server Environment Variables

Create a `.env` file in the `Server/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
PUBLIC_APP_URL=http://localhost:5173

# Database
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/bookmyshow

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_EMAIL_FROM=noreply@bookmyshow.com

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**For Render Deployment:**
```env
PUBLIC_APP_URL=https://your-netlify-frontend.netlify.app
NODE_ENV=production
```

---
<a name="deployment"></a>
## 🚀 Deployment

### Frontend Deployment (Netlify)

#### Prerequisites
- Netlify account
- GitHub repository connected

#### Steps

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `Client`

3. **Set Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add `VITE_API_URL` pointing to your Render backend `/bms/v1` base path
   - Add `VITE_RAZORPAY_KEY_ID` for Razorpay Checkout

4. **Deploy**
   - Push to main branch
   - Netlify automatically builds and deploys

#### Netlify Configuration File (`Client/netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"
  base = "Client"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### Backend Deployment (Render)

#### Prerequisites
- Render account
- GitHub repository connected
- MongoDB Atlas cluster

#### Steps

1. **Create New Web Service**
   - Go to [Render](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: bookmyshow-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free or Paid (recommended for production)

3. **Set Environment Variables**
   - Go to Environment
   - Add the server variables listed above
   - Ensure `PUBLIC_APP_URL` matches your Netlify domain

4. **Database Connection**
   - Use MongoDB Atlas connection string
   - Whitelist Render IP in MongoDB Atlas

5. **Deploy**
   - Push to main branch
   - Render automatically builds and deploys

#### Render Configuration File (`Server/render.yaml`)

```yaml
services:
  - type: web
    name: bookmyshow-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
    # Add a health endpoint before enabling this in Render.
    # healthCheckPath: /bms/v1/health
```

---
<a name="development-workflow"></a>
## 💻 Development Workflow

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/bookmyshow.git
cd bookmyshow
```

#### 2. Setup Backend
```bash
cd Server
npm install
# Create .env with the server variables listed above
npm run dev
```

#### 3. Setup Frontend
```bash
cd ../Client
npm install
# Create .env with VITE_API_URL and VITE_RAZORPAY_KEY_ID
npm run dev
```

#### 4. Access Application
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### Development Commands

#### Client
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Server
```bash
npm run dev          # Start with nodemon
npm start            # Start production server
npm run seed         # Seed database (if available)
```

---
<a name="api-overview"></a>
## 📡 API Overview

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/verify-email` | Verify email address |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/forgot-password` | Initiate password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/logout` | User logout |
| POST | `/auth/refresh-token` | Refresh JWT token |

### Movie Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/movies` | Get all movies |
| GET | `/movies/:id` | Get movie details |
| POST | `/movies` | Create movie (Admin) |
| PUT | `/movies/:id` | Update movie (Admin) |
| DELETE | `/movies/:id` | Delete movie (Admin) |

### Theatre Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/theatres` | Get all theatres |
| GET | `/theatres/:id` | Get theatre details |
| POST | `/theatres` | Create theatre (Partner) |
| PUT | `/theatres/:id` | Update theatre (Partner) |
| DELETE | `/theatres/:id` | Delete theatre (Partner) |

### Show Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shows` | Get all shows |
| GET | `/shows/:id` | Get show details |
| POST | `/shows` | Create show (Partner) |
| PUT | `/shows/:id` | Update show (Partner) |
| DELETE | `/shows/:id` | Delete show (Partner) |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | Get user bookings |
| GET | `/bookings/:id` | Get booking details |
| POST | `/bookings` | Create booking |
| POST | `/bookings/:id/payment` | Process payment |
| DELETE | `/bookings/:id` | Cancel booking |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update profile |
| PUT | `/users/password` | Change password |
| PUT | `/users/email` | Change email |
| DELETE | `/users/account` | Delete account |

---
<a name="key-features"></a>
## ✨ Key Features

### User Features
- ✅ User registration with email verification
- ✅ Two-factor authentication (2FA)
- ✅ Password reset and recovery
- ✅ Profile management
- ✅ Booking history
- ✅ Email reminders for upcoming shows

### Movie & Theatre Features
- ✅ Browse movies with ratings and reviews
- ✅ Filter by genre, language, release date
- ✅ Theatre listings with location
- ✅ Show timings and availability
- ✅ Real-time seat availability

### Booking Features
- ✅ Interactive seat selection
- ✅ Seat recommendations
- ✅ Multiple payment options
- ✅ Booking confirmation emails
- ✅ PDF ticket generation
- ✅ Booking cancellation

### Admin Features
- ✅ Movie management (CRUD)
- ✅ Theatre management
- ✅ Show scheduling
- ✅ User management
- ✅ Analytics dashboard

### Partner Features
- ✅ Theatre registration
- ✅ Show management
- ✅ Seat configuration
- ✅ Revenue tracking
- ✅ Booking management

---
<a name="getting-started"></a>
## 🚦 Getting Started

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bookmyshow.git
   cd bookmyshow
   ```

2. **Setup Backend**
   ```bash
   cd Server
   npm install
   cp .env.example .env
   # Configure .env with your credentials
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../Client
   npm install
   npm run dev
   ```

4. **Access the application**
   - Open `http://localhost:5173` in your browser

### First Steps
- Register a new account
- Verify your email
- Browse available movies
- Select a theatre and show
- Choose seats and complete booking
- Check your email for confirmation

---
## 📚 Documentation

- [Client Documentation](./Client/DOCUMENTATION.md)
- [Server Documentation](./Server/DOCUMENTATION.md)
- [Architecture Documentation](./docs/ARCHITECTURE.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For support, email bkmyshowsup@gmail.com or open an issue on GitHub.

---


## 🧠 Author

**Shravan Kumar Atti**<br>
*Pre-sales Architect | Full-stack Developer*

GitHub: [@Shravan-509](https://github.com/Shravan-509)

---

## 📝 License

This project is open-source and available under the [MIT License](./LICENSE).
---

**Last Updated**: October 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team
