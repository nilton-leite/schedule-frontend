// Ambiente da suíte de QA (Playwright). Tudo isolado: banco descartável, API e front em portas próprias,
// WhatsApp desligado. Nunca aponta para produção nem para a cópia local de produção (wambierdb).
const API_PORT = Number(process.env.QA_API_PORT || 3433);
const WEB_PORT = Number(process.env.QA_WEB_PORT || 3401);

const DB = {
  host: process.env.QA_DB_HOST || '127.0.0.1',
  port: Number(process.env.QA_DB_PORT || 5433),
  user: process.env.QA_DB_USER || 'wambier',
  password: process.env.QA_DB_PASSWORD || 'local_dev_only',
  database: process.env.QA_DB_NAME || 'wambierdb_ui_e2e'
};

// Trava: o banco é APAGADO a cada execução, então precisa terminar em _e2e.
if (!/_e2e$/.test(DB.database)) {
  throw new Error(`Banco de QA "${DB.database}" não termina em _e2e. Recusando para não apagar dados reais.`);
}

const API_URL = `http://localhost:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

// Variáveis da API de QA (sobrepõem o .env do schedule-api).
const API_ENV = {
  NODE_ENV: 'test',
  TZ: 'America/Sao_Paulo',
  PORT: String(API_PORT),
  POSTGRES_HOST: DB.host,
  POSTGRES_PORT: String(DB.port),
  POSTGRES_USER: DB.user,
  POSTGRES_PASSWORD: DB.password,
  POSTGRES_DB: DB.database,
  DB_SSL: 'false',
  SECRET_JWT: 'segredo-somente-para-qa-e2e',
  JWT_EXPIRES_IN: '8h',
  CORS_ORIGIN: WEB_URL,
  PUBLIC_APP_URL: WEB_URL,
  // WhatsApp desligado: nenhuma mensagem pode sair durante os testes.
  URL_HALLO: 'http://127.0.0.1:9/desligado',
  INSTANCE_TOKEN_WPP: '',
  INSTANCE_KEY_WPP: '',
  FLOGIN: ''
};

const PASSWORD = 'Qa@123456';
const USERS = {
  admin: { document: '10000000001', name: 'QA Admin', role: 'admin' },
  recepcao: { document: '10000000002', name: 'QA Recepção', role: 'recepcao' },
  medico: { document: '10000000003', name: 'QA Médico', role: 'medico' },
  inativo: { document: '10000000004', name: 'QA Inativo', role: 'recepcao', active: false }
};

module.exports = { API_PORT, WEB_PORT, DB, API_URL, WEB_URL, API_ENV, PASSWORD, USERS };
