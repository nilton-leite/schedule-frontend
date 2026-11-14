// Campos obrigatórios da Nova Consulta (QA-012). Antes o formulário enviava incompleto e a tela mostrava só
// "Não foi possivel cadastrar." Devolve a mensagem com o que falta, ou null quando está completo.
const vazio = (v) => v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v));

export function camposFaltando({ tipo, paciente, medico, data, inicio, fim }) {
  const faltam = [];
  if (vazio(tipo)) faltam.push('tipo');
  if (vazio(paciente)) faltam.push('paciente');
  if (vazio(medico)) faltam.push('médico');
  if (vazio(data)) faltam.push('data');
  if (vazio(inicio) || /_/.test(String(inicio))) faltam.push('hora inicial');
  if (vazio(fim) || /_/.test(String(fim))) faltam.push('hora final');
  if (!faltam.length) return null;
  const lista = faltam.length === 1 ? faltam[0] : `${faltam.slice(0, -1).join(', ')} e ${faltam[faltam.length - 1]}`;
  return `Preencha ${lista} para cadastrar a consulta.`;
}
