import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, Phone, User, X } from 'lucide-react';
import { clientSignupService } from '../../../lib/services/clientSignupService';

type ClientSignupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ClientSignupFormData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: ClientSignupFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
};

export const ClientSignupModal: React.FC<ClientSignupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ClientSignupFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(EMPTY_FORM);
    setErrorMessage('');
    setSuccessMessage('');
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

  const updateField = <K extends keyof ClientSignupFormData>(field: K, value: ClientSignupFormData[K]) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setErrorMessage('Preencha todos os campos do cadastro.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('A senha precisa ter no minimo 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('A senha e a confirmacao de senha nao coincidem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await clientSignupService.registerClient({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      setSuccessMessage(
        result.requiresEmailConfirmation
          ? 'Cadastro criado com sucesso. Verifique seu e-mail para confirmar o acesso e continuar buscando pintores.'
          : 'Cadastro criado com sucesso. Agora voce ja pode continuar e encontrar um pintor.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel concluir o cadastro agora.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    onClose();
    onSuccess();
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
        className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:my-6 sm:max-h-[88vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h3 className="text-xl font-black text-[#000747] sm:text-2xl">Cadastro do Cliente</h3>
            <p className="text-sm font-medium text-slate-500">
              Crie seu acesso rapido para contratar com mais seguranca na plataforma.
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

        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {successMessage ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h4 className="mb-3 text-2xl font-black text-slate-900">Cadastro concluido</h4>
              <p className="mx-auto mb-6 max-w-md text-slate-500">{successMessage}</p>
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-2xl bg-[#9A077B] px-6 py-3 font-black text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665]"
              >
                Continuar para encontrar pintores
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                    placeholder="voce@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Cel
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                    placeholder="Minimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                    placeholder="Repita a senha"
                    required
                    minLength={6}
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
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#000747] px-6 py-3 font-black uppercase tracking-widest text-white transition hover:bg-[#9A077B] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : null}
                  {isSubmitting ? 'Cadastrando...' : 'Criar Cadastro'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
