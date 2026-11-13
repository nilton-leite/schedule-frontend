import { test, expect } from '@playwright/test';
import { createHash, randomBytes } from 'crypto';
import { idOf, patientByFirstName, query, scheduleById } from '../fixtures/db';
import { addDays, nextDay } from '../fixtures/dates';

/**
 * Página pública de confirmação (link do WhatsApp). Roda também no projeto "iphone".
 * O WhatsApp está desligado no QA, então o link é gerado aqui: token aleatório e só o hash no banco (como a API faz).
 */
test.use({ storageState: { cookies: [], origins: [] } });

async function agendamentoComLink(primeiroNome: string, hora: string, dias = 2) {
  const paciente = await patientByFirstName(primeiroNome);
  const dia = nextDay(['seg', 'ter', 'quar', 'quin', 'sex'], dias);
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  const local = `${dia.getFullYear()}-${dia.getMonth() + 1}-${dia.getDate()}`;
  const [row] = await query<{ id: number }>(
    `INSERT INTO schedule (uuid, data, time, "timeEnd", "hasHealthInsurance", "hasFirstQuery", "statusId", "doctorId", "patientId",
       "scheduleTypeId", "confirmationTokenHash", "confirmationTokenExpiresAt", "createdBy", "lastChangedBy")
     VALUES (gen_random_uuid()::text, $1, $2, $2, false, false, 6, $3, $4, 1, $5, $6, 1, 1) RETURNING "scheduleId" id`,
    [`${local} 00:00:00`, `${hora}:00`, await idOf('doctor', 'Dra. Ana Lima'), paciente.id, hash, `${local} ${hora}:00`]
  );
  return { id: row.id, url: `/confirmacao/${token}`, paciente };
}

test.describe('Confirmação pelo link do WhatsApp', () => {
  test('paciente confirma pelo link, sem login @smoke @cross', async ({ page }, info) => {
    const { id, url, paciente } = await agendamentoComLink('Marina', info.project.name === 'iphone' ? '08:10' : '08:20');
    await page.goto(url);
    await expect(page.getByText('Olá, Marina!')).toBeVisible();
    await expect(page.getByText('Dra. Ana Lima')).toBeVisible();
    // Nada de dados sensíveis na página
    await expect(page.locator('body')).not.toContainText(paciente.name.split(' ').slice(1).join(' ')); // sobrenome
    const [{ phone }] = await query<{ phone: string }>(`SELECT phone FROM patient WHERE "patientId" = $1`, [paciente.id]);
    await expect(page.locator('body')).not.toContainText(phone);
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Agendamento confirmado')).toBeVisible();
    expect((await scheduleById(id)).statusId).toBe(4);
    await page.reload();
    await expect(page.getByText('Agendamento confirmado')).toBeVisible();
  });

  test('paciente cancela (com pergunta de confirmação) @cross', async ({ page }, info) => {
    const { id, url } = await agendamentoComLink('Nicolas', info.project.name === 'iphone' ? '08:30' : '08:40');
    await page.goto(url);
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await page.getByRole('button', { name: 'Voltar' }).click(); // desistiu
    expect((await scheduleById(id)).statusId).toBe(6);
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await page.getByRole('button', { name: 'Sim, cancelar' }).click();
    await expect(page.getByText('Agendamento cancelado')).toBeVisible();
    expect((await scheduleById(id)).statusId).toBe(3);
  });

  test('link inválido, link antigo e agendamento já alterado pela clínica', async ({ page }, info) => {
    await page.goto('/confirmacao/' + 'A'.repeat(43));
    await expect(page.getByText(/link não é válido/)).toBeVisible();
    await page.goto('/confirmacao');
    await expect(page.getByText('Este link não está mais ativo')).toBeVisible();

    const { id, url } = await agendamentoComLink('Olívia', info.project.name === 'iphone' ? '08:50' : '09:00');
    await query(`UPDATE schedule SET "statusId" = 3 WHERE "scheduleId" = $1`, [id]); // recepção cancelou
    await page.goto(url);
    await expect(page.getByText('Agendamento cancelado')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar' })).toHaveCount(0);
  });

  test('link expirado (horário passou)', async ({ page }) => {
    const { id, url } = await agendamentoComLink('Pedro', '09:10');
    await query(`UPDATE schedule SET "confirmationTokenExpiresAt" = $2 WHERE "scheduleId" = $1`, [id, addDays(new Date(), -1)]);
    await page.goto(url);
    await expect(page.getByText(/expirou/)).toBeVisible();
  });

  test('funcionário logado também consegue abrir o link', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/recepcao.json' });
    const page = await ctx.newPage();
    const { url } = await agendamentoComLink('Quésia', '09:20');
    await page.goto(url);
    await expect(page.getByText('Olá, Quésia!')).toBeVisible();
    await ctx.close();
  });
});
