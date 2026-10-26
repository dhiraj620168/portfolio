# Portfolio backend update notes

## Changes in this updated backend
- Removed `imageUrl` and `liveUrl` from profile update fields because they are not Profile schema fields.
- Added consistent type validation and trimming for project create/update inputs.
- Added basic uploaded-content signature checks for supported image types and PDF files, in addition to Multer MIME checks.
- Explicitly restricts JWT verification to HS256, matching the current `jsonwebtoken` signer defaults.
- Health endpoint now returns HTTP 503 when MongoDB is disconnected.
- Added `/api/experiences` routes using the existing Experience model:
  - `GET /api/experiences` (public list)
  - `POST /api/experiences` (admin)
  - `PUT /api/experiences/:id` (admin)
  - `DELETE /api/experiences/:id` (admin)
- Added `.env.example`; the actual `.env` is intentionally not included in this package.
- Updated `.gitignore` to ignore environment files while allowing `.env.example`.

## Setup
1. Copy `.env.example` to `.env` and fill in your local/production values.
2. Run `npm install` in this folder.
3. Create an admin using `npm run create-admin` after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Start with `npm run dev` or `npm start`.

## Verification performed
- All JavaScript files passed `node --check` syntax validation.
- Full live API/database integration tests were not run in this environment. Test against your own MongoDB and frontend before deploying.

## Important
The original uploaded archive contained a `.env` file. This updated archive excludes it. If the original file contained real secrets and was shared or committed anywhere, rotate those credentials/secrets.
