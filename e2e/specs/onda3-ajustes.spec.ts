import { test, expect } from '@playwright/test';
import { Api } from '../fixtures/api';
import { cpfValido, mascararCpf } from '../fixtures/cpf';
import { patientByFirstName, query } from '../fixtures/db';
import { addDays, today } from '../fixtures/dates';
import { AgendaPage } from '../pages/AgendaPage';

/**
 * Ajustes pequenos da Onda 3 (fora do QA original):
 * - busca de paciente leve (no máximo 30, por nome/telefone/CPF) e a agenda sem baixar todos os pacientes;
 * - "Invalid date" para paciente sem nascimento e a edição de paciente gravando a data de nascimento;
 * - lista "Consultas de hoje" no dia local (antes, depois das 21h, mostrava o dia seguinte por usar UTC).
 */
test.use({ storageState: 'e2e/.auth/recepcao.json', timezoneId: 'America/Sao_Paulo' });

let api: Api;
test.beforeAll(async () => {
  api = await Api.as('recepcao');
});
test.afterAll(async () => api?.dispose());

const dia = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} 00:00:00`;

test.describe('busca de paciente', () => {
  test('devolve no máximo 30, por nome, só com os campos da busca', async () => {
    const r = await api.get('patients/search?search=Teste');
    const lista = r.body.response as Array<Record<string, unknown>>;
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.length).toBeLessThanOrEqual(30);
    expect(Object.keys(lista[0]).sort()).toEqual(['acceptedMessage', 'document', 'name', 'patientId', 'phone']);
    const nomes = lista.map((p) => String(p.name));
    // Ordem do banco (collation): compara ignorando acentos e maiúsculas.
    const chave = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    expect(nomes.map(chave)).toEqual([...nomes].map(chave).sort());
  });

  test('acha por parte do telefone e pelo CPF com pontuação', async () => {
    const italo = await patientByFirstName('Ítalo');
    const [{ phone }] = await query<{ phone: string }>(`SELECT phone FROM patient WHERE "patientId" = $1`, [italo.id]);
    let r = await api.get(`patients/search?search=${phone.slice(-8)}`);
    expect((r.body.response as Array<{ patientId: number }>).map((p) => p.patientId)).toContain(italo.id);

    const livia = await patientByFirstName('Lívia');
    const cpf = cpfValido(Date.now() + 77);
    await query(`UPDATE patient SET document = $2 WHERE "patientId" = $1`, [livia.id, cpf]);
    r = await api.get(`patients/search?search=${encodeURIComponent(mascararCpf(cpf))}`);
    expect((r.body.response as Array<{ patientId: number }>).map((p) => p.patientId)).toEqual([livia.id]);
  });

  test('termo curto não lista ninguém', async () => {
    const r = await api.get('patients/search?search=a');
    expect(r.body.response).toEqual([]);
  });

  test('a agenda não baixa a lista inteira de pacientes; a Nova Consulta busca ao digitar', async ({ page }) => {
    // GET /api/patients (sem /search, /list...): a lista completa, que a agenda baixava ao abrir e a cada clique.
    const chamadasLista: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'GET' && /\/patients\/?$/.test(new URL(req.url()).pathname)) chamadasLista.push(req.url());
    });
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.todas();
    await agenda.clicarHorario('18:45');
    const modal = agenda.novaConsulta;
    const busca = page.waitForRequest((req) => req.url().includes('/patients/search'));
    await agenda.escolher(modal, 'Paciente', 'Otávio');
    await busca;
    await expect(modal.locator('.form-group', { has: page.locator('label', { hasText: /^Paciente/ }) })).toContainText('Otávio');
    expect(chamadasLista, 'GET /patients (lista completa) não deve ser chamado').toEqual([]);
  });
});

test.describe('data de nascimento do paciente', () => {
  test('paciente sem nascimento vem com data vazia (antes "Invalid date")', async () => {
    const angela = await patientByFirstName('Ângela');
    await query(`UPDATE patient SET "dateBirth" = NULL WHERE "patientId" = $1`, [angela.id]);
    const r = await api.get(`patients/${angela.id}`);
    expect(r.body.response.dateBirth).toBe('');
    const lista = await api.get('patients/list?limit=100&page=1');
    expect(JSON.stringify(lista.body)).not.toContain('Invalid date');
  });

  test('edição pela API grava e limpa a data de nascimento', async () => {
    const angela = await patientByFirstName('Ângela');
    let r = await api.patch(`patients/${angela.id}`, { dateBirth: '1990-05-20' });
    expect(r.body.statusCode, JSON.stringify(r.body)).toBe(200);
    expect(r.body.response.dateBirth).toBe('20/05/1990');
    r = await api.patch(`patients/${angela.id}`, { dateBirth: null });
    expect(r.body.statusCode, JSON.stringify(r.body)).toBe(200);
    const [row] = await query<{ dateBirth: Date | null }>(`SELECT "dateBirth" FROM patient WHERE "patientId" = $1`, [angela.id]);
    expect(row.dateBirth).toBeNull();
  });

  test('edição pela tela de Pacientes grava a data de nascimento (antes era ignorada)', async ({ page }) => {
    const angela = await patientByFirstName('Ângela');
    await query(`UPDATE patient SET "dateBirth" = NULL WHERE "patientId" = $1`, [angela.id]);
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    await page.locator('.pcoded-navbar').getByText('Pacientes', { exact: true }).click();
    await expect(page.getByText('Nossos Pacientes')).toBeVisible();

    // Clica no controle do filtro (o campo de digitação fica por cima do texto de exemplo).
    await page.getByText('Digite para buscar pacientes...').locator('xpath=../..').click();
    await page.keyboard.type('Ângela');
    await page.locator('div[id*="-option-"]', { hasText: 'Ângela' }).first().click();
    await page.locator('.pull-right .icon-search').click();
    const linha = page.locator('tr', { hasText: 'Ângela' }).first();
    await expect(linha).toBeVisible();
    await linha.getByRole('button', { name: /Editar/ }).click();

    const campo = page.locator('input[name="dateBirth"]');
    await campo.click();
    await campo.fill('07031982');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.getByText('Paciente alterado com sucesso.')).toBeVisible();
    const [row] = await query<{ d: string }>(`SELECT to_char("dateBirth", 'YYYY-MM-DD') d FROM patient WHERE "patientId" = $1`, [angela.id]);
    expect(row.d).toBe('1982-03-07');
  });
});

test.describe('Consultas de hoje', () => {
  test('às 22:30 a lista mostra as consultas de HOJE, não as de amanhã (antes usava UTC)', async ({ page }) => {
    const ana = await query<{ id: number }>(`SELECT "doctorId" id FROM doctor WHERE name = 'Dra. Ana Lima'`);
    const italo = await patientByFirstName('Ítalo');
    const otavio = await patientByFirstName('Otávio');
    const hoje = today();
    const amanha = addDays(hoje, 1);
    const inserir = (d: Date, patientId: number) =>
      query(
        `INSERT INTO schedule (uuid, data, time, "timeEnd", "hasHealthInsurance", "hasFirstQuery", "statusId", "doctorId", "patientId", "scheduleTypeId", "createdBy", "lastChangedBy")
         VALUES (gen_random_uuid()::text, $1, '10:00:00', '10:10:00', false, false, 2, $2, $3, 1, 1, 1)`,
        [dia(d), ana[0].id, patientId]
      );
    await inserir(hoje, italo.id);
    await inserir(amanha, otavio.id);

    const noite = new Date(hoje);
    noite.setHours(22, 30, 0, 0);
    await page.clock.setFixedTime(noite);
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    const card = page.locator('.card', { has: page.getByText('Nossas Consultas de Hoje') });
    await expect(card).toContainText(italo.name);
    await expect(card).not.toContainText(otavio.name);
  });
});
