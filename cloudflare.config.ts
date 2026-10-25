/**
 * Cloudflare project configuration used by the `cf` CLI for local development
 * (`npm run dev`) and for deployment (`npm run deploy`, `cf deploy --prebuilt`).
 *
 * The values below are part of the production contract: the worker name and the
 * custom domain are baked into README embeds, so they must stay stable.
 */
import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
  worker: {
    // Worker name shown in the dashboard and used by the deploy step.
    name: "siyuan-bazaar-stats-graph",
    // Runtime surface the bundle is compiled against; changing it is a code change.
    compatibilityDate: "2026-10-19",
    // Module entry point: the default export's fetch() handler.
    entrypoint,
    // Custom domain attached to the worker. workers.dev is DNS-blocked in
    // mainland China, so the service is only published on this hostname.
    domains: ["siyuan-bazaar-stats-graph.sr1.cc.cd"],
    observability: {
      // Enable the dashboard metrics and the log pipeline for every invocation.
      enabled: true,
      // Chart URLs contain owner/repo and query parameters; keep them out of logs.
      redactQueryString: true,
      // Invocation logs: enable the pipeline, record each request, persist the output.
      logs: {
        enabled: true,
        invocationLogs: true,
        persist: true,
      },
    },
  },
});
