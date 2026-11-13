import { Locator, Page, expect } from '@playwright/test';

/** Tela /agenda (FullEventCalendar.js): calendário, ficha da consulta e modal "Nova Consulta". */
export class AgendaPage {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto('/agenda');
    await expect(this.page.locator('.fc')).toBeVisible({ timeout: 30_000 });
  }

  /** Mostra a agenda de todos os médicos. */
  async todas() {
    await this.page.getByRole('button', { name: /^Todas/ }).click();
  }

  /** Avança o calendário (visão de dia) até a data pedida. */
  async irPara(date: Date) {
    const alvo = new Date(date);
    alvo.setHours(0, 0, 0, 0);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
    const botao = this.page.locator(dias >= 0 ? '.fc-next-button' : '.fc-prev-button');
    for (let i = 0; i < Math.abs(dias); i++) await botao.click();
  }

  evento(texto: string | RegExp): Locator {
    return this.page.locator('.fc-event', { hasText: texto });
  }

  /** Clica num horário vazio da grade do dia (abre "Nova Consulta"). */
  async clicarHorario(hhmm: string) {
    await this.page.locator(`td.fc-timegrid-slot-lane[data-time="${hhmm}:00"]`).click({ position: { x: 5, y: 5 } });
    await expect(this.novaConsulta).toBeVisible();
  }

  get novaConsulta(): Locator {
    return this.page.locator('.modal.show', { hasText: 'Nova Consulta' });
  }

  get ficha(): Locator {
    return this.page.locator('.modal.show', { hasText: 'Ficha da Consulta' });
  }

  /** Escolhe uma opção num react-select identificado pelo rótulo do campo, dentro de um escopo. */
  async escolher(escopo: Locator, rotulo: string, opcao: string | RegExp) {
    const grupo = escopo.locator('.form-group', { has: this.page.locator('label', { hasText: new RegExp(`^${rotulo}`) }) }).first();
    await grupo.locator('.select__control').click();
    if (typeof opcao === 'string') await this.page.keyboard.type(opcao);
    await this.page.locator('.select__option', { hasText: opcao }).first().click();
  }

  async preencherNovaConsulta(d: {
    tipo?: string;
    paciente: string;
    medico: string;
    data?: string; // dd/MM/aaaa
    inicio?: string; // HH:MM
    fim?: string; // HH:MM
    plano?: string;
    retorno?: boolean;
    obs?: string;
  }) {
    const m = this.novaConsulta;
    // A caixa real fica escondida pelo tema; clica-se no rótulo estilizado ao lado (como o usuário faz).
    if (d.retorno) {
      await m.locator('.form-group', { has: this.page.locator('label', { hasText: /^Retorno\?/ }) }).locator('label.cr').click();
      await expect(m.locator('.form-group', { hasText: /^Retorno\?/ }).locator('label.cr')).toContainText('Sim');
    }
    if (d.tipo) await this.escolher(m, 'Tipo', d.tipo);
    await this.escolher(m, 'Paciente', d.paciente);
    await this.escolher(m, 'Médico', d.medico);
    if (d.data) {
      const campo = m.locator('input[name="data"]');
      await campo.fill(d.data);
      await campo.press('Enter');
    }
    if (d.inicio) await this.preencherHora(m.locator('#time input, input[name="time"]').first(), d.inicio);
    if (d.fim) await this.preencherHora(m.locator('input[name="timeEnd"]'), d.fim);
    if (d.plano) await this.escolher(m, 'Plano de Saúde', d.plano);
    if (d.obs) await m.locator('input[name="obs"]').fill(d.obs);
  }

  async preencherHora(campo: Locator, hhmm: string) {
    await campo.click();
    await campo.press('Control+a');
    await campo.press('Backspace');
    await campo.type(`${hhmm.replace(':', '')}00`);
  }

  async salvarNovaConsulta() {
    await this.novaConsulta.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  }

  /** Texto do alerta SweetAlert exibido (sucesso ou erro) e fecha. */
  async alerta(): Promise<string> {
    const popup = this.page.locator('.swal2-popup');
    await expect(popup).toBeVisible();
    const texto = (await popup.locator('.swal2-html-container, #swal2-content, #swal2-html-container').first().innerText()).trim();
    await this.page.locator('.swal2-close, .swal2-confirm').first().click();
    return texto;
  }
}
