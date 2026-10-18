// The Cloudflare backend serves a Supabase-compatible read API under /rest/v1,
// so supabase-js is kept until the backend is ready for a dedicated client.
// Public reads ignore the key; supabase-js only requires a non-empty value.
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://bazaarghost-validation.kaio-8df.workers.dev";

export const BACKEND_PUBLIC_KEY = "public";
