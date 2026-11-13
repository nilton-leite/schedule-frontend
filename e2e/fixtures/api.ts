import { APIRequestContext, request } from '@playwright/test';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { API_URL, PASSWORD, USERS } = require('../qa-env');

export type Perfil = 'admin' | 'recepcao' | 'medico';

/** Cliente HTTP direto na API de QA (para preparar dados rápido e conferir o banco pelo que a API devolve). */
export class Api {
  constructor(private readonly ctx: APIRequestContext, readonly token: string) {}

  /**
   * Reaproveita o token do login feito no auth.setup (e2e/.auth/<perfil>.json). Logar de novo em cada arquivo
   * estoura o limite de 10 logins/min por IP da API (achado QA-013).
   */
  static async as(perfil: Perfil = 'admin'): Promise<Api> {
    const ctx = await request.newContext({ baseURL: `${API_URL}/api/` });
    let token = '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const state = JSON.parse(require('fs').readFileSync(`e2e/.auth/${perfil}.json`, 'utf8'));
      const ls = state.origins.flatMap((o: { localStorage: Array<{ name: string; value: string }> }) => o.localStorage);
      token = (ls.find((i: { name: string }) => i.name === 'access_token') || {}).value || '';
    } catch {
      /* sem sessão salva: loga abaixo */
    }
    if (!token) {
      const res = await ctx.post('auth', { data: { username: USERS[perfil].document, password: PASSWORD } });
      if (!res.ok()) throw new Error(`login ${perfil} falhou: ${res.status()}`);
      token = (await res.json()).access_token;
    }
    return new Api(ctx, token);
  }

  private h() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async get(path: string) {
    const res = await this.ctx.get(path, { headers: this.h() });
    return { status: res.status(), body: await res.json().catch(() => null) };
  }

  async post(path: string, data: unknown) {
    const res = await this.ctx.post(path, { headers: this.h(), data });
    return { status: res.status(), body: await res.json().catch(() => null) };
  }

  async patch(path: string, data: unknown) {
    const res = await this.ctx.patch(path, { headers: this.h(), data });
    return { status: res.status(), body: await res.json().catch(() => null) };
  }

  async doctors(): Promise<Array<{ doctorId: number; name: string }>> {
    return (await this.get('doctors')).body.response;
  }

  async doctorId(nome: string): Promise<number> {
    const d = (await this.doctors()).find((x) => x.name === nome);
    if (!d) throw new Error(`médico ${nome} não encontrado`);
    return d.doctorId;
  }

  async patientId(nome: string): Promise<number> {
    const res = await this.get(`patients/search?search=${encodeURIComponent(nome)}`);
    const list = res.body?.response || [];
    const p = list.find((x: { name: string }) => x.name === nome) || list[0];
    if (!p) throw new Error(`paciente ${nome} não encontrado`);
    return p.patientId ?? p.value;
  }

  /** Cria agendamento pela API. Devolve o corpo (regras de negócio vêm como HTTP 201 + statusCode 400 no corpo). */
  async createSchedule(s: {
    doctorId: number;
    patientId: number;
    data: string; // AAAA-MM-DD
    time: string; // HH:MM
    timeEnd?: string;
    statusId?: number;
    scheduleTypeId?: number;
    hasHealthInsurance?: boolean;
    healthInsuranceId?: number;
    hasFirstQuery?: boolean;
    encaixe?: boolean; // confirma encaixe acima de 'pacientes por hora' (QA-004)
  }) {
    return this.post('schedules', {
      statusId: 2,
      scheduleTypeId: 1,
      hasHealthInsurance: false,
      hasFirstQuery: false,
      timeEnd: s.timeEnd || addMinutes(s.time, 10),
      ...s
    });
  }

  async dispose() {
    await this.ctx.dispose();
  }
}

export function addMinutes(hhmm: string, min: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
