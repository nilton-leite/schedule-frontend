import { test, expect, Page } from '@playwright/test';
import { Api } from '../fixtures/api';
import { cpfValido, mascararCpf } from '../fixtures/cpf';
import { query } from '../fixtures/db';
import { AgendaPage } from '../pages/AgendaPage';

test.use({ storageState: 'e2e/.auth/recepcao.json' });

let api: Api;
test.beforeAll(async () => {
  api = await Api.as('recepcao');
});
test.afterAll(async () => api?.dispose());

async function abrirPacientes(page: Page) {
  await page.goto('/agenda');
  await expect(page.locator('.fc')).toBeVisible();
  await page.locator('.pcoded-navbar').getByText('Pacientes', { exact: true }).click();
  await expect(page.getByText('Nossos Pacientes')).toBeVisible();
}

const novoPaciente = (dados: Record<string, unknown>) =>
  api.post('patients', { acceptedMessage: true, insurances: [], ...dados });
// A API devolve erros de regra como HTTP 201 com o código verdadeiro no corpo: olhar os dois.
const criado = (r: { status: number; body: { statusCode?: number } }) => r.status < 300 && (r.body?.statusCode ?? 200) < 300;

test.describe('Pacientes', () => {
  test('cadastro pela tela com máscaras e plano; aparece na busca @smoke', async ({ page }, info) => {
    const cpf = cpfValido(Date.now());
    const sufixo = info.project.name === 'firefox' ? '2' : '1';
    const nome = `Paciente Tela QA ${sufixo}`;
    await abrirPacientes(page);
    await page.getByRole('button', { name: /Cadastrar/ }).first().click();
    await page.locator('input[name="document"]').fill(cpf);
    await page.locator('input[name="name"]').fill(nome);
    await page.locator('input[name="dateBirth"]').fill('15031985');
    await page.locator('input[name="phone"]').fill(`4195555123${sufixo}`);
    await page.locator('input[name="street"]').fill('Rua QA');
    await page.locator('input[name="number"]').fill('100');
    const planos = page.locator('.form-group', { has: page.locator('label', { hasText: /^Planos de Saúde/ }) });
    await planos.locator('.select__control').click();
    await page.locator('.select__option', { hasText: 'Unimed QA' }).click();
    await page.getByRole('button', { name: 'Cadastrar', exact: true }).last().click();
    await expect(page.locator('.swal2-popup')).toContainText('Paciente cadastrado com sucesso');

    const [p] = await query<{ document: string; phone: string; dateBirth: Date }>(
      `SELECT document, phone, "dateBirth" FROM patient WHERE name = $1`, [nome]
    );
    expect(p.document).toBe(cpf); // sem máscara
    expect(p.phone).toBe(`4195555123${sufixo}`);
    expect(new Date(p.dateBirth).getFullYear()).toBe(1985);
  });

  test('CPF inválido é recusado na tela', async ({ page }) => {
    await abrirPacientes(page);
    await page.getByRole('button', { name: /Cadastrar/ }).first().click();
    const campo = page.locator('input[name="document"]');
    await campo.fill('11111111112');
    await campo.blur();
    await expect(page.locator('.swal2-popup')).toContainText('CPF Inválido');
  });

  test('QA-016: mesmo telefone (mãe e bebê) pede confirmação; confirmado, cadastra', async () => {
    const fone = '41933330001';
    const mae = await novoPaciente({ name: 'Mãe Família QA', phone: fone, document: cpfValido(111) });
    expect(criado(mae)).toBe(true);
    const semConfirmar = await novoPaciente({ name: 'Bebê Família QA', phone: fone });
    expect(semConfirmar.body.statusCode).toBe(409);
    expect(String(semConfirmar.body.response)).toContain('Este telefone já é do paciente Mãe Família QA');
    const confirmado = await novoPaciente({ name: 'Bebê Família QA', phone: fone, telefoneCompartilhado: true });
    expect(criado(confirmado), JSON.stringify(confirmado.body)).toBe(true);
  });

  test('QA-016 na tela: "Telefone já cadastrado" → "Cadastrar mesmo assim"', async ({ page }, info) => {
    const fone = info.project.name === 'firefox' ? '41933330012' : '41933330011';
    expect(criado(await novoPaciente({ name: `Pai Família QA ${fone}`, phone: fone }))).toBe(true);
    await abrirPacientes(page);
    await page.getByRole('button', { name: /Cadastrar/ }).first().click();
    await page.locator('input[name="name"]').fill(`Filho Família QA ${fone}`);
    await page.locator('input[name="phone"]').fill(fone);
    await page.locator('input[name="street"]').fill('Rua QA');
    await page.locator('input[name="number"]').fill('1');
    const planos = page.locator('.form-group', { has: page.locator('label', { hasText: /^Planos de Saúde/ }) });
    await planos.locator('.select__control').click();
    await page.locator('.select__option', { hasText: 'Unimed QA' }).click();
    await page.getByRole('button', { name: 'Cadastrar', exact: true }).last().click();
    await expect(page.locator('.swal2-popup')).toContainText('Telefone já cadastrado');
    await page.getByRole('button', { name: 'Cadastrar mesmo assim' }).click();
    await expect(page.locator('.swal2-popup')).toContainText('Paciente cadastrado com sucesso');
    const [p] = await query(`SELECT 1 FROM patient WHERE name = $1`, [`Filho Família QA ${fone}`]);
    expect(p).toBeTruthy();
  });

  test('QA-017: CPF já cadastrado não pode ser usado em outro paciente (mensagem com o nome)', async () => {
    const cpf = cpfValido(222);
    expect(criado(await novoPaciente({ name: 'Original CPF QA', phone: '41933330002', document: cpf }))).toBe(true);
    const dup = await novoPaciente({ name: 'Duplicado CPF QA', phone: '41933330003', document: cpf });
    expect(criado(dup), JSON.stringify(dup.body)).toBe(false);
    expect(dup.body.message).toBe('Este CPF já está cadastrado para o paciente Original CPF QA.');
  });

  test('QA-018: busca ignora acentos ("cecilia" encontra "Cecília")', async () => {
    const nomes = async (termo: string) => {
      const r = await api.get(`patients/search?search=${encodeURIComponent(termo)}`);
      return JSON.stringify(r.body);
    };
    expect(await nomes('Cecília'), 'a busca com acento precisa funcionar').toMatch(/Cecília/);
    expect(await nomes('cecilia')).toMatch(/Cecília/);
  });

  test('nome com HTML/script aparece como texto (sem XSS) na lista e na agenda', async ({ page }) => {
    const malicioso = 'XSS <img src=x onerror="window.__xss=1"> QA';
    const r = await novoPaciente({ name: malicioso, phone: '41933330009' });
    expect(r.status).toBeLessThan(300);
    const patientId = r.body.response.patientId;
    const doctorId = (await query<{ id: number }>(`SELECT "doctorId" id FROM doctor WHERE name = 'Dra. Ana Lima'`))[0].id;
    const amanha = new Date(Date.now() + 5 * 86400000);
    while ([0, 6].includes(amanha.getDay())) amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    const admin = await Api.as('admin');
    // encaixe: a hora pode já estar ocupada por outro teste da Ana (1 paciente por hora — QA-004)
    const criado = await admin.createSchedule({ doctorId, patientId, data: amanha.toISOString(), time: '16:00:00', timeEnd: '16:10:00', encaixe: true });
    expect(criado.body.statusCode, JSON.stringify(criado.body)).toBe(200);
    await admin.dispose();

    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.todas();
    await agenda.irPara(amanha);
    await expect(agenda.evento('XSS')).toContainText('<img');
    await agenda.evento('XSS').hover(); // tooltip (tippy) com o título
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

    await page.locator('.pcoded-navbar').getByText('Pacientes', { exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test('cadastro direto pelo modal da agenda (paciente novo)', async ({ page }) => {
    const cpf = cpfValido(Date.now() + 7);
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.clicarHorario('09:00');
    await agenda.novaConsulta.locator('button:has(.icon-plus-circle)').click();
    await agenda.novaConsulta.locator('input[name="document"]').fill(mascararCpf(cpf));
    await agenda.novaConsulta.locator('input[name="name"]').fill('Paciente Modal QA');
    await agenda.novaConsulta.locator('input[name="phone"]').fill('41944440001');
    await agenda.novaConsulta.locator('button:has(.icon-check-circle)').click();
    await expect(page.locator('.swal2-popup')).toContainText('Paciente cadastrado com sucesso');
    const [p] = await query(`SELECT 1 FROM patient WHERE name = 'Paciente Modal QA'`);
    expect(p).toBeTruthy();
  });
});
