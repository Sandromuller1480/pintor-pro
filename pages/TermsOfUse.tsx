import React from 'react';
import { LegalPageLayout } from '../components/legal/LegalPageLayout';
import { termsSections } from '../lib/legalContent';

export const TermsOfUse: React.FC = () => (
  <LegalPageLayout
    eyebrow="Termos de Uso"
    title="Termos de Uso da Plataforma Pintor Pro"
    description="Regras claras para uso da plataforma, cadastro de pintores e clientes, assinaturas, negociacoes, contratos e responsabilidades."
    sections={termsSections}
  />
);
