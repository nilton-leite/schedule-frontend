// Datas relativas para os testes (fuso America/Sao_Paulo, igual à API de QA).
const DAY_KEYS = ['dom', 'seg', 'ter', 'quar', 'quin', 'sex', 'sab'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

const pad = (n: number) => String(n).padStart(2, '0');

/** AAAA-MM-DD de uma Date local. */
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Como o front envia a data de um agendamento: meia-noite LOCAL serializada em ISO (ex.: 2026-11-17T03:00:00.000Z). */
export const asFrontSends = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};

/** DD/MM/AAAA. */
export const br = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const dayKey = (d: Date): DayKey => DAY_KEYS[d.getDay()];

/**
 * Próximo dia (a partir de hoje + minDays) que cai num dos dias da semana pedidos.
 * Use minDays >= 3 para ficar fora da janela de envio automático de confirmação (até 48h).
 */
export function nextDay(days: DayKey[], minDays = 3): Date {
  let d = addDays(today(), minDays);
  for (let i = 0; i < 14; i++) {
    if (days.includes(dayKey(d))) return d;
    d = addDays(d, 1);
  }
  throw new Error('dia não encontrado');
}

/** Contador de horários livres: cada chamada devolve um horário diferente (evita colisão entre testes). */
let slot = 0;
export function uniqueMorningTime(): string {
  const t = 8 * 60 + 10 * (slot++ % 23); // 08:00 .. 11:40, de 10 em 10 min
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
