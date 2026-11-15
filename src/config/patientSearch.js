import axios from 'axios';
import { ENDPOINT } from './constant';

/** Rótulo do paciente nos campos de busca: "(telefone) Nome". */
export const patientLabel = (p) => `(${p.phone || ''}) ${p.name}`;

/**
 * Busca de paciente enquanto se digita (react-select/async), a partir de 3 caracteres.
 * Antes a agenda baixava TODOS os pacientes (~8 mil, cada um com seus agendamentos) ao abrir e a cada clique
 * num horário. A API devolve no máximo 30, por nome (sem acento) e, se o termo for número, por telefone/CPF.
 */
export const searchPatients = async (term) => {
  const termo = String(term || '').trim();
  if (termo.length < 3) return [];
  const response = await axios.get(`${ENDPOINT.api}patients/search`, { ...ENDPOINT.config, params: { search: termo } });
  return Array.isArray(response.data.response) ? response.data.response : [];
};

export const loadPatientOptions = async (term) => {
  try {
    return (await searchPatients(term)).map((p) => ({ value: p.patientId, label: patientLabel(p) }));
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return [];
  }
};

/** Paciente com exatamente este CPF (só dígitos), ou null. */
export const findPatientByCpf = async (cpf) => {
  const digitos = String(cpf || '').replace(/\D/g, '');
  if (digitos.length !== 11) return null;
  return (await searchPatients(digitos)).find((p) => p.document === digitos) || null;
};

/** "AAAA-MM-DD" no fuso do navegador (toISOString usa UTC: depois das 21h já é o dia seguinte). */
export const localISODate = (d = new Date()) => {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${mm}-${dd}`;
};
