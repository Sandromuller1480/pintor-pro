
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

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [formData, setFormData] = useState({ fullName: '', city: '', whatsapp: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.city || !formData.whatsapp || !formData.email) {
      alert('Por favor, preencha todos os campos.');
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
