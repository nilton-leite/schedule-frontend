import { test } from '@playwright/test';

/**
 * Marca o teste como bug conhecido (registrado em e2e/RELATORIO-QA.md).
 * O teste descreve o comportamento CORRETO; enquanto o bug existir ele falha, e o test.fail() deixa a suíte verde.
 * Quando o bug for corrigido, o Playwright acusa "passou inesperadamente" — aí é só remover esta linha.
 *
 * QA_SHOW_BUGS=1 roda SEM o test.fail(), para ver a mensagem real de cada falha (conferir que o motivo é o bug).
 */
export function knownBug(id: string, descricao: string) {
  test.info().annotations.push({ type: 'bug', description: `${id}: ${descricao}` });
  if (!process.env.QA_SHOW_BUGS) test.fail();
}
