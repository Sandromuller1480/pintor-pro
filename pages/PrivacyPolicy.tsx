import React from 'react';
import { LegalPageLayout } from '../components/legal/LegalPageLayout';
import { privacySections } from '../lib/legalContent';

export const PrivacyPolicy: React.FC = () => (
  <LegalPageLayout
    eyebrow="Privacidade e LGPD"
    title="Politica de Privacidade da Pintor Pro"
    description="Entenda quais dados podem ser tratados, para quais finalidades, com quem podem ser compartilhados e como exercer seus direitos."
    sections={privacySections}
  />
);
