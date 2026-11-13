import { defineConfig, devices } from '@playwright/test';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { API_URL, WEB_URL, WEB_PORT } = require('./qa-env');

/**
 * Suíte de QA ponta a ponta da Agenda (Playwright).
 * Sobe uma API e um front SÓ para os testes (portas 3433/3401), com banco descartável e WhatsApp desligado.
 *   npm run e2e            -> tudo (Chromium + Firefox + confirmação no iPhone)
 *   npm run e2e:smoke      -> só @smoke no Chromium
 *   npm run e2e:report     -> abre o relatório HTML
 */
export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  fullyParallel: false, // os testes dividem um banco; a agenda é sensível a horários já ocupados
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: './report', open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } }, dependencies: ['setup'] },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } },
      dependencies: ['setup'],
      grep: /@smoke|@cross/
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
      testMatch: /confirmacao\.spec\.ts/
    }
  ],
  webServer: [
    {
      command: 'node scripts/start-api.js',
      url: `${API_URL}/api/healthcheck`,
      timeout: 240_000,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe'
    },
    {
      command: 'npx react-scripts start',
      cwd: '..',
      url: WEB_URL,
      timeout: 240_000,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        PORT: String(WEB_PORT),
        BROWSER: 'none',
        API_PROXY_TARGET: API_URL,
        NODE_OPTIONS: '--openssl-legacy-provider',
        // Sem overlay de erro do CRA cobrindo a tela durante os testes.
        DISABLE_ESLINT_PLUGIN: 'true',
        FAST_REFRESH: 'false'
      }
    }
  ]
});
