import React from 'react';
import ConfirmationLayout from './ConfirmationLayout';

// Rota antiga (/confirmacao, sem token): os links enviados antes da mudança caem aqui.
const OldLinkNotice = () => (
  <ConfirmationLayout>
    <h5 className="mb-3">Este link de confirmação mudou</h5>
    <p className="mb-2">Use o link mais recente que enviamos pelo WhatsApp para confirmar ou cancelar seu agendamento.</p>
    <p className="mb-0 text-muted">
      Se não encontrar a mensagem, responda por lá mesmo com CONFIRMADO ou CANCELADO, ou fale com a clínica.
    </p>
  </ConfirmationLayout>
);

export default OldLinkNotice;
