# FilingsCenter

FilingsCenter is a Netlify-first marketing collateral builder built with Next.js 14, React Query, Tailwind CSS, Netlify Functions, and Netlify Blobs. Administrators curate reusable flyer templates while agents personalise them in a live canvas editor and export production-ready PNGs. No external databases or auth providers are required.

## Features

- **Custom authentication** powered by Netlify Functions, bcrypt salted hashes, and JWT HttpOnly cookies.
- **Template governance**: admins manage users, categories, sizes, and layered templates with Google Font controls and base image uploads stored in Netlify Blobs.
- **Agent editor**: profile autofill, layer panel, colour picker with hex sync, drag-to-move, logo scaling, and one-click PNG exports persisted to Blobs.
- **Serverless storage**: JSON records for entities (`users`, `categories`, `sizes`, `templates`, `renders`) plus binary blobs for templates, logos, and exports.
- **Dark/light UI** with lucide-react icons, Tailwind CSS, and responsive layout.

## Project structure

```
app/                # App Router pages (landing, admin, user)
components/         # Shared UI (canvas, panels, controls, auth)
lib/                # Helpers for auth, fonts, fetch, blobs
netlify/functions/  # Serverless endpoints (auth, data CRUD, uploads, renders)
public/             # Static assets
styles/             # Tailwind configuration
```

## Prerequisites

- Node.js 20+
- Netlify CLI (`npm install -g netlify-cli`)

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template and set values:

   ```bash
   cp .env.example .env
   # update JWT_SECRET and SITE_URL if needed
   ```

3. Start the Netlify/Next.js dev environment:

   ```bash
   netlify dev
   ```

   Netlify CLI proxies `/api/*` to the corresponding Netlify Functions and serves the Next.js dev server.

4. Seed the first administrator (once per environment):

   ```bash
   curl -X POST http://localhost:8888/api/auth/seed-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","username":"Admin","password":"ChangeMe123"}'
   ```

   Afterwards sign in at `http://localhost:8888/login` with the seeded credentials.

## Deploying to Netlify

1. Push this repository to your Git provider and create a Netlify site linked to the repo, **or** zip the project and drag-and-drop into Netlify for a manual deploy.
2. In Netlify **Site settings → Environment variables**, set:

   ```
   JWT_SECRET=change_me_strong_secret
   SITE_URL=https://your-site.netlify.app
   ```

3. The included `netlify.toml` already configures the Next.js plugin, function bundling, and API redirects. Builds run `npm run build`.

4. Use `netlify deploy --prod` to trigger a manual deploy if desired.

## Managing Blobs data

All JSON and binary data live in Netlify Blobs namespaces. Access them via the Netlify dashboard:

- **Site dashboard → Data → Blobs**: browse stores (`users/`, `categories/`, `sizes/`, `templates/`, `renders/`, `uploads/`).
- Each entity is a standalone JSON blob; uploads (base images, logos, exports) live under `uploads/...`.

## Available Netlify Functions

- `auth-seed-admin`, `auth-register`, `auth-login`, `auth-logout`, `auth-me`
- `users`, `users-status`, `users-rename`
- `categories`, `sizes`
- `templates`, `templates-base`
- `profile`, `uploads-logo`
- `renders`

All protected routes verify JWTs and enforce role-based access.

## Seeding reference data

To quickly populate categories/sizes you can call the REST endpoints, for example:

```bash
curl -X POST https://your-site.netlify.app/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Open House"}'

curl -X POST https://your-site.netlify.app/api/sizes \
  -H "Content-Type: application/json" \
  -d '{"name":"Letter", "w":2550, "h":3300}'
```

## Testing

Run type checking and linting via Next.js:

```bash
npm run lint
```

Netlify builds execute `npm run build` which includes production type-checking.

## Notes

- Authentication relies on HttpOnly cookies; requests to `/api/*` automatically include credentials via the `fetchJSON` helper.
- Google Fonts are loaded on demand per placeholder selection.
- Canvas export uses the full template dimensions for sharp PNG output and simultaneously persists user renders to Netlify Blobs.
