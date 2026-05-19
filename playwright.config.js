import { defineConfig } from "@playwright/test";

const remoteBase = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: remoteBase || "http://127.0.0.1:4173",
  },
  // Skip local server when running against a deployed preview
  webServer: remoteBase
    ? undefined
    : {
        command: "npx serve . -l 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: true,
      },
});
