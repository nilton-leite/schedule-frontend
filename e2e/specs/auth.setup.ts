import { test as setup, expect } from '@playwright/test';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PASSWORD, USERS } = require('../qa-env');

// Faz login uma vez por perfil e guarda a sessão (localStorage) para os demais testes.
for (const perfil of ['admin', 'recepcao', 'medico'] as const) {
  setup(`login ${perfil}`, async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('CPF').fill(USERS[perfil].document);
    await page.getByPlaceholder('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(/\/agenda/, { timeout: 30_000 });
    await page.context().storageState({ path: `e2e/.auth/${perfil}.json` });
  });
}
