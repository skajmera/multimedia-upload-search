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

**Frontend on Vercel, backend on Railway or Render.** Vercel serverless
functions cap request bodies at ~4.5MB, which breaks video/audio uploads under
this app's design (the backend streams the raw upload straight through to
Cloudinary — see `backend/src/middleware/upload.js`). Railway/Render run the
Express server as a normal always-on process, so there's no such limit; the
task's own deliverables list Vercel/Railway as interchangeable examples, not a
requirement, so this sidesteps the issue entirely rather than needing to
rework the upload flow into a direct-from-browser-to-Cloudinary scheme.

### Backend → Railway (or Render)

1. Create a new project from this repo, with **root directory set to `backend/`**.
2. Set environment variables in the platform's dashboard: `MONGO_URI`,
   `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`,
   `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NODE_ENV=production`, and
   `CLIENT_ORIGIN` (set this once you have the Vercel URL, e.g.
   `https://your-app.vercel.app`).
3. Build command: `npm install`. Start command: `npm start` (also declared in
   `backend/Procfile` for platforms that read one).
4. After deploy, confirm `https://<your-backend-url>/health` returns
   `{"success":true,"status":"ok"}` and `/api-docs` loads Swagger.

### Frontend → Vercel

1. Import this repo into Vercel with **root directory set to `frontend/`**
   (Vercel auto-detects the Vite build; build command `npm run build`, output
   `dist`).
2. Set the environment variable `VITE_API_BASE_URL` to your deployed backend's
   API base, e.g. `https://your-backend.up.railway.app/api`.
3. Redeploy after setting env vars (Vite inlines them at build time, so a
   later change needs a rebuild, not just a restart).
4. Update the backend's `CLIENT_ORIGIN` to the resulting `https://*.vercel.app`
   URL so CORS allows it.
