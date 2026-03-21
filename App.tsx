
import React, { useEffect, useState } from 'react';
import { AppRoute, NavigateToPage, Page, PageNavigationParams } from './types';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FindPainter } from './pages/FindPainter';
import { PainterProfile } from './pages/PainterProfile';
import { Plans } from './pages/Plans';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import { Login } from './pages/Login';
import { paintersService, type ApplicationSubmissionResult } from './lib/paintersService';

const SPECIALTY_OPTIONS = [
  'Preparo do reboco (Limpeza, Lixa, Selador/Fundo Preparador)',
  'Preparo do Acartonado (Lixa e Fundo Preparador)',
  'Massa Corrida (Aplicacao e lixamento)',
  'Massa Acrilica (Aplicacao e lixamento)',
  'Tintas Acrilicas',
  'Tintas Solvente',
  'Pinturas em Metais (Tratamento especial)',
  'Pinturas em Madeira (Tratamento especial)',
  'Pinturas com Efeitos',
  'Texturas',
  'Airless',
  'Pistolas Industriais (Pinturas, Texturas e Efeitos)',
  'Lixadeiras: Pequenas, medias e grande porte',
  'Compressores de Pequenos, Medios e grande porte',
  'Reformas (Tratamento de patologias e Superficies)',
  'Acabamentos Finos',
  'NR-35 (trabalho em altura)',
  'EPIs'
];

const GENDER_OPTIONS = [
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' }
] as const;

type SubmissionFeedback = Pick<ApplicationSubmissionResult, 'processingResult' | 'processingWarning'>;

type ApplicationFormData = {
  fullName: string;
  gender: '' | 'feminino' | 'masculino';
  city: string;
  whatsapp: string;
  email: string;
  experienceTime: string;
  specialty: string[];
  workPhotos: File[];
  certifications: File[];
};

const ROUTE_PATHS: Record<Exclude<Page, Page.PainterProfile>, string> = {
  [Page.Home]: '/',
  [Page.FindPainter]: '/encontrar-pintor',
  [Page.Register]: '/cadastro-pintor',
  [Page.HowItWorks]: '/como-funciona',
  [Page.Plans]: '/planos',
  [Page.About]: '/sobre',
  [Page.Login]: '/login'
};

const getInitialRoute = (): AppRoute => {
  if (typeof window === 'undefined') {
    return { page: Page.Home };
  }

  const rawPath = window.location.pathname || '/';
  const cleanPath = rawPath.replace(/\/+$/, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length === 0) return { page: Page.Home };
  if (parts[0] === 'encontrar-pintor') return { page: Page.FindPainter };
  if (parts[0] === 'cadastro-pintor') return { page: Page.Register };
  if (parts[0] === 'como-funciona') return { page: Page.HowItWorks };
  if (parts[0] === 'planos') return { page: Page.Plans };
  if (parts[0] === 'sobre') return { page: Page.About };
  if (parts[0] === 'login') return { page: Page.Login };
  if (parts[0] === 'pintor' && parts[1]) {
    return { page: Page.PainterProfile, painterId: decodeURIComponent(parts[1]) };
  }

  return { page: Page.Home };
};

