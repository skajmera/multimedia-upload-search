# Multimedia Upload & Search

A full-stack app for uploading multimedia files (images, videos, audio, PDFs) with
authentication, keyword search, and relevance ranking. Built for the Adsiduous/Santa
Browser technical assessment.

## Stack

- **Frontend:** React (Hooks) + Redux Toolkit + SCSS, built with Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB (Atlas) for file metadata
- **Storage:** Cloudinary for the actual media files
- **Auth:** JWT (bearer tokens)
- **Docs:** Swagger / OpenAPI at `/api-docs`

## Project structure

```
backend/    Express API, MongoDB models, Cloudinary upload, Swagger docs, Jest tests
frontend/   React + Redux Toolkit SPA (Vite)
```

## Running locally

### Prerequisites

- Node.js 18+
- A MongoDB Atlas connection string (or any MongoDB instance)
- A Cloudinary account (cloud name, API key, API secret)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, CLOUDINARY_* values
npm run dev             # starts on http://localhost:5000
```

Swagger UI: `http://localhost:5000/api-docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # starts on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`, so no
separate frontend `.env` is needed for local development.

### 3. Tests (backend)

```bash
cd backend
npm test
```

Tests use `mongodb-memory-server` (an in-memory MongoDB), so no live database is
needed. They cover registration/login/auth guarding and search/ranking/filtering
behavior. Upload is not covered by automated tests since it requires a live
Cloudinary account; it was verified manually against a real Cloudinary bucket.

## API overview

| Method | Endpoint            | Auth | Description                              |
|--------|----------------------|------|-------------------------------------------|
| POST   | /api/auth/register    | No   | Create an account, returns a JWT          |
| POST   | /api/auth/login       | No   | Log in, returns a JWT                     |
| GET    | /api/auth/me          | Yes  | Current user                              |
| POST   | /api/files/upload     | Yes  | Upload a file (multipart `file` field)    |
| GET    | /api/files/search     | Yes  | Search/filter/sort files                  |
| GET    | /api/files/mine       | Yes  | Files owned by the current user           |
| GET    | /api/files/:id        | Yes  | Get one file, increments its view count   |
| DELETE | /api/files/:id        | Yes  | Delete a file (owner only)                |

Full request/response schemas are in Swagger at `/api-docs`.

## Search & ranking

`GET /api/files/search?query=...&type=...&sort=relevance|date|views`

- Keyword matching uses a MongoDB text index over `fileName` and `tags`.
- The default `relevance` sort blends three signals: text-match strength (60%),
  popularity via `viewCount` (25%), and recency with a ~30-day decay (15%). When
  there's no `query`, it falls back to popularity + recency only.
- `type` filters to `image | video | audio | pdf`.
- `sort=date` and `sort=views` are simple overrides for users who want a strict
  chronological or most-viewed ordering instead.

## Security notes

- Passwords are hashed with bcrypt; the hash is never returned in API responses.
- JWTs expire (`JWT_EXPIRES_IN`, default 1 day).
- Uploads are restricted by MIME type (image/video/audio/pdf only) and capped at
  25MB via `multer`'s `limits.fileSize`.
- All file routes require a valid bearer token; delete is additionally restricted
  to the file's owner.
- The frontend stores the JWT in `localStorage` for simplicity (matches the task's
  "localStorage" option). An HTTP-only cookie would be more resistant to XSS token
  theft and is a reasonable follow-up if this were going to production.

## Known limitations / assumptions

- No refresh-token flow — a single JWT is issued at login/register and expires
  after `JWT_EXPIRES_IN`.
- No WebSocket/real-time upload notifications (listed as an optional stretch goal).
- No fuzzy search — the MongoDB text index does stemmed/tokenized matching, not
  typo-tolerant fuzzy matching.

## Deployment

Deployed as two separate Vercel projects from this repo:

- **Frontend:** https://multimedia-upload-search-frontend-mssga3ko1.vercel.app
- **Backend:** deployed from `backend/` as a Vercel serverless function
  (`backend/api/index.js` wraps the Express app; `backend/vercel.json`
  rewrites every path to it; `src/config/db.js` caches the Mongoose
  connection across warm invocations instead of reconnecting per request).

**Caveat:** Vercel serverless functions cap request bodies at ~4.5MB. This
app streams uploads straight through to Cloudinary (`backend/src/middleware/upload.js`)
rather than buffering them, but the 4.5MB cap is enforced by Vercel before
the function even runs — so video/audio files above that size will fail to
upload on this deployment, even though the app's own configured limit is
25MB. Images and PDFs under ~4.5MB work fine. If large media uploads matter
for evaluation, the backend can instead be redeployed to Railway or Render
(both run Express as a normal always-on process with no such cap) with no
code changes beyond the standard `npm install` / `npm start` — see
`backend/Procfile`.

### Redeploying

```bash
# Frontend
cd frontend && vercel deploy --prod

# Backend
cd backend && vercel deploy --prod
```

### Required environment variables

Frontend (`VITE_API_BASE_URL`) and backend (`MONGO_URI`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, `CLIENT_ORIGIN`) must be set in each Vercel
project's dashboard (Settings → Environment Variables) before the app will
actually connect to a database or accept uploads — see `.env.example` in
each folder for what's needed.
