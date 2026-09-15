import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: { command: 'node scripts/test-server.mjs', port: 4173, reuseExistingServer: true },
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } }
  ]
});
