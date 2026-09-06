import React, { useEffect, useState } from 'react';
import { Menu, X, Instagram, Facebook, Linkedin, LogOut, LogIn } from 'lucide-react';
import { getCurrentAdminProfile, type CurrentAdminProfile } from '../lib/adminAccess';
import { getSessionRoleContext, type SessionRole } from '../lib/authSession';
import { type CurrentClientProfile } from '../lib/services/clientSignupService';
import { supabase } from '../lib/supabase';
import { Page } from '../types';
import { CookieConsentBanner } from './legal/CookieConsentBanner';
import { ClientLoginModal } from './ClientLoginModal';
import { ClientSignupModal } from './ClientSignupModal';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setPage: (p: Page) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, setPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionRole, setSessionRole] = useState<SessionRole>('guest');
  const [currentClientProfile, setCurrentClientProfile] = useState<CurrentClientProfile | null>(null);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<CurrentAdminProfile | null>(null);
  const [isClientLoginModalOpen, setIsClientLoginModalOpen] = useState(false);
  const [isClientSignupModalOpen, setIsClientSignupModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncSessionContext = async () => {
      try {
        const sessionContext = await getSessionRoleContext();
        const adminProfile = await getCurrentAdminProfile(sessionContext.user);

        if (!isMounted) {
          return;
        }

        setSessionRole(sessionContext.role);
        setCurrentClientProfile(sessionContext.currentClientProfile);
        setCurrentAdminProfile(adminProfile);
      } catch (error) {
        console.error('Erro ao carregar sessão do cabeçalho:', error);

        if (!isMounted) {
          return;
        }

        setSessionRole('guest');
        setCurrentClientProfile(null);
        setCurrentAdminProfile(null);
      }
    };

    void syncSessionContext();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void syncSessionContext();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (currentPage === Page.Dashboard || currentPage === Page.Admin) {
    return <div className="min-h-screen bg-slate-50 font-sans">{children}</div>;
  }

  const clientFirstName = currentClientProfile?.fullName.trim().split(/\s+/)[0] ?? '';
  const shouldShowClientEntry = sessionRole !== 'painter';
  const shouldShowPlansEntry = sessionRole !== 'client';
  const shouldShowPainterEntry = sessionRole !== 'client';
  const shouldShowAdminEntry = Boolean(currentAdminProfile);
  const footerGridClassName = sessionRole === 'client'
    ? 'grid grid-cols-1 md:grid-cols-3 gap-16 mb-16 max-w-5xl mx-auto'
    : 'grid grid-cols-1 md:grid-cols-4 gap-16 mb-16';

  const handleClientLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao encerrar sessão do cliente:', error);
      return;
    }

    setSessionRole('guest');
    setCurrentClientProfile(null);
    setPage(Page.Home);
  };

  const handleClientLoginSuccess = () => {
    setIsClientLoginModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center cursor-pointer" onClick={() => setPage(Page.Home)}>
              <Logo className="h-16" color="#000000" />
              {shouldShowClientEntry && (
                currentClientProfile ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleClientLogout();
                    }}
                    className="ml-10 hidden lg:inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-[#9A077B] transition hover:bg-[#FDF3FA]"
                    title="Sair da conta do cliente"
                  >
                    <span>Ola {clientFirstName || 'Cliente'}</span>
                    <LogOut size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsClientLoginModalOpen(true);
                    }}
                    className="ml-10 hidden lg:inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-[#9A077B] transition hover:bg-[#FDF3FA]"
                    title="Entrar como cliente"
                  >
                    <span>Login Cliente</span>
                    <LogIn size={16} />
                  </button>
                )
              )}
            </div>

            <nav className="hidden md:flex space-x-8 items-center">
              <button
                onClick={() => setPage(Page.HowItWorks)}
                className={`text-sm font-bold uppercase tracking-wider transition ${currentPage === Page.HowItWorks ? 'text-[#9A077B]' : 'text-slate-600 hover:text-[#000747]'}`}
              >
                Como Funciona
              </button>
              <button
                onClick={() => setPage(Page.Help)}
                className={`text-sm font-bold uppercase tracking-wider transition ${currentPage === Page.Help ? 'text-[#9A077B]' : 'text-slate-600 hover:text-[#000747]'}`}
              >
                Ajuda
              </button>
              {shouldShowPlansEntry && (
                <button
                  onClick={() => setPage(Page.Plans)}
                  className={`text-sm font-bold uppercase tracking-wider transition ${currentPage === Page.Plans ? 'text-[#9A077B]' : 'text-slate-600 hover:text-[#000747]'}`}
                >
                  Planos
                </button>
              )}
              {shouldShowPainterEntry && (
                <>
                  <div className="h-6 w-px bg-slate-200 mx-2" />
                  <button
                    onClick={() => setPage(Page.Login)}
                    className="bg-[#9A077B] text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3] uppercase tracking-widest"
                  >
                    Área do Pintor
                  </button>
                </>
              )}
              {shouldShowAdminEntry && (
                <button
                  onClick={() => setPage(Page.Admin)}
                  className="rounded-xl border border-[#000747]/15 bg-[#000747] px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-[#020b72]"
                >
                  Painel Admin
                </button>
              )}
            </nav>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            {shouldShowClientEntry && (
              currentClientProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleClientLogout();
                    setIsMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#FDF3FA] px-4 py-3 text-sm font-black text-[#9A077B]"
                >
                  <span>Ola {clientFirstName || 'Cliente'}</span>
                  <LogOut size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsClientLoginModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#FDF3FA] px-4 py-3 text-sm font-black text-[#9A077B]"
                >
                  <span>Login Cliente</span>
                  <LogIn size={16} />
                </button>
              )
            )}

            <button
              onClick={() => {
                setPage(Page.HowItWorks);
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-lg font-bold p-2 uppercase tracking-tight"
            >
              Como Funciona
            </button>
            <button
              onClick={() => {
                setPage(Page.Help);
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-lg font-bold p-2 uppercase tracking-tight"
            >
              Ajuda
            </button>
            {shouldShowPlansEntry && (
              <button
                onClick={() => {
                  setPage(Page.Plans);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-lg font-bold p-2 uppercase tracking-tight"
              >
                Planos
              </button>
            )}
            {shouldShowPainterEntry && (
              <button
                onClick={() => {
                  setPage(Page.Login);
                  setIsMenuOpen(false);
                }}
                className="w-full bg-[#9A077B] text-white px-6 py-4 rounded-xl font-black text-center uppercase tracking-widest mt-4"
              >
                Sou Pintor
              </button>
            )}
            {shouldShowAdminEntry && (
              <button
                onClick={() => {
                  setPage(Page.Admin);
                  setIsMenuOpen(false);
                }}
                className="w-full rounded-xl bg-[#000747] px-6 py-4 text-center font-black uppercase tracking-widest text-white"
              >
                Painel Admin
              </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-grow">{children}</main>

      <ClientLoginModal
        isOpen={isClientLoginModalOpen}
        onClose={() => setIsClientLoginModalOpen(false)}
        onSuccess={handleClientLoginSuccess}
        onShowSignup={() => setIsClientSignupModalOpen(true)}
      />

      <ClientSignupModal
        isOpen={isClientSignupModalOpen}
        onClose={() => setIsClientSignupModalOpen(false)}
        onSuccess={() => setIsClientSignupModalOpen(false)}
      />
      <CookieConsentBanner />

      <footer className="bg-[#0f172a] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={footerGridClassName}>
            <div className="col-span-1 md:col-span-1">
              <Logo className="h-20 mb-8" color="#ffffff" />
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                A primeira plataforma nacional focada exclusivamente na elite da pintura imobiliaria. Qualidade inegociavel, tecnologia de ponta.
              </p>
              <div className="flex space-x-5">
                <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-[#9A077B] transition duration-300"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-[#9A077B] transition duration-300"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-[#9A077B] transition duration-300"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-8 text-white uppercase text-xs tracking-[0.2em] border-l-4 border-[#9A077B] pl-4">Marketplace</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                {sessionRole !== 'painter' && (
                  <li><button onClick={() => setPage(Page.HowItWorks)} className="hover:text-[#C93EA6] transition">Como funciona para Clientes</button></li>
                )}
                <li><button onClick={() => setPage(Page.Help)} className="hover:text-[#C93EA6] transition">Central de Ajuda</button></li>
                <li>
                  <a
                    href="/categorias-de-pintura"
                    className="hover:text-[#C93EA6] transition"
                  >
                    Categorias de Pintura
                  </a>
                </li>
                <li><button className="hover:text-[#C93EA6] transition">Galeria de Inspiração</button></li>
              </ul>
            </div>

            {sessionRole !== 'client' && (
              <div>
                <h4 className="font-black mb-8 text-white uppercase text-xs tracking-[0.2em] border-l-4 border-[#9A077B] pl-4">Profissionais</h4>
                <ul className="space-y-4 text-slate-400 text-sm font-medium">
                  <li><button onClick={() => setPage(Page.Register)} className="hover:text-[#C93EA6] transition">Cadastrar Portfólio</button></li>
                  {shouldShowPlansEntry && (
                    <li><button onClick={() => setPage(Page.Plans)} className="hover:text-[#C93EA6] transition">Planos PRO</button></li>
                  )}
                  <li><button className="hover:text-[#C93EA6] transition">PINTOR PRO Academy</button></li>
                  <li><button className="hover:text-[#C93EA6] transition">Central do Parceiro</button></li>
                </ul>
              </div>
            )}

            <div>
              <h4 className="font-black mb-8 text-white uppercase text-xs tracking-[0.2em] border-l-4 border-[#9A077B] pl-4">Institucional</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><button className="hover:text-[#C93EA6] transition">Sobre a Marca</button></li>
                <li><button onClick={() => setPage(Page.Terms)} className="hover:text-[#C93EA6] transition">Termos de Uso</button></li>
                <li><button onClick={() => setPage(Page.Privacy)} className="hover:text-[#C93EA6] transition">Politica de Privacidade</button></li>
                <li><button onClick={() => setPage(Page.Cookies)} className="hover:text-[#C93EA6] transition">Politica de Cookies</button></li>
                <li><button onClick={() => setPage(Page.PrivacyRequest)} className="hover:text-[#C93EA6] transition text-[#C93EA6]">Solicitacao de privacidade</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
            <p>© {new Date().getFullYear()} Pintor Pro. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <button onClick={() => setPage(Page.Terms)} className="hover:text-white transition">Termos de Uso</button>
              <button onClick={() => setPage(Page.Privacy)} className="hover:text-white transition">Privacidade</button>
              <button onClick={() => setPage(Page.Help)} className="hover:text-white transition">Contato</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
