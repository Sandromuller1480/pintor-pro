import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { getPainterApplicationId, getSessionRoleContext, type SessionRole } from './lib/authSession';
import { getCurrentAdminProfile } from './lib/adminAccess';
import { buildPathForRoute, getInitialRoute } from './lib/routes';
import { supabase } from './lib/supabase';
import { AdminDashboard } from './pages/AdminDashboard';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { FindPainter } from './pages/FindPainter';
import { Home } from './pages/Home';
import { HowItWorks } from './pages/HowItWorks';
import { Login } from './pages/Login';
import { PainterProfile } from './pages/PainterProfile';
import { Plans } from './pages/Plans';
import { Register } from './pages/Register';
import { AppRoute, NavigateToPage, Page, PageNavigationParams } from './types';

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
      return (
        <div className="py-24 text-center max-w-xl mx-auto px-4">
          <p className="text-slate-500 font-black uppercase tracking-widest">Verificando acesso...</p>
        </div>
      );
    }

    switch (route.page) {
      case Page.Home:
        return <Home setPage={navigateToPage} />;
      case Page.FindPainter:
        return <FindPainter setPage={navigateToPage} />;
      case Page.PainterProfile:
        return <PainterProfile painterId={route.painterId} setPage={navigateToPage} />;
      case Page.Register:
        return <Register setPage={navigateToPage} />;
      case Page.HowItWorks:
        return <HowItWorks setPage={navigateToPage} />;
      case Page.Plans:
        return <Plans setPage={navigateToPage} />;
      case Page.About:
        return <About />;
      case Page.Login:
        return <Login setPage={navigateToPage} />;
      case Page.Dashboard:
        return <Dashboard setPage={navigateToPage} />;
      case Page.Admin:
        return <AdminDashboard setPage={navigateToPage} />;
      default:
        return <Home setPage={navigateToPage} />;
    }
  };

  return (
    <Layout currentPage={route.page} setPage={navigateToPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
