const VALIDATION = import.meta.env.MODE === "validation";

export const SITE_URL = VALIDATION
  ? "https://bazaarghost-frontend-validation.kaio-8df.workers.dev"
  : "https://bazaarghost.stream";

export const INDEXABLE = !VALIDATION;
