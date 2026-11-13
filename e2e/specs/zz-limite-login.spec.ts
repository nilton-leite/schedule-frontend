import { test, expect, request } from '@playwright/test';
import { knownBug } from '../fixtures/bug';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { API_URL, PASSWORD, USERS } = require('../qa-env');

/**
 * Roda por último (nome zz-): esgota o limite de login da API (10/min por IP).
 * Cenário real: toda a clínica sai pelo MESMO IP; no início do expediente (ou depois de um deploy, quando todos
 * precisam logar de novo) mais de 10 pessoas entram no mesmo minuto.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('QA-013: 12 funcionários logando no mesmo minuto (mesmo IP da clínica) conseguem entrar', async () => {
  knownBug('QA-013', 'limite de 10 logins/min por IP bloqueia a clínica inteira (todos saem pelo mesmo IP)');
  const ctx = await request.newContext({ baseURL: `${API_URL}/api/` });
  const status: number[] = [];
  for (let i = 0; i < 12; i++) {
    const r = await ctx.post('auth', { data: { username: USERS.recepcao.document, password: PASSWORD } });
    status.push(r.status());
  }
  await ctx.dispose();
  expect(status.filter((s) => s === 429), `respostas: ${status.join(',')}`).toHaveLength(0);
});

test('QA-013: quando o limite estoura, a tela de login explica que é preciso aguardar', async ({ page }) => {
  knownBug('QA-013', 'com 429 a tela diz "Usuário ou senha incorretos." (o usuário acha que errou a senha)');
  await page.goto('/');
  await page.getByPlaceholder('CPF').fill(USERS.recepcao.document);
  await page.getByPlaceholder('Senha').fill(PASSWORD); // senha CORRETA
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByText(/aguarde|muitas tentativas/i)).toBeVisible();
});
