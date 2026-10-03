# StudyMind Phase 1

A runnable MERN learning companion starter with JWT authentication, profile and password management, responsive React UI, and a clean dashboard shell.

## Run

1. `cd StudyMind`
2. Create a local `.env` from `.env.example` and set a strong `JWT_SECRET` (minimum 32 characters).
3. `npm install`
4. `npm run dev` starts the API on `5000` and the Vite client on `5173`.
5. `npm run dev:memory` starts the API with MongoDB Memory Server.

## Environment

- `PORT` defaults to `5000` and is validated.
- `MONGO_URI` is required unless `USE_MEMORY_DB=true`.
- To enable the optional AI Assistant, add a Google AI Studio Gemini key as `GEMINI_API_KEY` in the server `.env` file. The key is never sent to the browser.
- The default Gemini model is `gemini-3.5-flash-lite`; change `GEMINI_MODEL` if your Google AI Studio account exposes a different available model.
- Recurring reminders are stored as one owned series with virtual Asia/Kolkata occurrences. Completion, snoozing, dismissal, and missed state are tracked per occurrence without creating unbounded reminder documents.
- `JWT_SECRET` must be at least 32 characters and must not use the removed dev fallback.
- `CLIENT_ORIGIN` must be a valid origin URL such as `http://localhost:5173`.
- `TRUST_PROXY` defaults to `false`.
- `AUTH_RATE_LIMIT_MAX` defaults to `10`; `GENERAL_RATE_LIMIT_MAX` defaults to `300`.

## API

- `POST /api/auth/register` and `POST /api/auth/login` are limited to 10 requests per 15 minutes.
- All other `/api` routes are limited to 300 requests per 15 minutes.
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/change-password`
- `POST /api/auth/logout`

Authentication is maintained in an `HttpOnly`, `Secure` (in production), `SameSite=Strict`
cookie. The client sends requests with credentials enabled; JWTs are not stored in browser
storage. State-changing requests that include an auth cookie must come from `CLIENT_ORIGIN`.
Logging out and changing a password invalidate previously issued sessions.

## Validation

- `npm test`
- `npm run lint`
- `npm run build`

The seed script remains guarded behind an explicit `SEED=true` flag; it does not run automatically.
