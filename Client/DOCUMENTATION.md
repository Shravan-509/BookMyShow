# BookMyShow - Client (Frontend) Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Setup & Installation](#setup--installation)
3. [Project Structure](#project-structure)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [Component Architecture](#component-architecture)
7. [Routing & Navigation](#routing--navigation)
8. [Custom Hooks](#custom-hooks)
9. [Development Workflow](#development-workflow)
10. [Performance Optimization](#performance-optimization)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Acknowledgments](#acknowledgements)

---
## Project Overview

The BookMyShow client is a modern React application built with Vite, featuring a comprehensive movie ticket booking interface. It uses Redux for state management, Redux Saga for side effects, and Ant Design for UI components.

### Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build tool & dev server |
| Redux Toolkit | 1.9.x | State management |
| Redux-Saga | 1.2.x | Side effects management |
| Ant Design | 5.x | UI component library |
| Axios | 1.x | HTTP client |
| React Router | 6.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first CSS |

### Key Features

- **User Authentication**: Registration, login, email verification, 2FA, password reset
- **Movie Discovery**: Browse, search, and filter movies
- **Booking System**: Interactive seat selection and booking management
- **Payment Integration**: Secure payment processing with Razorpay
- **User Dashboard**: Profile management, booking history, preferences
- **Admin Panel**: Movie and theatre management
- **Partner Dashboard**: Theatre and show management

---

## Setup & Installation

### Prerequisites

- Node.js 16+ and npm
- Git
- Code editor (VS Code recommended)

### Installation Steps

```bash
# Clone repository
git clone https://github.com/yourusername/bookmyshow.git
cd bookmyshow/Client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# VITE_API_URL=/bms/v1
# VITE_BASE_API_URL=http://localhost:3000
```

### Running the Application

**Development Mode:**
```bash
npm run dev
```
Starts Vite dev server at `http://localhost:5173`

**Build for Production:**
```bash
npm run build
```
Creates optimized production build in `dist/` folder

**Preview Production Build:**
```bash
npm run preview
```
Preview production build locally

**Linting:**
```bash
npm run lint
```
Run ESLint to check code quality

---

## Project Structure

### Directory Organization

```
src/
├── api/                          # API integration layer
│   ├── index.js                 # Axios instance & base config
│   ├── auth.js                  # Authentication API calls
│   ├── movie.js                 # Movie API calls
│   ├── show.js                  # Show API calls
│   ├── theatre.js               # Theatre API calls
│   ├── booking.js               # Booking API calls
│   └── user.js                  # User API calls
│
├── assets/                       # Static assets
│   ├── cinema-background.png
│   ├── cinema-background-1.png
│   ├── cinema-background-2.png
│   ├── bookmyshow_light.svg
│   ├── bookmyshow_dark.svg
│   ├── arm_chair.svg
│   └── favicon.svg
│
├── components/                   # Reusable components
│   ├── MainLayout.jsx           # Main layout wrapper
│   ├── SeatLayout.jsx           # Seat selection component
│   └── SeatRecommendation.jsx   # Seat recommendation logic
│
├── features/                     # Feature modules (by domain)
│   ├── auth/                    # Authentication module
│   │   └── pages/
│   │       ├── AuthTabs.jsx         # Auth tab switcher
│   │       ├── Login.jsx            # Login page
│   │       ├── Register.jsx         # Registration page
│   │       ├── EmailVerification.jsx
│   │       ├── ForgotPassword.jsx
│   │       ├── ResetPassword.jsx
│   │       ├── TwoFactorAuthentication.jsx
│   │       └── ReverifyAccount.jsx
│   │
│   ├── home/                    # Home module
│   │   └── pages/
│   │       └── Home.jsx         # Home page with movie listing
│   │
│   ├── movies/                  # Movie booking module
│   │   └── pages/
│   │       ├── MovieDetails.jsx     # Movie details page
│   │       ├── MovieSynopsis.jsx    # Movie synopsis
│   │       ├── ShowTime.jsx         # Show time selection
│   │       ├── SeatSelection.jsx    # Seat selection page
│   │       ├── Checkout.jsx         # Checkout page
│   │       ├── Bookings.jsx         # User bookings
│   │       └── NoBookings.jsx       # Empty state
│   │
│   ├── profile/                 # User profile module
│   │   └── pages/
│   │       ├── Profile.jsx          # Profile main page
│   │       ├── ProfileTabs.jsx      # Tab navigation
│   │       ├── Personal_InfoTab.jsx # Personal info
│   │       ├── SecurityTab.jsx      # Security settings
│   │       ├── EmailTab.jsx         # Email management
│   │       ├── PasswordTab.jsx      # Password change
│   │       ├── ReminderSettingsTab.jsx
│   │       ├── DangerZoneTab.jsx    # Account deletion
│   │       ├── EmailChangeModal.jsx
│   │       └── ReauthenticationModal.jsx
│   │
│   ├── admin/                   # Admin dashboard module
│   │   └── pages/
│   │       ├── Admin.jsx            # Admin main page
│   │       ├── MovieForm.jsx        # Movie form
│   │       ├── MovieList.jsx        # Movie list
│   │       ├── DeleteMovie.jsx      # Delete movie
│   │       └── TheatreList.jsx      # Theatre list
│   │
│   └── partner/                 # Partner dashboard module
│       └── pages/
│           ├── Partner.jsx          # Partner main page
│           ├── TheatreForm.jsx      # Theatre form
│           ├── TheatreList.jsx      # Theatre list
│           ├── DeleteTheatre.jsx    # Delete theatre
│           └── MovieShows.jsx       # Show management
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.js               # Authentication hook
│   ├── useBooking.js            # Booking operations
│   ├── useProfile.js            # Profile management
│   ├── useUI.js                 # UI state management
│   └── useVerification.js       # Email verification
│
├── redux/                        # Redux state management
│   ├── store.js                 # Redux store configuration
│   ├── actions/                 # Action creators
│   │   ├── authActions.js
│   │   ├── movieActions.js
│   │   ├── showActions.js
│   │   ├── theatreActions.js
│   │   └── userActions.js
│   ├── slices/                  # Redux Toolkit slices
│   │   ├── authSlice.js         # Auth state
│   │   ├── movieSlice.js        # Movie state
│   │   ├── showSlice.js         # Show state
│   │   ├── theatreSlice.js      # Theatre state
│   │   ├── bookingSlice.js      # Booking state
│   │   ├── userSlice.js         # User state
│   │   ├── profileSlice.js      # Profile state
│   │   ├── loaderSlice.js       # Loading state
│   │   ├── uiSlice.js           # UI state
│   │   ├── verificationSlice.js # Verification state
│   │   └── forgotPasswordSlice.js
│   ├── reducers/
│   │   └── rootReducer.js       # Root reducer
│   └── sagas/                   # Redux-Saga side effects
│       ├── index.js             # Saga root
│       ├── authSaga.js          # Auth side effects
│       ├── movieSaga.js         # Movie side effects
│       ├── showSaga.js          # Show side effects
│       ├── theatreSaga.js       # Theatre side effects
│       ├── bookingSaga.js       # Booking side effects
│       ├── profileSaga.js       # Profile side effects
│       ├── verificationSaga.js  # Verification side effects
│       └── forgotPasswordSaga.js
│
├── utils/                        # Utility functions
│   ├── notificationUtils.js     # Toast notifications
│   ├── reminderUtils.js         # Reminder logic
│   └── format-duration.js       # Duration formatting
│
├── App.jsx                       # Root component
├── App.css                       # Global styles
├── index.css                     # Base styles
└── main.jsx                      # Entry point

public/
├── vite.svg
└── _redirects                    # Netlify redirects

DOCUMENTATION.md                  # Client documentation
index.html                        # Main HTML template where the React app mounts
vite.config.js                    # Vite configuration
tailwind.config.js                # Tailwind CSS config
package.json                      # Dependencies
```

---

## State Management

### Redux Architecture

The application uses Redux Toolkit with Redux-Saga for state management:

```
┌─────────────────────────────────────────┐
│         React Components                │
└────────────┬────────────────────────────┘
             │
             ├─ dispatch(action)
             │
┌────────────▼────────────────────────────┐
│      Redux Store (Slices)               │
│  ├─ authSlice                           │
│  ├─ movieSlice                          │
│  ├─ showSlice                           │
│  ├─ theatreSlice                        │
│  ├─ bookingSlice                        │
│  ├─ userSlice                           │
│  ├─ profileSlice                        │
│  ├─ loaderSlice                         │
│  ├─ uiSlice                             │
│  ├─ verificationSlice                   │
│  └─ forgotPasswordSlice                 │
└────────────┬────────────────────────────┘
             │
             ├─ subscribe(listener)
             │
┌────────────▼────────────────────────────┐
│      Redux-Saga (Side Effects)          │
│  ├─ authSaga                            │
│  ├─ movieSaga                           │
│  ├─ showSaga                            │
│  ├─ theatreSaga                         │
│  ├─ bookingSaga                         │
│  ├─ profileSaga                         │
│  ├─ verificationSaga                    │
│  └─ forgotPasswordSaga                  │
└────────────┬────────────────────────────┘
             │
             ├─ API Calls (Axios)
             │
┌────────────▼────────────────────────────┐
│      Backend API                        │
└─────────────────────────────────────────┘
```

### Redux Slices

Each slice manages a specific domain:

- **authSlice**: Authentication state (user, token, isAuthenticated)
- **movieSlice**: Movies list and details
- **showSlice**: Show timings and availability
- **theatreSlice**: Theatre information
- **bookingSlice**: Booking data and status
- **userSlice**: User profile information
- **profileSlice**: Profile edit state
- **loaderSlice**: Global loading state
- **uiSlice**: UI state (modals, notifications)
- **verificationSlice**: Email verification state
- **forgotPasswordSlice**: Password reset state

**Auth Slice** - Authentication state
```javascript
{
  user: { id, name, email, role },
  isAuthenticated: boolean,
  token: string,
  loading: boolean,
  error: string
}
```

**Movie Slice** - Movies list and details
```javascript
{
  list: Movie[],
  selectedMovie: Movie,
  loading: boolean,
  error: string
}
```

**Booking Slice** - Booking state
```javascript
{
  selectedSeats: string[],
  bookingDetails: Booking,
  loading: boolean,
  error: string
}
```

### Using Redux in Components

**Selector Pattern:**
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '../redux/slices/authSlice';

function MyComponent() {
  const { user, isAuthenticated } = useSelector(selectAuth);
  const dispatch = useDispatch();
  
  return (
    <div>
      {isAuthenticated && <p>Welcome, {user.name}</p>}
    </div>
  );
}
```

### Redux-Saga

Sagas handle side effects like API calls:

```javascript
// Example: Login saga (redux/sagas/authSaga.js)
ffunction* loginSaga(action) {
  try {
    const response = yield call(loginUser, action.payload);
    yield put(setUser(response.data.user));
    yield put(setToken(response.data.access_token));
  } catch (error) {
    yield put(setError(error.message));
  }
}

export function* authSaga() {
  yield takeEvery(LOGIN_REQUEST, loginSaga);
}
```

---
## API Integration

### Axios Configuration

The API client is configured in `src/api/index.js`:

```javascript
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true // Include cookies in requests
});
```

### API Modules

Each domain has its own API module:

- **auth.js**: Login, register, verify email, reset password
- **movie.js**: Get movies, movie details, search
- **show.js**: Get shows, show details
- **theatre.js**: Get theatres, theatre details
- **booking.js**: Create booking, get bookings, cancel booking
- **user.js**: Get profile, update profile, change password

### Example API Call

```javascript
// In a saga
function* fetchMoviesSaga() {
  try {
    const response = yield call(movieAPI.getMovies);
    yield put(setMovies(response.data));
  } catch (error) {
    yield put(setError(error.message));
  }
}
```

### Error Handling

```javascript
// Global error handling in saga
function* watchApiCall() {
  try {
    const response = yield call(apiFunction);
    yield put(successAction(response.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    yield put(failureAction(errorMessage));
    yield put(showNotification({ type: 'error', message: errorMessage }));
  }
}
```

---

## Component Architecture

### Route Protection

**ProtectedRoute:**
```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkingAuth } = useSelector(selectAuth);
  
  if (checkingAuth) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/" />;
  
  return <MainLayout>{children}</MainLayout>;
};
```

**PublicRoute:**
```javascript
const PublicRoute = ({ children }) => {
  const { isAuthenticated, checkingAuth } = useSelector(selectAuth);
  
  if (checkingAuth) return <LoadingFallback />;
  if (isAuthenticated) return <Navigate to="/home" />;
  
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
};
```

### Component Patterns

**Functional Component with Hooks:**
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';

export default function MovieDetails() {
  const dispatch = useDispatch();
  const { selectedMovie, loading } = useSelector(selectMovies);
  
  useEffect(() => {
    // Fetch movie details
  }, []);
  
  if (loading) return <Spin />;
  
  return (
    <div>
      <h1>{selectedMovie.movieName}</h1>
      {/* Component JSX */}
    </div>
  );
}
```

### Code Splitting

Components are lazy-loaded for better performance:

```javascript
const Home = lazy(() => import('./features/home/pages/Home'));
const Profile = lazy(() => import('./features/profile/pages/Profile'));

// In routes
<Route path="/home" element={<Suspense fallback={<LoadingFallback />}><Home /></Suspense>} />
```

---
## Routing & Navigation

### Route Structure

The application uses React Router v6 with protected routes:

```javascript
// App.jsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<PublicRoute><AuthTabs /></PublicRoute>} />
  <Route path="/no-auth/reset-password" element={<ResetPassword />} />
  
  {/* Protected Routes */}
  <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
  <Route path="/my-profile/edit" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  
  {/* Admin Routes */}
  <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
  
  {/* Partner Routes */}
  <Route path="/partner" element={<ProtectedRoute><Partner /></ProtectedRoute>} />
  
  {/* User Routes */}
  <Route path="/movie/:id/:date" 
         element={<ProtectedRoute><UserRoute><MovieDetails /></UserRoute></ProtectedRoute>} />
  <Route path="/booking/:id" 
         element={<ProtectedRoute><UserRoute><Booking /></UserRoute></ProtectedRoute>} />
  
  {/* Catch-all */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>

```
### Navigation

```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/home');
  };
  
  return <button onClick={handleClick}>Go Home</button>;
}
```
---

## Custom Hooks

### useAuth Hook

```javascript
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector(selectAuth);
  
  const login = (email, password) => {
    dispatch(loginUser({ email, password }));
  };
  
  const logout = () => {
    dispatch(logoutUser());
  };
  
  return { user, isAuthenticated, loading, error, login, logout };
};
```

### useBooking Hook

```javascript
export const useBooking = () => {
  const dispatch = useDispatch();
  const { selectedSeats, bookingDetails, loading } = useSelector(selectBooking);
  
  const selectSeats = (seats) => {
    dispatch(setSelectedSeats(seats));
  };
  
  const createBooking = (bookingData) => {
    dispatch(createBooking(bookingData));
  };
  
  return { selectedSeats, bookingDetails, loading, selectSeats, createBooking };
};
```

---

## Development Workflow

### Adding a New Feature

1. **Create feature folder:**
   ```
   src/features/newFeature/
   ├── pages/
   │   └── NewFeature.jsx
   └── components/
       └── NewFeatureComponent.jsx
   ```

2. **Create Redux slice:**
   ```javascript
   // redux/slices/newFeatureSlice.js
   const newFeatureSlice = createSlice({
     name: 'newFeature',
     initialState: { /* ... */ },
     reducers: { /* ... */ }
   });
   ```

3. **Create Redux saga:**
   ```javascript
   // redux/sagas/newFeatureSaga.js
   function* newFeatureSaga() {
     // Handle side effects
   }
   ```

4. **Add API calls:**
   ```javascript
   // api/newFeature.js
   export const fetchNewFeatureData = () => {
     return axiosInstance.get('/new-feature');
   };
   ```

5. **Create component:**
   ```javascript
   // features/newFeature/pages/NewFeature.jsx
   export default function NewFeature() {
     const { data, loading } = useSelector(selectNewFeature);
     
     return <div>{/* Component JSX */}</div>;
   }
   ```

6. **Add route:**
   ```javascript
   // App.jsx
   <Route path="/new-feature" element={<ProtectedRoute><NewFeature /></ProtectedRoute>} />
   ```

### Best Practices

- Keep components small and focused
- Use custom hooks for reusable logic
- Separate API calls into dedicated files
- Use Redux for global state, local state for component-specific data
- Implement error boundaries for error handling
- Use lazy loading for code splitting
- Add loading and error states to all async operations
- Use meaningful variable and function names
- Add comments for complex logic

---

## Performance Optimization

### Memoization

```javascript
// Memoize components
const MyComponent = React.memo(function MyComponent(props) {
  // Component code
});

// Memoize functions
const memoizedCallback = useCallback(() => {
  // Function code
}, [dependency]);

// Memoize values
const memoizedValue = useMemo(() => {
  return expensiveComputation(a, b);
}, [a, b]);
```

### Redux Selectors

```javascript
// Prevent unnecessary re-renders
const selectMovies = (state) => state.movies.list;
const selectSelectedMovie = (state) => state.movies.selectedMovie;

// Use in component
const movies = useSelector(selectMovies);
```

### Code Splitting

```javascript
// Lazy load components
const Home = lazy(() => import('./features/home/pages/Home'));

// Use with Suspense
<Suspense fallback={<LoadingFallback />}>
  <Home />
</Suspense>
```

### Image Optimization

- Use appropriate image formats (WebP, JPEG, PNG)
- Compress images before uploading
- Lazy load images below the fold
- Use responsive images with srcset

---
## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS for styling:

```javascript
<div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg">
  <h1 className="text-2xl font-bold">Title</h1>
  <button className="px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100">
    Action
  </button>
</div>
```

### Ant Design

Ant Design components are used for complex UI:

```javascript
import { Button, Form, Input, Modal } from 'antd';

<Form layout="vertical">
  <Form.Item label="Email" name="email">
    <Input type="email" />
  </Form.Item>
  <Button type="primary" htmlType="submit">
    Submit
  </Button>
</Form>
```

---

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Environment Variables for Production

```
VITE_API_BASE_URL=https://api.yourdomain.com/bms/v1
```

### Deploy to Netlify

#### Option 1: Using Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option 2: Using GitHub Integration

1. Push code to GitHub
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard
6. Deploy automatically on push

#### Netlify Configuration

Create `netlify.toml` in the Client directory:

```toml
[build]
  command = "npm run build"
  publish = "dist"

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
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

---

## Troubleshooting

### Common Issues

#### 1. API Connection Error
**Problem:** Cannot connect to backend API  
**Solution:**
- Verify `VITE_API_BASE_URL` in `.env`.
- Ensure the backend server is running.
- Check the browser console for CORS errors.
- Verify CORS configuration on the backend.

#### 2. Redux State Error
**Problem:** Redux state not updating  
**Solution:**
- Ensure the action is dispatched correctly.
- Verify the reducer is handling the action.
- Check Redux DevTools for action history.

#### 3. Components Not Rendering
**Problem:** Components are not displayed  
**Solution:**
- Check route configuration.
- Ensure the component is exported correctly.
- Verify Redux selectors are returning expected data.

#### 4. Performance Issues
**Problem:** UI is slow or re-renders unnecessarily  
**Solution:**
- Use React DevTools Profiler to identify bottlenecks.
- Check for unnecessary re-renders.
- Implement memoization using `React.memo`, `useMemo`, or `useCallback` where needed.

#### 5. Build Fails
**Problem:** `npm run build` fails  
**Solution:**
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 6. Hot Reload Not Working
**Problem**: Changes not reflecting in dev server
**Solution**:
- Restart dev server: `npm run dev`
- Check file permissions
- Clear browser cache

#### 7. Authentication Token Expired
**Problem**: Getting 401 errors after login
**Solution**:
- Check token expiry configuration on the backend.
- Implement token refresh logic if needed.
- Clear localStorage and re-login.

---

## Acknowledgements

This frontend project leverages the following open-source libraries and frameworks to deliver a modern, performant, and responsive user experience:

| Technology                                                       | Description                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| [**React**](https://react.dev/)                               | Library for building interactive and component-based UIs         |
| [**React DOM**](https://react.dev/reference/react-dom)        | Enables React components to render in the browser DOM            |
| [**React Router DOM**](https://reactrouter.com/)              | Declarative routing and navigation for React apps                |
| [**Redux Toolkit**](https://redux-toolkit.js.org/)            | Simplifies Redux state management with minimal boilerplate       |
| [**React Redux**](https://react-redux.js.org/)                | Official React bindings for Redux                                |
| [**Redux Saga**](https://redux-saga.js.org/)                  | Manages complex async logic using generator functions            |
| [**Redux Persist**](https://github.com/rt2zz/redux-persist)   | Persists and rehydrates Redux state across sessions              |
| [**Ant Design (antd)**](https://ant.design/)                  | Enterprise-grade UI library with elegant React components        |
| [**@ant-design/icons**](https://ant.design/components/icon/) | Official icon library for Ant Design components                  |
| [**Tailwind CSS**](https://tailwindcss.com/)                  | Utility-first CSS framework for custom and responsive designs    |
| [**Axios**](https://axios-http.com/)                          | Promise-based HTTP client for API communication                  |
| [**Moment.js**](https://momentjs.com/)                         | Simplifies date and time parsing, formatting, and manipulation   |
| [**js-cookie**](https://github.com/js-cookie/js-cookie)       | Lightweight API for managing browser cookies                     |
| [**Vite**](https://vitejs.dev/)                                | Next-generation frontend tooling for fast development and builds |

---

## 🧠 Author

**Shravan Kumar Atti**<br>
*Pre-sales Architect | Full-stack Developer*

GitHub: [@Shravan-509](https://github.com/Shravan-509)

---
**Last Updated**: October 2024  
**Version**: 1.0.0
