
import React, { useEffect, useState } from 'react';
import { MOCK_PAINTERS } from '../constants';
import { ScheduleVisitModal } from '../components/ScheduleVisitModal';
import { StartChatModal } from '../components/StartChatModal';
import { paintersService } from '../lib/paintersService';
import { supabase } from '../lib/supabase';
import { NavigateToPage, Page, Painter, PortfolioItem, PainterReview } from '../types';
import { Shield, Star, MapPin, CheckCircle, Zap, Calendar, MessageSquare, ArrowRight, Camera, Share2, Heart, Info } from 'lucide-react';

interface PainterProfileProps {
    painterId?: string;
    setPage?: NavigateToPage;
}

export const PainterProfile: React.FC<PainterProfileProps> = ({ painterId, setPage }) => {
    const [painter, setPainter] = useState<Painter | null>(null);
    const [loading, setLoading] = useState(true);
    const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
    const [portfolioLoading, setPortfolioLoading] = useState(true);
    const [portfolioError, setPortfolioError] = useState('');
    const [reviewItems, setReviewItems] = useState<PainterReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState('');
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [isScheduleVisitModalOpen, setIsScheduleVisitModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews' | 'about'>('portfolio');

    const formatPortfolioDate = (value: string) => {
        const parsedDate = new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(parsedDate);
    };

    const getPlanLabel = (currentPainter: Painter) => {
        const subscriptionPlan = currentPainter.subscriptionPlan?.toLowerCase();
        const categoryLevel = currentPainter.categoryLevel?.toLowerCase();

        if (subscriptionPlan === 'pro') return 'PINTOR PRO';
        if (subscriptionPlan === 'silver') return 'Elite Silver';
        if (subscriptionPlan === 'bronze') return 'Bronze';
        if (categoryLevel === 'ouro') return 'Categoria Ouro';
        if (categoryLevel === 'prata') return 'Categoria Prata';
        if (categoryLevel === 'bronze') return 'Categoria Bronze';

        return 'Perfil ativo';
    };

    const formatReviewAge = (value: string) => {
        const parsedDate = new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            return value;
        }

        const now = new Date();
        const diffMs = now.getTime() - parsedDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ha 1 dia';
        if (diffDays < 30) return `Ha ${diffDays} dias`;

        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths === 1) return 'Ha 1 mes';
        if (diffMonths < 12) return `Ha ${diffMonths} meses`;

        const diffYears = Math.floor(diffMonths / 12);
        return diffYears === 1 ? 'Ha 1 ano' : `Ha ${diffYears} anos`;
    };

    const getReviewInitials = (clientName: string) => {
        const parts = clientName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2);

        if (parts.length === 0) {
            return 'CL';
        }

        return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
    };

    const buildAboutSummary = (currentPainter: Painter, publishedWorks: number) => {
        const summaryParts = [currentPainter.description || 'Perfil profissional ativo na PINTOR PRO.'];

        if (currentPainter.location) {
            summaryParts.push(`Atende principalmente em ${currentPainter.location}.`);
        }

        if (publishedWorks > 0) {
            summaryParts.push(`Ja publicou ${publishedWorks} obra(s) no portfolio publico.`);
        }

        return summaryParts.join(' ');
    };

    const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    const hasRealReviews = (painter?.reviewsCount ?? 0) > 0 && (painter?.rating ?? 0) > 0;
    const canScheduleVisit = Boolean(painter && isUuid(painter.id));
    const canStartChat = canScheduleVisit;

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

    useEffect(() => {
        let cancelled = false;

        async function loadPortfolio() {
            if (loading) {
                return;
            }

            setPortfolioLoading(true);
            setPortfolioError('');

            if (!painter) {
                if (!cancelled) {
                    setPortfolioItems([]);
                    setPortfolioLoading(false);
                }
                return;
            }

            const ownerIds = Array.from(
                new Set(
                    [painter.portfolioOwnerId, painter.id].filter((value): value is string => Boolean(value) && isUuid(value))
                )
            );

            if (ownerIds.length === 0) {
                if (!cancelled) {
                    setPortfolioItems([]);
                    setPortfolioLoading(false);
                }
                return;
            }

            const { data, error } = await supabase
                .from('obras')
                .select('id, pintor_id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, created_at')
                .in('pintor_id', ownerIds)
                .order('created_at', { ascending: false });

            if (cancelled) {
                return;
            }

            if (error) {
                console.error('Erro ao carregar portfolio publico do pintor:', error);
                setPortfolioItems([]);
                setPortfolioError('Nao foi possivel carregar o portfolio deste pintor agora.');
                setPortfolioLoading(false);
                return;
            }

            setPortfolioItems((data ?? []).map((item: any) => ({
                id: item.id,
                painterId: item.pintor_id,
                title: item.titulo,
                location: item.local,
                propertyType: item.tipo_imovel,
                paintType: item.tipo_pintura,
                status: item.status,
                imageUrl: item.imagem_url,
                videoUrl: item.video_url,
                createdAt: item.created_at
            })));
            setPortfolioLoading(false);
        }

        void loadPortfolio();

        return () => {
            cancelled = true;
        };
    }, [loading, painter]);

    useEffect(() => {
        let cancelled = false;

        async function loadReviews() {
            if (loading) {
                return;
            }

            setReviewsLoading(true);
            setReviewsError('');

            if (!painter || !isUuid(painter.id)) {
                if (!cancelled) {
                    setReviewItems([]);
                    setReviewsLoading(false);
                }
                return;
            }

            const { data, error } = await supabase
                .from('painter_reviews')
                .select('id, application_id, client_name, client_avatar_url, rating, comment, created_at')
                .eq('application_id', painter.id)
                .order('created_at', { ascending: false });

            if (cancelled) {
                return;
            }

            if (error) {
                console.error('Erro ao carregar avaliacoes publicas do pintor:', error);
                setReviewItems([]);
                setReviewsError('Nao foi possivel carregar as avaliacoes deste pintor agora.');
                setReviewsLoading(false);
                return;
            }

            setReviewItems((data ?? []).map((item: any) => ({
                id: item.id,
                applicationId: item.application_id,
                clientName: item.client_name,
                clientAvatarUrl: item.client_avatar_url ?? null,
                rating: Number(item.rating ?? 0),
                comment: item.comment,
                createdAt: item.created_at
            })));
            setReviewsLoading(false);
        }

        void loadReviews();

        return () => {
            cancelled = true;
        };
    }, [loading, painter]);

    if (loading) {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#9A077B] rounded-full animate-spin mx-auto mb-4"></div>
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
                        className="bg-[#9A077B] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
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
                                    {painter.verified && <Shield className="w-6 h-6 text-[#C93EA6] fill-[#C93EA6]" />}
                                </div>
                                <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                                    {hasRealReviews ? (
                                        <span className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            {painter.rating.toFixed(1)} ({painter.reviewsCount} avaliacoes)
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-white/70" />
                                            Sem avaliacoes ainda
                                        </span>
                                    )}
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
                                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition whitespace-nowrap ${activeTab === tab ? 'text-[#9A077B] border-b-2 border-[#9A077B]' : 'text-slate-400 hover:text-[#000747]'}`}
                                >
                                    {tab === 'portfolio' ? 'Portfólio' : tab === 'about' ? 'Sobre o Pintor' : 'Avaliações'}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'portfolio' && (
                            <>
                                {portfolioError && (
                                    <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
                                        {portfolioError}
                                    </div>
                                )}

                                {portfolioLoading ? (
                                    <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center text-slate-400 font-bold uppercase tracking-widest">
                                        Carregando portfolio...
                                    </div>
                                ) : portfolioItems.length === 0 ? (
                                    <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
                                        <h3 className="text-xl font-black text-slate-900 mb-3">Portfolio ainda nao publicado</h3>
                                        <p className="text-slate-500">
                                            Este pintor ainda nao adicionou obras publicas ao perfil.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {portfolioItems.map((item) => (
                                            <div key={item.id} className="bg-white rounded-[32px] overflow-hidden shadow-[0_14px_34px_rgba(15,23,42,0.08)] border border-slate-100 group hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] transition">
                                                <div className="relative h-60 bg-slate-100 overflow-hidden">
                                                    {item.videoUrl ? (
                                                        <video
                                                            src={item.videoUrl}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            playsInline
                                                            controls
                                                        />
                                                    ) : item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                                            Midia indisponivel
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-[#9A077B] flex items-center">
                                                            <Camera className="w-3 h-3 mr-1" />
                                                            {item.status === 'EM ANDAMENTO' ? 'Em andamento' : 'Concluido'}
                                                        </div>
                                                        {item.videoUrl && (
                                                            <div className="bg-slate-900/75 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                                                                Video
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h4 className="font-bold text-lg mb-2 text-slate-900">{item.title}</h4>
                                                    <p className="text-slate-500 text-sm mb-4 flex items-center">
                                                        <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                                                        {item.location}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[11px] font-bold">
                                                            {item.propertyType}
                                                        </span>
                                                        <span className="bg-[#FDF3FA] text-[#7F0665] px-3 py-1 rounded-full text-[11px] font-bold">
                                                            {item.paintType}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            Publicado em {formatPortfolioDate(item.createdAt)}
                                                        </span>
                                                        <ArrowRight className="w-4 h-4 text-[#9A077B]" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'about' && (
                            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-2xl font-black mb-4">Sobre {painter.name}</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        {buildAboutSummary(painter, portfolioItems.length)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Experiência</div>
                                        <div className="font-black text-slate-800">{painter.experienceTime || 'Nao informado'}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Especialidades</div>
                                        <div className="font-black text-slate-800">{painter.specialties.length || 0}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Obras Publicas</div>
                                        <div className="font-black text-slate-800">{portfolioLoading ? '...' : portfolioItems.length}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Plano</div>
                                        <div className="font-black text-slate-800">{getPlanLabel(painter)}</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-4 flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2 text-[#9A077B]" />
                                        Especialidades informadas
                                    </h4>
                                    {painter.specialties.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {painter.specialties.map((specialty) => (
                                                <span key={specialty} className="bg-[#FDF3FA] text-[#7F0665] px-4 py-2 rounded-full text-xs font-bold">
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm">
                                            Este pintor ainda nao informou especialidades publicas no cadastro.
                                        </p>
                                    )}
                                </div>
                                {painter.createdAt && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                            Perfil publicado em {formatPortfolioDate(painter.createdAt)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <>
                                {reviewsError && (
                                    <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
                                        {reviewsError}
                                    </div>
                                )}

                                {reviewsLoading ? (
                                    <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center text-slate-400 font-bold uppercase tracking-widest">
                                        Carregando avaliacoes...
                                    </div>
                                ) : reviewItems.length === 0 ? (
                                    <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
                                        <h3 className="text-xl font-black text-slate-900 mb-3">Nenhuma avaliacao publicada ainda</h3>
                                        <p className="text-slate-500">
                                            Este pintor ainda nao recebeu avaliacoes publicas na plataforma.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {reviewItems.map((review) => (
                                            <div key={review.id} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <div className="flex items-center gap-4">
                                                        {review.clientAvatarUrl ? (
                                                            <img src={review.clientAvatarUrl} alt={review.clientName} className="w-12 h-12 rounded-xl object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-black flex items-center justify-center">
                                                                {getReviewInitials(review.clientName)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold">{review.clientName}</h4>
                                                            <span className="text-xs text-slate-400">{formatReviewAge(review.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex text-yellow-400 shrink-0">
                                                        {Array.from({ length: 5 }, (_, index) => (
                                                            <Star
                                                                key={`${review.id}-star-${index}`}
                                                                className={`w-4 h-4 ${index < review.rating ? 'fill-current' : 'text-slate-200'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
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
                                        <span className="font-bold text-[#9A077B]">Disponível em 10 dias</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Meios de Pagamento</span>
                                        <span className="font-bold">Cartão, Pix, Boleto</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsChatModalOpen(true)}
                                        disabled={!canStartChat}
                                        className="w-full bg-[#9A077B] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#7F0665] transition shadow-xl shadow-[#EFC6E3] flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <MessageSquare className="w-5 h-5 mr-2" /> Chamar no Chat
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsScheduleVisitModalOpen(true)}
                                        disabled={!canScheduleVisit}
                                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-[#000747] transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Calendar className="w-5 h-5 mr-2" /> Agendar Visita
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center mt-6 uppercase tracking-widest font-bold flex items-center justify-center">
                                    <Shield className="w-3 h-3 mr-1" /> Contratação Segura PINTOR PRO
                                </p>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4 text-[#C93EA6]">
                                        <Info className="w-5 h-5" />
                                        <span className="font-bold text-sm uppercase tracking-widest">Dica Premium</span>
                                    </div>
                                    <h4 className="font-black text-lg mb-4">Proteção de Pagamento</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-6">Contrate através da plataforma e garanta que seu dinheiro só seja liberado após a conclusão da obra.</p>
                                    <button className="text-sm font-bold border-b border-[#C93EA6] text-[#C93EA6]">Saiba mais como funciona</button>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#9A077B]/10 rounded-full -translate-y-16 translate-x-16"></div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
            <ScheduleVisitModal
                isOpen={isScheduleVisitModalOpen}
                painterId={canScheduleVisit ? painter.id : null}
                painterName={painter.name}
                painterLocation={painter.location}
                onClose={() => setIsScheduleVisitModalOpen(false)}
            />
            <StartChatModal
                isOpen={isChatModalOpen}
                painterId={canStartChat ? painter.id : null}
                painterName={painter.name}
                painterLocation={painter.location}
                onClose={() => setIsChatModalOpen(false)}
            />
        </div>
    );
};

