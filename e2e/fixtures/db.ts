import { Client } from 'pg';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DB } = require('../qa-env');

/** Acesso direto ao banco DESCARTÁVEL de QA (wambierdb_ui_e2e) para preparar e conferir dados. */
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client(DB);
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

export async function idOf(table: 'doctor' | 'patient' | 'healthInsurance' | 'reasonTemporaryAbsence', name: string): Promise<number> {
  const col = { doctor: ['doctorId', 'name'], patient: ['patientId', 'name'], healthInsurance: ['healthInsuranceId', 'name'], reasonTemporaryAbsence: ['reasonTemporaryAbsenceId', 'description'] }[table];
  const rows = await query<{ id: number }>(`SELECT "${col[0]}" id FROM "${table}" WHERE "${col[1]}" = $1`, [name]);
  if (!rows.length) throw new Error(`${table} "${name}" não encontrado`);
  return rows[0].id;
}

/** Paciente do seed pelo primeiro nome (o sobrenome sintético varia; não depender dele). */
export async function patientByFirstName(first: string): Promise<{ id: number; name: string }> {
  const rows = await query<{ id: number; name: string }>(
    `SELECT "patientId" id, name FROM patient WHERE name LIKE $1 ORDER BY "patientId" LIMIT 1`,
    [`${first} %`]
  );
  if (!rows.length) throw new Error(`paciente "${first} ..." não encontrado`);
  return rows[0];
}

export async function scheduleById(id: number) {
  const [row] = await query<{ statusId: number; data: Date; time: string; hasFirstQuery: boolean; hasHealthInsurance: boolean; healthInsuranceId: number | null; scheduleTypeId: number }>(
    `SELECT "statusId", data, time, "hasFirstQuery", "hasHealthInsurance", "healthInsuranceId", "scheduleTypeId" FROM schedule WHERE "scheduleId" = $1`,
    [id]
  );
  return row;
}

/** Último agendamento do paciente (os testes usam pacientes diferentes para não se confundirem). */
export async function lastScheduleOf(patientId: number) {
  const [row] = await query<{ scheduleId: number }>(
    `SELECT "scheduleId" FROM schedule WHERE "patientId" = $1 ORDER BY "scheduleId" DESC LIMIT 1`,
    [patientId]
  );
  return row?.scheduleId;
}
