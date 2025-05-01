# Lower or Higher — Developer Documentation

**Lower or Higher** is a casual, web‑based game where players guess whether a
second cultural item (album, movie, artwork, etc.) was released before or after
a first. It combines quick decision‑making with light trivia, making it ideal
for short breaks.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture & Stack](#architecture--stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Core Components](#core-components)
- [API Endpoints](#api-endpoints)
- [Style & Theming](#style--theming)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Project Overview

- **Purpose:** Provide an addictive, quick‑play game for guessing release years
  of cultural items.
- **Audience:** Anyone with a few spare moments—students, commuters, trivia
  fans.
- **Gameplay:** Show two items, guess if the second was released **Higher**
  (later year) or **Lower** (earlier year). Correct guesses chain, forming a
  streak.

---

## Features

- **Randomized card comparisons** drawn from a MongoDB collection.
- **Guess logic** with immediate correct/incorrect feedback.
- **Streak tracking** (client‑side) to motivate replay.
- **Admin CRUD** for managing cards (via S3 uploads and Mongo).
- **Responsive UI** for mobile and desktop layouts.

---

## Architecture & Stack

| Layer        | Technology                 |
| ------------ | -------------------------- |
| **Backend**  | Node.js, Express, Mongoose |
| **Storage**  | MongoDB Atlas, AWS S3      |
| **Frontend** | React, Vite                |
| **Styling**  | Global CSS + CSS Modules   |
| **Testing**  | Jest, Supertest, RTL       |
| **CI/CD**    | GitHub Actions             |

---

## Config Module (express-backend/config)

Centralized environment-driven setup for the API server:

- **config/index.js**  
  Re-exports all config pieces: `connectDB`, `s3`, and `logger`.
- **config/db.js**  
  Connects to MongoDB using `mongoose.connect(process.env.MONGO_URI)`.
- **config/s3.js**  
  Exports an AWS S3 client (`@aws-sdk/client-s3`) configured via
  `process.env.AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

These modules allow controllers and services to import a single source of truth
for database, S3, and logging.

---

## Getting Started

Refer to [Getting Started](getting-started.md) for installation, environment
setup, and dev commands.

---

## Core Components

### Layout Components

These compose the overall page structure and adapt to screen size:

- **Header.jsx**
  - Displays app logo/title and current streak.
  - Always visible.
- **BottomNav.jsx**
  - Mobile-only navigation (Game, Stats, Admin).
  - Uses CSS media query `max-width: var(--bp-tablet)`.
- **Sidebar.jsx**
  - Desktop-only navigation (Game, Stats, Admin).
  - Visible at `min-width: var(--bp-desktop)`.
- **Hero.jsx**
  - Banner under header on tablet+/desktop with instructions or daily prompt.
- **Layout.jsx**
  - Orchestrates which nav to render based on CSS, wraps page content.

### Game Components

- **CardPair.jsx**
  - Renders two cards: previous and current.
  - Uses CSS Modules for slide animations on guess.
- **GuessButtons.jsx**
  - Two buttons (“Higher”, “Lower”) that call `POST /cards/guess`.
- **StreakDisplay.jsx**
  - Shows current streak from `localStorage`.

### Admin Components

- **CardList.jsx**
  - Table or grid listing all cards with Edit/Delete actions.
- **CardEditorForm.jsx**
  - Form for editing card metadata and uploading new image.
- **UploadButton.jsx**
  - Wraps file input and handles S3 presigned URL logic via
    `services/s3Service.js`.

### UI Primitive Components

Under `src/components/ui/` create reusable primitives:

- **Button**: styled clickable element with `variant` prop.
- **Card**: container for image and text.
- **Dialog**: modal built with headless primitives.
- **Input**: text input with label support.

---

## API Endpoints

### Public

- **GET /cards/random**
  - Returns two random cards from Mongo.
- **POST /cards/guess**
  - Body: `{ previousId, currentId, guess }`
  - Returns: `{ correct, nextCard }`.

### Admin (API key via `x-admin-key` header)

- **POST /admin/cards**

  - Create card: multipart/form-data with `title`, `year`, `sourceText`,
    `image`.
  - Saves to S3 and Mongo.

- **GET /admin/cards**

  - List all cards.

- **GET /admin/cards/:id**

  - Fetch single card details.

- **PUT /admin/cards/:id**

  - Update metadata, if `image` present, re-upload to S3.

- **DELETE /admin/cards/:id**
  - Remove card and delete S3 object.

---

## Style & Theming

1. **Global CSS** (`global.css`):

   - Variables for:
     - Colors: `--color-primary`, `--color-secondary`.
     - Spacing: `--space-sm`, `--space-md`, `--space-lg`.
     - Breakpoints: `--bp-tablet: 641px; --bp-desktop: 1024px;`.
   - Resets and `box-sizing`.

2. **CSS Modules**:

   - Scoped `.module.css` files next to components.
   - BEM-like naming for clarity.

3. **Responsive**:
   - Mobile-first, use media queries in modules for tablet and desktop
     overrides.

---

## Testing

### Backend

- **Location**: `packages/express-backend/tests/`
- **Tools**: Jest, Supertest.
- **Tests**:
  - `/cards/random` returns 2 distinct cards.
  - `/cards/guess` logic.
  - Admin CRUD with auth header.

### Frontend

- **Location**: `packages/react-frontend/tests/`
- **Tools**: Jest, React Testing Library, user-event.
- **Tests**:
  - Render `CardPair` and simulate guess flow.
  - Verify streak increments/resets.
  - Admin form input and submit mocks.

---

## Additional Developer Notes

1. **Implement CSS & UI skeleton** using global styles and CSS Modules.
2. **Seed Mongo** with initial cards via a script.
3. **Build API** endpoints and test them.
4. **Wire up** Game components to API.
5. **Develop** Admin components and protect routes.
6. **Add** basic CI (GitHub Actions) to run `npm test` on PRs.

---

_This document is a living guide for developers working on Lower or Higher.
Please update it as new features are added or modifications are made._
