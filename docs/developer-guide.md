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
10. [Style & Theming](#10-style--theming)
11. [Testing](#11-testing)
12. [Sprint Planning & Onboarding](#12-sprint-planning--onboarding)
13. [Additional Notes](#13-additional-notes)

## 3. Project Overview

Summarize game mechanics and admin interface:

- **Name:** Before or After
- **Gameplay:** Compare release years between cultural items. Show card with
  year, then prompt for before/after comparison with new card.
- **Game Flow:** Start with reference card. Show second card without year.
  Advance on correct guesses using current card as new reference. Show loss
  screen on incorrect guesses.
- **Card Model:** Store items with title, year, imageUrl, sourceUrl, and
  category fields.
- **Roles:** Allow public gameplay (Home, Game, Loss screens) and admin
  functionality (Dashboard, Card management).
- **Goals:** Deliver responsive MVP with core features in four-week timeframe.

## 4. Page Map & UI Flows

Outline the primary pages and navigation patterns.

### Public Pages

- **Home Page**: display logo, tagline, and start buttons
- **Game Page**: show two stacked or side-by-side cards; render Higher/Lower
  controls; auto-scroll on success
- **Loss Page**: overlay final score; display corresponding loss GIF; provide
  Back and Play Again buttons
- **Login Page**: center form card with username, password, Forgot Password, and
  Sign Up link
- **Signup Page**: center form card with email, password, confirm password, and
  Log In link

### Admin Pages

- **Dashboard**: show metrics at top; list Loss GIF categories with headers
- **Card Viewer**: display infinite-scroll grid of cards; use fixed-width cards
  that adapt to viewport

### Navigation

- **Desktop Nav**: top bar with brand title center, score and user icon right
- **Mobile Nav**: bottom tab bar with Home, Game, Dashboard, and Card Viewer
  icons

Use React Router (or equivalent) to manage routes and protect admin pages behind
authentication.

## 5. Architecture & Tech Stack

Define each layer and its technology to establish standards and dependencies.

- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **Storage:** AWS S3 for images
- **Frontend:** React with Vite
- **Styling:** Tailwind CSS with custom variables
- **Authentication:** server-side sessions via `express-session` (stores guest
  score in `req.session.score`, merges on login)
- **Testing:** Jest, React Testing Library, Supertest
- **CI/CD:** GitHub Actions for build, test, and deploy

## 6. Directory Structure

Organize code and resources as follows:

```text
/ (repo root)
├── .github/               # CI workflows & issue/PR templates
├── docs/                  # Markdown guides (onboarding, dev guide)
├── packages/
│   ├── express-backend/   # API server
│   │   ├── controllers/   # HTTP handlers (create when >2 files)
│   │   ├── models/        # Mongoose schemas (create when >2 files)
│   │   └── index.js       # Entry point (imports config, sets up sessions with SESSION_SECRET)
│   └── react-frontend/    # SPA client
│       ├── components/    # Shared React components (start with 1–2 files)
│       ├── pages/         # Route views (Home, Game, Loss, Login, Signup, Admin)
│       └── main.jsx       # Entry point (router & Layout)
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

   - Backend: `npm start --workspace=packages/express-backend`
   - Frontend: `npm start --workspace=packages/react-frontend`

> NOTE: Copy `.env.example` to `.env.local` and set required variables.

## 8. Core Components

Break down UI and logic into reusable components.

### Layout & Navigation

- **Header.jsx**: display brand center, show scores on desktop
- **BottomNav.jsx**: mobile-only tabs for Home, Game, Dashboard, Card Viewer
- **Layout.jsx**: render Header or BottomNav based on viewport size

### Game Components

- **CardPair.jsx**: Display previous and current cards with years and images.
  Animate card transition on correct guesses.
- **GuessButtons.jsx**: Provide Before/After buttons to compare years directly.
  Send guesses to API endpoint.
- **StreakDisplay.jsx**: Track and show current streak from local storage.

### Authentication Components

- **LoginForm.jsx**: username/password form; include Forgot Password
- **SignupForm.jsx**: email/password/confirm form; link to Login

### Admin Viewer Components

- **DashboardView\.jsx**: show metrics and Loss GIF categories
- **CardViewer.jsx**: infinite-scroll grid of cards; fixed-width, responsive
  layout

## 9. API Endpoints

Define REST routes for public gameplay and admin viewing.

### Public

- **GET `/api/cards/next`**

  - Retrieve random card for gameplay session.
  - Response: `{ id, title, year, imageUrl, sourceUrl, category }`

- **POST `/api/cards/guess`**

  - Body: `{ previousYear, currentYear, guess }`
  - Returns: `{ correct: boolean, nextCard: Card }`
  - Direct player to Loss page on incorrect guesses.

### Authentication (session-based)

- **POST `/api/auth/login`**

  - Body: `{ username, password }`
  - Set `req.session.userId` and merge guest score on success.

- **POST `/api/auth/signup`**

  - Body: `{ email, password }`
  - Set `req.session.userId` on success.

### Admin

- **GET `/api/admin/cards`**

  - List cards with pagination support via `?cursor=&limit=`.
  - Include year, imageUrl, and other card fields in response.

- **GET `/api/admin/cards/:id`**

  - Fetch single card with complete field set.

> NOTE: Secure admin endpoints with `x-admin-key` header or JWT cookie.

## 10. Style & Theming

Standardize UI look and responsive behavior.

- **CSS Framework**: use Tailwind CSS with custom config in
  `tailwind.config.js`.
- **Variables**: define colors and spacing in `theme.extend`.
- **Mobile-first**: build components for narrow screens first.
- **BottomNav**: use fixed positioning at bottom on mobile only.
- **Card Grid**: use CSS Grid with
  `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` for
  `CardViewer`.

## 11. Testing

Ensure core flows are reliable:

### Backend Tests

- Location: `packages/express-backend/tests/`
- Use Jest and Supertest.
- Test `/api/cards/next` returns unique cards for a session.
- Test `/api/cards/guess` logic for correct and incorrect.
- Test auth endpoints for error and success cases.

### Frontend Tests

- Location: `packages/react-frontend/tests/`
- Use Jest and React Testing Library.
- Render `CardPair` and simulate correct/incorrect guess flows.
- Test `LoginForm` and `SignupForm` validation and submission.
- Test `CardViewer` infinite scroll triggers fetch on scroll end.

## 12. Sprint Planning & Onboarding

Guide for sprint cadence and task assignments:

- **Sprint length**: 1 week, each due Friday.
- **Sprint 1**: clickable UI shell for Home, Game, and Loss.
- **Sprint 2**: login and signup pages; initial Admin Dashboard stub (Kevin).
- **Sprint 3**: finish Admin Dashboard; enhance Home, Game, Loss, Login, and
  Signup.
- **Sprint 4**: polish, tests, CI/CD, and deploy by Week 4.
- **Task sizing**: Small (\~1 h), Medium (\~2 h), Large (>4 h).
- **Definition of Done**: list acceptance criteria in each issue.
- **WIP limit**: max 2 tasks per person in **In Progress**.
- **Stand-ups**: daily 15 min check-ins.
- **Retros**: end-of-sprint record of wins and improvements.

## 13. Additional Notes

- Refer to `docs/project-onboarding.md` for contributor workflows and issue
  guidelines.
- Track guest scores in `req.session.score` and merge into user records on
  login.
- Ensure `SESSION_SECRET` is set to keep sessions secure.
- Update this guide with new features or architectural changes.
