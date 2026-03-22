import React, { useEffect, useRef, useState } from 'react';
import { Page, NavigateToPage } from '../types';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  CalendarDays,
  Plus,
  Edit2,
  Camera,
  TrendingUp,
  Users,
  Star,
  Clock,
  Loader2
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { EditProfileModal, type EditProfileFormData } from '../components/EditProfileModal';
import { OrcamentoModal, type SavedOrcamento } from '../components/OrcamentoModal';
import { ObraModal, type SavedObra } from '../components/ObraModal';

interface DashboardProps {
  setPage: NavigateToPage;
}

type Tab = 'inicio' | 'portfolio' | 'orcamentos' | 'agenda' | 'config';

type CurrentPainterProfile = {
  applicationId: string;
  fullName: string;
  email: string;
  city: string;
  uf: string;
  whatsapp: string;
  experienceTime: string;
  specialties: string[];
  profilePhotoPath: string | null;
  profilePhotoUrl: string | null;
  coverPhotoPath: string | null;
  coverPhotoUrl: string | null;
  applicationStatus: string | null;
  categoryLevel: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
};

type DashboardMetrics = {
  portfolioCount: number;
  quoteCount: number;
  pendingQuoteCount: number;
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  respondido: 'Respondido',
  em_negociacao: 'Em Negociacao',
  fechado: 'Fechado',
  recusado: 'Recusado'
};

const QUOTE_STATUS_STYLES: Record<string, string> = {
  novo: 'bg-emerald-100 text-emerald-700',
  respondido: 'bg-blue-100 text-blue-700',
  em_negociacao: 'bg-amber-100 text-amber-700',
  fechado: 'bg-slate-200 text-slate-700',
  recusado: 'bg-red-100 text-red-700'
};

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop';
const DEFAULT_PROFILE_IMAGE = 'https://i.pravatar.cc/150?u=dashboard-profile';
const PAINTER_MEDIA_BUCKET = 'painters-media';
const LEGACY_PROFILE_BUCKET = 'application-work-photos';

const PLAN_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Elite Silver',
  pro: 'PINTOR PRO'
};

const CATEGORY_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro'
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Em analise',
  accepted: 'Ativo',
  rejected: 'Reprovado'
};

const getPlanLabel = (profile: CurrentPainterProfile | null) => {
  if (profile?.subscriptionPlan && PLAN_LABELS[profile.subscriptionPlan]) {
    return PLAN_LABELS[profile.subscriptionPlan];
  }

  if (profile?.categoryLevel && CATEGORY_LABELS[profile.categoryLevel]) {
    return `Categoria ${CATEGORY_LABELS[profile.categoryLevel]}`;
  }

  return 'Sem plano';
};

const getApplicationStatusLabel = (status: string | null | undefined) => {
  if (!status) return 'Sem status';
  return APPLICATION_STATUS_LABELS[status] ?? status;
};

