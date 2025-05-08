# Getting Started

Welcome to **Before of After**. This guide helps you set up your local
development environment, configure your IDE for consistent styling, and run the
application and its tests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone & Install](#clone--install)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Linting & Formatting](#linting--formatting)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Prerequisites

- **Node.js** v18+ and **npm**
- **MongoDB** Atlas or local instance
- **AWS S3** bucket (for image storage)

---

## Clone & Install

1. **Clone the repo**
   ```bash
   git clone https://github.com/kevinrutledge/before-or-after.git
   cd before-or-after
   ```
2. **Install dependencies** (root workspace)
   ```bash
   npm install
   ```
   This installs both backend and frontend packages via npm workspaces.

---

## Environment Variables

Copy the example env file for the backend and fill in your secrets:

```bash
cp packages/express-backend/.env.example packages/express-backend/.env
```

Open `packages/express-backend/.env` and set:

```
MONGO_URI=<your-mongo-connection-string>
PORT=8000
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_S3_BUCKET=<your-bucket-name>
AWS_S3_REGION=<your-bucket-region>
```

No `.env` needed in the frontend.

---

## Running the App

Start both servers in parallel:

```bash
npm run dev    # starts backend on http://localhost:8000 and frontend on http://localhost:5173
```

- **Backend**: `npm run dev:backend`
- **Frontend**: `npm run dev:frontend`

To run in production mode (build+serve):

```bash
# Build frontend
npm run build --prefix packages/react-frontend
# Serve static build and backend
npm start
```

---

## Linting & Formatting

We use ESLint and Prettier for code quality.

- **Check**:
  ```bash
  npm run lint
  ```
- **Auto-fix**:
  ```bash
  npm run lint:fix
  ```

---

## Testing

### Backend Tests

```bash
npm test --prefix packages/express-backend
```

### Frontend Tests

```bash
npm test --prefix packages/react-frontend
```

---

## Project Structure

```
/ (repo root)
├── .github/                 # CI workflows & templates
├── docs/                    # Documentation files
├── packages/
│   ├── express-backend/     # API server
│   │   ├── config/          # DB, S3, logger setup
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth & error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business & S3 logic
│   │   ├── tests/           # Jest + Supertest tests
│   │   └── src/index.js     # Server entrypoint
│   └── react-frontend/      # SPA client
│       ├── public/          # Static files + index.html
│       ├── src/
│       │   ├── api/         # Fetch wrappers
│       │   ├── components/  # UI & layout
│       │   ├── hooks/       # Custom React hooks
│       │   ├── pages/       # Route components
│       │   └── styles/      # Global CSS & resets
│       ├── tests/           # RTL + Jest tests
│       └── src/main.jsx     # Client entrypoint
├── package.json             # Root workspace config & scripts
└── package-lock.json
```

---

## Developer Guide

For more details on the project’s scope, architecture, and component
specifications, please refer to the [Developer Guide](developer-guide.md).
