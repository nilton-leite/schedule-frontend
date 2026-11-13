import { test, expect, request } from '@playwright/test';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { API_URL, PASSWORD, USERS } = require('../qa-env');

/**
 * Limite de login (QA-013): por CPF (5 erros em 15 min bloqueiam aquele CPF) e, por IP, só contra ataque em massa.
 * Cenário real: toda a clínica sai pelo MESMO IP; no início do expediente ou depois de um deploy (todos relogam)
 * mais de 10 pessoas entram no mesmo minuto. Roda por último (nome zz-) porque bloqueia um CPF de propósito.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('QA-013: 12 funcionários logando no mesmo minuto (mesmo IP da clínica) conseguem entrar', async () => {
  const ctx = await request.newContext({ baseURL: `${API_URL}/api/` });
  const status: number[] = [];
  for (let i = 0; i < 12; i++) {
    const r = await ctx.post('auth', { data: { username: USERS.recepcao.document, password: PASSWORD } });
    status.push(r.status());
  }
  await ctx.dispose();
  expect(status.filter((s) => s === 429), `respostas: ${status.join(',')}`).toHaveLength(0);
});

test('QA-013/021: senha errada 5 vezes no mesmo CPF → "incorretos" e depois "aguarde"', async ({ page }) => {
  // CPF que nenhum outro teste usa (a contagem é igual para CPF inexistente: não revela quais existem).
  const cpf = '10000000099';
  await page.goto('/');
  for (let i = 0; i < 5; i++) {
    await page.getByPlaceholder('CPF').fill(cpf);
    await page.getByPlaceholder('Senha').fill(`errada-${i}`);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('Usuário ou senha incorretos.')).toBeVisible();
  }
  await page.getByPlaceholder('Senha').fill('outra-errada');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByText(/Muitas tentativas de login com este CPF\. Aguarde \d+ minutos?/)).toBeVisible();
});
