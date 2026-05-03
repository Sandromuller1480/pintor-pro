import React, { useEffect, useRef, useState } from 'react';
import { ProfilePhotoCropModal } from '../components/ProfilePhotoCropModal';
import { SPECIALTY_OPTIONS } from '../lib/painterProfileOptions';
import {
  paintersService,
  type ApplicationFormSubmission,
  type ApplicationSubmissionResult
} from '../lib/services/paintersService';
import { NavigateToPage, Page } from '../types';

const GENDER_OPTIONS = [
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' }
] as const;

const SUPPORTED_PROFILE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/bmp',
  'image/x-ms-bmp',
  'image/webp'
]);

const PROFILE_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.bmp,.webp,image/jpeg,image/jpg,image/png,image/bmp,image/x-ms-bmp,image/webp';
const PROFILE_IMAGE_EXTENSION_PATTERN = /\.(jpg|jpeg|png|bmp|webp)$/i;

type SubmissionFeedback = Pick<ApplicationSubmissionResult, 'processingResult' | 'processingWarning'>;

type ApplicationFormData = {
  fullName: string;
  gender: '' | 'feminino' | 'masculino';
  cep: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  city: string;
  uf: string;
  whatsapp: string;
  email: string;
  password: string;
  confirmPassword: string;
  experienceTime: string;
  specialty: string[];
  profilePhoto: File | null;
  workPhotos: File[];
  certifications: File[];
};

const INITIAL_FORM_DATA: ApplicationFormData = {
  fullName: '',
  gender: '',
  cep: '',
  street: '',
  neighborhood: '',
  addressNumber: '',
  city: '',
  uf: '',
  whatsapp: '',
  email: '',
  password: '',
  confirmPassword: '',
  experienceTime: '',
  specialty: [],
  profilePhoto: null,
  workPhotos: [],
  certifications: []
};

interface RegisterProps {
  setPage: NavigateToPage;
}

