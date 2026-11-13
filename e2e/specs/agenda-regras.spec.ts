import { test, expect } from '@playwright/test';
import { Api } from '../fixtures/api';
import { idOf, scheduleById, lastScheduleOf, query } from '../fixtures/db';
import { addDays, asFrontSends, nextDay, today, iso } from '../fixtures/dates';

/**
 * Regras de negócio do agendamento, exercitadas direto na API (onde moram).
 * Convenção: o teste descreve o comportamento ESPERADO. Quando a aplicação diverge, o teste é marcado com
 * test.fail() e o id do bug (QA-xxx) do relatório — a suíte fica verde e o bug, visível.
 * Atenção: regra recusada volta HTTP 201 com { statusCode: 400 } no corpo (padrão atual da API).
 */
let api: Api;
let ana: number, bruno: number, carla: number, inativo: number;
const pac: Record<string, number> = {};

test.beforeAll(async () => {
  api = await Api.as('admin');
  ana = await idOf('doctor', 'Dra. Ana Lima');
  bruno = await idOf('doctor', 'Dr. Bruno Reis');
  carla = await idOf('doctor', 'Dra. Carla Souza');
  inativo = await idOf('doctor', 'Dr. Desligado Teste');
  for (const n of ['Bernardo Teste Santos', 'Cecília Teste Oliveira', 'Davi Teste Pereira', 'Elisa Teste Costa', 'Fábio Teste Silva', 'Giovana Teste Santos', 'Heitor Teste Oliveira']) {
    pac[n.split(' ')[0]] = await idOf('patient', n);
  }
});
test.afterAll(async () => api?.dispose());

// Horário como o front envia ("HH:MM:SS", máscara 99:99:99). { raw: true } manda exatamente o texto dado.
const comoFront = (t: string) => (/^\d{2}:\d{2}$/.test(t) ? `${t}:00` : t);
const criar = (doctorId: number, patientId: number, dia: Date, time: string, extra: Record<string, unknown> = {}, raw = false) =>
  api.createSchedule({ doctorId, patientId, data: asFrontSends(dia), time: raw ? time : comoFront(time), ...extra });

const aceito = (r: { status: number; body: { statusCode: number } }) => r.status < 300 && r.body.statusCode === 200;
const recusado = (r: { body: { statusCode: number; response: unknown } }, trecho: RegExp) => {
  expect(r.body.statusCode).toBe(400);
  expect(String(r.body.response)).toMatch(trecho);
};

test.describe('data e escala do médico', () => {
  test('agendamento retroativo é recusado', async () => {
    recusado(await criar(ana, pac.Bernardo, addDays(today(), -1), '10:00'), /retroativo/);
  });

  test('dia em que o médico não atende é recusado', async () => {
    recusado(await criar(ana, pac.Bernardo, nextDay(['sab']), '10:00'), /indisponível/);
    recusado(await criar(carla, pac.Bernardo, nextDay(['seg']), '10:00'), /indisponível/);
  });

  test('horário fora da escala é recusado (intervalo de almoço, antes e depois)', async () => {
    const seg = nextDay(['seg']);
    recusado(await criar(ana, pac.Bernardo, seg, '12:30'), /fora da escala/);
    recusado(await criar(ana, pac.Bernardo, seg, '07:50'), /fora da escala/);
    recusado(await criar(ana, pac.Bernardo, seg, '18:10'), /fora da escala/);
    recusado(await criar(bruno, pac.Bernardo, nextDay(['ter']), '09:00'), /fora da escala/); // Bruno só atende à tarde
  });

  test('limites da escala são aceitos (início da manhã e da tarde)', async () => {
    const ter = nextDay(['ter'], 4);
    expect(aceito(await criar(ana, pac.Cecília, ter, '08:00'))).toBe(true);
    expect(aceito(await criar(ana, pac.Cecília, ter, '13:00'))).toBe(true);
  });

  test('QA-005: horário em outro formato ("9:00" ou "08:00" sem segundos) é aceito dentro da escala', async () => {
    const qua = nextDay(['quar']);
    expect(aceito(await criar(ana, pac.Cecília, qua, '9:00', {}, true))).toBe(true);
    expect(aceito(await criar(ana, pac.Cecília, qua, '08:00', {}, true))).toBe(true);
  });

  test('QA-006: médico inativo não recebe agendamento', async () => {
    const seg = nextDay(['seg']);
    const r = await criar(inativo, pac.Davi, seg, '10:00');
    expect(aceito(r)).toBe(false);
  });

  test('cirurgia (tipo 7) nasce como Finalizado', async () => {
    const qui = nextDay(['quin']);
    expect(aceito(await criar(ana, pac.Davi, qui, '14:00', { scheduleTypeId: 7 }))).toBe(true);
    const s = await scheduleById(await lastScheduleOf(pac.Davi));
    expect(s.statusId).toBe(1);
  });
});

