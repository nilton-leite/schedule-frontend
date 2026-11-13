import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ENDPOINT } from '../../config/constant';
import ConfirmationLayout from './ConfirmationLayout';

const MySwal = withReactContent(Swal);

// Mensagens para quando o link não pode ser usado (códigos da API pública de confirmação).
const ERRORS = {
  404: 'Este link não é válido. Use o link mais recente que enviamos pelo WhatsApp ou fale com a clínica.',
  410: 'Este link expirou porque o horário do agendamento já passou. Em caso de dúvida, fale com a clínica.',
  429: 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.'
};
const GENERIC_ERROR = 'Não foi possível carregar seu agendamento agora. Tente de novo em instantes ou fale com a clínica.';

const SITUATION_TEXT = {
  confirmado: { title: 'Agendamento confirmado', text: 'Obrigado! Esperamos você no dia e horário marcados.' },
  cancelado: { title: 'Agendamento cancelado', text: 'Se quiser remarcar, fale com a clínica.' },
  indisponivel: {
    title: 'Agendamento não está aguardando confirmação',
    text: 'Este agendamento foi alterado pela clínica. Em caso de dúvida, fale com a clínica.'
  }
};

// Página aberta pelo link do WhatsApp: /confirmacao/:token. Sem login; o token é a única credencial.
const Confirmation = () => {
  const { token } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const url = `${ENDPOINT.api}public/confirmation/${encodeURIComponent(token)}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(url);
      setSchedule(response.data.response);
    } catch (err) {
      const status = err && err.response && err.response.status;
      setError(ERRORS[status] || GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  const answer = async (acao) => {
    if (acao === 'cancelar') {
      const choice = await MySwal.fire({
        title: 'Cancelar o agendamento?',
        text: 'Seu horário ficará livre para outro paciente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, cancelar',
        cancelButtonText: 'Voltar'
      });
      if (!choice.isConfirmed) return;
    }
    setSending(true);
    try {
      const response = await axios.post(url, { acao });
      setSchedule(response.data.response);
    } catch (err) {
      const status = err && err.response && err.response.status;
      const body = err && err.response && err.response.data;
      if (status === 409 && body && body.response) {
        // Já respondido (por esta ou outra aba, ou pela clínica): mostra a situação atual.
        setSchedule(body.response);
      } else {
        MySwal.fire({ title: 'Poxa...', text: ERRORS[status] || GENERIC_ERROR, icon: 'error' });
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <ConfirmationLayout>
        <Spinner animation="border" role="status" />
        <p className="mt-3 mb-0">Carregando seu agendamento…</p>
      </ConfirmationLayout>
    );
  }

  if (error) {
    return (
      <ConfirmationLayout>
        <p className="mb-0">{error}</p>
      </ConfirmationLayout>
    );
  }

  const done = SITUATION_TEXT[schedule.situation];
  const what = schedule.scheduleType || 'Agendamento';

  return (
    <ConfirmationLayout>
      <h5 className="mb-3">Olá{schedule.firstName ? `, ${schedule.firstName}` : ''}!</h5>
      <p className="mb-1">
        <strong>{what}</strong>
        {schedule.doctorName ? (
          <>
            {' '}
            com <strong>{schedule.doctorName}</strong>
          </>
        ) : null}
      </p>
      <p className="mb-4">
        em <strong>{schedule.date}</strong> às <strong>{schedule.time}</strong>
      </p>

      {done ? (
        <>
          <h6 className="mb-2">{done.title}</h6>
          <p className="mb-0 text-muted">{done.text}</p>
        </>
      ) : (
        <>
          <p className="mb-3">Você confirma sua presença?</p>
          <Button variant="primary" className="m-1" disabled={sending} onClick={() => answer('confirmar')}>
            Confirmar
          </Button>
          <Button variant="outline-danger" className="m-1" disabled={sending} onClick={() => answer('cancelar')}>
            Cancelar agendamento
          </Button>
        </>
      )}
    </ConfirmationLayout>
  );
};

export default Confirmation;
