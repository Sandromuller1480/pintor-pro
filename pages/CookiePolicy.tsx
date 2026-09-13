import React from 'react';
import { LegalPageLayout } from '../components/legal/LegalPageLayout';
import { cookieSections } from '../lib/legalContent';

export const CookiePolicy: React.FC = () => (
  <LegalPageLayout
    eyebrow="Política de Cookies"
    title="Política de Cookies da Pintor Pro"
    description="Saiba como cookies essenciais e não essenciais podem ser usados na plataforma e como controlar suas preferências."
    sections={cookieSections}
  />
);