const buildPathForRoute = (route: AppRoute): string => {
  if (route.page === Page.PainterProfile) {
    return route.painterId ? `/pintor/${encodeURIComponent(route.painterId)}` : ROUTE_PATHS[Page.FindPainter];
  }

  return ROUTE_PATHS[route.page];
};

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(getInitialRoute);
  const currentPage = route.page;
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: '',
    gender: '',
    city: '',
    whatsapp: '',
    email: '',
    experienceTime: '',
    specialty: [],
    workPhotos: [],
    certifications: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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

  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.city ||
      !formData.whatsapp ||
      !formData.email ||
      !formData.experienceTime ||
      formData.specialty.length === 0
    ) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.workPhotos.length < 5) {
      alert('Envie no mínimo 5 fotos de trabalhos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await paintersService.submitApplication(formData);
      
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        setIsSubmitting(false);
        setFormData({
          fullName: '',
          gender: '',
          city: '',
          whatsapp: '',
          email: '',
          experienceTime: '',
          specialty: [],
          workPhotos: [],
          certifications: []
        });
        navigateToPage(Page.Home);
      }, 3000);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado.';
      alert(`Erro ao enviar solicitação.\n\n${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  const handleWorkPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, workPhotos: Array.from(e.target.files ?? []) });
  };

  const handleCertificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, certifications: Array.from(e.target.files ?? []) });
  };

  const toggleSpecialty = (option: string) => {
    setFormData(prev => {
      const isSelected = prev.specialty.includes(option);
      if (isSelected) {
        return { ...prev, specialty: prev.specialty.filter(s => s !== option) };
      } else {
        return { ...prev, specialty: [...prev.specialty, option] };
      }
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return <Home setPage={navigateToPage} />;
      case Page.FindPainter:
        return <FindPainter setPage={navigateToPage} />;
      case Page.PainterProfile:
        return <PainterProfile painterId={route.painterId} setPage={navigateToPage} />;
      case Page.HowItWorks:
        return <HowItWorks setPage={navigateToPage} />;
      case Page.Plans:
        return <Plans setPage={navigateToPage} />;
      case Page.About:
        return <About />;
      case Page.Login:
        return <Login setPage={navigateToPage} />;
      case Page.Register:
        return (
          <div className="py-24 text-center max-w-2xl mx-auto px-4 relative">
            {showSuccessToast && (
              <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#9A077B] text-white font-black px-10 py-5 rounded-2xl shadow-2xl tracking-widest uppercase border-4 border-[#F7E3F1] transition-all" style={{ animation: 'fade-in 0.5s ease-out' }}>
                CADASTRO EFETUADO COM SUCESSO!
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
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome do Profissional ou Empresa</label>
                  <input
                    type="text"
                    placeholder="Ex: Roberto Silva Pinturas"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cidade Base (Atendimento Nacional)</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo - SP"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Sexo (Pessoa Física)
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
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    Opcional para empresa. Selecione quando o cadastro for de profissional pessoa física.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail</label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tempo de Profissao</label>
                  <input
                    type="text"
                    placeholder="Ex: 10 anos"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                    value={formData.experienceTime}
                    onChange={(e) => setFormData({ ...formData, experienceTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">SELECIONE SUAS ESPECIALIDADES</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-200 max-h-64 overflow-y-auto no-scrollbar">
                    {SPECIALTY_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer group ${formData.specialty.includes(option) ? 'bg-[#9A077B] border-[#9A077B] shadow-lg shadow-[#F7E3F1]' : 'bg-white border-slate-100 hover:border-[#EFC6E3]'}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.specialty.includes(option)}
                          onChange={() => toggleSpecialty(option)}
                        />
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${formData.specialty.includes(option) ? 'bg-white border-white text-[#9A077B]' : 'bg-slate-50 border-slate-200 group-hover:border-[#C93EA6]'}`}>
                          {formData.specialty.includes(option) && (
                            <svg xmlns="http://www.w3.org/2003/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-tight leading-tight ${formData.specialty.includes(option) ? 'text-white' : 'text-slate-600'}`}>
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
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fotos de Trabalhos</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition file:mr-3 file:rounded-lg file:border-0 file:bg-[#9A077B] file:px-3 file:py-2 file:text-white file:font-semibold file:text-xs"
                      onChange={handleWorkPhotosChange}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Mínimo de 5 fotos. Selecionadas: {formData.workPhotos.length}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Certificados (Opcional para Bronze)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      multiple
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white file:font-semibold file:text-xs"
                      onChange={handleCertificationsChange}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      PDF ou JPG. Opcional para Bronze e obrigatório para Ouro/Prata. Selecionados: {formData.certifications.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full ${isSubmitting ? 'bg-slate-400' : 'bg-[#9A077B] hover:bg-[#7F0665]'} text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-[#EFC6E3] transition uppercase tracking-widest`}
                >
                  {isSubmitting ? 'Processando...' : 'Solicitar Credenciamento'}
                </button>
              </div>
            </div>
            <p className="mt-8 text-slate-400 text-sm font-medium">
              Sua inscrição passará por uma curadoria técnica antes de ser publicada.
            </p>
            <button onClick={() => navigateToPage(Page.Home)} className="mt-8 text-slate-900 hover:text-[#9A077B] font-black uppercase text-xs tracking-widest transition">
              ← Voltar para a Home
            </button>
          </div>
        );
      default:
        return <Home setPage={navigateToPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setPage={navigateToPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;

