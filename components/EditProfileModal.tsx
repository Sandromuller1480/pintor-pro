import React, { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { SPECIALTY_OPTIONS } from '../lib/painterProfileOptions';

export type EditProfileFormData = {
  fullName: string;
  city: string;
  uf: string;
  whatsapp: string;
  experienceTime: string;
  specialties: string[];
};

type EditablePainterProfile = EditProfileFormData & {
  email: string;
};

interface EditProfileModalProps {
  isOpen: boolean;
  profile: EditablePainterProfile | null;
  onClose: () => void;
  onSave: (formData: EditProfileFormData) => Promise<void>;
}

const INITIAL_FORM_DATA: EditProfileFormData = {
  fullName: '',
  city: '',
  uf: '',
  whatsapp: '',
  experienceTime: '',
  specialties: []
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<EditProfileFormData>(INITIAL_FORM_DATA);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !profile) {
      return;
    }

    setFormData({
      fullName: profile.fullName || '',
      city: profile.city || '',
      uf: profile.uf || '',
      whatsapp: profile.whatsapp || '',
      experienceTime: profile.experienceTime || '',
      specialties: profile.specialties || []
    });
    setErrorMessage('');
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !profile) {
    return null;
  }

  const specialtyOptions = [
    ...SPECIALTY_OPTIONS,
    ...formData.specialties.filter((specialty) => !SPECIALTY_OPTIONS.includes(specialty as (typeof SPECIALTY_OPTIONS)[number]))
  ];

  const toggleSpecialty = (specialty: string) => {
    setFormData((currentFormData) => {
      const alreadySelected = currentFormData.specialties.includes(specialty);

      return {
        ...currentFormData,
        specialties: alreadySelected
          ? currentFormData.specialties.filter((item) => item !== specialty)
          : [...currentFormData.specialties, specialty]
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedFullName = formData.fullName.trim();
    const normalizedCity = formData.city.trim();
    const normalizedWhatsapp = formData.whatsapp.trim();

    if (!normalizedFullName) {
      setErrorMessage('Informe o nome do profissional ou empresa.');
      return;
    }

    if (!normalizedCity) {
      setErrorMessage('Informe a cidade do perfil.');
      return;
    }

    if (!normalizedWhatsapp) {
      setErrorMessage('Informe um WhatsApp para contato.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      await onSave({
        fullName: normalizedFullName,
        city: normalizedCity,
        uf: formData.uf.trim().toUpperCase().slice(0, 2),
        whatsapp: normalizedWhatsapp,
        experienceTime: formData.experienceTime.trim(),
        specialties: formData.specialties
      });
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message
        ? error.message
        : 'Não foi possível salvar as alterações do perfil agora.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
  };

  return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        onClick={() => {
          if (!isSaving) {
            onClose();
        }
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[78vh] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[92vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h3 className="text-2xl font-black text-[#000747]">Editar Perfil</h3>
            <p className="text-sm text-slate-500 font-medium">
              Atualize os dados principais do seu cadastro profissional.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="max-h-[calc(78vh-80px)] overflow-y-auto px-5 py-5 pb-7 md:pb-6 sm:max-h-[calc(92vh-88px)] sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Nome do profissional ou empresa
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                placeholder="Ex: Roberto Silva Pinturas"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                placeholder="Ex: Cuiabá"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                UF
              </label>
              <input
                type="text"
                value={formData.uf}
                onChange={(event) => setFormData((current) => ({ ...current, uf: event.target.value.toUpperCase() }))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                placeholder="MT"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(event) => setFormData((current) => ({ ...current, whatsapp: event.target.value }))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                placeholder="(65) 99999-9999"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                E-mail do cadastro
              </label>
              <input
                type="email"
                value={profile.email}
                className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500"
                disabled
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Tempo de profissão
              </label>
              <input
                type="text"
                value={formData.experienceTime}
                onChange={(event) => setFormData((current) => ({ ...current, experienceTime: event.target.value }))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                placeholder="Ex: 10 anos"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Especialidades
            </label>
            <div className="grid max-h-[11.5rem] grid-cols-1 gap-3 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 md:max-h-72 md:grid-cols-2 md:p-5">
              {specialtyOptions.map((option) => {
                const isSelected = formData.specialties.includes(option);

                return (
                  <label
                    key={option}
                    className={`flex items-center p-3 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-[#9A077B] border-[#9A077B] shadow-lg shadow-[#F7E3F1]'
                        : 'bg-white border-slate-100 hover:border-[#EFC6E3]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => toggleSpecialty(option)}
                    />
                    <div
                      className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? 'bg-white border-white text-[#9A077B]'
                          : 'bg-slate-50 border-slate-200 group-hover:border-[#C93EA6]'
                      }`}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-tight leading-tight ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Selecionadas: {formData.specialties.length}
            </p>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 mt-8 flex justify-end gap-3 bg-white/95 px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm md:static md:mx-0 md:mt-6 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-[#9A077B] text-white font-black shadow-lg shadow-[#EFC6E3] hover:bg-[#7F0665] transition flex items-center disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
