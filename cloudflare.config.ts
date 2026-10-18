import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

export default defineConfig(({ mode }) => ({
  worker: defineWorker({
    ...cache,
    name: mode === "validation" ? "bazaarghost-frontend-validation" : "bazaarghost",
    entrypoint: "vinext/server/fetch-handler",
    domains: mode === "validation" ? [] : ["bazaarghost.stream", "www.bazaarghost.stream"],
    workersDev: true,
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
      BACKEND: bindings.worker({
        worker: mode === "validation" ? "bazaarghost-validation" : (process.env.BACKEND_WORKER ?? "bazaarghost-validation"),
        dev: { remote: process.env.BACKEND_REMOTE === "true" },
      }),
    },
  }),
}));
