import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/admin.json' });

const fim = (url: string) => new RegExp(url.replace(/\//g, '\\/') + '$');

test.describe('navegação', () => {
  for (const url of ['/pacientes', '/medicos', '/consultas', '/parametros/usuarios']) {
    test(`abrir ${url} pelo endereço (ou recarregar a página) fica em ${url} — QA-014 corrigido`, async ({ page }) => {
      await page.goto(url);
      await expect(page).toHaveURL(fim(url));
      await page.waitForTimeout(2000); // um redirecionamento tardio para a agenda também reprova
      await expect(page).toHaveURL(fim(url));
      await expect(page.locator('.fc')).toHaveCount(0); // não é a agenda
      await page.reload();
      await expect(page).toHaveURL(fim(url));
    });
  }

  test('menu leva a cada tela e a URL acompanha', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    for (const [menu, url] of [['Pacientes', '/pacientes'], ['Médicos', '/medicos'], ['Consultas', '/consultas'], ['Agenda', '/agenda']]) {
      await page.locator('.pcoded-navbar').getByText(menu, { exact: true }).click();
      await expect(page).toHaveURL(fim(url));
    }
  });
});
