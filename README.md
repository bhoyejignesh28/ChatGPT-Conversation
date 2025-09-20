# FilingsCenter Minimal Backend

This repository now includes the Netlify Function endpoints required to seed the first admin user, perform logins, and read the current session. Each handler ships with a reusable CORS helper so calls from any origin can complete successfully.

## Project layout

```
/netlify.toml
/package.json
/netlify/functions/_lib/cors.js
/netlify/functions/_lib/http.js
/netlify/functions/_lib/db.js
/netlify/functions/seed-admin.js
/netlify/functions/login.js
/netlify/functions/me.js
/public              # existing static assets
```

## Environment variables

Configure these in Netlify → **Site settings → Build & deploy → Environment** before deploying:

- `MONGODB_URI` – connection string for your MongoDB Atlas cluster.
- `MONGODB_DB` – optional, defaults to `filingscenter`.
- `JWT_SECRET` – random string used to sign JSON Web Tokens.

## Deploying on Netlify

1. Create or open your Netlify site and connect this repository.
2. In **Build settings**, leave the default branch (for example `main`). The build command is `npm i` and the publish directory is `public` as defined in `netlify.toml`.
3. Add the environment variables listed above.
4. Trigger a deploy.

## Available functions

All functions are available at `/.netlify/functions/<name>` when deployed.

### POST `seed-admin`
Creates the very first administrator account. Only works once; subsequent calls return HTTP 409.

Body:
```json
{ "email": "admin@example.com", "username": "admin", "password": "YourStrongPassword" }
```

### POST `login`
Verifies user credentials and returns a signed JWT token plus basic profile information.

Body:
```json
{ "email": "admin@example.com", "password": "YourStrongPassword" }
```

### GET `me`
Validates an incoming bearer token and returns the decoded payload when valid.

Header:
```
Authorization: Bearer <token-from-login>
```

## Local testing

Install dependencies and hit the functions with your preferred HTTP client:

```bash
npm install
netlify dev
```

Use the `seed-admin`, `login`, and `me` endpoints as demonstrated above. The `withCORS` helper automatically returns `204` for `OPTIONS` preflight requests and adds the required `Access-Control-*` headers for all responses.
