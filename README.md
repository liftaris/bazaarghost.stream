# BazaarGhost

Frontend for [bazaarghost.stream](https://bazaarghost.stream): vinext (Next.js App Router on Vite) on Cloudflare Workers. Data, sessions and authorization live in the backend Worker, reached through the `BACKEND` service binding.

## Local development

```sh
npm install
npm run dev                          # backend Worker must run locally
BACKEND_REMOTE=true npm run dev      # use the hosted validation backend (needs a Cloudflare login)
```

### Signed-in flows without OAuth

The validation backend has no OAuth providers configured, so sign-in can't complete locally. To try login, account, bookmarks and saved matchups, run with the dev-only auth mock:

```sh
BACKEND_REMOTE=true VITE_AUTH_MOCK=1 npm run dev
```

Sign in with either provider button; a fake consent step signs you in. The mock (`lib/auth-mock.ts`) handles `/api/auth/*` and the favorites routes, and keeps its state in memory until the dev server restarts. All other API calls still go to the backend. It only runs when `import.meta.env.DEV` is true and is stripped from production builds.

## Checks

```sh
npm run typecheck   # TypeScript 7 (`tsc`)
npm run lint        # ESLint; typescript-eslint uses the TS 6 API package
npm run build
```
