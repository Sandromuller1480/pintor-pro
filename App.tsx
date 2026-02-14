
import React, { useState } from 'react';
import { Page } from './types';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FindPainter } from './pages/FindPainter';
import { PainterProfile } from './pages/PainterProfile';
import { Plans } from './pages/Plans';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import { paintersService } from './lib/paintersService';

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

type ApplicationFormData = {
  fullName: string;
  city: string;
  whatsapp: string;
  email: string;
  experienceTime: string;
  specialty: string[];
  workPhotos: File[];
  certifications: File[];
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: '',
    city: '',
    whatsapp: '',
    email: '',
    experienceTime: '',
    specialty: [],
    workPhotos: [],
    certifications: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

    if (formData.workPhotos.length < 3) {
      alert('Envie no minimo 3 fotos de trabalhos.');
      return;
    }

    if (formData.certifications.length === 0) {
      alert('Envie pelo menos 1 certificacao em PDF ou JPG.');
      return;
    }

    setIsSubmitting(true);
    try {
      await paintersService.submitApplication(formData);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
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
        return <Home setPage={setCurrentPage} />;
      case Page.FindPainter:
        return <FindPainter setPage={setCurrentPage} />;
      case Page.PainterProfile:
        return <PainterProfile />;
      case Page.HowItWorks:
        return <HowItWorks setPage={setCurrentPage} />;
      case Page.Plans:
        return <Plans setPage={setCurrentPage} />;
      case Page.About:
        return <About />;
      case Page.Register:
        if (submitted) {
          return (
            <div className="py-24 text-center max-w-2xl mx-auto px-4 animate-in">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100">
                <svg xmlns="http://www.w3.org/2003/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-black mb-6 text-slate-900 tracking-tighter uppercase">Solicitação Enviada!</h1>
              <p className="text-slate-600 text-lg mb-12 font-medium">
                Iniciamos a sua <b>Análise Técnica Automática</b>. <br />
                Você receberá uma notificação via E-mail e WhatsApp em alguns minutos com o resultado.
              </p>
              <button onClick={() => { setCurrentPage(Page.Home); setSubmitted(false); }} className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-600 transition uppercase tracking-widest">
                Voltar para a Home
              </button>
            </div>
          );
        }
        return (
          <div className="py-24 text-center max-w-2xl mx-auto px-4">
            <h1 className="text-5xl font-black mb-6 text-black tracking-tighter uppercase">
              Seja a Elite: <span className="text-blue-600">PINTOR PRO</span>
            </h1>
            <p className="text-slate-600 text-lg mb-12 font-medium">
              Não somos apenas um diretório. Somos a vitrine dos melhores pintores do Brasil. Inicie sua jornada para o topo do mercado.
            </p>
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome do Profissional ou Empresa</label>
                  <input
                    type="text"
                    placeholder="Ex: Roberto Silva Pinturas"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cidade Base (Atendimento Nacional)</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo - SP"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail</label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
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
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
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
                        className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer group ${formData.specialty.includes(option) ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.specialty.includes(option)}
                          onChange={() => toggleSpecialty(option)}
                        />
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${formData.specialty.includes(option) ? 'bg-white border-white text-blue-600' : 'bg-slate-50 border-slate-200 group-hover:border-blue-400'}`}>
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
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white file:font-semibold file:text-xs"
                      onChange={handleWorkPhotosChange}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Minimo de 3 fotos. Selecionadas: {formData.workPhotos.length}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Certificacao</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      multiple
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white file:font-semibold file:text-xs"
                      onChange={handleCertificationsChange}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      PDF ou JPG. Selecionados: {formData.certifications.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full ${isSubmitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition uppercase tracking-widest`}
                >
                  {isSubmitting ? 'Processando...' : 'Solicitar Credenciamento'}
                </button>
              </div>
            </div>
            <p className="mt-8 text-slate-400 text-sm font-medium">
              Sua inscrição passará por uma curadoria técnica antes de ser publicada.
            </p>
            <button onClick={() => setCurrentPage(Page.Home)} className="mt-8 text-slate-900 hover:text-blue-600 font-black uppercase text-xs tracking-widest transition">
              ← Voltar para a Home
            </button>
          </div>
        );
      default:
        return <Home setPage={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
