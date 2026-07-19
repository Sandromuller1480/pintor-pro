import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BellRing,
  Briefcase,
  CalendarDays,
  Clock3,
  Facebook,
  FileText,
  Globe2,
  ImagePlus,
  Instagram,
  Loader2,
  Mail,
  MessageSquare,
  PauseCircle,
  Save,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { DashboardConfirmationDialog } from './DashboardConfirmationDialog';
import { SPECIALTY_OPTIONS } from '../../../lib/painterProfileOptions';
import {
  BRAZIL_TIMEZONE_OPTIONS,
  buildBusinessHoursSummary,
  buildWorkingDaysSummary,
  isWorkingHoursRangeValid,
  WEEK_DAY_OPTIONS
} from '../../../lib/painterAvailability';
import { CurrentPainterProfile, FeedbackMessage, PainterSettingsAssetsForm, PainterSettingsForm } from '../types';
import { getApplicationStatusLabel, getPlanLabel } from '../utils';

interface DashboardSettingsTabProps {
  currentProfile: CurrentPainterProfile | null;
  feedback: FeedbackMessage | null;
  isSaving: boolean;
  isDeletingAccount: boolean;
  onSave: (settings: PainterSettingsForm, assets: PainterSettingsAssetsForm) => void;
  onDeleteAccount: () => void;
}

