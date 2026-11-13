import { test, expect } from '@playwright/test';
import { Api } from '../fixtures/api';
import { knownBug } from '../fixtures/bug';
import { idOf, patientByFirstName, query } from '../fixtures/db';
import { asFrontSends, nextDay } from '../fixtures/dates';
import { AgendaPage } from '../pages/AgendaPage';

let api: Api;
test.beforeAll(async () => {
  api = await Api.as('admin');
});
test.afterAll(async () => api?.dispose());

test.describe('Médicos', () => {
  test.describe('QA-023: médico desativado com consultas futuras', () => {
    test.use({ storageState: 'e2e/.auth/recepcao.json' });

    test('continua na agenda (API e tela), marcado como inativo; sem consultas futuras, não aparece', async ({ page }) => {
      const bruno = await idOf('doctor', 'Dr. Bruno Reis');
      const p = await patientByFirstName('Rafael');
      const dia = nextDay(['ter'], 9);
      const r = await api.createSchedule({ doctorId: bruno, patientId: p.id, data: asFrontSends(dia), time: '14:00:00', timeEnd: '14:10:00' });
      expect(r.body.statusCode, JSON.stringify(r.body)).toBe(200);
      await query(`UPDATE doctor SET active = false WHERE "doctorId" = $1`, [bruno]);
      try {
        const agenda = (await api.get('schedules/only')).body.response as Array<{ name: string; active: boolean; schedules: Array<{ patientName: string }> }>;
        const doc = agenda.find((d) => d.name === 'Dr. Bruno Reis');
        expect(doc, 'o médico desativado com consulta futura precisa aparecer').toBeTruthy();
        expect(doc.active).toBe(false);
        expect(doc.schedules.map((s) => s.patientName)).toContain(p.name);
        // Médico desativado SEM consultas futuras continua fora da agenda.
        expect(agenda.map((d) => d.name)).not.toContain('Dr. Desligado Teste');

        const tela = new AgendaPage(page);
        await tela.open();
        await tela.todas();
        await tela.irPara(dia);
        await expect(tela.evento(p.name)).toContainText('Dr. Bruno Reis – inativo');
      } finally {
        await query(`UPDATE doctor SET active = true WHERE "doctorId" = $1`, [bruno]);
      }
    });
  });
});

test.describe('Parâmetros refletem na agenda', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('plano novo aparece para escolher na Nova Consulta', async ({ page }) => {
    const r = await api.post('health-insurance', { name: 'Plano Novo QA' });
    expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.clicarHorario('09:00');
    const grupo = agenda.novaConsulta.locator('.form-group', { has: page.locator('label', { hasText: /^Plano de Saúde/ }) });
    await grupo.locator('.select__control').click();
    await expect(page.locator('.select__option', { hasText: 'Plano Novo QA' })).toBeVisible();
  });

  test('QA-009: plano desativado não é oferecido na Nova Consulta', async ({ page }) => {
    knownBug('QA-009', 'a agenda oferece planos desativados (e a API aceita)');
    const agenda = new AgendaPage(page);
    await agenda.open();
    await agenda.clicarHorario('09:00');
    const grupo = agenda.novaConsulta.locator('.form-group', { has: page.locator('label', { hasText: /^Plano de Saúde/ }) });
    await grupo.locator('.select__control').click();
    await expect(page.locator('.select__option', { hasText: 'Plano Desativado QA' })).toHaveCount(0);
  });
});
