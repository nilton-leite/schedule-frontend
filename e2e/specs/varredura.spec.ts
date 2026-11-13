import { test, expect, Page } from '@playwright/test';

/**
 * Varredura de robustez: abre cada tela PELO MENU (abrir a URL direto sempre cai na agenda — QA-014) e registra
 * erros de JavaScript, respostas 4xx/5xx da API e chamadas que saem do ambiente de QA (nunca podem ir para
 * produção). Anexa screenshot de cada tela ao relatório.
 */
const TODOS = ['admin', 'recepcao', 'medico'];
const TELAS = [
  { url: '/agenda', menu: ['Agenda'], perfis: TODOS },
  { url: '/consultas', menu: ['Consultas'], perfis: TODOS },
  { url: '/pacientes', menu: ['Pacientes'], perfis: TODOS },
  { url: '/medicos', menu: ['Médicos'], perfis: TODOS },
  { url: '/parametros/planos', menu: ['Parâmetros', 'Planos de Saúde'], perfis: ['admin'] },
  { url: '/parametros/especialidades', menu: ['Parâmetros', 'Especialidades'], perfis: ['admin'] },
  { url: '/parametros/usuarios', menu: ['Parâmetros', 'Usuários'], perfis: ['admin'] }
];

function monitorar(page: Page) {
  const problemas: string[] = [];
  page.on('pageerror', (e) => problemas.push(`JS: ${e.message}`));
  page.on('response', (r) => {
    const u = r.url();
    if (u.includes('/api/') && r.status() >= 400) problemas.push(`API ${r.status()} ${r.request().method()} ${u.replace(/^https?:\/\/[^/]+/, '')}`);
  });
  page.on('request', (r) => {
    if (/orlwambier|85\.31\.62\.71/.test(r.url())) problemas.push(`SAIU DO AMBIENTE: ${r.url()}`);
  });
  return problemas;
}

for (const perfil of ['admin', 'recepcao', 'medico'] as const) {
  test.describe(`varredura ${perfil}`, () => {
    test.use({ storageState: `e2e/.auth/${perfil}.json` });
    for (const tela of TELAS.filter((t) => t.perfis.includes(perfil))) {
      test(`${tela.url} sem erros (${perfil}) @cross`, async ({ page }, info) => {
        const problemas = monitorar(page);
        await page.goto('/agenda');
        await expect(page.locator('.fc')).toBeVisible();
        // Menu horizontal: o submenu (Parâmetros) abre ao passar o mouse no item pai.
        for (const [i, item] of tela.menu.entries()) {
          const alvo = page.locator('.pcoded-navbar').getByText(item, { exact: true });
          if (i < tela.menu.length - 1) await alvo.hover();
          else await alvo.click();
        }
        await expect(page).toHaveURL(new RegExp(tela.url.replace(/\//g, '\\/') + '$'));
        // (networkidle não serve aqui: o servidor de desenvolvimento mantém uma conexão de recarga sempre aberta)
        await page.waitForTimeout(1500);
        const foto = await page.screenshot({
          fullPage: true,
          path: `e2e/test-results/telas/${perfil}${tela.url.replace(/\//g, '_')}.png`
        });
        await info.attach(tela.url, { body: foto, contentType: 'image/png' });
        expect(problemas, problemas.join('\n')).toEqual([]);
      });
    }
  });
}
