import React, { useEffect, useState } from 'react';
import { Page, NavigateToPage } from '../types';
import { supabase } from '../lib/supabase';
import {
  LogOut, LayoutDashboard, Briefcase, FileText, Settings,
  Plus, Edit2, Camera, TrendingUp, Users, Star, Clock
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { OrcamentoModal } from '../components/OrcamentoModal';
import { ObraModal, type SavedObra } from '../components/ObraModal';

interface DashboardProps {
  setPage: NavigateToPage;
}

type Tab = 'inicio' | 'portfolio' | 'orcamentos' | 'config';

export const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [userName, setUserName] = useState('Pintor');
  const [isSignOut, setIsSignOut] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<SavedObra[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState('');
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [isObraModalOpen, setIsObraModalOpen] = useState(false);

  const loadPortfolio = async (userId: string) => {
    setIsLoadingPortfolio(true);
    setPortfolioError('');

    const { data, error } = await supabase
      .from('obras')
      .select('id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, created_at')
      .eq('pintor_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar portfolio:', error);
      setPortfolioItems([]);
      setPortfolioError('Nao foi possivel carregar suas obras agora.');
      setIsLoadingPortfolio(false);
      return;
    }

    setPortfolioItems(data ?? []);
    setIsLoadingPortfolio(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !data.user) {
        if (error) {
          console.error('Erro ao carregar usuario do painel:', error);
        }
        setIsCheckingAccess(false);
        setPage(Page.Login);
        return;
      }

      const fullName = data.user.user_metadata?.full_name;

      if (typeof fullName === 'string' && fullName.trim()) {
        setUserName(fullName.split(' ')[0]);
      } else if (data.user.email) {
        setUserName(data.user.email.split('@')[0]);
      }

      await loadPortfolio(data.user.id);

      if (!isMounted) return;
      setIsCheckingAccess(false);
    };

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [setPage]);

  const handleLogout = async () => {
    setIsSignOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setPage(Page.Home);
    } catch (error) {
      console.error('Erro ao encerrar sessao:', error);
      alert('Nao foi possivel sair da conta agora. Tente novamente.');
      setIsSignOut(false);
    }
  };

  const handleObraSaved = (obra: SavedObra) => {
    setPortfolioItems((currentItems) => {
      const nextItems = [obra, ...currentItems.filter((item) => item.id !== obra.id)];
      return nextItems.sort((firstItem, secondItem) => {
        return new Date(secondItem.created_at).getTime() - new Date(firstItem.created_at).getTime();
      });
    });
    setPortfolioError('');
    setActiveTab('portfolio');
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-center cursor-pointer" onClick={() => setPage(Page.Home)}>
        <Logo className="h-10" color="#000747" />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {[
          { id: 'inicio', label: 'Visao Geral', icon: LayoutDashboard },
          { id: 'portfolio', label: 'Meu Portfolio', icon: Briefcase },
          { id: 'orcamentos', label: 'Orcamentos', icon: FileText },
          { id: 'config', label: 'Configuracoes', icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition font-bold text-sm ${activeTab === item.id
              ? 'bg-[#9A077B]/10 text-[#9A077B]'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-[#9A077B]' : 'text-slate-400'} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-[#000747] to-[#9A077B] rounded-xl p-4 text-white mb-4 shadow-lg shadow-[#000747]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-10 translate-x-10"></div>
          <div className="flex items-center space-x-2 mb-1 relative z-10">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="font-black text-xs uppercase tracking-widest">Plano Ouro</span>
          </div>
          <p className="text-[10px] text-white/80 font-medium relative z-10">Seu perfil esta recebendo visibilidade maxima.</p>
        </div>

        <button
          onClick={handleLogout}
          disabled={isSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition font-bold text-sm"
        >
          <LogOut size={20} />
          <span>{isSignOut ? 'Saindo...' : 'Sair da Conta'}</span>
        </button>
      </div>
    </div>
  );

  const renderInicio = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200 mb-8 relative">
        <div className="h-48 bg-slate-800 relative group">
          <img src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Capa" />
          <button className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center hover:bg-white/30 transition">
            <Camera size={14} className="mr-2" /> Alterar Capa
          </button>
        </div>
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-16 border-4 border-white rounded-full bg-white shadow-xl group cursor-pointer inline-block">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Perfil" className="w-32 h-32 rounded-full object-cover relative z-10" />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Camera className="text-white" />
            </div>
          </div>
          <div className="pt-20 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-[#000747]">Bem-vindo de volta, {userName}!</h2>
              <p className="text-slate-500 font-medium">Seu perfil esta ativo e visivel para clientes em sua regiao.</p>
            </div>
            <button className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-slate-200 transition">
              <Edit2 size={16} className="mr-2" /> Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Visitas ao Perfil', value: '1.248', trend: '+12% este mes', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Orcamentos Solicitados', value: '34', trend: '4 aguardando resposta', icon: FileText, color: 'text-[#9A077B]', bg: 'bg-[#9A077B]/10' },
          { label: 'Avaliacao Media', value: '4.9', trend: 'Baseado em 42 avaliacoes', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 mb-2">{stat.value}</h3>
              <p className="text-slate-400 text-sm font-medium">{stat.trend}</p>
            </div>
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-[#000747] mb-6 flex items-center">
          <TrendingUp className="mr-3 text-[#9A077B]" /> Insights & Proximos Passos
        </h3>
        <ul className="space-y-4">
          <li className="flex items-center p-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-100">
            <Clock className="mr-4 flex-shrink-0" />
            <div>
              <p className="font-bold">Tempo de Resposta Acima da Media</p>
              <p className="text-sm opacity-80">Respondendo orcamentos mais rapido voce ganha destaque no algoritmo Ouro.</p>
            </div>
          </li>
          <li className="flex items-center p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100">
            <Camera className="mr-4 flex-shrink-0 text-slate-400" />
            <div>
              <p className="font-bold">Hora de Atualizar o Portfolio</p>
              <p className="text-sm text-slate-500">Adicione novas obras para manter seu perfil relevante para os clientes.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-[#000747]">Meu Portfolio</h2>
          <p className="text-slate-500 font-medium">Gerencie suas obras e impressione clientes.</p>
        </div>
        <button
          onClick={() => setIsObraModalOpen(true)}
          className="bg-[#9A077B] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3] uppercase tracking-widest flex items-center"
        >
          <Plus size={18} className="mr-2" /> Adicionar Obra
        </button>
      </div>

      {portfolioError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {portfolioError}
        </div>
      )}

      {isLoadingPortfolio ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 font-bold">
          Carregando obras...
        </div>
      ) : portfolioItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
          <h3 className="text-xl font-black text-slate-900 mb-2">Seu portfolio ainda esta vazio</h3>
          <p className="text-slate-500 font-medium">Adicione sua primeira obra e ela aparecera aqui sem recarregar a pagina.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((obra) => (
            <div key={obra.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm group">
              <div className="h-48 relative overflow-hidden bg-slate-100">
                {obra.video_url ? (
                  <video src={obra.video_url} className="w-full h-full object-cover" muted playsInline controls />
                ) : obra.imagem_url ? (
                  <img src={obra.imagem_url} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt={obra.titulo} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                    Sem midia
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full">
                  {obra.status === 'EM ANDAMENTO' ? 'Em Andamento' : 'Concluido'}
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-black text-lg text-slate-900 mb-1">{obra.titulo}</h4>
                <p className="text-sm text-slate-500 mb-4">{obra.local}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{obra.tipo_imovel}</span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{obra.tipo_pintura}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrcamentos = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-[#000747]">Orcamentos e Leads</h2>
          <p className="text-slate-500 font-medium">Acompanhe novos contatos e negociacoes em aberto.</p>
        </div>
        <button
          onClick={() => setIsOrcamentoModalOpen(true)}
          className="bg-[#9A077B] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3] uppercase tracking-widest flex items-center"
        >
          <Plus size={18} className="mr-2" /> Novo Orcamento
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="grid grid-cols-12 gap-4 p-6 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500">
          <div className="col-span-3">Cliente</div>
          <div className="col-span-4">Servico Solicitado</div>
          <div className="col-span-2">Data</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-center">Acao</div>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            { client: 'Carlos Mendonca', serv: 'Pintura interna 120m2 (Massa Corrida)', data: 'Hoje, 09:30', status: 'Novo', color: 'bg-emerald-100 text-emerald-700' },
            { client: 'Aline Freitas', serv: 'Renovacao Fachada Comercial', data: 'Ontem', status: 'Respondido', color: 'bg-blue-100 text-blue-700' },
            { client: 'Cond. Vila Nova', serv: 'Revitalizacao de Grades e Portoes', data: '12/03/2026', status: 'Em Negociacao', color: 'bg-amber-100 text-amber-700' },
          ].map((orc, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-slate-50 transition cursor-pointer">
              <div className="col-span-3 font-bold text-slate-900">{orc.client}</div>
              <div className="col-span-4 text-slate-600 font-medium truncate pr-4">{orc.serv}</div>
              <div className="col-span-2 text-slate-500 text-sm">{orc.data}</div>
              <div className="col-span-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${orc.color}`}>
                  {orc.status}
                </span>
              </div>
              <div className="col-span-1 text-center">
                <button className="text-[#9A077B] hover:text-[#000747] font-bold p-2"><ChevronRightMock /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ChevronRightMock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );

  let content;
  switch (activeTab) {
    case 'inicio': content = renderInicio(); break;
    case 'portfolio': content = renderPortfolio(); break;
    case 'orcamentos': content = renderOrcamentos(); break;
    case 'config': content = <div className="p-10 text-center text-slate-500">Configuracoes em desenvolvimento...</div>; break;
  }

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-black uppercase tracking-widest">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {renderSidebar()}
      <main className="ml-64 flex-1 p-10 max-w-7xl relative">
        {content}
      </main>

      <OrcamentoModal
        isOpen={isOrcamentoModalOpen}
        onClose={() => setIsOrcamentoModalOpen(false)}
      />
      <ObraModal
        isOpen={isObraModalOpen}
        onClose={() => setIsObraModalOpen(false)}
        onSaved={handleObraSaved}
      />
    </div>
  );
};
