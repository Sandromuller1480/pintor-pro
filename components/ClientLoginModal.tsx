import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Mail, Lock, X } from 'lucide-react';
import { clientSignupService } from '../lib/clientSignupService';

type ClientLoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowSignup: () => void;
};

export const ClientLoginModal: React.FC<ClientLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowSignup
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setEmail('');
    setPassword('');
    setErrorMessage('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage('Informe seu e-mail e sua senha para continuar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await clientSignupService.loginClient({
        email,
        password
      });

      onClose();
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel fazer login agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowSignup = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
    onShowSignup();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="my-4 flex w-full max-w-lg flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:my-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h3 className="text-xl font-black text-[#000747] sm:text-2xl">Login do Cliente</h3>
            <p className="text-sm font-medium text-slate-500">
              Entre com seu e-mail e senha para acessar os pintores da plataforma.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (errorMessage) {
                      setErrorMessage('');
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errorMessage) {
                      setErrorMessage('');
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col-reverse justify-end gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={handleShowSignup}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Criar cadastro
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-2xl bg-[#000747] px-6 py-3 font-black uppercase tracking-widest text-white transition hover:bg-[#9A077B] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : null}
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
