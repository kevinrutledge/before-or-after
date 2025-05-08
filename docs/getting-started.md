# Getting Started

Welcome to **Before or After**. This guide shows you how to set up your local
environment and run the app. For architecture and component details, see the
[Developer Guide](developer-guide.md).

## Prerequisites

- **Node.js** v18 or higher and **npm**
- **MongoDB** Atlas or local instance
- **AWS S3** credentials (_preconfigured by Kevin Rutledge_)

> NOTE: The S3 bucket is already set up. You don’t need to provision or
> configure AWS resources.

## Clone & Install

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/your-org/before-or-after.git \
     && cd before-or-after \
     && npm ci
   ```

> TIP: Using `npm ci` ensures a reproducible build via the lockfile.

## Environment Variables

1. Copy the example file to the root directory:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and set required variables:

   ```bash
   MONGO_URI=<your-mongo-connection-string>
   PORT=8000
   SESSION_SECRET=<your_session_secret_here>
   S3_REGION=<provided-by-admin>
   S3_BUCKET_NAME=<provided-by-admin>
   AWS_ACCESS_KEY_ID=<provided-by-admin>
   AWS_SECRET_ACCESS_KEY=<provided-by-admin>
   ```

> NOTE: Kevin Rutledge manages AWS bucket and credentials. Use the values he
> provides.

## Running the App

Start both backend and frontend with one command:

```bash
npm run dev
```

- **Backend** runs at `http://localhost:8000`
- **Frontend** runs at `http://localhost:5173`

> TIP: To run services separately:
>
> - `npm run dev:backend`
> - `npm run dev:frontend`

## Linting & Formatting

Ensure consistent code style:

- Check for issues:

  ```bash
  npm run lint
  ```

- Auto-fix problems:

  ```bash
  npm run lint:fix
  ```

## Testing

Run all tests with:

```bash
npm test
```

- **Backend tests:** `packages/express-backend/tests/`
- **Frontend tests:** `packages/react-frontend/tests/`

## Project Structure

A minimal layout for MVP, expanding subfolders only when needed:

```text
/ (repo root)
├── .github/               # CI workflows & issue/PR templates
├── docs/                  # Markdown guides (onboarding, dev guide)
├── packages/
│   ├── express-backend/   # API server
│   │   ├── controllers/   # HTTP handlers (create when >2 files)
│   │   ├── models/        # Mongoose schemas (create when >2 files)
│   │   └── index.js       # Entry point (imports config)
│   └── react-frontend/    # SPA client
│       ├── components/    # Shared React components (start with 1–2 files)
│       ├── pages/         # Route views (Home, Game, Loss, Login, Signup, Admin)
│       └── main.jsx       # Entry point (router & Layout)
└──package.json           # Workspace config & root scripts
```

> NOTE: Only introduce `services`, `middleware`, or `hooks` folders once you
> have at least three related files.
