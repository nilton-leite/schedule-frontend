import { test, expect } from '@playwright/test';

// Fumaça: cada perfil entra e vê a agenda sem erro de JavaScript.
for (const perfil of ['admin', 'recepcao', 'medico'] as const) {
  test.describe(`fumaça ${perfil}`, () => {
    test.use({ storageState: `e2e/.auth/${perfil}.json` });

    test(`agenda abre para ${perfil} @smoke`, async ({ page }) => {
      const errosJs: string[] = [];
      page.on('pageerror', (e) => errosJs.push(e.message));
      await page.goto('/agenda');
      await expect(page.locator('.fc')).toBeVisible({ timeout: 30_000 }); // FullCalendar renderizado
      await expect(page.getByText('Parâmetros')).toHaveCount(perfil === 'admin' ? 1 : 0);
      expect(errosJs, 'erros de JavaScript na página').toEqual([]);
    });
  });
}
