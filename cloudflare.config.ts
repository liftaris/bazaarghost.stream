import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

/** Validation and preview read the validation backend; nothing but production touches production data. */
const TARGETS = {
  validation: {
    name: "bazaarghost-frontend-validation",
    domains: [],
    backend: "bazaarghost-validation",
  },
  preview: {
    name: "bazaarghost-preview",
    domains: ["preview.bazaarghost.stream"],
    backend: "bazaarghost-validation",
  },
} as const;

export default defineConfig(({ mode }) => {
  const target = TARGETS[mode as keyof typeof TARGETS];
  return {
    worker: defineWorker({
      ...cache,
      name: target?.name ?? "bazaarghost",
      entrypoint: "worker/entry.ts",
      domains: target
        ? [...target.domains]
        : ["bazaarghost.stream", "www.bazaarghost.stream"],
      workersDev: mode === "validation",
      observability: {
        enabled: true,
        headSamplingRate: 1,
        redactQueryString: true,
        issues: { enabled: true },
        traces: { enabled: true, headSamplingRate: 0.1 },
      },
      compatibilityDate: "2026-10-17",
      compatibilityFlags: ["nodejs_compat"],
      assets: {
        htmlHandling: "none",
        notFoundHandling: "none",
        runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
      },
      env: {
        ...cache.env,
        ASSETS: bindings.assets(),
        IMAGES: bindings.images(),
        VINEXT_KV_CACHE: bindings.kv(),
        REPORTS: bindings.kv(),
        REPORT_LIMITER: bindings.rateLimit({
          namespace: "1001",
          simple: { limit: 5, period: 60 },
        }),
        FLAGS: bindings.flagship({
          id: "836d1b9e-a6e4-4db8-b342-cd991811e839",
        }),
        BACKEND: bindings.worker({
          worker:
            target?.backend ??
            process.env.BACKEND_WORKER ??
            (mode === "production"
              ? "bazaarghost-production"
              : "bazaarghost-validation"),
          dev: { remote: process.env.BACKEND_REMOTE === "true" },
        }),
      },
    }),
  };
});
