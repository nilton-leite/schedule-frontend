import React from 'react';
import ConfirmationLayout from './ConfirmationLayout';

// Rota antiga (/confirmacao, sem token): os links enviados antes da mudança caem aqui.
// Esses pacientes NÃO recebem link novo (a clínica confirma manualmente), então a orientação é responder pelo WhatsApp.
const OldLinkNotice = () => (
  <ConfirmationLayout>
    <h5 className="mb-3">Este link não está mais ativo</h5>
    <p className="mb-2">
      Para confirmar ou cancelar seu agendamento, responda à nossa mensagem no WhatsApp com <strong>CONFIRMADO</strong> ou{' '}
      <strong>CANCELADO</strong>.
    </p>
    <p className="mb-0 text-muted">Se preferir, fale com a clínica.</p>
  </ConfirmationLayout>
);

export default OldLinkNotice;