export const Register: React.FC<RegisterProps> = ({ setPage }) => {
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
  const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState<File | null>(null);
  const [isProfileCropModalOpen, setIsProfileCropModalOpen] = useState(false);
  const successTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!formData.profilePhoto) {
      setProfilePreviewUrl('');
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(formData.profilePhoto);
    setProfilePreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [formData.profilePhoto]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.cep ||
      !formData.street ||
      !formData.neighborhood ||
      !formData.addressNumber ||
      !formData.city ||
      !formData.uf ||
      !formData.whatsapp ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.experienceTime ||
      formData.specialty.length === 0 ||
      !formData.profilePhoto
    ) {
      alert('Por favor, preencha todos os campos obrigatorios e adicione a foto de perfil.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('A senha e a confirmação de senha não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      alert('A senha precisa ter no minimo 6 caracteres.');
      return;
    }

    if (formData.workPhotos.length < 5) {
      alert('Envie no minimo 5 fotos de trabalhos.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    try {
      const formPayload: ApplicationFormSubmission = {
        ...formData,
        profilePhoto: formData.profilePhoto as File,
        cep: formData.cep.replace(/\D/g, '').slice(0, 8),
        street: formData.street.trim(),
        neighborhood: formData.neighborhood.trim(),
        addressNumber: formData.addressNumber.trim(),
        city: formData.city.trim(),
        uf: formData.uf.trim().toUpperCase()
      };
      const submissionResult = await paintersService.submitApplication(formPayload);

      setSubmissionFeedback({
        processingResult: submissionResult.processingResult,
        processingWarning: submissionResult.processingWarning
      });
      setShowSuccessToast(true);

      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }

      successTimeoutRef.current = window.setTimeout(() => {
        setShowSuccessToast(false);
        setIsSubmitting(false);
        setSubmissionFeedback(null);
        setFormData(INITIAL_FORM_DATA);
        successTimeoutRef.current = null;
        setPage(Page.Login);
      }, 3000);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado.';
      alert(`Erro ao enviar solicitação.\n\n${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  const handleWorkPhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, workPhotos: Array.from(event.target.files ?? []) });
  };

  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) {
      return;
    }

    const hasSupportedMimeType = !file.type || SUPPORTED_PROFILE_IMAGE_TYPES.has(file.type);
    const hasSupportedExtension = PROFILE_IMAGE_EXTENSION_PATTERN.test(file.name);

    if (!hasSupportedMimeType || !hasSupportedExtension) {
      alert('Use uma imagem estatica em JPG, JPEG, PNG, BMP ou WEBP para a foto de perfil.');
      return;
    }

    setPendingProfilePhotoFile(file);
    setIsProfileCropModalOpen(true);
  };

  const handleProfilePhotoCropConfirm = (croppedFile: File) => {
    setFormData((currentData) => ({
      ...currentData,
      profilePhoto: croppedFile
    }));
    setPendingProfilePhotoFile(null);
    setIsProfileCropModalOpen(false);
  };

  const handleCloseProfileCropModal = () => {
    setPendingProfilePhotoFile(null);
    setIsProfileCropModalOpen(false);
  };

  const handleReframeCurrentPhoto = () => {
    if (!formData.profilePhoto) {
      return;
    }

    setPendingProfilePhotoFile(formData.profilePhoto);
    setIsProfileCropModalOpen(true);
  };

  const handleCepChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let cep = event.target.value.replace(/\D/g, '');
    if (cep.length > 8) cep = cep.slice(0, 8);

    setFormData((currentData) => ({ ...currentData, cep }));

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData((currentData) => ({
            ...currentData,
            street: data.logradouro || currentData.street,
            neighborhood: data.bairro || currentData.neighborhood,
            city: data.localidade || '',
            uf: data.uf || ''
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP', error);
      }
    }
  };

  const handleCertificationsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, certifications: Array.from(event.target.files ?? []) });
  };

  const toggleSpecialty = (option: string) => {
    setFormData((currentData) => {
      const isSelected = currentData.specialty.includes(option);
      if (isSelected) {
        return { ...currentData, specialty: currentData.specialty.filter((item) => item !== option) };
      }

      return { ...currentData, specialty: [...currentData.specialty, option] };
    });
  };

  return (
    <div className="py-24 text-center max-w-2xl mx-auto px-4 relative">
      {showSuccessToast && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#9A077B] text-white font-black px-10 py-5 rounded-2xl shadow-2xl tracking-widest uppercase border-4 border-[#F7E3F1] transition-all"
          style={{ animation: 'fadeIn 0.5s ease-out' }}
        >
          <div>CADASTRO EFETUADO COM SUCESSO!</div>
          <p className="mt-3 max-w-md text-[10px] font-medium normal-case tracking-normal text-white/90">
            Verifique seu e-mail antes de entrar no painel caso a confirmação de acesso esteja habilitada no Supabase.
          </p>
          {submissionFeedback?.processingWarning && (
            <p className="mt-2 max-w-md text-[10px] font-medium normal-case tracking-normal text-white/80">
              Analise automatica pendente: {submissionFeedback.processingWarning}
            </p>
          )}
        </div>
      )}
      <h1 className="text-5xl font-black mb-6 text-[#000747] tracking-tighter uppercase">
        Seja a Elite: <span className="text-[#9A077B]">PINTOR PRO</span>
      </h1>
      <p className="text-slate-600 text-lg mb-12 font-medium">
        Não somos apenas um diretório. Somos a vitrine dos melhores pintores do Brasil. Inicie sua jornada para o topo do mercado.
      </p>
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9A077B]/5 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group">
              <input
                id="profile-photo-upload"
                type="file"
                accept={PROFILE_IMAGE_ACCEPT}
                className="hidden"
                onChange={handleProfilePhotoChange}
              />
              {formData.profilePhoto ? (
                <label
                  htmlFor="profile-photo-upload"
                  className="mb-2 block cursor-pointer rounded-full transition-transform hover:scale-[1.02]"
                  aria-label="Selecionar foto de perfil"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative">
                  <img src={profilePreviewUrl} alt="Perfil" className="w-full h-full object-cover" />
                  </div>
                </label>
              ) : (
                <label
                  htmlFor="profile-photo-upload"
                  className="mb-2 flex cursor-pointer rounded-full transition-transform hover:scale-[1.02]"
                  aria-label="Selecionar foto de perfil"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
              )}
              <label
                htmlFor="profile-photo-upload"
                className="text-center cursor-pointer mt-2 text-[#9A077B] text-xs font-bold uppercase tracking-widest hover:text-[#7F0665]"
              >
                Upload Foto
              </label>
              {formData.profilePhoto && (
                <button
                  type="button"
                  onClick={handleReframeCurrentPhoto}
                  className="mt-3 rounded-full border border-[#EFC6E3] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9A077B] transition hover:bg-[#FDF3FA]"
                >
                  Editar enquadramento
                </button>
              )}
            </div>

            <div className="col-span-2 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Nome do Profissional ou Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Silva Pinturas"
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                  value={formData.fullName}
                  onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Sexo (Pessoa Fisica)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: option.value })}
                      className={`p-4 rounded-2xl border text-sm font-black uppercase tracking-widest transition ${
                        formData.gender === option.value
                          ? 'bg-[#9A077B] text-white border-[#9A077B] shadow-lg shadow-[#F7E3F1]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#EFC6E3] hover:text-[#9A077B]'
                      }`}
                      aria-pressed={formData.gender === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">CEP *</label>
              <input
                type="text"
                placeholder="00000000"
                maxLength={8}
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition text-center"
                value={formData.cep}
                onChange={handleCepChange}
                required
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Rua, Avenida ou Logradouro *
              </label>
              <input
                type="text"
                placeholder="Ex: Avenida Brasil"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.street}
                onChange={(event) => setFormData({ ...formData, street: event.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bairro *</label>
              <input
                type="text"
                placeholder="Ex: Centro"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.neighborhood}
                onChange={(event) => setFormData({ ...formData, neighborhood: event.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Numero *</label>
              <input
                type="text"
                placeholder="123"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.addressNumber}
                onChange={(event) => setFormData({ ...formData, addressNumber: event.target.value })}
                required
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cidade *</label>
              <input
                type="text"
                placeholder="Sao Paulo"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.city}
                onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">UF *</label>
              <input
                type="text"
                placeholder="SP"
                maxLength={2}
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition uppercase"
                value={formData.uf}
                onChange={(event) => setFormData({ ...formData, uf: event.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail *</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp *</label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.whatsapp}
                onChange={(event) => setFormData({ ...formData, whatsapp: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Crie uma Senha *</label>
              <input
                type="password"
                placeholder="********"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Confirme a Senha *
              </label>
              <input
                type="password"
                placeholder="********"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                value={formData.confirmPassword}
                onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                required
                minLength={6}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tempo de Profissao *</label>
            <input
              type="text"
              placeholder="Ex: 10 anos"
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
              value={formData.experienceTime}
              onChange={(event) => setFormData({ ...formData, experienceTime: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              SELECIONE SUAS ESPECIALIDADES
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-200 max-h-64 overflow-y-auto no-scrollbar">
              {SPECIALTY_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer group ${
                    formData.specialty.includes(option)
                      ? 'bg-[#9A077B] border-[#9A077B] shadow-lg shadow-[#F7E3F1]'
                      : 'bg-white border-slate-100 hover:border-[#EFC6E3]'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.specialty.includes(option)}
                    onChange={() => toggleSpecialty(option)}
                  />
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${
                      formData.specialty.includes(option)
                        ? 'bg-white border-white text-[#9A077B]'
                        : 'bg-slate-50 border-slate-200 group-hover:border-[#C93EA6]'
                    }`}
                  >
                    {formData.specialty.includes(option) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-tight leading-tight ${
                      formData.specialty.includes(option) ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {option}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
              Selecionadas: {formData.specialty.length} especialidades
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Fotos de Trabalhos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition file:mr-3 file:rounded-lg file:border-0 file:bg-[#9A077B] file:px-3 file:py-2 file:text-white file:font-semibold file:text-xs"
                onChange={handleWorkPhotosChange}
              />
              <p className="text-xs text-slate-500 mt-2">Minimo de 5 fotos. Selecionadas: {formData.workPhotos.length}</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Certificados (Opcional para Bronze)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg"
                multiple
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white file:font-semibold file:text-xs"
                onChange={handleCertificationsChange}
              />
              <p className="text-xs text-slate-500 mt-2">
                PDF ou JPG. Opcional para Bronze e obrigatorio para Ouro/Prata. Selecionados: {formData.certifications.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`w-full ${
              isSubmitting ? 'bg-slate-400' : 'bg-[#9A077B] hover:bg-[#7F0665]'
            } text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-[#EFC6E3] transition uppercase tracking-widest`}
          >
            {isSubmitting ? 'Processando...' : 'Solicitar Credenciamento'}
          </button>
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-sm font-medium">
        Sua inscrição passará por uma curadoria técnica antes de ser publicada.
      </p>
      <button
        onClick={() => setPage(Page.Home)}
        className="mt-8 text-slate-900 hover:text-[#9A077B] font-black uppercase text-xs tracking-widest transition"
      >
        &larr; Voltar para a Home
      </button>
      <ProfilePhotoCropModal
        isOpen={isProfileCropModalOpen}
        file={pendingProfilePhotoFile}
        onClose={handleCloseProfileCropModal}
        onConfirm={handleProfilePhotoCropConfirm}
      />
    </div>
  );
};

