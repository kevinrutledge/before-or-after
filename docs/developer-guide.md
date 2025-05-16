## 1. Introduction

Welcome to the **Before or After** developer guide. This document outlines
project goals, UI flows, and technical details needed to build and maintain the
game.

## 2. Table of Contents

1. [Introduction](#1-introduction)
2. [Table of Contents](#2-table-of-contents)
3. [Project Overview](#3-project-overview)
4. [Page Map & UI Flows](#4-page-map--ui-flows)
5. [Architecture & Tech Stack](#5-architecture--tech-stack)
6. [Directory Structure](#6-directory-structure)
7. [Getting Started](#7-getting-started)
8. [Core Components](#8-core-components)
9. [API Endpoints](#9-api-endpoints)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Game Logic](#11-game-logic)
12. [Style & Theming](#12-style--theming)
13. [Testing](#13-testing)
14. [Sprint Planning & Onboarding](#14-sprint-planning--onboarding)
15. [Additional Notes](#15-additional-notes)

## 3. Project Overview

- **Name:** Before or After
- **Gameplay:** Compare release dates between cultural items. Show card with
  year and month, then prompt for before/after comparison with new card.
- **Game Flow:** Start with reference card. Show second card without year.
  Advance on correct guesses using current card as new reference. Show loss
  screen on incorrect guesses.
- **Card Model:** Store items with title, year, month, imageUrl, sourceUrl, and
  category fields.
- **Authentication:** Support both guest and authenticated play modes with local
  storage tokens.
- **Roles:** Allow public gameplay (Home, Game, Loss screens) and admin
  functionality (Dashboard, Card management).
- **Goals:** Deliver responsive MVP with core features in four-week timeframe.

## 4. Page Map & UI Flows

### Public Pages

- **Home Page**: Display logo, tagline, and start buttons.
- **Game Page**: Show two cards (stacked on mobile, side-by-side on desktop).
  Render Before/After controls. Show score. Display login prompt for guest
  users.
- **Loss Page**: Display final score with loss GIF. Provide Play Again and Back
  to Home buttons.
- **Login Page**: Center form card with email, password fields. Include login
  button and sign-up link.
- **Signup Page**: Center form card with email, password, and confirm password
  fields. Include signup button and login link.

### Admin Pages

- **Dashboard**: Show metrics at top. List Loss GIF categories with headers.
- **Card Viewer**: Display infinite-scroll grid of cards. Use fixed-width cards
  that adapt to viewport.

### Navigation

- **Desktop Nav**: Top bar with brand title center, score display, and auth
  controls on right.
- **Mobile Nav**: Bottom tab bar with navigation icons and auth controls.

Use React Router to manage routes and RouteGuard to handle both guest and
authenticated modes.

## 5. Architecture & Tech Stack

- **Backend:** Node.js, Express, MongoDB native driver
- **Database:** MongoDB Atlas
- **Storage:** AWS S3 for images
- **Frontend:** React with Vite
- **Styling:** CSS with variables
- **Authentication:** Token-based with localStorage storage
- **Testing:** Jest, React Testing Library, Supertest
- **CI/CD:** GitHub Actions for build, test, and deploy

## 6. Directory Structure

```text
/ (repo root)
├── .github/               # CI workflows & issue/PR templates
├── docs/                  # Markdown guides (onboarding, dev guide)
├── packages/
│   ├── express-backend/   # API server
│   │   ├── controllers/   # HTTP handlers
│   │   ├── middleware/    # Auth middleware, request processing
│   │   ├── models/        # MongoDB schemas and data access
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic
│   │   └── src/           # Server entry point and core setup
│   └── react-frontend/    # SPA client
│       ├── components/    # Shared React components
│       ├── context/       # React context providers
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Route components
│       ├── routes/        # Router configuration
│       ├── styles/        # Global CSS and theme variables
│       ├── utils/         # Helper functions and utilities
│       └── src/           # App entry point
```

## 7. Getting Started

Set up development environment:

1. **Clone repository**

   ```bash
   git clone git@github.com:your-org/before-or-after.git
   ```

2. **Install dependencies**

   ```bash
   cd before-or-after
   npm ci
   ```

3. **Start applications**

   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`
   - Both: `npm run dev`

4. **Environment variables**

   Copy `.env.example` to `.env` and set required variables:

   ```
   MONGO_URI=<your-mongo-connection-string>
   PORT=8000
   SESSION_SECRET=<your_session_secret_here>
   S3_REGION=<provided-by-admin>
   S3_BUCKET_NAME=<provided-by-admin>
   AWS_ACCESS_KEY_ID=<provided-by-admin>
   AWS_SECRET_ACCESS_KEY=<provided-by-admin>
   ```

## 8. Core Components

### Layout & Navigation

- **Header.jsx**: Display brand center, scores, and auth controls on desktop.
- **BottomNav.jsx**: Mobile-only tabs for navigation with auth controls.
- **Layout.jsx**: Render Header or BottomNav based on viewport size.
- **RouteGuard.jsx**: Protect routes and enable guest mode functionality.

### Game Components

- **Card.jsx**: Display card with title, image, and conditional date formatting.
- **CardPair.jsx**: Render reference and current cards with proper layout.
- **GuessButtons.jsx**: Provide Before/After buttons to compare dates.
- **ResultOverlay.jsx**: Show animated feedback on correct/incorrect guesses.

### Authentication Components

- **LoginPage.jsx**: Handle login form submission and token storage.
- **SignupPage.jsx**: Process user registration and redirect to login.

### Game State Management

- **GameContext.jsx**: Manage game state, score tracking, and auth state.
- **deckUtils.js**: Handle card deck shuffling and management.
- **gameUtils.js**: Process game logic including compareCards function.
- **authUtils.js**: Handle token management and auth state.

## 9. API Endpoints

### Public

- **GET `/api/cards/next`**

  - Retrieve random card for gameplay session.
  - Response: `{ id, title, year, month, imageUrl, sourceUrl, category }`

- **POST `/api/cards/guess`**

  - Body: `{ previousYear, previousMonth, currentYear, currentMonth, guess }`
  - Returns: `{ correct: boolean, nextCard: Card }`
  - Direct player to Loss page on incorrect guesses.

### Authentication

- **POST `/api/auth/login`**

  - Body: `{ email, password }`
  - Returns: `{ token: string }`
  - Store token in localStorage on client.

- **POST `/api/auth/signup`**

  - Body: `{ email, password }`
  - Returns: `{ success: boolean }`
  - Redirect to login page on success.

### Admin

- **GET `/api/admin/cards`**

  - List cards with pagination support via `?cursor=&limit=`.
  - Include year, month, imageUrl, and other card fields in response.

- **GET `/api/admin/cards/:id`**

  - Fetch single card with complete field set.

NOTE: Secure admin endpoints with Bearer token in Authorization header.

## 10. Authentication & Authorization

### Token-Based Authentication

- Use JWT-based authentication with localStorage storage.
- Token format: JWT with user info (email, role, id) and expiration.
- Include token in Authorization header as Bearer token for API requests.
- Support session expiration with 24-hour token lifetime.

### Guest Mode Implementation

- Enable unregistered users to play as guests with localStorage score tracking.
- Display login prompt for guest users in Game page.
- Implement score merging when guest user authenticates via GameContext.
- Track high scores separately for guest and authenticated users using different
  localStorage keys.

### Password Reset Flow

- Three-stage password reset process: request, verification, reset.
- Endpoints: `/api/auth/forgot-password`, `/api/auth/verify-code`,
  `/api/auth/reset-password`.
- Email verification using 6-digit code with 15-minute expiration.
- Temporary JWT token for password reset authorization.
- Secure implementation with email obfuscation for privacy.

### Auth State Management

- Use AuthContext to track authentication state across components.
- Track isAuthenticated, isGuest, and user profile information.
- Implement login/logout and guest mode toggle handlers.
- Use storage event listener to sync auth state across browser tabs.

### Route Protection

- Use ProtectedRoute component to guard routes while allowing guest access.
- Implement conditional UI in Header and BottomNav based on auth state.
- Support role-based access control for admin routes.
- Redirect to login with return path for unauthenticated users.

## 11. Game Logic

### Card Model

- Store card data with title, year, month, imageUrl, sourceUrl, and category.
- Use month field (1-12) for more precise date comparisons.
- Index card collection on year, month, and category fields.

### Deck Management

- Implement card deck shuffling using Fisher-Yates algorithm.
- Manage deck state in GameContext.
- Support reshuffle functionality when deck is empty.
- Track current and reference cards for comparison.

### Game Mechanics

- Compare cards based on both year and month.
- Use month as tie-breaker when years match.
- Implement score tracking with localStorage persistence.
- Separate high score tracking for guest and authenticated users.
- Add visual feedback for correct/incorrect guesses.

### State Transitions

- Track game state: 'initial', 'playing', 'correct', 'incorrect', 'reshuffling'.
- Handle transitions between states with appropriate UI updates.
- Reset game state on reshuffle or restart.

## 12. Style & Theming

- Use CSS variables for consistent theming.
- Define color palette in global.css:
  ```css
  :root {
    --text: #100910;
    --background: #f9f5f9;
    --primary: #121212;
    --secondary: #e94f37;
    --accent: #2ab7ca;
    --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  ```
- Use Inter font for typography.
- Implement responsive design with mobile-first approach.
- Create consistent button styles and card layouts.

## 13. Testing

### MongoDB Testing

- Test index configuration and performance.
- Validate schema constraints including year and month ranges.
- Verify aggregation pipeline for random card selection.

### Backend Tests

- Test API endpoints with Supertest.
- Verify token generation and validation.
- Test guest mode score persistence.
- Validate card retrieval and guess processing.

### Frontend Tests

- Test component rendering with React Testing Library.
- Verify auth state management in context.
- Test card comparison logic.
- Validate form submissions and error handling.
- Test responsive behavior on different viewports.

### Test Scripts

```bash
# Run all tests
npm test

# Run backend tests
npm run test --workspace=packages/express-backend

# Run frontend tests
npm run test --workspace=packages/react-frontend
```

## 14. Sprint Planning & Onboarding

- **Sprint 1**: Core UI shell for Home, Game, and Loss pages.
- **Sprint 2**: Authentication system with guest mode and login/signup pages.
- **Sprint 3**: Enhanced game mechanics with card deck, month-based comparison.
- **Sprint 4**: UI polish, animations, and testing.
- **Task sizing**: Small (~1 h), Medium (~2 h), Large (>4 h).
- **Definition of Done**: List acceptance criteria in each issue.
- **WIP limit**: Maximum 2 tasks per person in **In Progress**.
- **Stand-ups**: Daily 15-minute check-ins.
- **Retros**: End-of-sprint record of wins and improvements.

## 15. Additional Notes

- Refer to open issues on GitHub for upcoming feature implementations.
- Implement guest score persistence before building server-side user profiles.
- Avoid unnecessary complexity in initial implementation.
- Focus on core gameplay experience before adding administrative features.
