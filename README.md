# Expense Tracker

This repository contains a combined frontend (Vite + React) and backend (Express + MongoDB) app.

Quick setup:

1. Install both frontend and backend dependencies:

```bash
npm run install-all
```

2. Create a `.env` file in `backend/` with the following variables:

```
MONGODB_URI=your-mongodb-uri
CLERK_SECRET_KEY=your-clerk-secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable
PORT=4000
```

3. Start both frontend and backend in development with a single command from the project root:

```bash
npm run dev
```

This runs the backend on port 4000 and the frontend on port 5173. During development the Vite server proxies any request starting with `/api` to the backend, so the frontend can call `/api/expenses` without changing the code.

If you deploy to production, build the frontend (`npm --prefix frontend run build`) and serve the `frontend/dist` files from the backend (optional)."