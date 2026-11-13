import { test, expect } from '@playwright/test';
import { Api } from '../fixtures/api';
import { knownBug } from '../fixtures/bug';
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
    knownBug('QA-005', 'horários comparados como texto; "9:00" e "08:00" (sem segundos) caem fora da escala');
    const qua = nextDay(['quar']);
    expect(aceito(await criar(ana, pac.Cecília, qua, '9:00', {}, true))).toBe(true);
    expect(aceito(await criar(ana, pac.Cecília, qua, '08:00', {}, true))).toBe(true);
  });

  test('QA-006: médico inativo não recebe agendamento', async () => {
    knownBug('QA-006', 'a criação não verifica se o médico está ativo');
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
    knownBug('QA-002', 'a regra só bloqueia dias > início e o dia final; o primeiro dia passa');
    recusado(await criar(ana, pac.Elisa, inicio, '10:00'), /ausencia temporária/);
  });

  test('dia seguinte ao fim da ausência é aceito', async () => {
    expect(aceito(await criar(ana, pac.Elisa, depois, '10:00'))).toBe(true);
  });

  test('QA-003: uma segunda ausência do mesmo médico também bloqueia', async () => {
    knownBug('QA-003', 'a criação só consulta UMA ausência ativa do médico (findOne)');
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
  test('QA-004: mesmo médico, mesmo horário, acima de "pacientes por hora" é recusado', async () => {
    knownBug('QA-004', 'não há checagem de conflito nem do patientsPerHour do médico (Ana = 1)');
    const qua = nextDay(['quar'], 5);
    expect(aceito(await criar(ana, pac.Fábio, qua, '15:00'))).toBe(true);
    const segundo = await criar(ana, pac.Giovana, qua, '15:00');
    expect(aceito(segundo)).toBe(false);
  });
});

test.describe('edição respeita as mesmas regras', () => {
  let id: number;
  test.beforeAll(async () => {
    const seg = nextDay(['seg'], 5);
    expect(aceito(await criar(ana, pac.Heitor, seg, '09:00'))).toBe(true);
    id = await lastScheduleOf(pac.Heitor);
  });

  test('QA-007: mover para um domingo (médico não atende) é recusado', async () => {
    knownBug('QA-007', 'PATCH /schedules/:id não aplica nenhuma regra de escala, ausência ou data');
    const r = await api.patch(`schedules/${id}`, { data: asFrontSends(nextDay(['dom'])) });
    expect(r.body.statusCode).toBe(400);
  });

  test('QA-007: mover para o passado é recusado', async () => {
    knownBug('QA-007', 'ver relatório');
    const r = await api.patch(`schedules/${id}`, { data: asFrontSends(addDays(today(), -3)) });
    expect(r.body.statusCode).toBe(400);
  });

  test('QA-007: mover para fora do horário (03:00) é recusado', async () => {
    knownBug('QA-007', 'ver relatório');
    const r = await api.patch(`schedules/${id}`, { time: '03:00', timeEnd: '03:10' });
    expect(r.body.statusCode).toBe(400);
  });
});

test.describe('dados inválidos', () => {
  test('QA-008: plano de saúde inexistente devolve erro claro (não 500)', async () => {
    knownBug('QA-008', 'NotFound dentro da transação vira "throw new Error" → 500 genérico');
    const r = await criar(ana, pac.Bernardo, nextDay(['quin'], 6), '10:20', { hasHealthInsurance: true, healthInsuranceId: 99999 });
    expect(r.status).toBeLessThan(500);
  });

  test('QA-009: plano de saúde desativado não pode ser usado num agendamento novo', async () => {
    knownBug('QA-009', 'a criação não verifica se o plano está ativo');
    const antigo = await idOf('healthInsurance', 'Plano Desativado QA');
    const r = await criar(ana, pac.Bernardo, nextDay(['quin'], 6), '10:30', { hasHealthInsurance: true, healthInsuranceId: antigo });
    expect(aceito(r)).toBe(false);
  });

  test('banco continua consistente: nenhum agendamento ficou sem paciente ou médico', async () => {
    const [r] = await query<{ n: string }>(`SELECT count(*) n FROM schedule WHERE "patientId" IS NULL OR "doctorId" IS NULL`);
    expect(Number(r.n)).toBe(0);
  });
});
