# FilingsCenter

FilingsCenter is a Netlify-native template and rendering tool for managing business filing artwork. Administrators manage users, categories, sizes, and templates. Users personalize placeholders, preview on-canvas, and export production PNGs, all persisted with Netlify Functions + Netlify Blobs.

## Deploy

1. **Create a Netlify site** and connect this repository (or drag-and-drop).
2. Under **Site settings → Environment variables** set `JWT_SECRET` to a strong random string.
3. Deploy. The build command simply echoes and publishes the repository root.
4. After the first deploy, open `/public/admin.html` and run the one-time **Seed Admin** action.
5. Create categories, sizes, and templates. Upload base art, place placeholders, and save.
6. Create users, toggle active/inactive, rename, or delete as needed.
7. Users sign in at `/public/user.html`, manage their profile + logo, edit templates, and export PNG renders.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS with modular scripts, dynamic Google Font loading, and canvas rendering.
- **Backend:** Netlify Functions (Node 20) using TypeScript modules, JWT HttpOnly auth, and bcrypt password hashing.
- **Storage:** Netlify Blobs for JSON records and binary uploads (templates, logos, exports).

## Development

```bash
npm install
# run formatting if desired
npm run format
```

Functions live in `netlify/functions`. Static assets are inside `public/`.

## Environment Variables

See `.env.example` for required configuration. Locally you can use `netlify dev` with the same values.

## Security Notes

- Passwords are hashed with bcrypt; JWTs are issued as HttpOnly cookies.
- Rate limiting (per-IP, in-memory) applies on seed + login to mitigate brute force.
- Uploads validate MIME type and size for PNG/JPEG content.

