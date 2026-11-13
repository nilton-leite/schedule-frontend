import { test, expect } from '@playwright/test';
import { AgendaPage } from '../pages/AgendaPage';
import { Api } from '../fixtures/api';
import { br, nextDay } from '../fixtures/dates';
import { patientByFirstName } from '../fixtures/db';

test.use({ storageState: 'e2e/.auth/recepcao.json' });

test.describe('Agenda — criar agendamento pela tela', () => {
  test('recepção cria consulta particular e ela aparece no calendário @smoke', async ({ page }, info) => {
    // Dados diferentes por navegador (o Firefox repete o cenário na mesma execução).
    const firefox = info.project.name === 'firefox';
    const paciente = (await patientByFirstName(firefox ? 'Tiago' : 'Alice')).name;
    const hora = firefox ? '11:30' : '10:00'; // horas diferentes: a Ana atende 1 paciente por hora (QA-004)
    const agenda = new AgendaPage(page);
    const dia = nextDay(['seg', 'ter', 'quar', 'quin', 'sex']);
    await agenda.open();
    await agenda.todas();
    await agenda.clicarHorario(hora);
    await agenda.preencherNovaConsulta({
      tipo: 'Agendamento',
      paciente,
      medico: 'Dra. Ana Lima',
      data: br(dia),
      inicio: hora,
      fim: firefox ? '11:40' : '10:10'
    });
    await agenda.salvarNovaConsulta();
    expect(await agenda.alerta()).toContain('Consulta cadastrada com sucesso');

    await agenda.todas();
    await agenda.irPara(dia);
    await expect(agenda.evento(paciente)).toBeVisible();

    // Conferência pela API: gravou no dia/hora/médico certos.
    const api = await Api.as('admin');
    const lista = await api.get(`schedules/only`);
    const ana = lista.body.response.find((d: { name: string }) => d.name === 'Dra. Ana Lima');
    const s = ana.schedules.find((x: { patientName: string }) => x.patientName === paciente);
    expect(s).toBeTruthy();
    expect(s.data).toBe(br(dia));
    expect(s.time.slice(0, 5)).toBe(hora);
    await api.dispose();
  });
});
