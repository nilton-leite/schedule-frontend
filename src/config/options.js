// Opções dos selects de cadastro: só itens ativos (QA-006 médico inativo, QA-009 plano desativado).
// "manter" é a opção já escolhida num registro existente: continua na lista mesmo se foi desativada depois,
// para a tela mostrar o valor atual e permitir salvar sem trocá-lo (a API aceita manter).
export const onlyActive = (options, manter) => {
  const ativos = (options || []).filter((o) => o.active !== false);
  if (manter && manter.value != null && !ativos.some((o) => o.value === manter.value)) {
    const atual = (options || []).find((o) => o.value === manter.value) || manter;
    return [...ativos, { ...atual, label: `${atual.label} (desativado)` }];
  }
  return ativos;
};
