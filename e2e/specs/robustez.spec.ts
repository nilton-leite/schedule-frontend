import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { knownBug } from '../fixtures/bug';
import { Api } from '../fixtures/api';
import { idOf, patientByFirstName, query } from '../fixtures/db';

test.describe('Robustez', () => {
  test.use({ storageState: 'e2e/.auth/recepcao.json' });

  test('QA-020: se a API da agenda falhar, a tela avisa, não deixa marcar e recupera com "Tentar de novo"', async ({ page }) => {
    // Uma consulta existente, para conferir que ela volta a aparecer depois da recuperação.
    const api = await Api.as('admin');
    const p = await patientByFirstName('Vítor');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const doctorId = await idOf('doctor', 'Dra. Ana Lima');
    await query(
      `INSERT INTO schedule (uuid, data, time, "timeEnd", "hasHealthInsurance", "hasFirstQuery", "statusId", "doctorId", "patientId", "scheduleTypeId", "createdBy", "lastChangedBy")
       VALUES (gen_random_uuid()::text, $1, '19:00:00', '19:10:00', false, false, 2, $2, $3, 1, 1, 1)`,
      [`${hoje.getFullYear()}-${hoje.getMonth() + 1}-${hoje.getDate()} 00:00:00`, doctorId, p.id]
    );
    await api.dispose();

    let falhar = true;
    await page.route('**/api/schedules/only**', (r) =>
      falhar ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"statusCode":500}' }) : r.continue()
    );
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    const aviso = page.getByRole('alert').filter({ hasText: 'A agenda pode estar incompleta' });
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText('Não foi possível carregar os agendamentos');

    // Não deixa marcar por cima enquanto a agenda está incompleta.
    await page.locator('td.fc-timegrid-slot-lane[data-time="10:00:00"]').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('.swal2-popup')).toContainText('Agenda incompleta');
    await page.locator('.swal2-confirm, .swal2-close').first().click();
    await expect(page.locator('.modal.show', { hasText: 'Nova Consulta' })).toHaveCount(0);

    // API volta: "Tentar de novo" limpa o aviso e mostra a consulta.
    falhar = false;
    await aviso.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(aviso).toHaveCount(0);
    await expect(page.locator('.fc-event', { hasText: p.name })).toBeVisible();
  });

  test('sem falha, a agenda não mostra o aviso', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page.locator('.fc')).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.getByText('A agenda pode estar incompleta')).toHaveCount(0);
  });

  for (const [caso, resposta, mensagem] of [
    ['servidor fora do ar', 'abort', /Não foi possível conectar/],
    ['erro interno (500)', '500', /indisponível no momento/]
  ] as const) {
    test(`login com ${caso}: mensagem certa, sem dizer que a senha está errada (QA-021)`, async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const page = await ctx.newPage();
      await page.route('**/api/auth', (r) =>
        resposta === 'abort' ? r.abort('connectionrefused') : r.fulfill({ status: 500, contentType: 'application/json', body: '{"statusCode":500}' })
      );
      await page.goto('/');
      await page.getByPlaceholder('CPF').fill('10000000002');
      await page.getByPlaceholder('Senha').fill('qualquer');
      await page.getByRole('button', { name: 'LOGIN' }).click();
      await expect(page.getByText(mensagem)).toBeVisible();
      await expect(page.getByText('Usuário ou senha incorretos.')).toHaveCount(0);
      await ctx.close();
    });
  }
});

test.describe('Acessibilidade (axe) — violações críticas e sérias', () => {
  const telas: Array<[string, string | null, string]> = [
    ['login', null, '/'],
    ['agenda', 'e2e/.auth/recepcao.json', '/agenda'],
    ['confirmacao-antiga', null, '/confirmacao']
  ];
  for (const [nome, sessao, url] of telas) {
    test(`${nome}: sem violações críticas nem sérias`, async ({ browser }, info) => {
      const ctx = await browser.newContext(sessao ? { storageState: sessao } : { storageState: { cookies: [], origins: [] } });
      const page = await ctx.newPage();
      if (nome === 'agenda') {
        // Consultas de HOJE em várias situações: a tabela "Consultas de hoje" e as cores dos eventos entram na
        // análise sempre (antes dependia de outro teste ter criado consulta no dia).
        const doctorId = await idOf('doctor', 'Dra. Ana Lima');
        const p = await patientByFirstName('Lívia');
        const h = new Date();
        const d = `${h.getFullYear()}-${h.getMonth() + 1}-${h.getDate()} 00:00:00`;
        for (const [statusId, hora] of [[2, '06:00'], [4, '06:15'], [1, '06:30'], [3, '06:45']] as const) {
          await query(
            `INSERT INTO schedule (uuid, data, time, "timeEnd", "hasHealthInsurance", "hasFirstQuery", "statusId", "doctorId", "patientId", "scheduleTypeId", "createdBy", "lastChangedBy")
             VALUES (gen_random_uuid()::text, $1, $2::time, $2::time + interval '10 minutes', false, false, $3, $4, $5, 1, 1, 1)`,
            [d, `${hora}:00`, statusId, doctorId, p.id]
          );
        }
      }
      await page.goto(url);
      await page.waitForTimeout(1500);
      let axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
      // Exceção documentada (agenda): a grade rolável do FullCalendar sem nenhum evento no dia não tem item
      // focável ("scrollable-region-focusable"). Dar tabindex a ela cria violação CRÍTICA (filho não permitido
      // dentro do role="grid" do FullCalendar). Com consultas no dia, os eventos já são focáveis.
      if (nome === 'agenda') axe = axe.disableRules(['scrollable-region-focusable']);
      const r = await axe.analyze();
      // Alvo + motivo medido (no contraste, as cores e a razão), para corrigir sem adivinhar.
      const motivo = (n: { any: Array<{ message: string }> }) => (n.any[0]?.message || '').split('\n')[0];
      const resumo = r.violations
        .map((v) => `${v.impact} · ${v.id} (${v.nodes.length}) · ${v.help}\n    ${v.nodes.slice(0, 4).map((n) => `${n.target.join(' ')}\n      ${motivo(n)}`).join('\n    ')}`)
        .join('\n');
      await info.attach(`axe-${nome}`, { body: resumo || 'sem violações', contentType: 'text/plain' });
      console.log(`[axe ${nome}]\n${resumo}`);
      // QA-022: os críticos foram corrigidos na C3; os sérios (contraste, links e ícones sem nome), na Onda 3.
      const graves = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(graves.map((v) => `${v.impact}:${v.id}`)).toEqual([]);
      await ctx.close();
    });
  }
});
