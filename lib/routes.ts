import { AppRoute, Page } from '../types';

export const ROUTE_PATHS: Record<Exclude<Page, Page.PainterProfile>, string> = {
  [Page.Home]: '/',
  [Page.Register]: '/cadastro-pintor',
  [Page.HowItWorks]: '/como-funciona',
  [Page.Plans]: '/planos',
  [Page.About]: '/sobre',
  [Page.Help]: '/ajuda',
  [Page.Terms]: '/termos-de-uso',
  [Page.Privacy]: '/politica-de-privacidade',
  [Page.Cookies]: '/politica-de-cookies',
  [Page.PrivacyRequest]: '/privacidade/solicitacao',
  [Page.Login]: '/login',
  [Page.Dashboard]: '/painel',
  [Page.Admin]: '/admin'
};

export const getInitialRoute = (): AppRoute => {
  if (typeof window === 'undefined') {
    return { page: Page.Home };
  }

  const rawPath = window.location.pathname || '/';
  const cleanPath = rawPath.replace(/\/+$/, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length === 0) return { page: Page.Home };
  if (parts[0] === 'encontrar-pintor') return { page: Page.Home };
  if (parts[0] === 'cadastro-pintor') return { page: Page.Register };
  if (parts[0] === 'como-funciona') return { page: Page.HowItWorks };
  if (parts[0] === 'planos') return { page: Page.Plans };
  if (parts[0] === 'sobre') return { page: Page.About };
  if (parts[0] === 'ajuda') return { page: Page.Help };
  if (parts[0] === 'termos-de-uso') return { page: Page.Terms };
  if (parts[0] === 'politica-de-privacidade') return { page: Page.Privacy };
  if (parts[0] === 'politica-de-cookies') return { page: Page.Cookies };
  if (parts[0] === 'privacidade' && parts[1] === 'solicitacao') return { page: Page.PrivacyRequest };
  if (parts[0] === 'login') return { page: Page.Login };
  if (parts[0] === 'painel') return { page: Page.Dashboard };
  if (parts[0] === 'admin') return { page: Page.Admin };
  if (parts[0] === 'pintor' && parts[1]) {
    return { page: Page.PainterProfile, painterId: decodeURIComponent(parts[1]) };
  }

  return { page: Page.Home };
};

export const buildPathForRoute = (route: AppRoute): string => {
  if (route.page === Page.PainterProfile) {
    return route.painterId ? `/pintor/${encodeURIComponent(route.painterId)}` : ROUTE_PATHS[Page.Home];
  }

  return ROUTE_PATHS[route.page];
};
