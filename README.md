# BookMyShow - Full Stack Movie Booking Application

A comprehensive full-stack movie booking platform built with React, Node.js/Express, and MongoDB. This application enables users to browse movies, select theatres, book seats, and complete payments with email confirmations and ticket generation.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
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
    %% Frontend (Netlify)
    subgraph Frontend["Frontend (Netlify)"]
        React["React + Vite"]
        Redux["Redux + Redux-Saga"]
        AntD["Ant Design UI"]
        Axios["Axios HTTP Client"]
    end
    
    %% Backend (Render)
    subgraph Backend["Backend (Render)"]
        Express["Express.js Server"]
        Auth["Authentication & Authorization"]
        Controllers["Controllers Layer"]
        Models["MongoDB Models"]
        Utils["Email & Payment Utils"]
    end
    
    %% External Services
    subgraph External["External Services"]
        MongoDB["MongoDB Atlas"]
        Razorpay["Razorpay Payment"]
        EmailService["Email Service"]
    end
    
    %% Frontend connections
    React -->|API Calls| Axios
    Axios -->|HTTP/REST| Express
    Redux -->|State Management| React
    AntD -->|UI Components| React
    
    %% Backend connections
    Express -->|Business Logic| Controllers
    Controllers -->|Data Operations| Models
    Models -->|Query/Store| MongoDB
    
    Express -->|Payment| Razorpay
    Express -->|Transactional Email| EmailService
    
    %% Professional Darker Colors for Better Readability
    style Frontend fill:#90caf9,stroke:#333,stroke-width:1px,color:#000
    style Backend fill:#ce93d8,stroke:#333,stroke-width:1px,color:#000
    style External fill:#ffe082,stroke:#333,stroke-width:1px,color:#000
```

### Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as React Client
    participant S as Express Server
    participant DB as MongoDB
    participant P as Razorpay
    participant E as Email Service
    
    %% Browsing Movies
    U->>C: Browse Movies
    C->>S: GET /movies
    S->>DB: Query Movies
    DB-->>S: Movie Data
    S-->>C: Movie List
    C-->>U: Display Movies
    
    %% Selecting Show & Seats
    U->>C: Select Show & Seats
    C->>S: POST /bookings
    S->>DB: Create Booking
    DB-->>S: Booking ID
    S-->>C: Booking Details
    C-->>U: Show Booking Summary
    
    %% Payment Flow
    U->>C: Proceed to Payment
    C->>P: Initiate Payment
    P-->>C: Payment Gateway Loaded
    U->>P: Complete Payment
    P-->>S: Payment Webhook Triggered
    
    %% Booking Confirmation
    S->>DB: Update Booking Status
    S->>E: Send Confirmation Email
    E-->>U: Ticket Email
    S-->>C: Success Response
    C-->>U: Booking Confirmation Displayed

```

### Component Architecture

```mermaid
graph TD
    %% Main App
    App["App.jsx"]

    %% Auth Module
    subgraph AuthModule["Auth Module"]
        AuthTabs["AuthTabs"]
        Login["Login"]
        Register["Register"]
        EmailVerification["EmailVerification"]
        ForgotPassword["ForgotPassword"]
        TwoFA["TwoFactorAuthentication"]
    end

    %% Movies Module
    subgraph MoviesModule["Movies Module"]
        Home["Home"]
        MovieDetails["MovieDetails"]
        ShowTime["ShowTime"]
        SeatSelection["SeatSelection"]
        Checkout["Checkout"]
        Bookings["Bookings"]
    end

    %% Profile Module
    subgraph ProfileModule["Profile Module"]
        ProfilePage["Profile"]
        PersonalInfoTab["PersonalInfoTab"]
        SecurityTab["SecurityTab"]
        EmailTab["EmailTab"]
        PasswordTab["PasswordTab"]
    end

    %% Admin Module
    subgraph AdminModule["Admin Module"]
        AdminDash["Admin Dashboard"]
        MovieForm["MovieForm"]
        MovieList["MovieList"]
        TheatreList["TheatreList"]
    end

    %% Partner Module
    subgraph PartnerModule["Partner Module"]
        PartnerDash["Partner Dashboard"]
        TheatreForm["TheatreForm"]
        MovieShows["MovieShows"]
    end

    %% App connections (entry points to each module)
    App --> AuthTabs
    App --> Home
    App --> ProfilePage
    App --> AdminDash
    App --> PartnerDash

    %% Auth Module internal flow
    AuthTabs --> Login
    AuthTabs --> Register
    Register --> EmailVerification
    Login --> TwoFA
    ForgotPassword --> EmailVerification

    %% Movies Module internal flow
    Home --> MovieDetails
    MovieDetails --> ShowTime
    ShowTime --> SeatSelection
    SeatSelection --> Checkout
    Checkout --> Bookings

    %% Profile Module internal flow
    ProfilePage --> PersonalInfoTab
    ProfilePage --> SecurityTab
```

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
| **Nodemailer/Resend** | Email Service |
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
<a name="nvironment-variables"></a>
## 🔐 Environment Variables

### Client Environment Variables

Create a `.env` file in the `Client/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/bms/v1
VITE_API_TIMEOUT=10000

# Feature Flags
VITE_ENABLE_2FA=true
VITE_ENABLE_EMAIL_VERIFICATION=true
VITE_ENABLE_PAYMENT=true

# Deployment
VITE_APP_NAME=BookMyShow
VITE_APP_VERSION=1.0.0
```

**For Netlify Deployment:**
```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/bms/v1
```

### Server Environment Variables

Create a `.env` file in the `Server/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookmyshow

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@bookmyshow.com

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Admin Credentials
ADMIN_EMAIL=admin@bookmyshow.com
ADMIN_PASSWORD=secure_password_here

# Cache Configuration
CACHE_TTL=3600

# 2FA
TWO_FACTOR_ENABLED=true
```

**For Render Deployment:**
```env
FRONTEND_URL=https://your-netlify-frontend.netlify.app
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
   - Add `VITE_API_BASE_URL` pointing to your Render backend

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
   - Add all variables from `.env.example`
   - Ensure `FRONTEND_URL` matches your Netlify domain

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
    healthCheckPath: /bms/v1/health
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
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### 3. Setup Frontend
```bash
cd ../Client
npm install
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

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For support, email bkmyshowsup@gmail.com or open an issue on GitHub.

---

## 🧠 Author

**Shravan Kumar Atti**<br>
*Pre-sales Architect | Full-stack Developer*

GitHub: [@Shravan-509](https://github.com/Shravan-509)

---

**Last Updated**: October 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team