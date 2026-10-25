# RSK app (Next.js)

A Next.js App Router app started from the RSK UI kit: the same components, blocks and `kit:update` as the Vite starter,
with server rendering, English and Arabic in the URL (`/en/…`, `/ar/…`), and sign-in through the app's own route
handlers.

```bash
vp create github:mohammadsafia/rsk-next-starter -- my-app
cd my-app
cp .env.example .env.local        # then set SESSION_SECRET=$(openssl rand -hex 32)
pnpm dev
```

Sign in with the demo account shown on the sign-in page (`AUTH_MOCK`, on in development).

## Deploying to Vercel

Import the repository and set `SESSION_SECRET` (and, once your API is ready, `API_URL` and `AUTH_MOCK=false`) in the
project's environment variables. That is the only configuration a deploy needs.

## Sessions

The API token lives in an encrypted, httpOnly cookie that only the server reads; the browser gets the user, never the
token. Sessions are stateless: signing out clears this browser's cookie, and a copied cookie stays valid until it
expires (8 hours). To revoke sessions at once, keep a session id on the server and check it in `src/server/session.ts`.
The proxy and the `(app)` layout send signed-out visitors to sign in; they are not authorization. Route handlers and
server actions call `getServerSession()` themselves. Add rate limiting where `app/api/auth/login/route.ts` says so.
