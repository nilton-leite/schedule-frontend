import { test, expect } from '@playwright/test';
import { Api } from '../fixtures/api';
import { idOf, patientByFirstName } from '../fixtures/db';
import { asFrontSends, br, nextDay } from '../fixtures/dates';

test.use({ storageState: 'e2e/.auth/recepcao.json' });

test.describe('Consultas (lista)', () => {
  test('filtrar por médico e data mostra a consulta marcada @smoke', async ({ page }, info) => {
    const api = await Api.as('admin');
    const firefox = info.project.name === 'firefox';
    const dia = nextDay(['sex'], 9);
    const p = await patientByFirstName(firefox ? 'Úrsula' : 'Sofia');
    const r = await api.createSchedule({
      doctorId: await idOf('doctor', 'Dra. Ana Lima'), patientId: p.id, data: asFrontSends(dia), time: firefox ? '16:30:00' : '15:30:00', timeEnd: firefox ? '16:40:00' : '15:40:00'
    });
    expect(r.body.statusCode).toBe(200);
    await api.dispose();

    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    await page.locator('.pcoded-navbar').getByText('Consultas', { exact: true }).click();
    await expect(page.getByText('Nossas Consultas')).toBeVisible();

    const filtros = page.locator('.card', { hasText: 'Nossas Consultas' });
    const medico = filtros.locator('.form-group', { has: page.locator('label', { hasText: /^Médico/ }) });
    await medico.locator('.select__control').click();
    await page.locator('.select__option', { hasText: 'Dra. Ana Lima' }).click();
    const data = filtros.locator('input[name="filterData"]');
    await data.fill(br(dia));
    await data.press('Enter');
    await filtros.locator('button:has(.icon-search)').click();

    await expect(filtros.getByText(p.name)).toBeVisible();
  });
});
