import axios from 'axios';
import Swal from 'sweetalert2';

// Confirmações pedidas pela API, num ponto só para todas as telas.
// A API responde { statusCode: 409, message: '<chave>', response: '<pergunta>' }; aqui:
//   - pergunta ao usuário; se confirmar, reenvia a MESMA requisição com o campo de confirmação e devolve o resultado;
//   - se desistir, devolve statusCode 400 com a mensagem, que as telas já exibem como erro.
export const ENCAIXE = 'Confirmar encaixe';
export const CONFIRMAR_TELEFONE = 'Confirmar telefone';

const CONFIRMACOES = {
  // Horário do médico cheio (acima de "pacientes por hora") — QA-004.
  [ENCAIXE]: {
    url: /\/schedules(\/\d+)?$/,
    titulo: 'Horário cheio',
    sim: 'Encaixar',
    nao: 'Escolher outro horário',
    campo: 'encaixe',
    desistiu: 'Agendamento não gravado. Escolha outro horário.'
  },
  // Telefone já usado por outro paciente (ex.: mãe e bebê) — QA-016.
  [CONFIRMAR_TELEFONE]: {
    url: /\/patients(\/\d+)?$/,
    titulo: 'Telefone já cadastrado',
    sim: 'Cadastrar mesmo assim',
    nao: 'Corrigir o telefone',
    campo: 'telefoneCompartilhado',
    desistiu: 'Paciente não cadastrado. Corrija o telefone.'
  }
};

export function installEncaixeInterceptor() {
  return axios.interceptors.response.use(async (response) => {
    const body = response && response.data;
    const config = response && response.config;
    const regra = body && body.statusCode === 409 && CONFIRMACOES[body.message];
    if (!regra || !config || !regra.url.test((config.url || '').split('?')[0])) return response;

    const escolha = await Swal.fire({
      title: regra.titulo,
      text: body.response,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: regra.sim,
      cancelButtonText: regra.nao
    });
    if (!escolha.isConfirmed) {
      return { ...response, data: { statusCode: 400, message: regra.desistiu, response: regra.desistiu } };
    }
    const dados = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    return axios.request({ ...config, data: { ...dados, [regra.campo]: true } });
  });
}
