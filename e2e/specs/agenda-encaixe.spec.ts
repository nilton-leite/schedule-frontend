import { test, expect } from '@playwright/test';
import { AgendaPage } from '../pages/AgendaPage';
import { Api } from '../fixtures/api';
import { idOf, patientByFirstName, query } from '../fixtures/db';
import { asFrontSends, br, nextDay } from '../fixtures/dates';

test.use({ storageState: 'e2e/.auth/recepcao.json' });

/** QA-004: horário cheio (acima de "pacientes por hora") pergunta se a recepção quer encaixar. */
test('horário cheio: "Escolher outro horário" não grava; "Encaixar" grava', async ({ page }) => {
  const dia = nextDay(['seg'], 13);
  const ana = await idOf('doctor', 'Dra. Ana Lima');
  const ocupante = await patientByFirstName('Yasmin');
  const novo = await patientByFirstName('Zeca');
  const api = await Api.as('admin');
  const r = await api.createSchedule({ doctorId: ana, patientId: ocupante.id, data: asFrontSends(dia), time: '14:00:00', timeEnd: '14:10:00' });
  expect(r.body.statusCode).toBe(200);
  await api.dispose();
  const doZeca = async () =>
    Number((await query<{ n: string }>(`SELECT count(*) n FROM schedule WHERE "patientId" = $1`, [novo.id]))[0].n);

  const agenda = new AgendaPage(page);
  await agenda.open();
  const preencher = async () => {
    await agenda.clicarHorario('14:30');
    await agenda.preencherNovaConsulta({ tipo: 'Agendamento', paciente: novo.name, medico: 'Dra. Ana Lima', data: br(dia), inicio: '14:30', fim: '14:40' });
    await agenda.salvarNovaConsulta();
    await expect(page.locator('.swal2-popup')).toContainText('Horário cheio');
    await expect(page.locator('.swal2-popup')).toContainText('Já há 1 paciente com Dra. Ana Lima entre 14h e 15h');
  };

  await preencher();
  await page.getByRole('button', { name: 'Escolher outro horário' }).click();
  await expect(page.locator('.swal2-popup')).toContainText('Escolha outro horário');
  await page.locator('.swal2-close, .swal2-confirm').first().click();
  expect(await doZeca()).toBe(0);

  await page.keyboard.press('Escape'); // fecha o modal para recomeçar
  await agenda.open();
  await preencher();
  await page.getByRole('button', { name: 'Encaixar' }).click();
  await expect(page.locator('.swal2-popup')).toContainText('Consulta cadastrada com sucesso');
  expect(await doZeca()).toBe(1);
});
