import { test, expect } from '@playwright/test';
import { knownBug } from '../fixtures/bug';

test.use({ storageState: 'e2e/.auth/admin.json' });

/** Tela parada não pode ficar chamando a API em loop (gasta servidor e bateria/dados do usuário). */
const TELAS: Array<[string, string[]]> = [
  ['/agenda', ['Agenda']],
  ['/consultas', ['Consultas']],
  ['/pacientes', ['Pacientes']],
  ['/medicos', ['Médicos']]
];

for (const [url, menu] of TELAS) {
  test(`${url}: parada por 10 s não fica chamando a API`, async ({ page }, info) => {
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    if (url !== '/agenda') await page.locator('.pcoded-navbar').getByText(menu[0], { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(url + '$'));
    await page.waitForTimeout(3000); // carga inicial
    const chamadas: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/')) chamadas.push(`${r.method()} ${r.url().replace(/^https?:\/\/[^/]+/, '').split('?')[0]}`);
    });
    await page.waitForTimeout(10_000);
    const resumo = Object.entries(chamadas.reduce((a: Record<string, number>, c) => ({ ...a, [c]: (a[c] || 0) + 1 }), {}))
      .map(([k, v]) => `${v}× ${k}`)
      .join('\n');
    await info.attach('chamadas em 10 s', { body: resumo || '(nenhuma)', contentType: 'text/plain' });
    console.log(`[${url}] ${chamadas.length} chamadas em 10 s\n${resumo}`);
    if (chamadas.length > 2) knownBug('QA-015', `tela parada fazendo ${chamadas.length} chamadas em 10 s`);
    expect(chamadas.length, resumo).toBeLessThanOrEqual(2);
  });
}
