import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Gift } from 'lucide-react';
import { ProfilePhotoCropModal } from '../components/ProfilePhotoCropModal';
import { SPECIALTY_OPTIONS } from '../lib/painterProfileOptions';
import {
  paintersService,
  type ApplicationFormSubmission,
  type ApplicationSubmissionResult
} from '../lib/services/paintersService';
import {
  buildBrazilianAddressGeocodingQuery,
  geocodeBrazilianLocation
} from '../lib/locationGeocoding';
import { NavigateToPage, Page } from '../types';

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
const REGISTER_DRAFT_STORAGE_KEY = 'pintor-pro-register-draft';

type SubmissionFeedback = Pick<ApplicationSubmissionResult, 'processingResult' | 'processingWarning'>;

type ApplicationFormData = {
  authUserId: string;
  fullName: string;
  publicName: string;
  cep: string;
  street: string;
  neighborhood: string;
  addressNumber: string;
  addressComplement: string;
  city: string;
  uf: string;
  serviceAreas: string;
  whatsapp: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  experienceTime: string;
  specialty: string[];
  professionalDescription: string;
  profilePhoto: File | null;
  workPhotos: File[];
  certifications: File[];
};

const INITIAL_FORM_DATA: ApplicationFormData = {
  authUserId: '',
  fullName: '',
  publicName: '',
  cep: '',
  street: '',
  neighborhood: '',
  addressNumber: '',
  addressComplement: '',
  city: '',
  uf: '',
  serviceAreas: '',
  whatsapp: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
  experienceTime: '',
  specialty: [],
  professionalDescription: '',
  profilePhoto: null,
  workPhotos: [],
  certifications: []
};

type PersistedRegisterDraft = Partial<Omit<ApplicationFormData, 'password' | 'confirmPassword' | 'profilePhoto' | 'workPhotos' | 'certifications'>>;

interface RegisterProps {
  setPage: NavigateToPage;
}

