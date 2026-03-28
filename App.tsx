import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { buildPathForRoute, getInitialRoute } from './lib/routes';
import { supabase } from './lib/supabase';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error('Erro ao recuperar sessao:', error);
      }

      setIsAuthenticated(Boolean(data.session));
      setIsAuthReady(true);
    };

    void syncSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setIsAuthenticated(Boolean(session));
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    if (route.page === Page.Dashboard && !isAuthenticated) {
      navigateToPage(Page.Login);
      return;
    }

    if (route.page === Page.Login && isAuthenticated) {
      navigateToPage(Page.Dashboard);
    }
  }, [route.page, isAuthReady, isAuthenticated]);

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
