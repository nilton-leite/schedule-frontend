# Suíte de QA ponta a ponta (Playwright)

Testa a Agenda pela interface e pela API, num ambiente **isolado**: banco descartável, API e front em portas
próprias, WhatsApp desligado. Nunca toca produção nem a cópia local de produção (`wambierdb`).

## Pré-requisitos
- Container local `agenda-pg16` (Postgres 16 em `127.0.0.1:5433`, usuário `wambier`).
- `schedule-api` ao lado deste repositório (`../schedule-api`), com `npm install` feito.
- Navegadores do Playwright: `npx playwright install chromium firefox webkit` (uma vez).

## Rodar
```bash
npm run e2e          # tudo: Chromium + Firefox (@smoke/@cross) + página de confirmação no iPhone
npm run e2e:smoke    # só os @smoke no Chromium (rápido)
npm run e2e:report   # abre o relatório HTML (screenshots, vídeos e trace das falhas)
QA_SKIP_BUILD=1 npm run e2e   # pula o build da API (quando ela não mudou)
```
A cada execução o `webServer` do Playwright:
1. recria o banco `wambierdb_ui_e2e` (trava: precisa terminar em `_e2e`), aplica **todas** as migrations e
   popula com dados sintéticos (`scripts/seed.js`): 4 médicos com escalas diferentes, 30 pacientes fictícios,
   planos, especialidades e usuários `admin` / `recepcao` / `medico` / `inativo` (senha `Qa@123456`);
2. sobe a API em `:3433` e o front (dev server) em `:3401` apontando para ela.

## Convenções
- **Bug conhecido**: o teste descreve o comportamento correto e chama `knownBug('QA-0xx', ...)`
  (`fixtures/bug.ts`). Enquanto o bug existir, a falha é esperada e a suíte fica verde; quando corrigirem, o
  Playwright avisa "passou inesperadamente" — remova a linha. Detalhes de cada bug em `RELATORIO-QA.md`.
- `QA_SHOW_BUGS=1 npm run e2e` roda **sem** as marcações, mostrando a mensagem real de cada falha.
- Regras de negócio são testadas direto na API (`fixtures/api.ts`); fluxos de tela, com page objects (`pages/`).
- Datas são relativas a hoje (`fixtures/dates.ts`) e ficam fora da janela de envio automático (≥ 3 dias).
- Limite de login da API: 5 erros por CPF em 15 min e 60/min por IP; os testes reaproveitam a sessão do `auth.setup.ts`;
  `zz-limite-login.spec.ts` (que bloqueia um CPF de propósito) roda por último.
- Abrir uma URL interna direto sempre cai na agenda (QA-014): navegue pelo menu.

## Estrutura
```
e2e/
  playwright.config.ts   qa-env.js (portas, banco, usuários)
  scripts/  start-api.js (banco + migrations + seed + API)  seed.js
  fixtures/ api.ts  db.ts  dates.ts  cpf.ts  bug.ts
  pages/    AgendaPage.ts
  specs/    smoke, auth, navegacao, varredura, agenda-criar, agenda-ficha, agenda-regras, consultas,
            pacientes, medicos-parametros, confirmacao, robustez (inclui acessibilidade), desempenho,
            zz-limite-login
```
