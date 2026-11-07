const MODE = import.meta.env.MODE;

export const SITE_URL =
  MODE === "validation"
    ? "https://bazaarghost-frontend-validation.kaio-8df.workers.dev"
    : MODE === "preview"
      ? "https://preview.bazaarghost.stream"
      : "https://bazaarghost.stream";

export const INDEXABLE = MODE !== "validation" && MODE !== "preview";
