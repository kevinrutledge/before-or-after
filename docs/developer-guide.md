# Before or After Developer Guide

This guide outlines project architecture, implementation patterns, and technical
details needed to build and maintain the Before or After game application.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Directory Structure](#directory-structure)
4. [Getting Started](#getting-started)
5. [Page Map & UI Flows](#page-map--ui-flows)
6. [Core Components](#core-components)
7. [Authentication & Authorization](#authentication--authorization)
8. [Game Logic](#game-logic)
9. [Admin Management](#admin-management)
10. [API Endpoints](#api-endpoints)
11. [Database Schema](#database-schema)
12. [Image Management](#image-management)
13. [Style & Theming](#style--theming)
14. [Testing Strategy](#testing-strategy)
15. [Responsive Design](#responsive-design)
16. [Error Handling](#error-handling)
17. [Performance Considerations](#performance-considerations)

## Project Overview

**Before or After** is a web-based trivia game where players compare release
dates of cultural artifacts including movies, albums, games, and technology.

### Core Gameplay

- Players view two cards showing cultural items with images and titles
- Reference card displays month/year while comparison card hides the date
- Users guess whether the comparison item was released before or after the
  reference
- Correct guesses advance the game with the comparison card becoming the new
  reference
- Incorrect guesses end the session and display the final score

### Key Features

- User registration and authentication with username/email login
- Score tracking with persistent high score leaderboards
- Admin dashboard for content management and card creation
- Image upload system with S3 storage and automatic processing
- Responsive design supporting mobile and desktop experiences
- Loss GIF system that displays different animations based on score ranges

### Technical Goals

- Deliver production-ready application with comprehensive testing
- Support concurrent users with efficient database queries
- Maintain consistent UI patterns across all device sizes
- Provide admin tools for content management without technical knowledge

## Architecture & Tech Stack

### Backend

- **Runtime**: Node.js with ES modules
- **Framework**: Native HTTP server with Express-style routing
- **Database**: MongoDB with native driver
- **Storage**: AWS S3 for image hosting
- **Authentication**: JWT tokens with 24-hour expiration
- **Image Processing**: Sharp for thumbnail generation and format conversion

### Frontend

- **Framework**: React 19 with Vite build system
- **Routing**: React Router DOM with protected routes
- **State Management**: React Context for auth and game state
- **Data Fetching**: TanStack Query for caching and synchronization
- **Styling**: CSS modules with CSS variables for theming
- **UI Components**: Custom components with responsive design patterns

### Development Tools

- **Testing**: Jest with React Testing Library and Supertest
- **Code Quality**: ESLint with Prettier formatting
- **Type Safety**: JSDoc comments for documentation
- **Package Management**: npm workspaces for monorepo structure

## Directory Structure

```text
/ (repo root)
├── .github/               # CI workflows and issue templates
├── docs/                  # Documentation and guides
├── packages/
│   ├── express-backend/   # API server
│   │   ├── api/           # Route handlers organized by feature
│   │   ├── middleware/    # Authentication and request processing
│   │   ├── models/        # Database models and schema definitions
│   │   ├── services/      # Business logic and external integrations
│   │   ├── utils/         # Shared utilities and helpers
│   │   ├── tests/         # Backend test suites
│   │   └── server.js      # Application entry point
│   └── react-frontend/    # Client application
│       ├── components/    # Reusable UI components
│       ├── context/       # React context providers
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Route-level components
│       ├── routes/        # Router configuration
│       ├── styles/        # Global CSS and theme definitions
│       ├── utils/         # Client-side utilities
│       ├── tests/         # Frontend test suites
│       └── src/           # Application entry point and main components
```

## Getting Started

### Prerequisites

- Node.js 18+ with npm
- MongoDB Atlas account or local MongoDB instance
- AWS S3 bucket with configured access credentials

### Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone [repository-url]
   cd before-or-after
   npm ci
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your database and AWS credentials
   ```

3. Start development servers:
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

### Environment Configuration

Set these variables in your `.env` file:

```
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret-key
S3_REGION=your-aws-region
S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Page Map & UI Flows

### Public Pages

- **Home Page**: Landing page with game logo, tagline, and play button
- **Game Page**: Core gameplay interface with card comparison and scoring
- **Loss Page**: Game over screen with final score and restart options
- **Leaderboard Page**: Top player scores with ranking display
- **Login Page**: User authentication with email/username and password
- **Signup Page**: Account creation with email, username, and password
  confirmation
- **Forgot Password Page**: Three-stage password reset with email verification

### Admin Pages

- **Admin Dashboard**: Content management interface with card and loss GIF
  management
- **Card Management**: Grid view of game cards with edit and delete operations
- **Loss GIF Management**: Configuration interface for score-based GIF display

### Navigation Patterns

- **Desktop**: Top navigation bar with logo, high score display, and account
  menu
- **Mobile**: Bottom navigation with same functionality adapted for touch
  interfaces
- **Responsive**: Automatic switching between layouts based on viewport width

## Core Components

### Layout Components

- **Layout.jsx**: Main wrapper that renders appropriate navigation based on
  screen size
- **Header.jsx**: Desktop navigation with brand logo, score display, and user
  menu
- **BottomNav.jsx**: Mobile navigation with touch-optimized controls
- **PageContainer.jsx**: Content wrapper with consistent spacing and max-width
  constraints
- **Background.jsx**: Grid pattern background component used across pages

### Game Components

- **Card.jsx**: Displays cultural artifact with image, title, and conditional
  date information
- **ResultOverlay.jsx**: Animated feedback overlay showing guess results
- **PlayButton.jsx**: Styled play button with star animation effects

### Admin Components

- **AdminCard.jsx**: Card management interface with edit and delete controls
- **AdminCardForm.jsx**: Modal form for creating new game cards
- **EditCardForm.jsx**: Modal form for updating existing cards
- **ImageUpload.jsx**: Drag-and-drop image upload with preview functionality
- **LossGifCard.jsx**: Loss GIF management interface
- **LossGifForm.jsx**: Modal form for configuring loss GIF settings
- **Modal.jsx**: Reusable modal wrapper with escape key and overlay click
  handling

### Utility Components

- **ProtectedRoute.jsx**: Route wrapper for role-based access control

## Authentication & Authorization

### User Registration

Users create accounts with email addresses and unique usernames. Password
requirements enforce minimum 6-character length with bcrypt hashing for secure
storage.

### Login System

Authentication accepts either email address or username with password
validation. Successful login generates JWT tokens containing user
identification, role information, and 24-hour expiration.

### Token Management

Client applications store JWT tokens in localStorage with automatic inclusion in
API requests via Authorization headers. Token expiration triggers automatic
logout with redirect to login page.

### Role-Based Access

- **User Role**: Access to gameplay, leaderboards, and personal score tracking
- **Admin Role**: Full system access including content management and user
  administration

### Password Reset Flow

Three-stage password reset process:

1. **Request Stage**: User enters email address to receive verification code
2. **Verification Stage**: User enters 6-digit code with 15-minute expiration
3. **Reset Stage**: User sets new password with temporary JWT authorization

### Route Protection

Protected routes verify authentication status and role requirements before
rendering content. Unauthenticated users redirect to login with return path
preservation.

## Game Logic

### Card Data Model

Game cards store cultural artifacts with these properties:

- **title**: Display name for the artifact
- **year**: Release year (1000-2030 range)
- **month**: Release month (1-12 numeric values)
- **imageUrl**: S3 URL for full-size display image
- **thumbnailUrl**: S3 URL for optimized thumbnail
- **sourceUrl**: Reference link to original content
- **category**: Classification (movie, album, game, technology, art)

### Gameplay Mechanics

Players compare two cards based on chronological release order. The system
processes guesses by comparing year values first, then month values for
same-year items. Exact matches (same year and month) automatically count as
incorrect guesses.

### Deck Management

The game fetches all available cards at session start and shuffles them using
Fisher-Yates algorithm. Cards are drawn sequentially from the shuffled deck to
prevent duplicates within a single game session.

### Score Tracking

Correct guesses increment the player's current score while updating the high
score when applicable. Authenticated users persist scores to the database with
real-time updates.

### Game State Flow

Game sessions progress through these states:

1. **Initialization**: Fetch and shuffle card deck
2. **Active Play**: Display card pair and accept user guesses
3. **Result Display**: Show animated feedback for guess accuracy
4. **Game Over**: Navigate to loss page with final score

## Admin Management

### Card Management

Administrators can create, edit, and delete game cards through a visual
interface. The system supports bulk operations and search functionality across
card titles, categories, and years.

### Image Upload System

Card creation includes drag-and-drop image upload with real-time preview. Images
are processed automatically to generate thumbnails and convert to WebP format
for optimal performance.

### Loss GIF Configuration

Administrators configure loss GIFs based on score thresholds. Each GIF entry
includes category name, minimum score threshold, and image URL for display
customization.

### Content Search

Admin interfaces include search functionality for filtering cards by title,
category, or release year. Search results update automatically with debounced
input handling.

## API Endpoints

### Authentication Routes

```
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/forgot-password
POST /api/auth/verify-code
POST /api/auth/reset-password
```

### Game Routes

```
GET /api/cards/all
GET /api/cards/next
POST /api/cards/guess
GET /api/loss-gifs/current?score=X
```

### Score Management

```
POST /api/scores/update
GET /api/leaderboard?limit=X
```

### Admin Routes

```
GET /api/admin/cards?cursor=X&limit=Y&search=Z
POST /api/admin/cards-with-image
PUT /api/admin/cards/:id
DELETE /api/admin/cards/:id
GET /api/admin/loss-gifs
PUT /api/admin/loss-gifs/:id
DELETE /api/admin/loss-gifs/:id
```

### Request/Response Patterns

All API endpoints return JSON responses with consistent error message
formatting. Protected endpoints require Bearer token authentication with
automatic 401 responses for invalid tokens.

## Database Schema

### Users Collection

```javascript
{
  email: String (unique),
  username: String (unique),
  password: String (bcrypt hashed),
  role: String ("user" | "admin"),
  currentScore: Number (default: 0),
  highScore: Number (default: 0),
  createdAt: Date,
  resetCode: String (optional),
  resetCodeExpires: Date (optional)
}
```

### Cards Collection

```javascript
{
  title: String,
  year: Number (1000-2030),
  month: Number (1-12),
  imageUrl: String,
  thumbnailUrl: String,
  sourceUrl: String,
  category: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Loss GIFs Collection

```javascript
{
  category: String,
  streakThreshold: Number,
  imageUrl: String,
  thumbnailUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexes

- Users: `{ email: 1 }`, `{ username: 1 }`
- Cards: `{ year: 1 }`, `{ category: 1 }`, `{ year: 1, category: 1 }`
- Loss GIFs: `{ streakThreshold: 1 }`, `{ category: 1 }`

## Image Management

### S3 Integration

Image uploads automatically process through Sharp library to generate two
versions:

- **Thumbnail**: 256x320 pixels at 80% quality for grid displays
- **Large**: 640x800 pixels at 85% quality for full-size viewing

### Processing Options

Image upload supports two fit modes:

- **Scale**: Maintains aspect ratio with white background padding
- **Crop**: Fills target dimensions by cropping excess content

### File Validation

Upload system validates file types (JPEG, PNG, WebP) and enforces 10MB maximum
file size. Invalid uploads display clear error messages with retry options.

### URL Generation

S3 URLs include CDN-optimized paths with cache headers for improved performance.
Thumbnail URLs provide fallback for large image loading failures.

## Style & Theming

### CSS Architecture

Application uses CSS custom properties for consistent theming across components:

```css
:root {
  --primary-color: rgb(37, 99, 235);
  --before-blue: rgb(86, 54, 230);
  --before-red: rgb(214, 37, 37);
  --before-purple: rgb(121, 51, 209);
  --secondary-color: #4b5563;
  --background-color: #f8fafc;
  --text-color: #1e293b;
  --card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

### Component Styling

Each component uses scoped CSS classes to prevent style conflicts. Responsive
breakpoints use mobile-first approach with `min-width` media queries.

### Typography

Application uses system font stack for optimal performance:

```css
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
  Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
```

### Animation Patterns

CSS transitions provide smooth interactions with consistent timing functions.
Component animations use transform properties for optimal performance.

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Component rendering and prop handling
- **Integration Tests**: User interaction flows and API integration
- **Authentication Tests**: Login, logout, and token management
- **Game Flow Tests**: Complete gameplay session validation
- **Error Handling Tests**: Network failures and API error responses

### Backend Testing

- **API Tests**: Endpoint functionality and response validation
- **Database Tests**: Model operations and query performance
- **Authentication Tests**: Token generation and validation
- **Admin Tests**: Content management and role verification
- **Error Tests**: Invalid input handling and edge cases

### Test File Organization

```
tests/
├── unit/           # Individual component and function tests
├── integration/    # Multi-component interaction tests
├── mocks/          # Shared mock implementations
└── utils/          # Test utilities and helpers
```

### Test Execution

```bash
npm test                   # Run all tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage reports
```

## Responsive Design

### Breakpoint Strategy

- **Mobile**: < 768px (bottom navigation, stacked layouts)
- **Desktop**: ≥ 768px (top navigation, side-by-side layouts)

### Layout Patterns

Components adapt automatically based on viewport size using CSS media queries
and React hooks for dynamic behavior.

### Container Constraints

Global container system provides consistent content width with override options
for full-viewport components like leaderboards.

### Touch Optimization

Mobile interfaces use larger touch targets and appropriate spacing for finger
navigation. Form inputs include proper keyboard types for mobile devices.

## Error Handling

### Client-Side Errors

- Network failures display retry options with user-friendly messages
- Form validation provides real-time feedback with clear error descriptions
- Authentication errors trigger automatic logout with redirect handling
- API timeouts show loading states with fallback content

### Server-Side Errors

- Database connection failures return 500 status with generic error messages
- Authentication failures return 401 status with token refresh guidance
- Validation errors return 400 status with specific field error details
- Rate limiting returns 429 status with retry timing information

### Error Boundaries

React error boundaries catch component failures and display fallback UI without
crashing the entire application.

## Performance Considerations

### Database Optimization

- Indexed queries for common search patterns
- Aggregation pipelines for efficient data retrieval
- Connection pooling for concurrent request handling

### Frontend Optimization

- TanStack Query for intelligent caching and background updates
- Image lazy loading with intersection observer
- Component code splitting for reduced bundle sizes
- CSS variable usage for efficient style updates

### Caching Strategy

- API responses cached with appropriate TTL values
- Static assets served with long-term cache headers
- Database query results cached for repeated operations

### Bundle Size Management

- Dynamic imports for admin functionality
- Tree shaking to eliminate unused code
- Compression and minification in production builds
