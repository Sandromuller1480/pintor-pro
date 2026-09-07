import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { getPainterApplicationId, getSessionRoleContext, type SessionRole } from './lib/authSession';
import { getCurrentAdminProfile } from './lib/adminAccess';
import { buildPathForRoute, getInitialRoute } from './lib/routes';
import { supabase } from './lib/supabase';
import { AppRoute, NavigateToPage, Page, PageNavigationParams } from './types';

const HomePage = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const PainterProfilePage = lazy(() => import('./pages/PainterProfile').then((module) => ({ default: module.PainterProfile })));
const RegisterPage = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorks').then((module) => ({ default: module.HowItWorks })));
const PlansPage = lazy(() => import('./pages/Plans').then((module) => ({ default: module.Plans })));
const AboutPage = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const HelpCenterPage = lazy(() => import('./pages/HelpCenter').then((module) => ({ default: module.HelpCenter })));
const PaintingCategoriesPage = lazy(() => import('./pages/PaintingCategories').then((module) => ({ default: module.PaintingCategories })));
const InspirationGalleryPage = lazy(() => import('./pages/InspirationGallery').then((module) => ({ default: module.InspirationGallery })));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUse').then((module) => ({ default: module.TermsOfUse })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicy').then((module) => ({ default: module.PrivacyPolicy })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicy').then((module) => ({ default: module.CookiePolicy })));
const PrivacyRequestPage = lazy(() => import('./pages/PrivacyRequest').then((module) => ({ default: module.PrivacyRequest })));
const LoginPage = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const DashboardPage = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));

const getPageLoadingMessage = (page: Page) => {
  switch (page) {
    case Page.Dashboard:
      return 'Carregando painel do pintor...';
    case Page.Admin:
      return 'Carregando painel admin...';
    case Page.PainterProfile:
      return 'Carregando perfil...';
    default:
      return 'Carregando pagina...';
  }
};

const PageLoadingState = ({ message }: { message: string }) => (
  <div className="py-24 text-center max-w-xl mx-auto px-4">
    <p className="text-slate-500 font-black uppercase tracking-widest">{message}</p>
  </div>
);

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(getInitialRoute);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sessionRole, setSessionRole] = useState<SessionRole>('guest');
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionUserEmail, setSessionUserEmail] = useState('');

  const navigateToPage: NavigateToPage = (page, params?: PageNavigationParams) => {
    const nextRoute: AppRoute =
      page === Page.PainterProfile
        ? { page, painterId: params?.painterId }
        : { page };

    setRoute(nextRoute);

    if (typeof window !== 'undefined') {
      const nextPath = buildPathForRoute(nextRoute);
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => setRoute(getInitialRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const sessionContext = await getSessionRoleContext();
        const adminProfile = await getCurrentAdminProfile(sessionContext.user);

        if (!isMounted) return;

        setSessionRole(sessionContext.role);
        setHasAdminAccess(Boolean(adminProfile));
        setSessionUserId(sessionContext.user?.id ?? null);
        setSessionUserEmail(sessionContext.user?.email?.trim().toLowerCase() ?? '');
        setIsAuthReady(true);
      } catch (error) {
        if (!isMounted) return;

        console.error('Erro ao recuperar sessao:', error);
        setSessionRole('guest');
        setHasAdminAccess(false);
        setSessionUserId(null);
        setSessionUserEmail('');
        setIsAuthReady(true);
      }
    };

    void syncSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      if (!isMounted) return;

      void syncSession();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const syncPainterPresenceFromSession = async () => {
      if (!isAuthReady || sessionRole !== 'painter' || !sessionUserId) {
        return;
      }

      try {
        const applicationId = await getPainterApplicationId(sessionUserEmail, sessionUserId);

        if (!applicationId || isCancelled) {
          return;
        }

        const { error } = await supabase
          .from('applications')
          .update({
            is_online: true,
            last_seen_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        if (error && !isCancelled) {
          console.error('Erro ao sincronizar presenca online do pintor a partir da sessao:', error);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Erro ao localizar cadastro do pintor para sincronizar presenca:', error);
        }
      }
    };

    void syncPainterPresenceFromSession();

    return () => {
      isCancelled = true;
    };
  }, [isAuthReady, sessionRole, sessionUserEmail, sessionUserId]);

  useEffect(() => {
    const isPainterAuthenticated = sessionRole === 'painter';

    if (!isAuthReady) return;

    if (route.page === Page.Dashboard && !isPainterAuthenticated) {
      if (hasAdminAccess) {
        navigateToPage(Page.Admin);
        return;
      }

      navigateToPage(Page.Login);
      return;
    }

    if (route.page === Page.Admin && !hasAdminAccess) {
      if (isPainterAuthenticated) {
        navigateToPage(Page.Dashboard);
        return;
      }

      navigateToPage(Page.Login);
      return;
    }

    if (route.page === Page.Login && hasAdminAccess) {
      navigateToPage(Page.Admin);
      return;
    }

    if (route.page === Page.Login && isPainterAuthenticated) {
      navigateToPage(Page.Dashboard);
    }
  }, [route.page, hasAdminAccess, isAuthReady, sessionRole]);

  const renderPage = () => {
    if (route.page === Page.Dashboard && !isAuthReady) {
      return <PageLoadingState message="Verificando acesso..." />;
    }

    switch (route.page) {
      case Page.Home:
        return <HomePage setPage={navigateToPage} />;
      case Page.PainterProfile:
        return <PainterProfilePage painterId={route.painterId} setPage={navigateToPage} />;
      case Page.Register:
        return <RegisterPage setPage={navigateToPage} />;
      case Page.HowItWorks:
        return <HowItWorksPage setPage={navigateToPage} />;
      case Page.Plans:
        return <PlansPage setPage={navigateToPage} />;
      case Page.About:
        return <AboutPage />;
      case Page.Help:
        return <HelpCenterPage setPage={navigateToPage} />;
      case Page.PaintingCategories:
        return <PaintingCategoriesPage setPage={navigateToPage} />;
      case Page.InspirationGallery:
        return <InspirationGalleryPage setPage={navigateToPage} />;
      case Page.Terms:
        return <TermsOfUsePage />;
      case Page.Privacy:
        return <PrivacyPolicyPage />;
      case Page.Cookies:
        return <CookiePolicyPage />;
      case Page.PrivacyRequest:
        return <PrivacyRequestPage />;
      case Page.Login:
        return <LoginPage setPage={navigateToPage} />;
      case Page.Dashboard:
        return <DashboardPage setPage={navigateToPage} />;
      case Page.Admin:
        return <AdminDashboardPage setPage={navigateToPage} />;
      default:
        return <HomePage setPage={navigateToPage} />;
    }
  };

  return (
    <Layout currentPage={route.page} setPage={navigateToPage}>
      <Suspense fallback={<PageLoadingState message={getPageLoadingMessage(route.page)} />}>
        {renderPage()}
      </Suspense>
    </Layout>
  );
};

export default App;
