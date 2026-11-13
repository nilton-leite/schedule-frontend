import { test, expect } from '@playwright/test';
import { AgendaPage } from '../pages/AgendaPage';
import { Api } from '../fixtures/api';
import { knownBug } from '../fixtures/bug';
import { idOf, lastScheduleOf, query, scheduleById } from '../fixtures/db';
import { addDays, asFrontSends, br, nextDay, today } from '../fixtures/dates';

test.use({ storageState: 'e2e/.auth/recepcao.json' });

let api: Api;
test.beforeAll(async () => {
  api = await Api.as('admin');
});
test.afterAll(async () => api?.dispose());

async function criarPelaApi(paciente: string, dia: Date, hora: string, extra: Record<string, unknown> = {}) {
  const patientId = await idOf('patient', paciente);
  const r = await api.createSchedule({
    doctorId: await idOf('doctor', 'Dra. Ana Lima'), patientId, data: asFrontSends(dia), time: `${hora}:00`, timeEnd: `${hora.slice(0, 3)}${String(Number(hora.slice(3)) + 10).padStart(2, '0')}:00`, ...extra
  });
  expect(r.body.statusCode, JSON.stringify(r.body)).toBe(200);
  return lastScheduleOf(patientId);
}

test.describe('Agenda — ficha da consulta', () => {
  test('QA-010: recepção confirma uma consulta PARTICULAR pela ficha (sem plano de saúde)', async ({ page }) => {
    knownBug('QA-010', 'a ficha exige plano de saúde para salvar ("Preencha todos os campos")');
    const dia = nextDay(['ter'], 6);
    const id = await criarPelaApi('Isabela Teste Pereira', dia, '09:00');
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.todas();
    await agenda.irPara(dia);
    await agenda.evento('Isabela Teste Pereira').click();
    await expect(agenda.ficha).toBeVisible();
    await agenda.escolher(agenda.ficha, 'Situação', 'Confirmado');
    await agenda.ficha.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(agenda.ficha).toBeHidden();
    const s = await scheduleById(id);
    expect(s.statusId).toBe(4);
    expect(s.hasHealthInsurance).toBe(false);
  });

  test('consulta COM plano é confirmada pela ficha', async ({ page }) => {
    const dia = nextDay(['ter'], 6);
    const unimed = await idOf('healthInsurance', 'Unimed QA');
    const id = await criarPelaApi('João Teste Costa', dia, '10:00', { hasHealthInsurance: true, healthInsuranceId: unimed });
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.todas();
    await agenda.irPara(dia);
    await agenda.evento('João Teste Costa').click();
    await agenda.escolher(agenda.ficha, 'Situação', 'Confirmado');
    await agenda.ficha.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(agenda.ficha).toBeHidden();
    expect((await scheduleById(id)).statusId).toBe(4);
  });

  test('QA-011: "Retorno?" marcado como Sim no cadastro aparece como Sim na ficha', async ({ page }) => {
    knownBug('QA-011', 'o cadastro grava "Retorno? Sim" em hasFirstQuery=true e a ficha mostra o inverso');
    const dia = nextDay(['quin'], 6);
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.todas();
    await agenda.clicarHorario('11:00');
    await agenda.preencherNovaConsulta({
      tipo: 'Agendamento', paciente: 'Karina Teste Silva', medico: 'Dra. Ana Lima',
      data: br(dia), inicio: '11:00', fim: '11:10', retorno: true
    });
    await agenda.salvarNovaConsulta();
    expect(await agenda.alerta()).toContain('sucesso');
    await agenda.todas();
    await agenda.irPara(dia);
    await agenda.evento('Karina Teste Silva').click();
    await expect(agenda.ficha.locator('.p-2', { hasText: 'Retorno?' })).toContainText('Sim');
  });

  test('consulta de dia que já passou abre só para leitura (sem "Salvar Alterações")', async ({ page }) => {
    const ontem = addDays(today(), -1);
    const patientId = await idOf('patient', 'Lucas Teste Santos');
    await query(
      `INSERT INTO schedule (uuid, data, time, "timeEnd", "hasHealthInsurance", "hasFirstQuery", "statusId", "doctorId", "patientId", "scheduleTypeId", "createdBy", "lastChangedBy")
       VALUES (gen_random_uuid()::text, $1, '10:00:00', '10:10:00', false, false, 4, $2, $3, 1, 1, 1)`,
      [`${ontem.getFullYear()}-${ontem.getMonth() + 1}-${ontem.getDate()} 00:00:00`, await idOf('doctor', 'Dra. Ana Lima'), patientId]
    );
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.todas();
    await agenda.irPara(ontem);
    await agenda.evento('Lucas Teste Santos').click();
    await expect(agenda.ficha).toBeVisible();
    await expect(agenda.ficha.getByRole('button', { name: 'Salvar Alterações' })).toHaveCount(0);
  });

  test('QA-006: médico inativo não aparece para agendar', async ({ page }) => {
    knownBug('QA-006', 'a lista de médicos da agenda inclui médicos inativos');
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.clicarHorario('09:00');
    const grupo = agenda.novaConsulta.locator('.form-group', { has: page.locator('label', { hasText: /^Médico/ }) });
    await grupo.locator('.select__control').click();
    await expect(page.locator('.select__option', { hasText: 'Dr. Desligado Teste' })).toHaveCount(0);
  });

  test('QA-012: cadastrar sem paciente mostra o que falta (não erro genérico)', async ({ page }) => {
    knownBug('QA-012', 'sem validação no formulário; a API recusa e a tela diz só "Não foi possivel cadastrar."');
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.clicarHorario('09:30');
    await agenda.escolher(agenda.novaConsulta, 'Médico', 'Dra. Ana Lima');
    await agenda.salvarNovaConsulta();
    expect(await agenda.alerta()).toMatch(/paciente/i);
  });
});
