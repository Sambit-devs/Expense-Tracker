# Expense Tracker

This repository contains a frontend (Vite + React) in `frontend/` and a backend (Express + MongoDB) in `backend/`.

Goal: make it trivial for someone who downloads the repo as a ZIP to run the app locally with minimal setup.

Prerequisites
- Node.js (recommended LTS: 18 or 20). Verify with `node -v` and `npm -v`.
- A MongoDB connection string (Atlas or local MongoDB). If you want to run without signing in, see the Troubleshooting section.

Quick start (recommended)

1. Unzip the repository and open a terminal in the project root.

2. Install both backend and frontend dependencies from the project root:

```bash
npm run install-all
```

From the project root run:

```bash
npm run dev
```

What this does:
- Installs: runs the `dev` script in `backend/` (starts `nodemon server.js`) and `frontend/` (`vite` dev server).
- Backend default port: 4000 (unless `PORT` in `backend/.env` overrides it).
- Frontend default port: 5173 (Vite).

Opening the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/expenses

Production / build

To build the frontend and serve static files from the frontend build (optional):

```bash
npm --prefix frontend run build
# then serve the files in frontend/dist using a static server or copy them into backend's static folder.
```

Useful npm scripts (added to root `package.json`)
- `npm run install-all` — install dependencies in both `backend/` and `frontend/`.
- `npm run dev` — start backend and frontend dev servers in parallel (recommended during development).
- `npm run start-backend` — start the backend only.
- `npm run start-frontend` — preview the built frontend.
