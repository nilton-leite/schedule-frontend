import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { knownBug } from '../fixtures/bug';

test.describe('Robustez', () => {
  test.use({ storageState: 'e2e/.auth/recepcao.json' });

  test('QA-020: se a API da agenda falhar, a tela avisa (não mostra a agenda vazia como se estivesse livre)', async ({ page }) => {
    knownBug('QA-020', 'erro ao carregar a agenda só vai para o console; a grade aparece vazia, sem aviso');
    await page.route('**/api/schedules/only**', (r) => r.fulfill({ status: 500, body: '{"statusCode":500}' }));
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    await page.getByRole('button', { name: /^Todas/ }).click();
    await expect(page.locator('.swal2-popup, .alert, [role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('API fora do ar no login: mensagem não diz que a senha está errada', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    knownBug('QA-021', 'qualquer falha no login (servidor fora, 429, 500) aparece como "Usuário ou senha incorretos."');
    await page.route('**/api/auth', (r) => r.abort('connectionrefused'));
    await page.goto('/');
    await page.getByPlaceholder('CPF').fill('10000000002');
    await page.getByPlaceholder('Senha').fill('qualquer');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText(/indispon|conex|tente novamente/i)).toBeVisible({ timeout: 5000 });
    await ctx.close();
  });
});

test.describe('Acessibilidade (axe) — violações críticas', () => {
  const telas: Array<[string, string | null, string]> = [
    ['login', null, '/'],
    ['agenda', 'e2e/.auth/recepcao.json', '/agenda'],
    ['confirmacao-antiga', null, '/confirmacao']
  ];
  for (const [nome, sessao, url] of telas) {
    test(`${nome}: sem violações críticas`, async ({ browser }, info) => {
      const ctx = await browser.newContext(sessao ? { storageState: sessao } : { storageState: { cookies: [], origins: [] } });
      const page = await ctx.newPage();
      await page.goto(url);
      await page.waitForTimeout(1500);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const resumo = r.violations.map((v) => `${v.impact} · ${v.id} (${v.nodes.length}) · ${v.help}`).join('\n');
      await info.attach(`axe-${nome}`, { body: resumo || 'sem violações', contentType: 'text/plain' });
      console.log(`[axe ${nome}]\n${resumo}`);
      const criticas = r.violations.filter((v) => v.impact === 'critical');
      if (criticas.length) knownBug('QA-022', `acessibilidade: ${criticas.map((v) => v.id).join(', ')}`);
      expect(criticas.map((v) => v.id)).toEqual([]);
      await ctx.close();
    });
  }
});
