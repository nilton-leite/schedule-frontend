# Relatório de QA — Agenda Eletrônica (13/11/2026)

Branch `hardening` (API + front), ambiente isolado com dados sintéticos. Suíte: `e2e/` (Playwright).
Cada bug abaixo tem um teste que o reproduz, marcado com `knownBug('QA-0xx')`. Nenhuma correção foi feita na
aplicação (decisão: só reportar).

**Última execução**: 112 testes aprovados em 9,6 min (Chromium, Firefox nos @smoke/@cross e iPhone na página
de confirmação), com os bugs abaixo marcados como falha esperada. `QA_SHOW_BUGS=1` mostra cada um falhando pela
causa descrita (conferido um a um).

## Andamento das correções
| Data | Correção | Bugs resolvidos |
|---|---|---|
| 13/11 | Validador único de regras da agenda (`schedule-api/src/modules/schedules/schedule-rules.ts`), usado na criação e na edição | QA-002, QA-003, QA-005, QA-007, QA-008, QA-025; QA-006 e QA-009 **na API** (as listas da tela ficam para a C2) |
| 13/11 | Agenda lista também médicos desativados que têm consultas de hoje em diante (`agendaDoctorFilters` em `schedules.service.ts`), com `active: false`; a tela marca o evento como "– inativo" | QA-023 |
| 13/11 | Agenda: faixa "A agenda pode estar incompleta" com "Tentar de novo" quando agenda, médicos, situações, tipos ou planos não carregam; marcação bloqueada até recarregar (`FullEventCalendar.js`) | QA-020 |
| 13/11 | Login: limite por CPF (5 erros em 15 min bloqueiam só aquele CPF; login certo zera — `LoginAttemptsService`), limite por IP subiu de 10 para 60/min; CPF aceito com pontuação; mensagens distintas na tela para senha errada, “aguarde”, sem conexão e sistema indisponível | QA-013, QA-019, QA-021 |

**Fase C1 (alta) concluída.** Pendentes: C2 (agenda) e C3 (cadastros e ajustes).

## Resumo executivo
- **O fluxo principal funciona**: login por perfil, criar consulta pela agenda, vê-la no calendário, confirmar pela
  ficha (com plano), lista de consultas, cadastro de pacientes, página pública de confirmação (desktop e iPhone),
  perfis de acesso, nenhuma tela com erro de JavaScript, nenhuma chamada saindo para produção, sem XSS.
- **22 problemas confirmados**: 6 de severidade **alta**, 9 **média**, 7 **baixa**. Os altos se concentram nas
  **regras da agenda** (ausência, edição, médico desativado, falha silenciosa) e no **limite de login** criado no
  endurecimento.
- Recomendação: corrigir os 6 altos antes do deploy da Onda 2 (QA-013 é do próprio endurecimento e afeta o
  relogin de todos no dia do deploy).

## Bugs por severidade

### Alta
| Id | Onde | Problema | Como reproduzir | Teste |
|---|---|---|---|---|
| QA-013 | Login (API) | Limite de **10 logins/min por IP**. A clínica inteira sai pelo mesmo IP: no início do expediente ou após o deploy (todos relogam), a 11ª pessoa recebe 429 — e a tela diz "Usuário ou senha incorretos." mesmo com a senha certa. | 12 logins seguidos: `201×10, 429, 429`. | `zz-limite-login` |
| QA-020 | Agenda (front) | Se a API da agenda falha, o erro vai só para o console: a grade aparece **vazia, sem aviso**, como se o dia estivesse livre. Risco de marcar por cima. | Simular 500 em `/schedules/only` e clicar em "Todas". | `robustez` |
| QA-023 | Agenda (API) | **Desativar um médico esconde todas as consultas futuras dele** da agenda (a listagem filtra só médicos ativos). Os pacientes continuam marcados e ninguém vê para remarcar. | Consulta futura com Dr. Bruno → desativar → `GET /schedules/only` não traz o médico nem a consulta. | `medicos-parametros` |
| QA-007 | Editar consulta (API) | A **edição não aplica nenhuma regra**: dá para mover uma consulta para domingo, para o passado ou para 03:00. A ficha da agenda permite alterar data e hora. | `PATCH /schedules/:id` com domingo / data passada / 03:00 → 200 (confirmado no banco). | `agenda-regras` |
| QA-002 | Criar consulta (API) | O **primeiro dia** de uma ausência temporária não é bloqueado (só os dias do meio e o último). | Ausência seg–qua 08–18h → marcar segunda 10h → aceito. | `agenda-regras` |
| QA-003 | Criar consulta (API) | Só **uma** ausência ativa do médico é considerada (`findOne`): uma segunda ausência (ex.: férias depois de um congresso) não bloqueia nada. | Duas ausências → marcar dentro da segunda → aceito. | `agenda-regras` |

| QA-025 | Editar consulta (API) | **Editar sem enviar a situação gravava "Finalizado"**: sem `statusId`, o `findOneBy` ignorava o filtro e pegava o primeiro status da tabela. A tela de Consultas envia só os campos alterados, então mudar observação/horário por ela finalizava a consulta. *(Achado durante a correção do QA-007; corrigido.)* | `PATCH` só com `obs` → status 1. | `agenda-regras` |