const formatShortDate = (value: string) => {
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

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const getPublicMediaUrl = (path: string | null | undefined) => {
  if (!path) {
    return null;
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(PAINTER_MEDIA_BUCKET).getPublicUrl(path);

  return publicUrl;
};

const getSignedLegacyMediaUrl = async (path: string | null | undefined) => {
  if (!path) {
    return null;
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  const { data, error } = await supabase.storage
    .from(LEGACY_PROFILE_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error('Erro ao gerar URL assinada da foto antiga:', error);
    return null;
  }

  return data.signedUrl;
};

const sanitizeFileName = (fileName: string) => {
  const cleanedName = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleanedName || 'imagem';
};

const buildPainterMediaPath = (folder: 'foto-perfil' | 'foto-capa', userId: string, file: File) => {
  const nameParts = file.name.split('.');
  const extension = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : 'jpg';
  const baseName = sanitizeFileName(nameParts.join('.'));

  return `${folder}/${userId}/${baseName}-${Date.now()}.${extension || 'jpg'}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [userName, setUserName] = useState('Pintor');
  const [currentProfile, setCurrentProfile] = useState<CurrentPainterProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    portfolioCount: 0,
    quoteCount: 0,
    pendingQuoteCount: 0
  });
  const [isSignOut, setIsSignOut] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<SavedObra[]>([]);
  const [quoteItems, setQuoteItems] = useState<SavedOrcamento[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [portfolioError, setPortfolioError] = useState('');
  const [quotesError, setQuotesError] = useState('');
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const fetchPortfolioItems = async (userId: string) => {
    const { data, error } = await supabase
      .from('obras')
      .select('id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, created_at')
      .eq('pintor_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as SavedObra[];
  };

  const fetchQuoteItems = async (userId: string) => {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('id, cliente_nome, cliente_telefone, cliente_email, cliente_tipo, imovel_cidade_estado, imovel_tipo, pintura_tipo_servico, prazo_urgencia, status, created_at')
      .eq('pintor_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as SavedOrcamento[];
  };

  const fetchCurrentPainterProfile = async (email: string): Promise<CurrentPainterProfile | null> => {
    if (!email) return null;

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const application = (data?.[0] ?? null) as any;

    if (!application) {
      return null;
    }

    const publicProfilePhotoPath = application.foto_perfil || null;
    const publicCoverPhotoPath = application.foto_capa || null;
    const legacyProfilePhotoPath =
      application.profile_photo_path ||
      application.work_photo_paths?.find((path: string) => path.includes('/profile-photo/')) ||
      application.work_photo_paths?.[0] ||
      null;

    const profilePhotoPath = publicProfilePhotoPath || legacyProfilePhotoPath;
    const profilePhotoUrl =
      getPublicMediaUrl(publicProfilePhotoPath) || await getSignedLegacyMediaUrl(legacyProfilePhotoPath);

    return {
      applicationId: application.id,
      fullName: application.full_name || email.split('@')[0],
      email: application.email || email,
      city: application.city || '',
      uf: application.uf || '',
      whatsapp: application.whatsapp || '',
      experienceTime: application.experience_time || '',
      specialties: application.specialties || [],
      profilePhotoPath,
      profilePhotoUrl,
      coverPhotoPath: publicCoverPhotoPath,
      coverPhotoUrl: getPublicMediaUrl(publicCoverPhotoPath),
      applicationStatus: application.status || null,
      categoryLevel: application.category_level || null,
      subscriptionPlan: application.subscription_plan || null,
      subscriptionStatus: application.subscription_status || null
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
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

      const normalizedEmail = data.user.email?.trim().toLowerCase() ?? '';
      const fallbackFullName =
        (typeof data.user.user_metadata?.full_name === 'string' && data.user.user_metadata.full_name.trim())
          ? data.user.user_metadata.full_name.trim()
          : normalizedEmail.split('@')[0];

      const [portfolioResult, quotesResult, profileResult] = await Promise.allSettled([
        fetchPortfolioItems(data.user.id),
        fetchQuoteItems(data.user.id),
        fetchCurrentPainterProfile(normalizedEmail)
      ]);

      if (!isMounted) return;

      if (portfolioResult.status === 'fulfilled') {
        setPortfolioItems(portfolioResult.value);
        setPortfolioError('');
      } else {
        console.error('Erro ao carregar portfolio:', portfolioResult.reason);
        setPortfolioItems([]);
        setPortfolioError('Nao foi possivel carregar suas obras agora.');
      }

      if (quotesResult.status === 'fulfilled') {
        setQuoteItems(quotesResult.value);
        setQuotesError('');
      } else {
        console.error('Erro ao carregar lista de orcamentos:', quotesResult.reason);
        setQuoteItems([]);
        setQuotesError('Nao foi possivel carregar seus orcamentos agora.');
      }

      if (profileResult.status === 'fulfilled' && profileResult.value) {
        setCurrentProfile(profileResult.value);
        setUserName(profileResult.value.fullName.split(' ')[0]);
      } else {
        if (profileResult.status === 'rejected') {
          console.error('Erro ao carregar cadastro do pintor:', profileResult.reason);
        }
        setCurrentProfile(null);
        setUserName(fallbackFullName.split(' ')[0]);
      }

      setIsLoadingPortfolio(false);
      setIsLoadingQuotes(false);
      setIsCheckingAccess(false);
    };

    setIsLoadingPortfolio(true);
    setIsLoadingQuotes(true);
    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [setPage]);

  useEffect(() => {
    setMetrics({
      portfolioCount: portfolioItems.length,
      quoteCount: quoteItems.length,
      pendingQuoteCount: quoteItems.filter((quote) => quote.status === 'novo').length
    });
  }, [portfolioItems, quoteItems]);

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

  const handleOrcamentoSaved = (orcamento: SavedOrcamento) => {
    setQuoteItems((currentItems) => {
      const nextItems = [orcamento, ...currentItems.filter((item) => item.id !== orcamento.id)];
      return nextItems.sort((firstItem, secondItem) => {
        return new Date(secondItem.created_at).getTime() - new Date(firstItem.created_at).getTime();
      });
    });
    setQuotesError('');
    setActiveTab('orcamentos');
  };

  const openEditProfileModal = () => {
    if (!currentProfile?.applicationId) {
      setProfileFeedback({
        type: 'error',
        message: 'Nao encontramos seu cadastro para editar o perfil.'
      });
      return;
    }

    setProfileFeedback(null);
    setIsEditProfileModalOpen(true);
  };

  const handleProfileUpdated = async (formData: EditProfileFormData) => {
    if (!currentProfile?.applicationId) {
      throw new Error('Nao encontramos seu cadastro para salvar as alteracoes.');
    }

    const normalizedSpecialties = Array.from(
      new Set(
        formData.specialties
          .map((specialty) => specialty.trim())
          .filter(Boolean)
      )
    );

    const { data, error } = await supabase
      .from('applications')
      .update({
        full_name: formData.fullName.trim(),
        city: formData.city.trim(),
        uf: formData.uf.trim().toUpperCase().slice(0, 2),
        whatsapp: formData.whatsapp.trim(),
        experience_time: formData.experienceTime.trim(),
        specialties: normalizedSpecialties
      })
      .eq('id', currentProfile.applicationId)
      .select('full_name, city, uf, whatsapp, experience_time, specialties')
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil do pintor:', error);
      throw new Error('Nao foi possivel salvar as alteracoes do perfil agora.');
    }

    setCurrentProfile((profile) => {
      if (!profile) {
        return profile;
      }

      return {
        ...profile,
        fullName: data.full_name || profile.fullName,
        city: data.city || '',
        uf: data.uf || '',
        whatsapp: data.whatsapp || '',
        experienceTime: data.experience_time || '',
        specialties: Array.isArray(data.specialties) ? data.specialties : []
      };
    });
    setUserName((data.full_name || currentProfile.fullName).split(' ')[0]);
    setProfileFeedback({
      type: 'success',
      message: 'Perfil atualizado com sucesso.'
    });
    setIsEditProfileModalOpen(false);
  };

  const openProfilePicker = () => {
    if (!isUploadingProfile && currentProfile?.applicationId) {
      profileInputRef.current?.click();
    }
  };

  const openCoverPicker = () => {
    if (!isUploadingCover && currentProfile?.applicationId) {
      coverInputRef.current?.click();
    }
  };

  const uploadPainterMedia = async (
    file: File,
    folder: 'foto-perfil' | 'foto-capa',
    column: 'foto_perfil' | 'foto_capa',
    applicationId: string,
    userId: string,
    previousPath: string | null
  ) => {
    const filePath = buildPainterMediaPath(folder, userId, file);

    const { error: uploadError } = await supabase.storage
      .from(PAINTER_MEDIA_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({ [column]: filePath })
      .eq('id', applicationId);

    if (updateError) {
      await supabase.storage.from(PAINTER_MEDIA_BUCKET).remove([filePath]);
      throw updateError;
    }

    if (previousPath && previousPath !== filePath && previousPath.startsWith(`${folder}/`)) {
      const { error: removeError } = await supabase.storage
        .from(PAINTER_MEDIA_BUCKET)
        .remove([previousPath]);

      if (removeError) {
        console.error('Erro ao remover midia anterior do pintor:', removeError);
      }
    }

    return {
      path: filePath,
      url: getPublicMediaUrl(filePath)
    };
  };

  const handlePainterMediaSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
    mediaType: 'profile' | 'cover'
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMediaFeedback({
        type: 'error',
        message: 'Selecione uma imagem valida para atualizar o perfil.'
      });
      return;
    }

    if (!currentProfile?.applicationId) {
      setMediaFeedback({
        type: 'error',
        message: 'Nao encontramos seu cadastro para salvar essa imagem.'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMediaFeedback({
        type: 'error',
        message: 'A imagem precisa ter no maximo 10 MB.'
      });
      return;
    }

    const setLoadingState = mediaType === 'profile' ? setIsUploadingProfile : setIsUploadingCover;
    setLoadingState(true);
    setMediaFeedback(null);

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('Sua sessao expirou. Entre novamente para atualizar as imagens.');
      }

      const uploadResult = await uploadPainterMedia(
        file,
        mediaType === 'profile' ? 'foto-perfil' : 'foto-capa',
        mediaType === 'profile' ? 'foto_perfil' : 'foto_capa',
        currentProfile.applicationId,
        user.id,
        mediaType === 'profile' ? currentProfile.profilePhotoPath : currentProfile.coverPhotoPath
      );

      setCurrentProfile((profile) => {
        if (!profile) {
          return profile;
        }

        if (mediaType === 'profile') {
          return {
            ...profile,
            profilePhotoPath: uploadResult.path,
            profilePhotoUrl: uploadResult.url
          };
        }

        return {
          ...profile,
          coverPhotoPath: uploadResult.path,
          coverPhotoUrl: uploadResult.url
        };
      });

      setMediaFeedback({
        type: 'success',
        message: mediaType === 'profile'
          ? 'Foto de perfil atualizada com sucesso.'
          : 'Foto de capa atualizada com sucesso.'
      });
    } catch (error) {
      console.error(`Erro ao atualizar ${mediaType === 'profile' ? 'foto de perfil' : 'foto de capa'}:`, error);
      setMediaFeedback({
        type: 'error',
        message: mediaType === 'profile'
          ? 'Nao foi possivel atualizar a foto de perfil agora.'
          : 'Nao foi possivel atualizar a foto de capa agora.'
      });
    } finally {
      setLoadingState(false);
    }
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
          { id: 'agenda', label: 'Agenda', icon: CalendarDays },
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
            <span className="font-black text-xs uppercase tracking-widest">{getPlanLabel(currentProfile)}</span>
          </div>
          <p className="text-[10px] text-white/80 font-medium relative z-10">
            {getApplicationStatusLabel(currentProfile?.applicationStatus)}
            {currentProfile?.city ? ` | ${[currentProfile.city, currentProfile.uf].filter(Boolean).join(' - ')}` : ''}
          </p>
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

  const renderInicio = () => {
    const displayName = currentProfile?.fullName || userName;
    const profilePhotoUrl = currentProfile?.profilePhotoUrl || DEFAULT_PROFILE_IMAGE;
    const locationLabel = currentProfile?.city
      ? [currentProfile.city, currentProfile.uf].filter(Boolean).join(' - ')
      : '';
    const coverPhotoUrl =
      currentProfile?.coverPhotoUrl ||
      portfolioItems.find((obra) => obra.imagem_url)?.imagem_url ||
      DEFAULT_COVER_IMAGE;
    const introDetails = [
      locationLabel || null,
      currentProfile?.experienceTime ? `${currentProfile.experienceTime} de experiencia` : null,
      currentProfile?.specialties.length ? `${currentProfile.specialties.length} especialidades` : null
    ].filter(Boolean);
    const lastPortfolioEntry = portfolioItems[0];
    const canEditMedia = Boolean(currentProfile?.applicationId);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <input
          ref={profileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handlePainterMediaSelected(event, 'profile')}
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handlePainterMediaSelected(event, 'cover')}
        />

        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200 mb-8 relative">
          <div className="h-48 bg-slate-800 relative">
            <img src={coverPhotoUrl} className="w-full h-full object-cover opacity-60" alt="Capa do perfil" />
            <button
              type="button"
              onClick={openCoverPicker}
              disabled={isUploadingCover || !canEditMedia}
              className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center hover:bg-white/30 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploadingCover ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Camera size={14} className="mr-2" />
              )}
              {isUploadingCover ? 'Enviando capa...' : 'Alterar Capa'}
            </button>
          </div>

          <div className="px-8 pb-8 relative">
            <button
              type="button"
              onClick={openProfilePicker}
              disabled={isUploadingProfile || !canEditMedia}
              className="absolute -top-16 rounded-full bg-white shadow-xl group disabled:cursor-not-allowed"
            >
              <div className="border-4 border-white rounded-full overflow-hidden relative">
                <img src={profilePhotoUrl} alt={displayName} className="w-32 h-32 rounded-full object-cover relative z-10" />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {isUploadingProfile ? (
                    <Loader2 className="text-white animate-spin" />
                  ) : (
                    <Camera className="text-white" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-1 right-1 z-30 bg-[#9A077B] text-white rounded-full p-2 shadow-lg">
                {isUploadingProfile ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </div>
            </button>

            <div className="pt-20 flex justify-between items-start gap-4">
              <div>
                <h2 className="text-3xl font-black text-[#000747]">Bem-vindo de volta, {displayName.split(' ')[0]}!</h2>
                <p className="text-slate-500 font-medium">
                  {introDetails.length > 0
                    ? introDetails.join(' | ')
                    : 'Seu perfil esta ativo e visivel para clientes em sua regiao.'}
                </p>
              </div>
              <button
                type="button"
                onClick={openEditProfileModal}
                disabled={!currentProfile?.applicationId}
                className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Edit2 size={16} className="mr-2" /> Editar Perfil
              </button>
            </div>

            {profileFeedback && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
                  profileFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {profileFeedback.message}
              </div>
            )}

            {mediaFeedback && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
                  mediaFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {mediaFeedback.message}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              label: 'Obras no Portfolio',
              value: String(metrics.portfolioCount),
              trend: lastPortfolioEntry ? `Ultima obra em ${formatShortDate(lastPortfolioEntry.created_at)}` : 'Nenhuma obra cadastrada ainda',
              icon: Users,
              color: 'text-blue-500',
              bg: 'bg-blue-50'
            },
            {
              label: 'Orcamentos Recebidos',
              value: String(metrics.quoteCount),
              trend: `${metrics.pendingQuoteCount} aguardando resposta`,
              icon: FileText,
              color: 'text-[#9A077B]',
              bg: 'bg-[#9A077B]/10'
            },
            {
              label: 'Plano Atual',
              value: getPlanLabel(currentProfile),
              trend: getApplicationStatusLabel(currentProfile?.applicationStatus),
              icon: Star,
              color: 'text-amber-500',
              bg: 'bg-amber-50'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 mb-2 break-words">{stat.value}</h3>
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
                <p className="font-bold">Orcamentos aguardando retorno</p>
                <p className="text-sm opacity-80">
                  {metrics.pendingQuoteCount > 0
                    ? `Voce tem ${metrics.pendingQuoteCount} orcamento(s) novos esperando resposta.`
                    : 'Nenhum novo orcamento pendente no momento.'}
                </p>
              </div>
            </li>
            <li className="flex items-center p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100">
              <Camera className="mr-4 flex-shrink-0 text-slate-400" />
              <div>
                <p className="font-bold">Portfolio em evolucao</p>
                <p className="text-sm text-slate-500">
                  {metrics.portfolioCount > 0
                    ? `Seu portfolio ja possui ${metrics.portfolioCount} obra(s) publicada(s).`
                    : 'Adicione sua primeira obra para fortalecer sua apresentacao no painel.'}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    );
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-start">
          {portfolioItems.map((obra) => (
            <div key={obra.id} className="w-full max-w-[290px] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)] transition-shadow group">
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                {obra.video_url ? (
                  <video src={obra.video_url} className="w-full h-full object-cover object-center" muted playsInline controls />
                ) : obra.imagem_url ? (
                  <img src={obra.imagem_url} className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" alt={obra.titulo} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                    Sem midia
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full">
                  {obra.status === 'EM ANDAMENTO' ? 'Em Andamento' : 'Concluido'}
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-black text-lg text-slate-900 mb-1">{obra.titulo}</h4>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[2.75rem]">{obra.local}</p>
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

      {quotesError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {quotesError}
        </div>
      )}

      {isLoadingQuotes ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 font-bold">
          Carregando orcamentos...
        </div>
      ) : quoteItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
          <h3 className="text-xl font-black text-slate-900 mb-2">Nenhum orcamento salvo ainda</h3>
          <p className="text-slate-500 font-medium">Crie seu primeiro orcamento e ele aparecera aqui automaticamente.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden text-left">
          <div className="grid grid-cols-12 gap-4 p-6 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500">
            <div className="col-span-3">Cliente</div>
            <div className="col-span-4">Servico Solicitado</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-center">Acao</div>
          </div>

          <div className="divide-y divide-slate-100">
            {quoteItems.map((orcamento) => {
              const serviceLabel =
                orcamento.pintura_tipo_servico ||
                orcamento.imovel_tipo ||
                'Servico nao informado';
              const statusStyle = QUOTE_STATUS_STYLES[orcamento.status] ?? 'bg-slate-100 text-slate-700';
              const statusLabel = QUOTE_STATUS_LABELS[orcamento.status] ?? orcamento.status;

              return (
                <div key={orcamento.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-slate-50 transition">
                  <div className="col-span-3">
                    <div className="font-bold text-slate-900">{orcamento.cliente_nome}</div>
                    <div className="text-xs text-slate-500 mt-1">{orcamento.cliente_telefone}</div>
                  </div>
                  <div className="col-span-4 text-slate-600 font-medium pr-4">
                    <div className="truncate">{serviceLabel}</div>
                    <div className="text-xs text-slate-400 mt-1 truncate">{orcamento.imovel_cidade_estado || 'Local nao informado'}</div>
                  </div>
                  <div className="col-span-2 text-slate-500 text-sm">{formatShortDate(orcamento.created_at)}</div>
                  <div className="col-span-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <button type="button" className="text-[#9A077B] hover:text-[#000747] font-bold p-2">
                      <ChevronRightMock />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderAgenda = () => (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#000747]">Agenda</h2>
        <p className="text-slate-500 font-medium">Organize visitas, prazos e compromissos do seu atendimento.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10">
        <div className="max-w-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#9A077B]/10 text-[#9A077B] flex items-center justify-center mb-6">
            <CalendarDays size={28} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">Menu Agenda adicionado</h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-6">
            Esta area ja esta pronta no painel e pode receber os proximos recursos de calendario sem afetar o restante do sistema.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Visitas</p>
              <p className="text-sm text-slate-600 font-medium">Espaco reservado para agendamentos presenciais.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Prazos</p>
              <p className="text-sm text-slate-600 font-medium">Espaco reservado para acompanhar datas de obra.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Lembretes</p>
              <p className="text-sm text-slate-600 font-medium">Espaco reservado para compromissos e retornos.</p>
            </div>
          </div>
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
    case 'agenda': content = renderAgenda(); break;
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
        onSaved={handleOrcamentoSaved}
      />
      <ObraModal
        isOpen={isObraModalOpen}
        onClose={() => setIsObraModalOpen(false)}
        onSaved={handleObraSaved}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        profile={currentProfile}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={handleProfileUpdated}
      />
    </div>
  );
};
