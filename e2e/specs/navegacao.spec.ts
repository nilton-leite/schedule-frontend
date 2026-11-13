import { test, expect } from '@playwright/test';
import { knownBug } from '../fixtures/bug';

test.use({ storageState: 'e2e/.auth/admin.json' });

test.describe('navegação', () => {
  for (const url of ['/pacientes', '/medicos', '/consultas', '/parametros/usuarios']) {
    test(`QA-014: abrir ${url} pelo endereço (ou recarregar a página) fica em ${url}`, async ({ page }) => {
      knownBug('QA-014', 'link direto / F5 numa tela interna sempre volta para /agenda');
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(`${url}$`));
    });
  }

  test('menu leva a cada tela e a URL acompanha', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    for (const [menu, url] of [['Pacientes', '/pacientes'], ['Médicos', '/medicos'], ['Consultas', '/consultas'], ['Agenda', '/agenda']]) {
      await page.locator('.pcoded-navbar').getByText(menu, { exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${url}$`));
    }
  });
});
