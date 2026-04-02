import React, { useState } from 'react';
import { getCurrentAdminProfile } from '../lib/adminAccess';
import { getSessionRoleContext } from '../lib/authSession';
import { Page, NavigateToPage } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  setPage: NavigateToPage;
}

export const Login: React.FC<LoginProps> = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getFriendlyAuthErrorMessage = (message: string) => {
    const normalized = message.toLowerCase();

    if (normalized.includes('email not confirmed')) {
      return 'Seu e-mail ainda nao foi confirmado. Abra a mensagem enviada pela PINTOR PRO e tente novamente.';
    }

    if (normalized.includes('invalid login credentials')) {
      return 'E-mail ou senha invalidos.';
    }

    if (normalized.includes('too many requests')) {
      return 'Muitas tentativas de acesso. Aguarde alguns minutos antes de tentar novamente.';
    }

    return message;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        setErrorMessage(getFriendlyAuthErrorMessage(error.message));
        return;
      }

      const sessionContext = await getSessionRoleContext();
      const adminProfile = await getCurrentAdminProfile(sessionContext.user);

      if (adminProfile) {
        setPage(Page.Admin);
        return;
      }

      if (sessionContext.role === 'painter') {
        setPage(Page.Dashboard);
        return;
      }

      setPage(Page.Home);
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      setErrorMessage('Nao foi possivel concluir o login agora. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-24 text-center max-w-md mx-auto px-4">
      <h1 className="text-4xl font-black mb-6 text-[#000747] tracking-tighter uppercase">
        Acesso <span className="text-[#9A077B]">Restrito</span>
      </h1>
      <p className="text-slate-600 text-lg mb-12 font-medium">
        Bem-vindo de volta! Acesse sua Area do Pintor.
      </p>

      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9A077B]/5 rounded-full -translate-y-10 translate-x-10"></div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Senha</label>
            <input
              type="password"
              placeholder="********"
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="text-right">
            <button type="button" className="text-[10px] font-bold text-[#9A077B] hover:text-[#000747] uppercase tracking-widest transition">
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-slate-400' : 'bg-[#9A077B] hover:bg-[#7F0665]'} text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-[#EFC6E3] transition uppercase tracking-widest`}
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center relative z-10">
          <p className="text-sm font-medium text-slate-500">
            Se ainda nao tem cadastro <button type="button" onClick={() => setPage(Page.Register)} className="text-[#9A077B] font-black uppercase tracking-widest hover:text-[#000747] transition">CLIQUE AQUI</button>
          </p>
        </div>
      </div>

      <button onClick={() => setPage(Page.Home)} className="mt-8 text-slate-900 hover:text-[#9A077B] font-black uppercase text-xs tracking-widest transition">
        Voltar para a Home
      </button>
    </div>
  );
};