export const Register: React.FC<RegisterProps> = ({ setPage }) => {
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_FORM_DATA);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
  const [pendingProfilePhotoFile, setPendingProfilePhotoFile] = useState<File | null>(null);
  const [isProfileCropModalOpen, setIsProfileCropModalOpen] = useState(false);
  const [accountNotice, setAccountNotice] = useState('');
  const successTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(REGISTER_DRAFT_STORAGE_KEY);

    if (!savedDraft) {
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as PersistedRegisterDraft;
      setFormData((currentData) => ({ ...currentData, ...parsedDraft, password: '', confirmPassword: '' }));

      if (parsedDraft.authUserId) {
        setCurrentStep(2);
        setAccountNotice('Conta criada. Complete seu perfil profissional para enviar à curadoria.');
      }
    } catch (error) {
      console.error('Erro ao restaurar rascunho do cadastro:', error);
    }
  }, []);

  useEffect(() => {
    const { password, confirmPassword, profilePhoto, workPhotos, certifications, ...persistableDraft } = formData;
    window.localStorage.setItem(REGISTER_DRAFT_STORAGE_KEY, JSON.stringify(persistableDraft));
  }, [formData]);

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

  const updateFormData = (updates: Partial<ApplicationFormData>) => {
    setFormData((currentData) => ({ ...currentData, ...updates }));
  };

  const handleCreateAccount = async () => {
    const requiredFields = [
      formData.fullName,
      formData.whatsapp,
      formData.email,
      formData.city,
      formData.uf,
      formData.password,
      formData.confirmPassword
    ];

    if (requiredFields.some((value) => !value.trim()) || !formData.acceptedTerms) {
      alert('Preencha todos os campos da etapa 1 e aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('A senha e a confirmação de senha não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      alert('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setAccountNotice('');

    try {
      const result = await paintersService.createPainterAccount({
        fullName: formData.fullName,
        whatsapp: formData.whatsapp,
        email: formData.email,
        city: formData.city,
        uf: formData.uf,
        password: formData.password
      });

      updateFormData({
        authUserId: result.authUserId,
        publicName: formData.publicName || formData.fullName,
        password: '',
        confirmPassword: ''
      });
      setCurrentStep(2);
      setAccountNotice(result.hasSession
        ? 'Conta criada com sucesso. Complete seu perfil profissional.'
        : 'Conta criada com sucesso. Se a confirmação de e-mail estiver habilitada, confirme seu e-mail antes de acessar o painel.');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado.';
      alert(`Erro ao criar conta.\n\n${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProfile = async () => {
    if (
      !formData.authUserId ||
      !formData.fullName.trim() ||
      !formData.cep.trim() ||
      !formData.street.trim() ||
      !formData.neighborhood.trim() ||
      !formData.addressNumber.trim() ||
      !formData.city.trim() ||
      !formData.uf.trim() ||
      !formData.whatsapp.trim() ||
      !formData.email.trim() ||
      !formData.experienceTime.trim() ||
      !formData.profilePhoto
    ) {
      alert('Preencha os campos profissionais obrigatórios e adicione a foto de perfil antes de enviar para análise.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    try {
      const geocodingQuery = buildBrazilianAddressGeocodingQuery({
        street: formData.street,
        addressNumber: formData.addressNumber,
        neighborhood: formData.neighborhood,
        city: formData.city,
        uf: formData.uf
      });
      let coordinates: ApplicationFormSubmission['coordinates'] = null;

      if (geocodingQuery) {
        try {
          coordinates = await geocodeBrazilianLocation(geocodingQuery);
        } catch (geocodingError) {
          console.error('Erro ao geocodificar endereço do cadastro:', geocodingError);
        }
      }

      const professionalSummary = [
        formData.experienceTime.trim(),
        formData.professionalDescription.trim() ? `Descrição profissional: ${formData.professionalDescription.trim()}` : ''
      ].filter(Boolean).join('. ');

      const normalizedSpecialties = [
        ...formData.specialty,
        ...formData.serviceAreas
          .split(',')
          .map((item) => `Atende: ${item.trim()}`)
          .filter((item) => item !== 'Atende:')
      ];

      const formPayload: ApplicationFormSubmission = {
        authUserId: formData.authUserId,
        fullName: (formData.publicName || formData.fullName).trim(),
        subscriptionPaymentName: '',
        cep: formData.cep.replace(/\D/g, '').slice(0, 8),
        street: formData.street.trim(),
        neighborhood: formData.neighborhood.trim(),
        addressNumber: formData.addressNumber.trim(),
        city: formData.city.trim(),
        uf: formData.uf.trim().toUpperCase(),
        whatsapp: formData.whatsapp.trim(),
        email: formData.email.trim().toLowerCase(),
        experienceTime: professionalSummary,
        specialty: normalizedSpecialties,
        coordinates,
        profilePhoto: formData.profilePhoto,
        workPhotos: formData.workPhotos,
        certifications: formData.certifications
      };
      const submissionResult = await paintersService.submitApplication(formPayload);

      setSubmissionFeedback({
        processingResult: submissionResult.processingResult,
        processingWarning: submissionResult.processingWarning
      });
      setShowSuccessToast(true);
      window.localStorage.removeItem(REGISTER_DRAFT_STORAGE_KEY);

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
      }, 3500);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado.';
      alert(`Erro ao enviar perfil para análise.\n\n${errorMessage}`);
      setIsSubmitting(false);
    }
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
      alert('Use uma imagem estática em JPG, JPEG, PNG, BMP ou WEBP para a foto de perfil.');
      return;
    }

    setPendingProfilePhotoFile(file);
    setIsProfileCropModalOpen(true);
  };

  const handleProfilePhotoCropConfirm = (croppedFile: File) => {
    updateFormData({ profilePhoto: croppedFile });
    setPendingProfilePhotoFile(null);
    setIsProfileCropModalOpen(false);
  };

  const handleCepChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let cep = event.target.value.replace(/\D/g, '');
    if (cep.length > 8) cep = cep.slice(0, 8);

    updateFormData({ cep });

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData((currentData) => ({
            ...currentData,
            street: data.logradouro || currentData.street,
            neighborhood: data.bairro || currentData.neighborhood,
            city: data.localidade || currentData.city,
            uf: data.uf || currentData.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP', error);
      }
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData((currentData) => ({
      ...currentData,
      specialty: currentData.specialty.includes(specialty)
        ? currentData.specialty.filter((item) => item !== specialty)
        : [...currentData.specialty, specialty]
    }));
  };

  const handlePortfolioFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ workPhotos: Array.from(event.target.files ?? []) });
  };

  return (
    <div className="py-24 text-center max-w-3xl mx-auto px-4 relative">
      {showSuccessToast && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#9A077B] text-white font-black px-10 py-5 rounded-2xl shadow-2xl tracking-widest uppercase border-4 border-[#F7E3F1] transition-all"
          style={{ animation: 'fadeIn 0.5s ease-out' }}
        >
          <div>Perfil enviado com sucesso!</div>
          <p className="mt-3 max-w-md text-[10px] font-medium normal-case tracking-normal text-white/90">
            Nossa equipe realizará a análise antes da publicação.
          </p>
          {submissionFeedback?.processingWarning && (
            <p className="mt-2 max-w-md text-[10px] font-medium normal-case tracking-normal text-white/80">
              Análise automática pendente: {submissionFeedback.processingWarning}
            </p>
          )}
        </div>
      )}

      <p className="mb-4 inline-flex rounded-full bg-[#FDF3FA] px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#9A077B]">
        Etapa {currentStep} de 2
      </p>
      <h1 className="text-5xl font-black mb-6 text-[#000747] tracking-tighter">
        Comece agora no <span className="text-[#9A077B]">Pintor Pro</span>
      </h1>
      <p className="text-slate-600 text-lg mb-8 font-medium">
        Crie sua conta gratuitamente e complete seu perfil profissional para começar a divulgar seus serviços.
      </p>

      <div className="mb-8 rounded-[24px] border border-emerald-200 bg-emerald-50 px-6 py-5 text-left">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <Gift size={22} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Teste gratuito incluído</p>
            <h2 className="mt-1 text-2xl font-black text-[#000747]">30 dias de acesso completo grátis</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
              Ao enviar o perfil para análise, seu teste gratuito é ativado uma única vez para usar as funções e ferramentas da plataforma.
            </p>
          </div>
        </div>
      </div>

      {accountNotice && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          {accountNotice}
        </div>
      )}

      <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-2xl border border-slate-100 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9A077B]/5 rounded-full -translate-y-10 translate-x-10"></div>

        {currentStep === 1 ? (
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome do profissional ou empresa *</label>
              <input type="text" placeholder="Ex: Roberto Silva Pinturas" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.fullName} onChange={(event) => updateFormData({ fullName: event.target.value })} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp *</label>
                <input type="tel" placeholder="(11) 99999-9999" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.whatsapp} onChange={(event) => updateFormData({ whatsapp: event.target.value })} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail *</label>
                <input type="email" placeholder="seu@email.com" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.email} onChange={(event) => updateFormData({ email: event.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cidade *</label>
                <input type="text" placeholder="São Paulo" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.city} onChange={(event) => updateFormData({ city: event.target.value })} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estado/UF *</label>
                <input type="text" placeholder="SP" maxLength={2} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition uppercase" value={formData.uf} onChange={(event) => updateFormData({ uf: event.target.value.toUpperCase() })} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Senha *</label>
                <input type="password" placeholder="********" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.password} onChange={(event) => updateFormData({ password: event.target.value })} required minLength={6} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Confirmação da senha *</label>
                <input type="password" placeholder="********" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.confirmPassword} onChange={(event) => updateFormData({ confirmPassword: event.target.value })} required minLength={6} />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={formData.acceptedTerms} onChange={(event) => updateFormData({ acceptedTerms: event.target.checked })} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]" />
              <span>
                Li e aceito os{' '}
                <button type="button" onClick={() => setPage(Page.Terms)} className="font-black text-[#9A077B] hover:text-[#000747]">Termos de Uso</button>
                {' '}e a{' '}
                <button type="button" onClick={() => setPage(Page.Privacy)} className="font-black text-[#9A077B] hover:text-[#000747]">Política de Privacidade</button>.
              </span>
            </label>

            <button onClick={() => void handleCreateAccount()} disabled={isSubmitting} className={`w-full ${isSubmitting ? 'bg-slate-400' : 'bg-[#9A077B] hover:bg-[#7F0665]'} text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-[#EFC6E3] transition uppercase tracking-widest`}>
              {isSubmitting ? 'Criando conta...' : 'Criar minha conta grátis'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600">
              Você pode salvar o progresso e continuar depois neste navegador. O endereço completo é usado apenas internamente; clientes verão somente cidade, UF e regiões atendidas.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center">
                <input id="profile-photo-upload" type="file" accept={PROFILE_IMAGE_ACCEPT} className="sr-only" onChange={handleProfilePhotoChange} />
                <label htmlFor="profile-photo-upload" className="mb-2 flex cursor-pointer rounded-full transition-transform hover:scale-[1.02]" aria-label="Selecionar foto de perfil">
                  {formData.profilePhoto ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      <img src={profilePreviewUrl} alt="Perfil" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-inner">
                      <CheckCircle2 className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                </label>
                <label htmlFor="profile-photo-upload" className="text-center cursor-pointer mt-2 text-[#9A077B] text-xs font-bold uppercase tracking-widest hover:text-[#7F0665]">Enviar foto *</label>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome público do profissional ou empresa</label>
                  <input type="text" placeholder="Use se for diferente do nome da conta" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.publicName} onChange={(event) => updateFormData({ publicName: event.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tempo de profissão *</label>
                  <input type="text" placeholder="Ex: 10 anos" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.experienceTime} onChange={(event) => updateFormData({ experienceTime: event.target.value })} required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Descrição profissional</label>
              <textarea placeholder="Conte sua experiência, tipos de obra que atende e diferenciais profissionais." className="min-h-32 w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.professionalDescription} onChange={(event) => updateFormData({ professionalDescription: event.target.value })} />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Especialidades</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <button key={specialty} type="button" onClick={() => toggleSpecialty(specialty)} className={`rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-[0.08em] transition ${formData.specialty.includes(specialty) ? 'border-[#9A077B] bg-[#FDF3FA] text-[#9A077B]' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#EFC6E3]'}`}>
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Áreas e cidades atendidas</label>
              <input type="text" placeholder="Ex: Zona Sul de São Paulo, Santo André, São Bernardo" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.serviceAreas} onChange={(event) => updateFormData({ serviceAreas: event.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">CEP *</label>
                <input type="text" placeholder="00000000" maxLength={8} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition text-center" value={formData.cep} onChange={handleCepChange} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rua ou logradouro *</label>
                <input type="text" placeholder="Ex: Avenida Brasil" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.street} onChange={(event) => updateFormData({ street: event.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bairro *</label>
                <input type="text" placeholder="Ex: Centro" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.neighborhood} onChange={(event) => updateFormData({ neighborhood: event.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Número *</label>
                <input type="text" placeholder="123" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.addressNumber} onChange={(event) => updateFormData({ addressNumber: event.target.value })} required />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Complemento</label>
                <input type="text" placeholder="Sala, bloco, referência" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition" value={formData.addressComplement} onChange={(event) => updateFormData({ addressComplement: event.target.value })} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cidade/UF</label>
                <input type="text" className="w-full p-5 bg-slate-100 border border-slate-200 rounded-2xl outline-none text-slate-500" value={`${formData.city}${formData.uf ? ` - ${formData.uf}` : ''}`} readOnly />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Portfólio</label>
              <input type="file" multiple accept="image/*" onChange={handlePortfolioFilesChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600" />
              <p className="mt-2 text-xs font-semibold text-slate-400">{formData.workPhotos.length ? `${formData.workPhotos.length} arquivo(s) selecionado(s).` : 'Envie fotos de obras concluídas, antes e depois ou detalhes de acabamento.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button type="button" onClick={() => setCurrentStep(1)} className="w-full border-2 border-slate-200 bg-white text-slate-700 py-5 rounded-2xl font-black text-sm transition uppercase tracking-widest hover:border-[#9A077B] hover:text-[#9A077B]">
                Voltar à etapa 1
              </button>
              <button onClick={() => void handleSubmitProfile()} disabled={isSubmitting} className={`w-full ${isSubmitting ? 'bg-slate-400' : 'bg-[#9A077B] hover:bg-[#7F0665]'} text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-[#EFC6E3] transition uppercase tracking-widest`}>
                {isSubmitting ? 'Enviando...' : 'Enviar perfil para análise'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-slate-400 text-sm font-medium">
        Sua inscrição passará por uma curadoria técnica antes de ser publicada.
      </p>
      <button onClick={() => setPage(Page.Home)} className="mt-8 text-slate-900 hover:text-[#9A077B] font-black uppercase text-xs tracking-widest transition">
        &larr; Voltar para a Home
      </button>
      <ProfilePhotoCropModal
        isOpen={isProfileCropModalOpen}
        file={pendingProfilePhotoFile}
        onClose={() => {
          setPendingProfilePhotoFile(null);
          setIsProfileCropModalOpen(false);
        }}
        onConfirm={handleProfilePhotoCropConfirm}
      />
    </div>
  );
};