### Média
| Id | Onde | Problema | Teste |
|---|---|---|---|
| QA-004 | Criar consulta (API) | Sem checagem de **conflito/capacidade**: o médico tem "pacientes por hora" (Ana = 1), mas dois pacientes no mesmo horário são aceitos. (Confirmar com a clínica se encaixe é desejado; hoje a coluna existe e é ignorada.) | `agenda-regras` |
| QA-010 | Ficha da consulta | A ficha **exige plano de saúde para salvar**: consulta sem plano não pode ser confirmada/cancelada ("Preencha todos os campos") sem escolher um plano — o que grava um convênio que não existe. ~3,5% das consultas reais dos últimos 90 dias não têm plano. | `agenda-ficha` |
| QA-011 | Ficha da consulta | **"Retorno?" invertido**: o cadastro grava "Retorno? Sim" como `hasFirstQuery = true` e a ficha mostra o inverso. Nos dados reais, 99,6% das consultas aparecem como "Retorno: Sim". | `agenda-ficha` |
| QA-006 | Agenda | **Médico inativo** aparece na lista para agendar e a API aceita o agendamento. | `agenda-ficha`, `agenda-regras` |
| QA-009 | Agenda | **Plano desativado** é oferecido na Nova Consulta e aceito pela API. | `medicos-parametros`, `agenda-regras` |
| QA-016 | Pacientes (API) | **Telefone único por paciente**: mãe e bebê (exame BERA infantil) não podem ter o mesmo celular — força telefone falso e o WhatsApp de confirmação vai para o lugar errado. (Decisão de produto a confirmar.) | `pacientes` |
| QA-017 | Pacientes (API) | **CPF duplicado** é aceito (só o telefone é checado). A detecção de "CPF já cadastrado" na tela só olha os 10 pacientes da página aberta. | `pacientes` |
| QA-022 | Acessibilidade | Crítico em todas as telas: **zoom bloqueado no celular** (`meta-viewport`) — pesa na página de confirmação usada por pacientes idosos. Agenda: botões sem nome, campo sem rótulo, 14 problemas de contraste. | `robustez` (axe) |
| QA-014 | Navegação | **F5 ou link direto** em qualquer tela interna sempre volta para a Agenda (perde-se a tela e os filtros). | `navegacao` |

### Baixa
| Id | Onde | Problema | Teste |
|---|---|---|---|
| QA-005 | API | Horários comparados como **texto**: "9:00" ou "08:00" (sem segundos) caem fora da escala. Pela tela não acontece (o front envia `HH:MM:SS`). | `agenda-regras` |
| QA-008 | API | Plano inexistente no agendamento → **500** genérico em vez de 400/404. | `agenda-regras` |
| QA-012 | Nova Consulta | Sem validação no formulário: cadastrar sem paciente mostra só "Não foi possivel cadastrar." | `agenda-ficha` |
| QA-018 | Pacientes | Busca **diferencia acentos**: "cecilia" não encontra "Cecília". | `pacientes` |
| QA-019 | Login | CPF com pontuação ("000.000.000-00") não entra (campo sem máscara). | `auth` |
| QA-021 | Login | Qualquer falha (servidor fora, 429, 500) aparece como "Usuário ou senha incorretos." | `robustez` |
| QA-001 | Médicos (API) | A lista de médicos responde **500** se algum médico não tiver "criado por"/"alterado por" (lê `users.name` sem checar). Hoje todos os médicos reais têm; quebra com registro importado ou usuário apagado. | (achado ao montar o seed) |

### Observações (sem teste automatizado)
- `dateBirth: "Invalid date"` na resposta de paciente sem data de nascimento.
- Lista "Consultas de hoje" da agenda usa a data em **UTC** (`toISOString`): depois das 21h mostra o dia seguinte.
- Ao abrir **Nova Consulta**, o front baixa **todos os pacientes** (`GET /patients`); com ~8 mil pacientes reais isso pesa a cada abertura. Não medido com volume.
- Com o cadastro simplificado de paciente aberto, o modal Nova Consulta perde o botão "Cadastrar".
- Status de sistema (5 "Erro na confirmação automática", 6 "Enviado mensagem de confirmação") podem ser escolhidos à mão na ficha.
- **QA-024 (não confirmado)**: suspeita de que a escala do médico aceita "fim antes do início". O teste pela API não gravou a escala inválida; precisa ser verificado pela tela de Médicos.

## Cobertura
| Área | O que foi testado |
|---|---|
| Autenticação | senha errada, usuário inativo, sessão sem senha/hash no navegador, sair limpa a sessão, token inválido volta ao login, CPF pontuado, limite de login |
| Perfis | menu por perfil (admin/recepção/médico) em todas as telas; regras de API já cobertas pelos 45 e2e da API |
| Agenda | criar pela tela e conferir no calendário e no banco; ficha (confirmar com plano, sem plano, retorno, consulta passada só leitura); regras de escala, retroativo, ausência (início/meio/fim/depois/duas ausências), cirurgia, conflito, edição, médico inativo, planos |
| Consultas | filtro por médico + data |
| Pacientes | cadastro com máscaras e plano (conferido no banco), CPF inválido, telefone e CPF duplicados, busca com/sem acento, XSS no nome (lista, agenda, tooltip), cadastro pelo modal da agenda |
| Médicos/Parâmetros | médico desativado com consultas futuras, plano novo e plano desativado na agenda |
| Confirmação pública | confirmar, cancelar (com desistência), link inválido/antigo/expirado, alterado pela clínica, funcionário logado; sem sobrenome/telefone na página; desktop e iPhone |
| Não funcionais | varredura de todas as telas × perfis (erros JS, 4xx/5xx, chamadas para produção), telas paradas sem chamadas em loop, API fora do ar, acessibilidade (axe), Firefox nos @smoke/@cross |

**Não coberto nesta rodada**: cadastro/edição de médico e ausência **pela tela** (formulário extenso), carga com
volume real, sessões exploratórias manuais por charter, troca de senha pela tela.
