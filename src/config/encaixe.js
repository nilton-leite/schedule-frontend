import axios from 'axios';
import Swal from 'sweetalert2';

// Encaixe acima do limite de pacientes por hora do médico (QA-004).
// A API responde { statusCode: 409, message: 'Confirmar encaixe', response: '<pergunta>' } ao criar/mover uma
// consulta num horário cheio. Aqui, num ponto só para todas as telas (Agenda, Ficha, Consultas):
//   - pergunta à recepção; se confirmar, reenvia a MESMA requisição com encaixe=true e devolve o resultado;
//   - se desistir, devolve statusCode 400 com a mensagem, que as telas já exibem como erro.
export const ENCAIXE = 'Confirmar encaixe';

export function installEncaixeInterceptor() {
  return axios.interceptors.response.use(async (response) => {
    const body = response && response.data;
    const config = response && response.config;
    const ehAgendamento = config && /\/schedules(\/\d+)?$/.test((config.url || '').split('?')[0]);
    if (!body || body.statusCode !== 409 || body.message !== ENCAIXE || !ehAgendamento) return response;

    const escolha = await Swal.fire({
      title: 'Horário cheio',
      text: body.response,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Encaixar',
      cancelButtonText: 'Escolher outro horário'
    });
    if (!escolha.isConfirmed) {
      return { ...response, data: { statusCode: 400, message: 'Encaixe não confirmado', response: 'Agendamento não gravado. Escolha outro horário.' } };
    }
    const dados = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    return axios.request({ ...config, data: { ...dados, encaixe: true } });
  });
}
