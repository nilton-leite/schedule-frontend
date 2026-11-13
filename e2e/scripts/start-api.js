// Sobe a API de QA para o Playwright (webServer): recria o banco descartável, aplica TODAS as migrations,
// popula com dados sintéticos e inicia a API compilada na porta de QA. Fica rodando até o Playwright encerrar.
const { execSync, spawn } = require('child_process');
const path = require('path');
const { Client } = require('pg');
const { DB, API_ENV } = require('../qa-env');
const { seed } = require('./seed');

const API_DIR = path.resolve(__dirname, '..', '..', '..', 'schedule-api');

async function main() {
  const admin = new Client({ ...DB, database: 'postgres' });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${DB.database}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${DB.database}"`);
  await admin.end();
  console.log(`[qa-api] banco ${DB.database} recriado`);

  const env = { ...process.env, ...API_ENV };
  if (!process.env.QA_SKIP_BUILD) {
    execSync('npm run -s build', { cwd: API_DIR, env, stdio: 'inherit' });
  }
  execSync('npm run -s typeorm:run-migrations', { cwd: API_DIR, env, stdio: 'pipe' });
  console.log('[qa-api] migrations aplicadas');

  const client = new Client(DB);
  await client.connect();
  await seed(client);
  await client.end();
  console.log('[qa-api] dados sintéticos criados');

  const api = spawn(process.execPath, ['-r', 'source-map-support/register', 'dist/src/main'], {
    cwd: API_DIR,
    env: { ...env, NODE_PATH: path.join(API_DIR, 'dist') },
    // stdin ignorado: herdar a entrada de um processo em segundo plano trava o filho no Windows.
    stdio: ['ignore', 'inherit', 'inherit']
  });
  const stop = () => api.kill();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  process.on('exit', stop);
  api.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('[qa-api] falhou:', err);
  process.exit(1);
});
