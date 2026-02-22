
import React, { useEffect, useState } from 'react';
import { MOCK_PAINTERS } from '../constants';
import { paintersService } from '../lib/paintersService';
import { NavigateToPage, Page, Painter } from '../types';
import { Shield, Star, MapPin, CheckCircle, Zap, Calendar, MessageSquare, ArrowRight, Camera, Share2, Heart, Info } from 'lucide-react';

interface PainterProfileProps {
    painterId?: string;
    setPage?: NavigateToPage;
}

export const PainterProfile: React.FC<PainterProfileProps> = ({ painterId, setPage }) => {
    const [painter, setPainter] = useState<Painter | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'about'>('portfolio');

    useEffect(() => {
        let cancelled = false;

        async function loadPainter() {
            setLoading(true);

            if (!painterId) {
                if (!cancelled) {
                    setPainter(MOCK_PAINTERS[0] ?? null);
                    setLoading(false);
                }
                return;
            }

            const found = await paintersService.getById(painterId);
            const fallback = MOCK_PAINTERS.find((item) => item.id === painterId) ?? null;

            if (!cancelled) {
                setPainter(found ?? fallback);
                setLoading(false);
            }
        }

        loadPainter();
        return () => {
            cancelled = true;
        };
    }, [painterId]);

    if (loading) {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    if (!painter) {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
                <div className="max-w-xl w-full bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
                    <h1 className="text-2xl font-black text-slate-900 mb-4">Perfil não encontrado</h1>
                    <p className="text-slate-500 mb-8">O pintor solicitado não está disponível ou foi removido.</p>
                    <button
                        onClick={() => setPage?.(Page.FindPainter)}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
                    >
                        Voltar para busca
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Cabeçalho do Perfil */}
            <div className="relative h-64 lg:h-80 w-full overflow-hidden">
                <img src={painter.banner} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-8 left-0 w-full">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-end">
                        <div className="flex gap-6 items-end">
                            <img src={painter.avatar} alt={painter.name} className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl border-4 border-white shadow-xl object-cover relative z-10" />
                            <div className="pb-2">
                                <div className="flex items-center gap-3 text-white mb-2">
                                    <h1 className="text-3xl font-black">{painter.name}</h1>
                                    {painter.verified && <Shield className="w-6 h-6 text-blue-400 fill-blue-400" />}
                                </div>
                                <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {painter.rating} ({painter.reviewsCount} avaliações)</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {painter.location}</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex gap-3 mb-2">
                            <button className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 hover:bg-white/20 transition"><Share2 className="w-5 h-5" /></button>
                            <button className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 hover:bg-white/20 transition"><Heart className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Conteúdo da Esquerda */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Abas */}
                        <div className="flex gap-8 border-b border-slate-200 overflow-x-auto">
                            {(['portfolio', 'about', 'reviews'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition whitespace-nowrap ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-black'}`}
                                >
                                    {tab === 'portfolio' ? 'Portfólio' : tab === 'about' ? 'Sobre o Pintor' : 'Avaliações'}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'portfolio' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[1, 2, 3, 4].map(id => (
                                    <div key={id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-xl transition">
                                        <div className="relative h-60">
                                            <img src={`https://picsum.photos/seed/job${id}/600/600`} alt="Projeto" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-600 flex items-center">
                                                <Camera className="w-3 h-3 mr-1" /> Antes & Depois
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-bold text-lg mb-2">Pintura Comercial de Alto Padrão</h4>
                                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">Revitalização completa de fachada utilizando tecnologia airless e acabamento epóxi.</p>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ver Detalhes</span>
                                                <ArrowRight className="w-4 h-4 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-2xl font-black mb-4">A excelência em cada demão</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        Atuo no mercado há mais de 15 anos, com foco em projetos residenciais de luxo e ambientes corporativos que exigem rigor técnico e acabamento impecável. Meu compromisso é transformar espaços através da cor e da proteção, utilizando sempre os melhores materiais do mercado.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Experiência</div>
                                        <div className="font-black text-slate-800">15 Anos</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Equipe</div>
                                        <div className="font-black text-slate-800">5 Pessoas</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Obras</div>
                                        <div className="font-black text-slate-800">+200</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Garantia</div>
                                        <div className="font-black text-slate-800">12 Meses</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-blue-600" /> Certificações</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {['Pintor Airless Certificado', 'NR-35 (Trabalho em Altura)', 'Especialista em Texturas Coral', 'Suvinil Master Pro'].map(c => (
                                            <span key={c} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6">
                                {[1, 2, 3].map(id => (
                                    <div key={id} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <img src={`https://picsum.photos/seed/user${id}/100/100`} alt="User" className="w-12 h-12 rounded-xl object-cover" />
                                                <div>
                                                    <h4 className="font-bold">Cliente {id}</h4>
                                                    <span className="text-xs text-slate-400">Há 2 meses</span>
                                                </div>
                                            </div>
                                            <div className="flex text-yellow-400"><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /></div>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed italic">"Trabalho excepcional. Pontualidade britânica e um acabamento que nunca vi igual. Recomendo muito o Roberto para quem busca perfeição."</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ações Fixas da Barra Lateral */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 space-y-6">
                            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100">
                                <h3 className="text-xl font-black mb-6">Solicitar Orçamento</h3>
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Taxa de Resposta</span>
                                        <span className="font-bold text-green-600">Alta (15 min)</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Agenda</span>
                                        <span className="font-bold text-blue-600">Disponível em 10 dias</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Meios de Pagamento</span>
                                        <span className="font-bold">Cartão, Pix, Boleto</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 mr-2" /> Chamar no Chat
                                    </button>
                                    <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition flex items-center justify-center">
                                        <Calendar className="w-5 h-5 mr-2" /> Agendar Visita
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center mt-6 uppercase tracking-widest font-bold flex items-center justify-center">
                                    <Shield className="w-3 h-3 mr-1" /> Contratação Segura PINTOR PRO
                                </p>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                                        <Info className="w-5 h-5" />
                                        <span className="font-bold text-sm uppercase tracking-widest">Dica Premium</span>
                                    </div>
                                    <h4 className="font-black text-lg mb-4">Proteção de Pagamento</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-6">Contrate através da plataforma e garanta que seu dinheiro só seja liberado após a conclusão da obra.</p>
                                    <button className="text-sm font-bold border-b border-blue-400 text-blue-400">Saiba mais como funciona</button>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
