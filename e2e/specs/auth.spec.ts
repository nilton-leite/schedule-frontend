import { test, expect } from '@playwright/test';
import { knownBug } from '../fixtures/bug';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PASSWORD, USERS } = require('../qa-env');

// Sem sessão: cada teste faz o próprio login. (Poucos logins por arquivo: o limite da API é 10/min por IP.)
test.use({ storageState: { cookies: [], origins: [] } });

async function login(page: import('@playwright/test').Page, cpf: string, senha: string) {
  await page.goto('/');
  await page.getByPlaceholder('CPF').fill(cpf);
  await page.getByPlaceholder('Senha').fill(senha);
  await page.getByRole('button', { name: 'LOGIN' }).click();
}

test.describe('Autenticação e sessão', () => {
  test('senha errada mostra mensagem e não entra', async ({ page }) => {
    await login(page, USERS.recepcao.document, 'senha-errada');
    await expect(page.getByText('Usuário ou senha incorretos.')).toBeVisible();
    await expect(page).not.toHaveURL(/agenda/);
  });

  test('usuário inativo não entra', async ({ page }) => {
    await login(page, USERS.inativo.document, PASSWORD);
    await expect(page.getByText('Usuário ou senha incorretos.')).toBeVisible();
  });

  test('sessão guarda só token, id e nome (nunca senha/hash) e sair limpa tudo', async ({ page }) => {
    await login(page, USERS.recepcao.document, PASSWORD);
    await expect(page).toHaveURL(/agenda/);
    const ls = await page.evaluate(() => JSON.stringify(window.localStorage));
    expect(ls).not.toMatch(/\$2[aby]\$|password/i);
    await page.getByText('Sair', { exact: true }).click();
    await expect(page).not.toHaveURL(/agenda/);
    expect(await page.evaluate(() => window.localStorage.getItem('access_token'))).toBeNull();
  });

  test('token inválido/expirado volta para o login sem tela quebrada', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.invalido');
      localStorage.setItem('userId', '1');
      localStorage.setItem('name', 'X');
    });
    await page.goto('/agenda');
    await expect(page.getByPlaceholder('CPF')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
    expect(erros).toEqual([]);
  });

  test('QA-019: login aceita CPF digitado com pontuação (000.000.000-00)', async ({ page }) => {
    knownBug('QA-019', 'o campo CPF do login não tem máscara nem remove a pontuação');
    const d = USERS.recepcao.document;
    await login(page, `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`, PASSWORD);
    await expect(page).toHaveURL(/agenda/);
  });
});
