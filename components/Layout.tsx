
import React, { useEffect, useState } from 'react';
import { Page } from '../types';
import { Logo } from './Logo';
import { getCurrentClientProfile, type CurrentClientProfile } from '../lib/clientSignupService';
import { supabase } from '../lib/supabase';
import { Menu, X, ChevronRight, Instagram, Facebook, Linkedin } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setPage: (p: Page) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, setPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentClientProfile, setCurrentClientProfile] = useState<CurrentClientProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncCurrentClient = async () => {
      try {
        const profile = await getCurrentClientProfile();

        if (isMounted) {
          setCurrentClientProfile(profile);
        }
      } catch (error) {
        console.error('Erro ao carregar cliente logado no cabecalho:', error);

        if (isMounted) {
          setCurrentClientProfile(null);
        }
      }
    };

    void syncCurrentClient();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void syncCurrentClient();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (currentPage === Page.Dashboard) {
    return <div className="min-h-screen bg-slate-50 font-sans">{children}</div>;
  }

  const clientFirstName = currentClientProfile?.fullName.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* CABEÇALHO */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center cursor-pointer" onClick={() => setPage(Page.Home)}>
              <Logo className="h-16" color="#000000" />
              {currentClientProfile && (
                <span className="ml-10 hidden lg:block text-sm font-black text-[#9A077B]">
                  Olá {clientFirstName || 'Cliente'}
                </span>
              )}
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex space-x-8 items-center">
              <button onClick={() => setPage(Page.FindPainter)} className={`text-sm font-bold uppercase tracking-wider transition ${currentPage === Page.FindPainter ? 'text-[#9A077B]' : 'text-slate-600 hover:text-[#000747]'}`}>Encontrar Pintor</button>
              <button onClick={() => setPage(Page.HowItWorks)} className={`text-sm font-bold uppercase tracking-wider transition ${currentPage === Page.HowItWorks ? 'text-[#9A077B]' : 'text-slate-600 hover:text-[#000747]'}`}>Como Funciona</button>
              <button onClick={() => setPage(Page.Plans)} className={`text-sm font-bold uppercase tracking-wider transition ${currentPage === Page.Plans ? 'text-[#9A077B]' : 'text-slate-600 hover:text-[#000747]'}`}>Planos</button>
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              <button onClick={() => setPage(Page.Login)} className="bg-[#9A077B] text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3] uppercase tracking-widest">Área do Pintor</button>
            </nav>

            {/* Botão de Menu Mobile */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            {currentClientProfile && (
              <div className="rounded-2xl bg-[#FDF3FA] px-4 py-3 text-sm font-black text-[#9A077B]">
                Olá {clientFirstName || 'Cliente'}
              </div>
            )}
            <button onClick={() => { setPage(Page.FindPainter); setIsMenuOpen(false); }} className="block w-full text-left text-lg font-bold p-2 uppercase tracking-tight">Encontrar Pintor</button>
            <button onClick={() => { setPage(Page.HowItWorks); setIsMenuOpen(false); }} className="block w-full text-left text-lg font-bold p-2 uppercase tracking-tight">Como Funciona</button>
            <button onClick={() => { setPage(Page.Plans); setIsMenuOpen(false); }} className="block w-full text-left text-lg font-bold p-2 uppercase tracking-tight">Planos</button>
            <button onClick={() => { setPage(Page.Login); setIsMenuOpen(false); }} className="w-full bg-[#9A077B] text-white px-6 py-4 rounded-xl font-black text-center uppercase tracking-widest mt-4">Sou Pintor</button>
          </div>
        )}
      </header>

      {/* CONTEÚDO */}
      <main className="flex-grow">
        {children}
      </main>

      {/* RODAPÉ */}
      <footer className="bg-[#0f172a] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Logo className="h-20 mb-8" color="#ffffff" />
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                A primeira plataforma nacional focada exclusivamente na elite da pintura imobiliária. Qualidade inegociável, tecnologia de ponta.
              </p>
              <div className="flex space-x-5">
                <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-[#9A077B] transition duration-300"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-[#9A077B] transition duration-300"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="bg-white/5 p-3 rounded-full hover:bg-[#9A077B] transition duration-300"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-8 text-white uppercase text-xs tracking-[0.2em] border-l-4 border-[#9A077B] pl-4"> Marketplace</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><button onClick={() => setPage(Page.FindPainter)} className="hover:text-[#C93EA6] transition">Encontrar Profissionais</button></li>
                <li><button onClick={() => setPage(Page.HowItWorks)} className="hover:text-[#C93EA6] transition">Como funciona para Clientes</button></li>
                <li><button className="hover:text-[#C93EA6] transition">Categorias de Pintura</button></li>
                <li><button className="hover:text-[#C93EA6] transition">Galeria de Inspiração</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-8 text-white uppercase text-xs tracking-[0.2em] border-l-4 border-[#9A077B] pl-4">Profissionais</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><button onClick={() => setPage(Page.Register)} className="hover:text-[#C93EA6] transition">Cadastrar Portfólio</button></li>
                <li><button onClick={() => setPage(Page.Plans)} className="hover:text-[#C93EA6] transition">Planos PRO</button></li>
                <li><button className="hover:text-[#C93EA6] transition">PINTOR PRO Academy</button></li>
                <li><button className="hover:text-[#C93EA6] transition">Central do Parceiro</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-8 text-white uppercase text-xs tracking-[0.2em] border-l-4 border-[#9A077B] pl-4">Institucional</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><button className="hover:text-[#C93EA6] transition">Sobre a Marca</button></li>
                <li><button className="hover:text-[#C93EA6] transition">Trabalhe Conosco</button></li>
                <li><button className="hover:text-[#C93EA6] transition">Política de Qualidade</button></li>
                <li><button className="hover:text-[#C93EA6] transition text-[#C93EA6]">Atendimento 24h</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
            <p>© 2025 PINTOR PRO - O PADRÃO OURO DA PINTURA NACIONAL.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition">Termos de Uso</a>
              <a href="#" className="hover:text-white transition">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

