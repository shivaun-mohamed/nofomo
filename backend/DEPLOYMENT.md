# Shared Backend Deployment

The Flask API uses the JSON files when `DATABASE_URL` is unset. When
`DATABASE_URL` is set, it uses PostgreSQL and initializes the tables from
`schema.sql` at startup.

## Supabase

1. Create a Supabase project and copy its PostgreSQL connection string.
2. Keep the connection string private. Do not commit it to the repository or
   paste it into source files.
3. Before switching the API to the database, seed the existing sample clubs and
   events once from the repository root:

   ```powershell
   $env:DATABASE_URL = "<your Supabase PostgreSQL connection string>"
   py .\backend\seed_database.py
   ```

   The seed command leaves records with existing IDs unchanged, so it can be
   safely re-run without overwriting events submitted through the API.

## Render Flask API

Create a Render Web Service with `backend` as its root directory:

- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn api:app --bind 0.0.0.0:$PORT`
- Environment variable `DATABASE_URL`: the Supabase PostgreSQL connection string
- Environment variable `FRONTEND_ORIGINS`: the exact Cloudflare Pages origin,
  such as `https://your-project.pages.dev`

Render supplies `PORT`. Do not enable Flask debug mode in deployment.

## Cloudflare Pages Frontend

Configure the Pages project to use `no-fomo-app` as its root directory:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable `VITE_API_BASE_URL`: the deployed Render API origin,
  such as `https://your-api.onrender.com`

Leave `VITE_API_BASE_URL` unset locally; the Vite development proxy forwards
`/api` requests to local Flask.