type SettingsToggleCardProps = {
  icon: typeof MessageSquare;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

type FileFieldKey = keyof PainterSettingsAssetsForm;

const buildSelectedFileKey = (file: File) => `${file.name}::${file.size}::${file.lastModified}::${file.type}`;

const mergeSelectedFiles = (currentFiles: File[], nextFiles: File[]) => {
  const mergedFiles = new Map<string, File>(currentFiles.map((file) => [buildSelectedFileKey(file), file]));

  nextFiles.forEach((file) => {
    mergedFiles.set(buildSelectedFileKey(file), file);
  });

  return Array.from(mergedFiles.values());
};

const getVisibleWorkPhotoCount = (paths: string[]) => (
  paths.filter((path) => !path.includes('/profile-photo/')).length
);

const SettingsToggleCard: React.FC<SettingsToggleCardProps> = ({
  icon: Icon,
  title,
  description,
  checked,
  onChange
}) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
    <div className="flex gap-4">
      <div className={`mt-0.5 rounded-2xl p-3 ${checked ? 'bg-[#9A077B]/10 text-[#9A077B]' : 'bg-slate-100 text-slate-500'}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-base font-black text-[#000747]">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
    <span
      className={`relative mt-1 inline-flex h-7 w-12 flex-shrink-0 rounded-full transition ${
        checked ? 'bg-[#9A077B]' : 'bg-slate-300'
      }`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </span>
  </label>
);

export const DashboardSettingsTab: React.FC<DashboardSettingsTabProps> = ({
  currentProfile,
  feedback,
  isSaving,
  isDeletingAccount,
  onSave,
  onDeleteAccount
}) => {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [form, setForm] = useState<PainterSettingsForm>({
    allowChat: true,
    allowVisitRequests: true,
    pauseLeadIntake: false,
    businessHoursEnabled: false,
    workingDays: ['1', '2', '3', '4', '5'],
    workingHoursStart: '08:00',
    workingHoursEnd: '18:00',
    serviceTimezone: 'America/Cuiaba',
    emailNotifications: true,
    dailySummaryEnabled: false,
    instagramUrl: '',
    facebookUrl: '',
    specialties: []
  });
  const [selectedAssets, setSelectedAssets] = useState<PainterSettingsAssetsForm>({
    workPhotos: [],
    certifications: []
  });
  const [localValidationError, setLocalValidationError] = useState('');
  const workPhotosInputRef = useRef<HTMLInputElement | null>(null);
  const certificationsInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!currentProfile) {
      return;
    }

    setLocalValidationError('');
    setForm({
      allowChat: currentProfile.allowChat,
      allowVisitRequests: currentProfile.allowVisitRequests,
      pauseLeadIntake: currentProfile.pauseLeadIntake,
      businessHoursEnabled: currentProfile.businessHoursEnabled,
      workingDays: currentProfile.workingDays,
      workingHoursStart: currentProfile.workingHoursStart,
      workingHoursEnd: currentProfile.workingHoursEnd,
      serviceTimezone: currentProfile.serviceTimezone,
      emailNotifications: currentProfile.emailNotifications,
      dailySummaryEnabled: currentProfile.dailySummaryEnabled,
      instagramUrl: currentProfile.instagramUrl,
      facebookUrl: currentProfile.facebookUrl,
      specialties: currentProfile.specialties
    });
    setSelectedAssets({
      workPhotos: [],
      certifications: []
    });
  }, [currentProfile]);

  const updateField = <K extends keyof PainterSettingsForm>(field: K, value: PainterSettingsForm[K]) => {
    setLocalValidationError('');
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  };

  const toggleWorkingDay = (dayValue: string) => {
    setLocalValidationError('');
    setForm((currentForm) => {
      const nextWorkingDays = currentForm.workingDays.includes(dayValue)
        ? currentForm.workingDays.filter((value) => value !== dayValue)
        : [...currentForm.workingDays, dayValue].sort((first, second) => Number(first) - Number(second));

      return {
        ...currentForm,
        workingDays: nextWorkingDays
      };
    });
  };

  const toggleSpecialty = (specialty: string) => {
    setLocalValidationError('');
    setForm((currentForm) => ({
      ...currentForm,
      specialties: currentForm.specialties.includes(specialty)
        ? currentForm.specialties.filter((item) => item !== specialty)
        : [...currentForm.specialties, specialty]
    }));
  };

  const updateSelectedFiles = (field: FileFieldKey, updater: (currentFiles: File[]) => File[]) => {
    setLocalValidationError('');
    setSelectedAssets((currentAssets) => ({
      ...currentAssets,
      [field]: updater(currentAssets[field])
    }));
  };

  const handleAssetFilesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: FileFieldKey
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    updateSelectedFiles(field, (currentFiles) => mergeSelectedFiles(currentFiles, files));
  };

  const removeSelectedFile = (field: FileFieldKey, fileKey: string) => {
    updateSelectedFiles(field, (currentFiles) => currentFiles.filter((file) => buildSelectedFileKey(file) !== fileKey));
  };

  const handleSaveClick = () => {
    if (form.businessHoursEnabled) {
      if (form.workingDays.length === 0) {
        setLocalValidationError('Selecione pelo menos um dia de atendimento para ativar o expediente.');
        return;
      }

      if (!isWorkingHoursRangeValid(form.workingHoursStart, form.workingHoursEnd)) {
        setLocalValidationError('Defina um horario final maior do que o horario inicial.');
        return;
      }
    }

    if (form.specialties.length === 0) {
      setLocalValidationError('Selecione pelo menos uma especialidade.');
      return;
    }

    setLocalValidationError('');
    onSave(form, selectedAssets);
  };

  const handleDeleteConfirmation = async () => {
    await onDeleteAccount();
    setIsDeleteConfirmationOpen(false);
  };

  const planLabel = getPlanLabel(currentProfile);
  const statusLabel = getApplicationStatusLabel(currentProfile?.applicationStatus);
  const locationLabel = currentProfile?.city
    ? [currentProfile.city, currentProfile.uf].filter(Boolean).join(' - ')
    : 'Localização não informada';
  const scheduleSummary = buildBusinessHoursSummary(form);
  const existingWorkPhotoCount = currentProfile ? getVisibleWorkPhotoCount(currentProfile.workPhotoPaths) : 0;
  const existingCertificationCount = currentProfile?.certificationPaths.length ?? 0;
  const totalWorkPhotoCount = existingWorkPhotoCount + selectedAssets.workPhotos.length;
  const totalCertificationCount = existingCertificationCount + selectedAssets.certifications.length;

  const renderSelectedFiles = (files: File[], field: FileFieldKey) => {
    if (!files.length) {
      return null;
    }

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {files.map((file) => {
          const fileKey = buildSelectedFileKey(file);

          return (
            <button
              key={fileKey}
              type="button"
              onClick={() => removeSelectedFile(field, fileKey)}
              className="max-w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-left text-[11px] font-bold text-slate-600 transition hover:border-red-200 hover:text-red-600"
              title="Remover da seleção"
            >
              <span className="block truncate">{file.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#9A077B]">Configurações operacionais</p>
            <h2 className="text-3xl font-black text-[#000747]">Controle como você aparece e atende dentro da plataforma.</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              Essas preferências afetam seu perfil público em tempo real. Se você pausar o recebimento de contatos,
              os botões de chat e agendamento ficam indisponíveis para clientes até a reativação.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!currentProfile?.applicationId || isSaving}
            className="inline-flex items-center justify-center rounded-2xl bg-[#9A077B] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        {localValidationError && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {localValidationError}
          </div>
        )}

        {feedback && (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="space-y-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#9A077B]/10 p-3 text-[#9A077B]">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#000747]">Credenciais do perfil</h3>
                <p className="text-sm font-medium text-slate-500">Atualize especialidades, fotos de trabalhos e certificados exibidos na sua avaliação.</p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Selecione suas especialidades</p>
              <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
                {SPECIALTY_OPTIONS.map((option) => {
                  const isSelected = form.specialties.includes(option);

                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center rounded-2xl border p-3 transition ${
                        isSelected
                          ? 'border-[#9A077B] bg-[#9A077B] text-white shadow-lg shadow-[#F7E3F1]'
                          : 'border-slate-100 bg-white text-slate-600 hover:border-[#EFC6E3]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => toggleSpecialty(option)}
                      />
                      <span
                        className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          isSelected ? 'border-white bg-white text-[#9A077B]' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="text-xs font-black uppercase leading-tight">{option}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Selecionadas: {form.specialties.length} especialidades
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Fotos de trabalhos</p>
                <input
                  ref={workPhotosInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => handleAssetFilesChange(event, 'workPhotos')}
                />
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => workPhotosInputRef.current?.click()}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center rounded-2xl bg-[#9A077B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ImagePlus size={16} className="mr-2" />
                      Escolher fotos
                    </button>
                    <p className="text-xs font-medium text-slate-500">
                      {selectedAssets.workPhotos.length
                        ? `${selectedAssets.workPhotos.length} nova(s) foto(s)`
                        : 'Nenhuma foto nova selecionada.'}
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-slate-400">
                    No celular, voce pode selecionar em etapas. As novas selecoes serao somadas ao perfil.
                  </p>
                  {renderSelectedFiles(selectedAssets.workPhotos, 'workPhotos')}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Existentes: {existingWorkPhotoCount}. Total apos salvar: {totalWorkPhotoCount}
                </p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Certificados</p>
                <input
                  ref={certificationsInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg"
                  multiple
                  className="sr-only"
                  onChange={(event) => handleAssetFilesChange(event, 'certifications')}
                />
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => certificationsInputRef.current?.click()}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-700 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileText size={16} className="mr-2" />
                      Escolher arquivos
                    </button>
                    <p className="text-xs font-medium text-slate-500">
                      {selectedAssets.certifications.length
                        ? `${selectedAssets.certifications.length} novo(s) arquivo(s)`
                        : 'Nenhum arquivo novo selecionado.'}
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-slate-400">
                    PDF ou JPG. Novos certificados serao somados aos que voce ja enviou.
                  </p>
                  {renderSelectedFiles(selectedAssets.certifications, 'certifications')}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Existentes: {existingCertificationCount}. Total apos salvar: {totalCertificationCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#9A077B]/10 p-3 text-[#9A077B]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#000747]">Disponibilidade e atendimento</h3>
                <p className="text-sm font-medium text-slate-500">Defina como clientes podem iniciar contato com você.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SettingsToggleCard
                icon={MessageSquare}
                title="Permitir contato por chat"
                description="Quando desativado, o botão Chamar no Chat fica bloqueado no seu perfil público."
                checked={form.allowChat}
                onChange={(checked) => updateField('allowChat', checked)}
              />
              <SettingsToggleCard
                icon={Clock3}
                title="Permitir agendamento de visita"
                description="Controla se clientes podem solicitar visitas técnicas diretamente pela sua página pública."
                checked={form.allowVisitRequests}
                onChange={(checked) => updateField('allowVisitRequests', checked)}
              />
              <SettingsToggleCard
                icon={PauseCircle}
                title="Pausar recebimento de novos contatos"
                description="Desliga chat e agenda ao mesmo tempo, ideal para férias, agenda lotada ou manutenção do atendimento."
                checked={form.pauseLeadIntake}
                onChange={(checked) => updateField('pauseLeadIntake', checked)}
              />
              <SettingsToggleCard
                icon={CalendarDays}
                title="Restringir atendimento ao horario de expediente"
                description="Quando ligado, clientes só conseguem iniciar contato dentro dos dias e horários configurados abaixo."
                checked={form.businessHoursEnabled}
                onChange={(checked) => updateField('businessHoursEnabled', checked)}
              />
            </div>

            {form.businessHoursEnabled && (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
                <div className="mb-6">
                  <h4 className="text-base font-black text-[#000747]">Expediente publicado</h4>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Escolha os dias, o intervalo de horas e o fuso usado para liberar chat e agendamentos.
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Dias de atendimento</p>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAY_OPTIONS.map((day) => {
                      const isSelected = form.workingDays.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleWorkingDay(day.value)}
                          className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                            isSelected
                              ? 'bg-[#000747] text-white shadow-lg shadow-[#000747]/15'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
                          }`}
                        >
                          {day.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    Dias ativos: <span className="font-black text-slate-700">{buildWorkingDaysSummary(form.workingDays)}</span>
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Início</span>
                    <input
                      type="time"
                      value={form.workingHoursStart}
                      onChange={(event) => updateField('workingHoursStart', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#9A077B]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Fim</span>
                    <input
                      type="time"
                      value={form.workingHoursEnd}
                      onChange={(event) => updateField('workingHoursEnd', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#9A077B]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Fuso horário</span>
                    <div className="relative">
                      <Globe2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select
                        value={form.serviceTimezone}
                        onChange={(event) => updateField('serviceTimezone', event.target.value)}
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#9A077B]"
                      >
                        {BRAZIL_TIMEZONE_OPTIONS.map((timeZone) => (
                          <option key={timeZone.value} value={timeZone.value}>
                            {timeZone.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                <div className="mt-6 rounded-2xl border border-[#9A077B]/10 bg-white px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Resumo público</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">{scheduleSummary}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#000747]/10 p-3 text-[#000747]">
                <BellRing size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#000747]">Notificações</h3>
                <p className="text-sm font-medium text-slate-500">Organize como você quer acompanhar oportunidades no painel.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SettingsToggleCard
                icon={Mail}
                title="Receber avisos por e-mail"
                description="Mantém comunicações importantes de conversas, agenda e atualizações operacionais."
                checked={form.emailNotifications}
                onChange={(checked) => updateField('emailNotifications', checked)}
              />
              <SettingsToggleCard
                icon={Briefcase}
                title="Receber resumo diário"
                description="Agrupa novas interações e status do painel em um resumo mais compacto ao longo do dia."
                checked={form.dailySummaryEnabled}
                onChange={(checked) => updateField('dailySummaryEnabled', checked)}
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Globe2 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#000747]">Redes sociais</h3>
                <p className="text-sm font-medium text-slate-500">Cadastre os links do seu Instagram e Facebook para futuras exibições e integrações do seu perfil.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <Instagram size={14} className="text-[#9A077B]" />
                  Instagram
                </span>
                <input
                  type="url"
                  inputMode="url"
                  value={form.instagramUrl}
                  onChange={(event) => updateField('instagramUrl', event.target.value)}
                  placeholder="https://instagram.com/seuperfil"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#9A077B] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <Facebook size={14} className="text-[#000747]" />
                  Facebook
                </span>
                <input
                  type="url"
                  inputMode="url"
                  value={form.facebookUrl}
                  onChange={(event) => updateField('facebookUrl', event.target.value)}
                  placeholder="https://facebook.com/seuperfil"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#9A077B] focus:bg-white"
                />
              </label>

              <p className="text-xs font-medium leading-relaxed text-slate-500">
                Dica: cole o link completo do seu perfil. Se você digitar sem `https://`, a plataforma completa isso automaticamente ao salvar.
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black text-[#000747]">Conta e plano</h3>
            <div className="mt-6 space-y-4">
              {[
                { label: 'Conta principal', value: currentProfile?.email || 'Não informada' },
                { label: 'Plano atual', value: planLabel },
                { label: 'Status do cadastro', value: statusLabel },
                { label: 'Cidade base', value: locationLabel }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-700 break-words">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-[#000747] to-[#111F45] p-8 text-white shadow-sm">
            <h3 className="text-xl font-black">Impacto público agora</h3>
            <ul className="mt-6 space-y-4 text-sm font-medium leading-relaxed text-white/80">
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Chat: <span className="font-black text-white">{form.pauseLeadIntake ? 'Pausado' : form.allowChat ? 'Ativo' : 'Desativado'}</span>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Agenda: <span className="font-black text-white">{form.pauseLeadIntake ? 'Pausada' : form.allowVisitRequests ? 'Ativa' : 'Desativada'}</span>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Leads novos: <span className="font-black text-white">{form.pauseLeadIntake ? 'Bloqueados' : 'Recebendo normalmente'}</span>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Expediente: <span className="font-black text-white">{scheduleSummary}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[32px] border border-red-200 bg-red-50/80 p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-red-700">Zona de risco</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                  Exclui seu acesso, remove seu perfil público, portfólio, orçamentos, agenda e conversas vinculadas a esta conta.
                  Se houver assinatura ativa, a plataforma tenta cancelar a cobrança antes de concluir a exclusão.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteConfirmationOpen(true)}
              disabled={!currentProfile?.applicationId || isDeletingAccount}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingAccount ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={16} className="mr-2" />
              )}
              {isDeletingAccount ? 'Excluindo conta...' : 'Excluir minha conta'}
            </button>
          </div>
        </aside>
      </div>

      <DashboardConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        title="Tem certeza que deseja excluir sua conta?"
        description="Essa ação remove seu acesso, seu perfil público e os dados operacionais vinculados a este pintor."
        onCancel={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={() => void handleDeleteConfirmation()}
        isLoading={isDeletingAccount}
      />
    </div>
  );
};

