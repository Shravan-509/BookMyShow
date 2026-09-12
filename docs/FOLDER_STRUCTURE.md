# Folder Structure

```text
BookMyShow/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── workflows/
│   │   └── ci.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
│
├── Client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── seat.js
│   │   │   └── showSeat.js
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── SeatLayout.test.jsx
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   │   └── pages/
│   │   │   │       ├── CityManagement.jsx
│   │   │   │       ├── CityManagement.test.jsx
│   │   │   │       └── UserManagement.test.jsx
│   │   │   ├── auth/
│   │   │   │   └── pages/
│   │   │   │       ├── Login.test.jsx
│   │   │   │       └── ForgotPassword.test.jsx
│   │   │   ├── home/
│   │   │   ├── movies/
│   │   │   │   └── pages/
│   │   │   │       ├── Checkout.test.jsx
│   │   │   │       └── Bookings.test.jsx
│   │   │   ├── partner/
│   │   │   │   └── pages/
│   │   │   │       ├── MovieShows.test.jsx
│   │   │   │       ├── ScreenManagement.jsx
│   │   │   │       ├── ScreenManagement.test.jsx
│   │   │   │       ├── SeatManagement.jsx
│   │   │   │       ├── SeatManagement.test.jsx
│   │   │   │       ├── seatManagementUtils.js
│   │   │   │       ├── TheatreForm.test.jsx
│   │   │   │       └── TheatreBooking.test.jsx
│   │   │   └── profile/
│   │   │       └── pages/
│   │   │           ├── Personal_InfoTab.test.jsx
│   │   │           ├── EmailChangeModal.test.jsx
│   │   │           └── ReminderSettingsTab.test.jsx
│   │   ├── hooks/
│   │   ├── redux/
│   │   │   ├── sagas/
│   │   │   │   ├── seatSaga.js
│   │   │   │   └── showSeatSaga.js
│   │   │   ├── slices/
│   │   │   │   ├── bookingSlice.test.js
│   │   │   │   ├── seatSlice.js
│   │   │   │   └── showSeatSlice.js
│   │   │   └── store.js
│   │   ├── test/
│   │   │   ├── setup.js
│   │   │   └── renderWithProviders.jsx
│   │   ├── utils/
│   │   │   ├── screenDisplay.js
│   │   │   └── ticketPricing.js
│   │   ├── App.jsx
│   │   ├── App.test.jsx
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── package.json
│   └── vite.config.js
│
├── Server/
│   ├── config/
│   ├── controllers/
│   │   ├── SeatController.js
│   │   └── ShowSeatController.js
│   ├── middlewares/
│   ├── models/
│   │   ├── seatSchema.js
│   │   └── showSeatSchema.js
│   ├── repositories/
│   │   ├── seatRepository.js
│   │   └── showSeatRepository.js
│   ├── routes/
│   │   └── seatRoute.js
│   ├── scripts/
│   │   ├── backfillTheatreCities.js
│   │   ├── backfillShowScreens.js
│   │   ├── backfillShowSeats.js
│   │   └── importCities.js
│   ├── services/
│   │   ├── seatService.js
│   │   ├── showPricingService.js
│   │   └── showSeatService.js
│   ├── tests/
│   │   ├── helpers/
│   │   │   └── mockExpress.js
│   │   ├── integration/
│   │   │   ├── authAuthorization.test.js
│   │   │   ├── cacheSecurity.test.js
│   │   │   ├── cityRoute.test.js
│   │   │   ├── screenRoute.test.js
│   │   │   ├── seatRoute.test.js
│   │   │   ├── showSeatRoute.test.js
│   │   │   └── errorHandling.test.js
│   │   └── unit/
│   │       ├── backfillTheatreCities.test.js
│   │       ├── backfillShowScreens.test.js
│   │       ├── backfillShowSeats.test.js
│   │       ├── bookingController.test.js
│   │       ├── citySchema.test.js
│   │       ├── cityService.test.js
│   │       ├── importCities.test.js
│   │       ├── screenSchema.test.js
│   │       ├── screenService.test.js
│   │       ├── seatSchema.test.js
│   │       ├── seatService.test.js
│   │       ├── showScreen.test.js
│   │       ├── showPricingService.test.js
│   │       ├── showSeatRepository.test.js
│   │       ├── showSeatSchema.test.js
│   │       ├── showSeatService.test.js
│   │       ├── theatreCity.test.js
│   │       └── utils.test.js
│   ├── utils/
│   ├── jest.config.js
│   ├── package.json
│   └── server.js
│
├── docs/
│   ├── screenshots/
│   ├── API_REFERENCE.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEPLOYMENT.md
│   ├── DIAGRAMS.md
│   ├── ERROR_HANDLING.md
│   ├── FOLDER_STRUCTURE.md
│   ├── PERFORMANCE.md
│   ├── PROJECT_DOCUMENTATION.md
│   ├── SCREENSHOTS.md
│   ├── SECURITY.md
│   └── STATE_MANAGEMENT.md
│
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── SECURITY.md
```

## Organization Rationale

- `Client/src/features` groups UI by product domain.
- `Client/src/api` isolates HTTP contracts from components.
- `Client/src/redux` centralizes global state, reducers, slices, and sagas.
- `Client/src/test` contains shared Vitest/React Testing Library setup and rendering helpers.
- `Server/routes` maps HTTP endpoints to controller methods.
- `Server/controllers` owns validation, business workflows, payment verification, and email/PDF side effects.
- `Server/services` and `Server/repositories` contain the incremental City, Screen, and Seat domain service/repository foundation.
- `Server/models` keeps Mongoose schemas independent from controllers.
- `Server/tests` separates backend unit, integration, and reusable test-helper code.
- `docs` contains centralized technical documentation for reviewers and maintainers.

## Testing Structure

The project maintains separate automated testing infrastructure for the
frontend and backend.

### Frontend Testing

Frontend tests are implemented using **Vitest**, **React Testing Library**,
**jsdom**, and **Testing Library User Event**. Test files are colocated with
the components, pages, and Redux modules they validate, while shared test
configuration and rendering helpers are maintained under `Client/src/test/`.

The frontend test suite covers key areas including authentication, customer seat
selection, physical Seat management, checkout and payment flow, booking history,
profile management, administrative functionality, partner functionality, and
Redux state transitions.

### Backend Testing

Backend tests are implemented using **Jest** and **SuperTest** and are
organized under `Server/tests/`.

- `unit/` contains focused tests for domain services, schemas, booking controller logic, and utilities.
- `integration/` contains tests for authentication and authorization,
  centralized error handling, and cache/security behavior.
- `helpers/` contains reusable test utilities and Express mocks.

Mongoose models and external integrations such as Razorpay, Brevo email delivery, and PDF ticket generation are mocked where appropriate, allowing the automated test suite to run without connecting to production databases, payment services, or external credentials.

### Continuous Integration

GitHub Actions runs the frontend lint, test, and production build checks together
with the backend Jest test suite on pushes and pull requests. This provides
automatic validation of the project's primary quality checks before changes
are merged.
