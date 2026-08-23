import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

const MIGRZ_APPLICATIONS_DATABASE_ID = "1149148f-0bb2-4a4b-bb58-df7c28fd3f63";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const productionRoutes = process.env.MIGRZ_ENABLE_CUSTOM_DOMAINS === "1"
  ? [
      { pattern: "migrzz.com/*", zone_name: "migrzz.com" },
      { pattern: "www.migrzz.com/*", zone_name: "migrzz.com" },
      { pattern: "apply.migrzz.com", custom_domain: true },
    ]
  : [];

const localBindingConfig = {
  name: "migrz-web",
  main: "./worker/index.ts",
  compatibility_date: "2026-08-21",
  compatibility_flags: ["nodejs_compat"],
  routes: productionRoutes,
  workers_dev: true,
  d1_databases: [{ binding: "DB", database_name: "migrz-applications", database_id: MIGRZ_APPLICATIONS_DATABASE_ID }],
  r2_buckets: [{ binding: "DOCUMENTS", bucket_name: "migrz-applicant-documents" }],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
