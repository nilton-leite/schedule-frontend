// Dados sintéticos da suíte de QA (nenhum dado real). Rodado logo após as migrations, num banco vazio.
const bcrypt = require('bcryptjs');
const { PASSWORD, USERS } = require('../qa-env');

const DAYS = ['seg', 'ter', 'quar', 'quin', 'sex', 'sab', 'dom'];
const closed = { status: false, initMorning: '', finalMorning: '', initAfternoon: '', finalAfternoon: '' };
const open = (m1, m2, a1, a2) => ({ status: true, initMorning: m1, finalMorning: m2, initAfternoon: a1, finalAfternoon: a2 });
const week = (map) => Object.fromEntries(DAYS.map((d) => [d, map[d] || closed]));

// Escalas diferentes para exercitar as regras de horário (formato igual ao de produção: "HH:MM:SS").
const FULL = open('08:00:00', '12:00:00', '13:00:00', '18:00:00');
const DOCTORS = [
  { key: 'ana', name: 'Dra. Ana Lima', document: '20000000001', send: 48, perHour: 1,
    workDays: week({ seg: FULL, ter: FULL, quar: FULL, quin: FULL, sex: FULL }) },
  { key: 'bruno', name: 'Dr. Bruno Reis', document: '20000000002', send: 24, perHour: 2,
    workDays: week({ ter: open('', '', '13:00:00', '17:40:00'), quin: open('', '', '13:00:00', '17:40:00') }) },
  { key: 'carla', name: 'Dra. Carla Souza', document: '20000000003', send: 48, perHour: 1,
    workDays: week({ sab: open('08:00:00', '12:00:00', '', '') }) },
  { key: 'inativo', name: 'Dr. Desligado Teste', document: '20000000004', send: 48, perHour: 1, active: false,
    workDays: week({ seg: FULL }) }
];

const STATUS = ['Finalizado', 'Pendente', 'Cancelado', 'Confirmado', 'Erro na confirmação automática',
  'Enviado mensagem de confirmação', 'Necessário confirmação manual'];
const TYPES = ['Agendamento', 'Exame Normal', 'Exame Audiometria Bera (Infantil)', 'Exame Videonistagmografia',
  'Exame Videolaringo', 'Exame Videonaso', 'Cirurgia'];

const FIRST = ['Alice', 'Bernardo', 'Cecília', 'Davi', 'Elisa', 'Fábio', 'Giovana', 'Heitor', 'Isabela', 'João',
  'Karina', 'Lucas', 'Marina', 'Nicolas', 'Olívia', 'Pedro', 'Quésia', 'Rafael', 'Sofia', 'Tiago',
  'Úrsula', 'Vítor', 'Wanda', 'Xavier', 'Yasmin', 'Zeca', 'Ângela', 'Ítalo', 'Otávio', 'Lívia'];
const LAST = ['Teste Silva', 'Teste Santos', 'Teste Oliveira', 'Teste Pereira', 'Teste Costa'];