test.describe('ausência temporária do médico', () => {
  // Ausência de Ana em 3 dias úteis seguidos, das 08:00 às 18:00.
  let inicio: Date, meio: Date, fim: Date, depois: Date;

  test.beforeAll(async () => {
    inicio = nextDay(['seg'], 8);
    meio = addDays(inicio, 1);
    fim = addDays(inicio, 2);
    depois = addDays(inicio, 3);
    const motivo = await idOf('reasonTemporaryAbsence', 'Congresso');
    const r = await api.post('temporaryAbsence', {
      doctorId: ana, reasonTemporaryAbsenceId: motivo, observation: 'QA',
      initDate: iso(inicio), initTime: '08:00', endDate: iso(fim), endTime: '18:00'
    });
    expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
  });

  test('dia do meio da ausência é recusado', async () => {
    recusado(await criar(ana, pac.Elisa, meio, '10:00'), /ausencia temporária/);
  });

  test('último dia da ausência, dentro do horário, é recusado', async () => {
    recusado(await criar(ana, pac.Elisa, fim, '10:00'), /ausencia temporária/);
  });

  test('QA-002: PRIMEIRO dia da ausência também é recusado', async () => {
    recusado(await criar(ana, pac.Elisa, inicio, '10:00'), /ausencia temporária/);
  });

  test('dia seguinte ao fim da ausência é aceito', async () => {
    expect(aceito(await criar(ana, pac.Elisa, depois, '10:00'))).toBe(true);
  });

  test('QA-003: uma segunda ausência do mesmo médico também bloqueia', async () => {
    const outra = addDays(inicio, 14);
    const motivo = await idOf('reasonTemporaryAbsence', 'Férias');
    await api.post('temporaryAbsence', {
      doctorId: ana, reasonTemporaryAbsenceId: motivo, observation: 'QA 2',
      initDate: iso(addDays(outra, -1)), initTime: '08:00', endDate: iso(addDays(outra, 1)), endTime: '18:00'
    });
    recusado(await criar(ana, pac.Elisa, outra, '10:00'), /ausencia temporária/);
  });
});

test.describe('conflito e capacidade', () => {
  test('QA-004: acima de "pacientes por hora" pede confirmação de encaixe; confirmado, grava', async () => {
    // Ana atende 1 paciente por hora. Decisão da clínica: avisar e permitir encaixe com confirmação.
    const qua = nextDay(['quar'], 5);
    expect(aceito(await criar(ana, pac.Fábio, qua, '15:00'))).toBe(true);
    const mesmaHora = await criar(ana, pac.Giovana, qua, '15:40'); // mesma hora do relógio (15h–16h)
    expect(mesmaHora.body.statusCode).toBe(409);
    expect(String(mesmaHora.body.response)).toMatch(/Já há 1 paciente com Dra\. Ana Lima entre 15h e 16h \(limite: 1 por hora\)/);
    expect(aceito(await criar(ana, pac.Giovana, qua, '15:40', { encaixe: true }))).toBe(true);
    // Outra hora: sem pergunta.
    expect(aceito(await criar(ana, pac.Giovana, qua, '16:00'))).toBe(true);
  });

  test('QA-004: consulta cancelada não ocupa a vaga; mover para hora cheia também pergunta', async () => {
    const qui = nextDay(['quin'], 5);
    expect(aceito(await criar(ana, pac.Fábio, qui, '16:00'))).toBe(true);
    const cancelada = await lastScheduleOf(pac.Fábio);
    await api.patch(`schedules/${cancelada}`, { statusId: 3 });
    expect(aceito(await criar(ana, pac.Giovana, qui, '16:20'))).toBe(true); // a cancelada não conta

    expect(aceito(await criar(ana, pac.Heitor, qui, '17:00'))).toBe(true);
    const id = await lastScheduleOf(pac.Heitor);
    const mover = await api.patch(`schedules/${id}`, { time: '16:40:00', timeEnd: '16:50:00' });
    expect(mover.body.statusCode).toBe(409);
    expect((await scheduleById(id)).time.slice(0, 5)).toBe('17:00'); // não mudou sem confirmar
    const confirmado = await api.patch(`schedules/${id}`, { time: '16:40:00', timeEnd: '16:50:00', encaixe: true });
    expect(confirmado.body.statusCode).toBe(200);
  });
});

test.describe('edição respeita as mesmas regras', () => {
  let id: number;
  test.beforeAll(async () => {
    // Fora da ausência de teste da Ana (seg–qua da semana seguinte).
    const sex = nextDay(['sex'], 5);
    expect(aceito(await criar(ana, pac.Heitor, sex, '09:00'))).toBe(true);
    id = await lastScheduleOf(pac.Heitor);
  });

  test('QA-007: mover para um domingo (médico não atende) é recusado', async () => {
    const r = await api.patch(`schedules/${id}`, { data: asFrontSends(nextDay(['dom'])) });
    expect(r.body.statusCode).toBe(400);
  });

  test('QA-007: mover para o passado é recusado', async () => {
    const r = await api.patch(`schedules/${id}`, { data: asFrontSends(addDays(today(), -3)) });
    expect(r.body.statusCode).toBe(400);
  });

  test('QA-007: mover para fora do horário (03:00) é recusado', async () => {
    const r = await api.patch(`schedules/${id}`, { time: '03:00', timeEnd: '03:10' });
    expect(r.body.statusCode).toBe(400);
  });
});

