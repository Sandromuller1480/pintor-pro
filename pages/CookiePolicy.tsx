import React from 'react';
import { LegalPageLayout } from '../components/legal/LegalPageLayout';
import { cookieSections } from '../lib/legalContent';

export const CookiePolicy: React.FC = () => (
  <LegalPageLayout
    eyebrow="Politica de Cookies"
    title="Politica de Cookies da Pintor Pro"
    description="Saiba como cookies essenciais e nao essenciais podem ser usados na plataforma e como controlar suas preferencias."
    sections={cookieSections}
  />
);