async function seed(client) {
  const q = (sql, params) => client.query(sql, params);
  const one = async (sql, params) => (await q(sql, params)).rows[0];

  for (let i = 0; i < STATUS.length; i++) {
    await q(`INSERT INTO status ("statusId", uuid, description) VALUES ($1, gen_random_uuid()::text, $2)`, [i + 1, STATUS[i]]);
  }
  for (let i = 0; i < TYPES.length; i++) {
    await q(`INSERT INTO "scheduleType" ("scheduleTypeId", uuid, description) VALUES ($1, gen_random_uuid()::text, $2)`, [i + 1, TYPES[i]]);
  }
  await q(`SELECT setval(pg_get_serial_sequence('status','statusId'), 100)`);
  await q(`SELECT setval(pg_get_serial_sequence('"scheduleType"','scheduleTypeId'), 100)`);

  const hi = {};
  for (const [key, name, active] of [['unimed', 'Unimed QA', true], ['bradesco', 'Bradesco Saúde QA', true], ['antigo', 'Plano Desativado QA', false]]) {
    hi[key] = (await one(`INSERT INTO "healthInsurance" (uuid, name, active) VALUES (gen_random_uuid()::text, $1, $2) RETURNING "healthInsuranceId" id`, [name, active])).id;
  }
  const sp = {};
  for (const [key, name] of [['otorrino', 'Otorrinolaringologia QA'], ['fono', 'Fonoaudiologia QA'], ['cirurgia', 'Cirurgia QA']]) {
    sp[key] = (await one(`INSERT INTO specialty (uuid, name, description) VALUES (gen_random_uuid()::text, $1, $1) RETURNING "specialtyId" id`, [name])).id;
  }
  // As migrations já criam "Férias" e "Ausente"; só completa o que faltar.
  for (const d of ['Férias', 'Ausente', 'Congresso']) {
    await q(
      `INSERT INTO "reasonTemporaryAbsence" (uuid, description)
       SELECT gen_random_uuid()::text, $1::varchar WHERE NOT EXISTS (SELECT 1 FROM "reasonTemporaryAbsence" WHERE description = $1::varchar)`,
      [d]
    );
  }

  const doctors = {};
  for (const d of DOCTORS) {
    const row = await one(
      `INSERT INTO doctor (uuid, name, "dateBirth", document, phone, "timeSendConfirmation", "patientsPerHour", "workDays", active)
       VALUES (gen_random_uuid()::text, $1, '1980-05-10', $2, '41999990000', $3, $4, $5, $6) RETURNING "doctorId" id`,
      [d.name, d.document, d.send, d.perHour, JSON.stringify(d.workDays), d.active !== false]
    );
    doctors[d.key] = row.id;
    await q(`INSERT INTO "doctorSpecialty" ("doctorId", "specialtyId") VALUES ($1, $2)`, [row.id, sp.otorrino]);
    await q(`INSERT INTO "doctorInsurance" ("doctorId", "healthInsuranceId") VALUES ($1, $2), ($1, $3)`, [row.id, hi.unimed, hi.bradesco]);
  }

  const patients = [];
  for (let i = 0; i < FIRST.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const row = await one(
      `INSERT INTO patient (uuid, name, "dateBirth", document, phone, "zipCode", street, number, complement, "acceptedMessage")
       VALUES (gen_random_uuid()::text, $1, '1990-01-${n}', $2, $3, '80000000', 'Rua dos Testes', $4, '', true) RETURNING "patientId" id`,
      [`${FIRST[i]} ${LAST[i % LAST.length]}`, `300000000${n}`, `419880000${n}`, n]
    );
    patients.push(row.id);
    if (i % 2 === 0) await q(`INSERT INTO "patientInsurance" ("patientId", "healthInsuranceId") VALUES ($1, $2)`, [row.id, hi.unimed]);
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const u of Object.values(USERS)) {
    await q(
      `INSERT INTO users (uuid, name, "dateBirth", document, phone, password, active, "firstLogin", role)
       VALUES (gen_random_uuid()::text, $1, '1990-01-01', $2, '41977770000', $3, $4, false, $5)`,
      [u.name, u.document, hash, u.active !== false, u.role]
    );
  }

  // Como em produção: todo registro tem quem criou e quem alterou por último (a lista de médicos,
  // por exemplo, quebra com 500 se faltar — achado QA registrado no relatório).
  const { id: adminId } = await one(`SELECT "userId" id FROM users WHERE document = $1`, [USERS.admin.document]);
  for (const table of ['status', 'scheduleType', 'healthInsurance', 'specialty', 'reasonTemporaryAbsence', 'doctor', 'patient', 'users']) {
    await q(`UPDATE "${table}" SET "createdBy" = $1, "lastChangedBy" = $1`, [adminId]);
  }

  return { doctors, patients, hi, sp, adminId };
}

module.exports = { seed, DOCTORS, STATUS, TYPES };