test.describe('edição: o que precisa continuar funcionando', () => {
  test('QA-025: editar sem enviar a situação não muda a situação (antes virava "Finalizado")', async () => {
    const p = await idOf('patient', 'Alice Teste Silva');
    expect(aceito(await criar(ana, p, nextDay(['sex'], 12), '10:40'))).toBe(true);
    const id = await lastScheduleOf(p);
    const r = await api.patch(`schedules/${id}`, { obs: 'só a observação' });
    expect(r.body.statusCode).toBe(200);
    expect((await scheduleById(id)).statusId).toBe(2);
  });

  test('mudar só a situação de consulta já marcada é permitido mesmo se a escala mudou depois', async () => {
    const p = await idOf('patient', 'Alice Teste Silva');
    const dia = nextDay(['quin'], 12);
    expect(aceito(await criar(ana, p, dia, '11:20'))).toBe(true);
    const id = await lastScheduleOf(p);
    const [antes] = await query<{ workDays: Record<string, unknown> }>(`SELECT "workDays" FROM doctor WHERE "doctorId" = $1`, [ana]);
    await query(`UPDATE doctor SET "workDays" = jsonb_set("workDays", '{quin,status}', 'false') WHERE "doctorId" = $1`, [ana]);
    try {
      // A ficha reenvia data e hora iguais junto com a nova situação.
      const r = await api.patch(`schedules/${id}`, { statusId: 4, data: asFrontSends(dia), time: '11:20:00', timeEnd: '11:30:00' });
      expect(r.body.statusCode, JSON.stringify(r.body)).toBe(200);
      expect((await scheduleById(id)).statusId).toBe(4);
    } finally {
      await query(`UPDATE doctor SET "workDays" = $2 WHERE "doctorId" = $1`, [ana, JSON.stringify(antes.workDays)]);
    }
  });

  test('mover para um horário válido é aceito e gravado', async () => {
    const p = await idOf('patient', 'Alice Teste Silva');
    expect(aceito(await criar(ana, p, nextDay(['ter'], 12), '09:40'))).toBe(true);
    const id = await lastScheduleOf(p);
    const novoDia = nextDay(['quar'], 20); // fora das ausências de teste
    const r = await api.patch(`schedules/${id}`, { data: asFrontSends(novoDia), time: '14:20:00', timeEnd: '14:30:00' });
    expect(r.body.statusCode, JSON.stringify(r.body)).toBe(200);
    const s = await scheduleById(id);
    expect(new Date(s.data).getDate()).toBe(novoDia.getDate());
    expect(s.time.slice(0, 5)).toBe('14:20');
    expect(s.statusId).toBe(2);
  });

  test('manter o plano desativado que a consulta já tinha é permitido; trocar para ele é recusado', async () => {
    const antigo = await idOf('healthInsurance', 'Plano Desativado QA');
    const unimed = await idOf('healthInsurance', 'Unimed QA');
    const p = await idOf('patient', 'Alice Teste Silva');
    expect(aceito(await criar(ana, p, nextDay(['seg'], 12), '15:20', { hasHealthInsurance: true, healthInsuranceId: unimed }))).toBe(true);
    const id = await lastScheduleOf(p);
    recusado(await api.patch(`schedules/${id}`, { hasHealthInsurance: true, healthInsuranceId: antigo }), /desativado/);
    // Consulta antiga com o plano que depois foi desativado: confirmar continua possível.
    await query(`UPDATE schedule SET "healthInsuranceId" = $2 WHERE "scheduleId" = $1`, [id, antigo]);
    const r = await api.patch(`schedules/${id}`, { statusId: 4, hasHealthInsurance: true, healthInsuranceId: antigo });
    expect(r.body.statusCode, JSON.stringify(r.body)).toBe(200);
  });
});

test.describe('dados inválidos', () => {
  test('QA-008: plano de saúde inexistente devolve erro claro (não 500)', async () => {
    const r = await criar(ana, pac.Bernardo, nextDay(['quin'], 6), '10:20', { hasHealthInsurance: true, healthInsuranceId: 99999 });
    expect(r.status).toBeLessThan(500);
  });

  test('QA-009: plano de saúde desativado não pode ser usado num agendamento novo', async () => {
    const antigo = await idOf('healthInsurance', 'Plano Desativado QA');
    const r = await criar(ana, pac.Bernardo, nextDay(['quin'], 6), '10:30', { hasHealthInsurance: true, healthInsuranceId: antigo });
    expect(aceito(r)).toBe(false);
  });

  test('banco continua consistente: nenhum agendamento ficou sem paciente ou médico', async () => {
    const [r] = await query<{ n: string }>(`SELECT count(*) n FROM schedule WHERE "patientId" IS NULL OR "doctorId" IS NULL`);
    expect(Number(r.n)).toBe(0);
  });
});
