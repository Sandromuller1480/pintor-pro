import React, { useState } from 'react';
import { X, Plus, Trash2, Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (orcamento: SavedOrcamento) => void;
}

type Ambiente = {
  id: string;
  nome: string;
  area: string;
  peDireito: string;
  superficie: string;
};

type OrcamentoFormData = {
  clienteNome: string;
  clienteCpfCnpj: string;
  clienteTelefone: string;
  clienteEmail: string;
  clienteTipo: string;
  imovelEndereco: string;
  imovelCidadeEstado: string;
  imovelTipo: string;
  imovelSituacao: string;
  imovelStatus: string;
  pinturaTipoServico: string;
  pinturaAcabamento: string;
  pinturaTinta: string;
  prepSituacaoParede: string;
  compAlturaTrabalho: string;
  compAcesso: string;
  coresJaDefinidas: string;
  coresQuantidade: string;
  coresConsultoria: string;
  prazoDataInicio: string;
  prazoEstimado: string;
  prazoUrgencia: string;
  fornecimentoMateriais: string;
  observacoes: string;
  confirmacaoInformacoes: boolean;
  autorizacaoContato: boolean;
};

export type SavedOrcamento = {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string | null;
  cliente_tipo: string | null;
  imovel_cidade_estado: string | null;
  imovel_tipo: string | null;
  pintura_tipo_servico: string | null;
  prazo_urgencia: string | null;
  status: string;
  created_at: string;
};

const QUOTE_MEDIA_BUCKET = 'orcamentos-media';

const INITIAL_FORM_DATA: OrcamentoFormData = {
  clienteNome: '',
  clienteCpfCnpj: '',
  clienteTelefone: '',
  clienteEmail: '',
  clienteTipo: '',
  imovelEndereco: '',
  imovelCidadeEstado: '',
  imovelTipo: 'Casa',
  imovelSituacao: '',
  imovelStatus: '',
  pinturaTipoServico: '',
  pinturaAcabamento: '',
  pinturaTinta: '',
  prepSituacaoParede: '',
  compAlturaTrabalho: '',
  compAcesso: '',
  coresJaDefinidas: '',
  coresQuantidade: '1',
  coresConsultoria: '',
  prazoDataInicio: '',
  prazoEstimado: '',
  prazoUrgencia: '',
  fornecimentoMateriais: '',
  observacoes: '',
  confirmacaoInformacoes: false,
  autorizacaoContato: false
};

const INITIAL_AMBIENTE = (): Ambiente => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  nome: '',
  area: '',
  peDireito: 'Padrao',
  superficie: ''
});

const InputGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
    {children}
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div className="flex items-center space-x-2 mt-8 mb-6 pb-2 border-b border-slate-200">
    <h3 className="text-lg font-black text-[#000747] uppercase tracking-wide">{title}</h3>
  </div>
);

const sanitizeFileName = (fileName: string) => {
  const cleanedName = fileName
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleanedName || 'arquivo';
};

const buildQuoteAttachmentPath = (userId: string, quoteId: string, file: File, index: number) => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const fileBaseName = sanitizeFileName(file.name);
  const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${index}`;

  return `${userId}/${quoteId}/${uniqueId}-${fileBaseName}.${extension}`;
};

const normalizeWhatsappPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('55')) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
};

const buildQuoteWhatsappMessage = (
  painterName: string,
  formData: OrcamentoFormData,
  ambientesValidos: Ambiente[]
) => {
  const messageLines = [
    `Ola, ${formData.clienteNome.trim()}!`,
    `Seu orcamento foi preparado por ${painterName || 'seu pintor'} pela plataforma Pintor Pro.`,
    'Este atendimento conta com a organizacao, garantia e seguranca da Pintor Pro para proteger a negociacao entre as partes.',
    '',
    'Resumo do orcamento:',
    `Tipo de servico: ${formData.pinturaTipoServico || 'A combinar'}`,
    `Imovel: ${formData.imovelTipo || 'Nao informado'}`,
    `Local: ${formData.imovelCidadeEstado.trim() || 'Nao informado'}`,
    `Urgencia: ${formData.prazoUrgencia || 'Nao informada'}`
  ];

  if (ambientesValidos.length > 0) {
    const ambienteNames = ambientesValidos
      .map((ambiente, index) => ambiente.nome.trim() || `Ambiente ${index + 1}`)
      .join(', ');

    messageLines.push(`Ambientes: ${ambienteNames}`);
  }

  if (formData.prazoDataInicio) {
    messageLines.push(`Inicio ideal: ${formData.prazoDataInicio}`);
  }

  if (formData.observacoes.trim()) {
    messageLines.push('', `Observacoes: ${formData.observacoes.trim()}`);
  }

  messageLines.push('', 'Se quiser, posso ajustar algum detalhe para deixar a proposta ideal para voce.');

  return messageLines.join('\n');
};

const buildQuoteWhatsappUrl = (phone: string, message: string) => {
  const normalizedPhone = normalizeWhatsappPhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
};

export const OrcamentoModal: React.FC<OrcamentoModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [formData, setFormData] = useState<OrcamentoFormData>(INITIAL_FORM_DATA);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([INITIAL_AMBIENTE()]);
  const [prepServicos, setPrepServicos] = useState<string[]>([]);
  const [compNecessidade, setCompNecessidade] = useState<string[]>([]);
  const [servicosExtras, setServicosExtras] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setAmbientes([INITIAL_AMBIENTE()]);
    setPrepServicos([]);
    setCompNecessidade([]);
    setServicosExtras([]);
    setAttachments([]);
    setErrorMessage('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const updateField = <K extends keyof OrcamentoFormData>(field: K, value: OrcamentoFormData[K]) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value
    }));
  };

  const handleAddAmbiente = () => {
    setAmbientes((currentAmbientes) => [...currentAmbientes, INITIAL_AMBIENTE()]);
  };

  const handleRemoveAmbiente = (id: string) => {
    setAmbientes((currentAmbientes) => currentAmbientes.filter((ambiente) => ambiente.id !== id));
  };

  const updateAmbiente = (id: string, field: keyof Ambiente, value: string) => {
    setAmbientes((currentAmbientes) =>
      currentAmbientes.map((ambiente) => (
        ambiente.id === id
          ? { ...ambiente, [field]: value }
          : ambiente
      ))
    );
  };

  const toggleArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    array: string[],
    item: string
  ) => {
    if (array.includes(item)) {
      setter(array.filter((value) => value !== item));
      return;
    }

    setter([...array, item]);
  };

  const uploadAttachments = async (userId: string, quoteId: string, files: File[]) => {
    if (!files.length) {
      return [];
    }

    const uploadedPaths: string[] = [];

    for (const [index, file] of files.entries()) {
      const filePath = buildQuoteAttachmentPath(userId, quoteId, file, index);

      const { error } = await supabase.storage
        .from(QUOTE_MEDIA_BUCKET)
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || undefined
        });

      if (error) {
        throw error;
      }

      uploadedPaths.push(filePath);
    }

    return uploadedPaths;
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!formData.clienteNome.trim() || !formData.clienteTelefone.trim()) {
      setErrorMessage('Informe pelo menos nome e telefone do cliente.');
      return;
    }

    if (!formData.confirmacaoInformacoes || !formData.autorizacaoContato) {
      setErrorMessage('Confirme as informacoes e a autorizacao de contato para salvar o orcamento.');
      return;
    }

    const normalizedClientWhatsapp = normalizeWhatsappPhone(formData.clienteTelefone);
    const whatsappDraftWindow = normalizedClientWhatsapp && typeof window !== 'undefined'
      ? window.open('', '_blank')
      : null;

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('Voce precisa estar autenticado para salvar um orcamento.');
      }

      const painterDisplayName =
        typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
          ? user.user_metadata.full_name.trim()
          : (user.email?.split('@')[0] ?? 'seu pintor');

      const ambientesValidos = ambientes.filter((ambiente) => (
        ambiente.nome.trim() ||
        ambiente.area.trim() ||
        ambiente.superficie.trim()
      ));
      const whatsappMessage = buildQuoteWhatsappMessage(painterDisplayName, formData, ambientesValidos);

      const { data: savedQuote, error: insertError } = await supabase
        .from('orcamentos')
        .insert({
          pintor_id: user.id,
          cliente_nome: formData.clienteNome.trim(),
          cliente_cpf_cnpj: formData.clienteCpfCnpj.trim() || null,
          cliente_telefone: formData.clienteTelefone.trim(),
          cliente_email: formData.clienteEmail.trim().toLowerCase() || null,
          cliente_tipo: formData.clienteTipo || null,
          imovel_endereco: formData.imovelEndereco.trim() || null,
          imovel_cidade_estado: formData.imovelCidadeEstado.trim() || null,
          imovel_tipo: formData.imovelTipo || null,
          imovel_situacao: formData.imovelSituacao || null,
          imovel_status: formData.imovelStatus || null,
          ambientes: ambientesValidos,
          pintura_tipo_servico: formData.pinturaTipoServico || null,
          pintura_acabamento: formData.pinturaAcabamento || null,
          pintura_tinta: formData.pinturaTinta || null,
          prep_situacao_parede: formData.prepSituacaoParede || null,
          prep_servicos_necessarios: prepServicos,
          comp_altura_trabalho: formData.compAlturaTrabalho || null,
          comp_necessidade: compNecessidade,
          comp_acesso: formData.compAcesso || null,
          servicos_extras: servicosExtras,
          cores_ja_definidas: formData.coresJaDefinidas || null,
          cores_quantidade: formData.coresQuantidade || null,
          cores_consultoria: formData.coresConsultoria || null,
          prazo_data_inicio: formData.prazoDataInicio || null,
          prazo_estimado: formData.prazoEstimado.trim() || null,
          prazo_urgencia: formData.prazoUrgencia || null,
          fornecimento_materiais: formData.fornecimentoMateriais || null,
          observacoes: formData.observacoes.trim() || null,
          status: 'novo'
        })
        .select('id, cliente_nome, cliente_telefone, cliente_email, cliente_tipo, imovel_cidade_estado, imovel_tipo, pintura_tipo_servico, prazo_urgencia, status, created_at')
        .single();

      if (insertError) {
        throw insertError;
      }

      if (attachments.length > 0) {
        try {
          const uploadedPaths = await uploadAttachments(user.id, savedQuote.id, attachments);
          const { error: updateError } = await supabase
            .from('orcamentos')
            .update({ imagens_paths: uploadedPaths })
            .eq('id', savedQuote.id);

          if (updateError) {
            console.error('Erro ao salvar anexos do orcamento:', updateError);
          }
        } catch (uploadError) {
          console.error('Erro ao enviar anexos do orcamento:', uploadError);
        }
      }

      const whatsappUrl = buildQuoteWhatsappUrl(formData.clienteTelefone, whatsappMessage);

      if (whatsappUrl) {
        if (whatsappDraftWindow) {
          whatsappDraftWindow.location.href = whatsappUrl;
        } else if (typeof window !== 'undefined') {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else if (whatsappDraftWindow) {
        whatsappDraftWindow.close();
      }

      onSaved?.(savedQuote);
      resetForm();
      onClose();
    } catch (error) {
      if (whatsappDraftWindow && !whatsappDraftWindow.closed) {
        whatsappDraftWindow.close();
      }

      console.error('Erro ao salvar orcamento:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar o orcamento.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-[#000747] to-[#9A077B] p-6 text-white flex justify-between items-center z-10 shadow-md">
          <div>
            <h2 className="text-xl font-black tracking-wide">Formulario Profissional de Orcamento</h2>
            <p className="text-white/80 text-sm font-medium">Pintura imobiliaria com salvamento real no painel</p>
          </div>
          <button onClick={handleClose} disabled={isSubmitting} className="p-2 hover:bg-white/20 rounded-full transition disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-6">
            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                {errorMessage}
              </div>
            )}

            <SectionTitle title="1. Dados do Cliente" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Nome completo">
                <input type="text" value={formData.clienteNome} onChange={(e) => updateField('clienteNome', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="Nome do cliente" />
              </InputGroup>
              <InputGroup label="CPF / CNPJ">
                <input type="text" value={formData.clienteCpfCnpj} onChange={(e) => updateField('clienteCpfCnpj', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="000.000.000-00" />
              </InputGroup>
              <InputGroup label="Telefone (WhatsApp)">
                <input type="text" value={formData.clienteTelefone} onChange={(e) => updateField('clienteTelefone', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="(00) 00000-0000" />
              </InputGroup>
              <InputGroup label="E-mail">
                <input type="email" value={formData.clienteEmail} onChange={(e) => updateField('clienteEmail', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="cliente@email.com" />
              </InputGroup>
              <InputGroup label="Tipo de cliente">
                <div className="flex flex-wrap gap-3 mt-2">
                  {['Pessoa fisica', 'Empresa', 'Imobiliaria'].map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                      <input type="radio" name="clienteTipo" value={item} checked={formData.clienteTipo === item} onChange={(e) => updateField('clienteTipo', e.target.value)} className="accent-[#9A077B]" />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
            </div>

            <SectionTitle title="2. Dados do Imovel" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <InputGroup label="Endereco completo">
                  <input type="text" value={formData.imovelEndereco} onChange={(e) => updateField('imovelEndereco', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="Rua, numero, bairro" />
                </InputGroup>
              </div>
              <InputGroup label="Cidade / Estado">
                <input type="text" value={formData.imovelCidadeEstado} onChange={(e) => updateField('imovelCidadeEstado', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="Cidade - UF" />
              </InputGroup>
              <InputGroup label="Tipo de imovel">
                <select value={formData.imovelTipo} onChange={(e) => updateField('imovelTipo', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] text-slate-700">
                  {['Casa', 'Apartamento', 'Comercial', 'Industrial', 'Rural'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </InputGroup>
              <InputGroup label="Situacao">
                <div className="flex flex-wrap gap-4 mt-2">
                  {['Novo', 'Usado', 'Reforma'].map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="imovelSituacao" value={item} checked={formData.imovelSituacao === item} onChange={(e) => updateField('imovelSituacao', e.target.value)} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
              <InputGroup label="Imovel esta">
                <div className="flex flex-wrap gap-4 mt-2">
                  {['Vazio', 'Mobiliado', 'Em uso'].map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="imovelStatus" value={item} checked={formData.imovelStatus === item} onChange={(e) => updateField('imovelStatus', e.target.value)} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
            </div>

            <SectionTitle title="3. Detalhamento das Areas" />
            <div className="space-y-4">
              {ambientes.map((ambiente, index) => (
                <div key={ambiente.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl relative">
                  <h4 className="font-bold text-[#000747] mb-4 flex items-center justify-between">
                    Ambiente {index + 1}
                    {ambientes.length > 1 && (
                      <button type="button" onClick={() => handleRemoveAmbiente(ambiente.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center">
                        <Trash2 size={16} className="mr-1" /> Remover
                      </button>
                    )}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputGroup label="Nome do ambiente">
                      <input type="text" placeholder="Ex: Sala" className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={ambiente.nome} onChange={(e) => updateAmbiente(ambiente.id, 'nome', e.target.value)} />
                    </InputGroup>
                    <InputGroup label="Area (m2)">
                      <input type="text" placeholder="Ex: 25" className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={ambiente.area} onChange={(e) => updateAmbiente(ambiente.id, 'area', e.target.value)} />
                    </InputGroup>
                    <InputGroup label="Pe direito">
                      <select className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={ambiente.peDireito} onChange={(e) => updateAmbiente(ambiente.id, 'peDireito', e.target.value)}>
                        <option value="Padrao">Padrao</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </InputGroup>
                    <InputGroup label="Superficie">
                      <select className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={ambiente.superficie} onChange={(e) => updateAmbiente(ambiente.id, 'superficie', e.target.value)}>
                        <option value="">Selecione...</option>
                        {['Reboco', 'Gesso', 'Drywall', 'Madeira', 'Metal'].map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </InputGroup>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddAmbiente} className="flex items-center text-[#9A077B] font-bold text-sm bg-[#9A077B]/10 px-4 py-2 rounded-xl hover:bg-[#9A077B]/20 transition">
                <Plus size={16} className="mr-1" /> Adicionar Ambiente
              </button>
            </div>

            <SectionTitle title="4. Tipo de Pintura" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputGroup label="Tipo de servico">
                {['Pintura interna', 'Pintura externa', 'Ambas'].map((item) => (
                  <label key={item} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="pinturaServico" value={item} checked={formData.pinturaTipoServico === item} onChange={(e) => updateField('pinturaTipoServico', e.target.value)} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Tipo de acabamento">
                {['Fosco', 'Semi-brilho', 'Acetinado', 'Brilhante'].map((item) => (
                  <label key={item} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="pinturaAcabamento" value={item} checked={formData.pinturaAcabamento === item} onChange={(e) => updateField('pinturaAcabamento', e.target.value)} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Tipo de tinta">
                {['Acrilica', 'Latex', 'Epoxi', 'Esmalte', 'Emborrachada', 'A definir'].map((item) => (
                  <label key={item} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="pinturaTinta" value={item} checked={formData.pinturaTinta === item} onChange={(e) => updateField('pinturaTinta', e.target.value)} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </InputGroup>
            </div>

            <SectionTitle title="5. Preparacao da Superficie" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label="Situacao atual da parede">
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Nova', 'Boa', 'Com rachaduras', 'Com infiltracao', 'Descascando'].map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-2 border rounded-lg">
                      <input type="radio" name="prepSituacao" value={item} checked={formData.prepSituacaoParede === item} onChange={(e) => updateField('prepSituacaoParede', e.target.value)} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
              <InputGroup label="Servicos necessarios">
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Lixamento', 'Massa corrida', 'Massa acrilica', 'Selador', 'Fundo preparador', 'Tratamento de mofo', 'Correcao de fissuras'].map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={prepServicos.includes(item)} onChange={() => toggleArrayItem(setPrepServicos, prepServicos, item)} className="accent-[#9A077B] w-4 h-4 rounded" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
            </div>

            <SectionTitle title="6. Complexidade do Servico" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputGroup label="Altura do trabalho">
                {['Ate 3m', '3m a 6m', 'Acima de 6m'].map((item) => (
                  <label key={item} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="compAltura" value={item} checked={formData.compAlturaTrabalho === item} onChange={(e) => updateField('compAlturaTrabalho', e.target.value)} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Necessidade de">
                {['Andaime', 'Escada', 'Plataforma elevatoria'].map((item) => (
                  <label key={item} className="flex items-center space-x-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={compNecessidade.includes(item)} onChange={() => toggleArrayItem(setCompNecessidade, compNecessidade, item)} className="accent-[#9A077B] w-4 h-4 rounded" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Acesso ao local">
                {['Facil', 'Medio', 'Dificil'].map((item) => (
                  <label key={item} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="compAcesso" value={item} checked={formData.compAcesso === item} onChange={(e) => updateField('compAcesso', e.target.value)} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </InputGroup>
            </div>

            <SectionTitle title="7. Servicos Extras" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Protecao de moveis', 'Protecao de piso', 'Limpeza pos-obra', 'Remocao de tinta antiga', 'Aplicacao de textura', 'Grafiato', 'Efeito decorativo'].map((item) => (
                <label key={item} className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-50 border rounded-xl hover:bg-slate-100 transition">
                  <input type="checkbox" checked={servicosExtras.includes(item)} onChange={() => toggleArrayItem(setServicosExtras, servicosExtras, item)} className="accent-[#9A077B] w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700 leading-tight">{item}</span>
                </label>
              ))}
            </div>

            <SectionTitle title="8. Cores e Personalizacao" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputGroup label="Ja possui cores definidas?">
                <div className="flex gap-4 mt-2">
                  {['Sim', 'Nao'].map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="coresDefinidas" value={item} checked={formData.coresJaDefinidas === item} onChange={(e) => updateField('coresJaDefinidas', e.target.value)} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
              <InputGroup label="Quantidade de cores">
                <select value={formData.coresQuantidade} onChange={(e) => updateField('coresQuantidade', e.target.value)} className="w-full border bg-slate-50 rounded-lg px-3 py-2 outline-[#9A077B] mt-2">
                  {['1', '2-3', '4+'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </InputGroup>
              <InputGroup label="Deseja consultoria de cores?">
                <div className="flex gap-4 mt-2">
                  {['Sim', 'Nao'].map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="coresConsultoria" value={item} checked={formData.coresConsultoria === item} onChange={(e) => updateField('coresConsultoria', e.target.value)} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <SectionTitle title="9. Prazo e Urgencia" />
                <InputGroup label="Data ideal de inicio">
                  <input type="date" value={formData.prazoDataInicio} onChange={(e) => updateField('prazoDataInicio', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-[#9A077B]" />
                </InputGroup>
                <InputGroup label="Prazo estimado na cabeca do cliente">
                  <input type="text" value={formData.prazoEstimado} onChange={(e) => updateField('prazoEstimado', e.target.value)} placeholder="Ex: 1 semana, 15 dias" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-[#9A077B]" />
                </InputGroup>
                <InputGroup label="Urgencia">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Normal', 'Urgente', 'Muito urgente'].map((item) => (
                      <label key={item} className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-2 border rounded-lg">
                        <input type="radio" name="prazoUrgencia" value={item} checked={formData.prazoUrgencia === item} onChange={(e) => updateField('prazoUrgencia', e.target.value)} className="accent-[#9A077B]" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </InputGroup>
              </div>
              <div>
                <SectionTitle title="10. Fornecimento" />
                <InputGroup label="Materiais serao">
                  <div className="flex flex-col gap-3 mt-2">
                    {['Fornecidos pelo cliente', 'Fornecidos pelo profissional', 'A combinar'].map((item) => (
                      <label key={item} className="flex items-center space-x-3 cursor-pointer bg-slate-50 px-4 py-3 border rounded-xl hover:bg-slate-100 transition">
                        <input type="radio" name="fornecimentoMateriais" value={item} checked={formData.fornecimentoMateriais === item} onChange={(e) => updateField('fornecimentoMateriais', e.target.value)} className="accent-[#9A077B] w-4 h-4" />
                        <span className="text-sm font-bold text-slate-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </InputGroup>
              </div>
            </div>

            <SectionTitle title="11. Imagens do Local (Opcionais)" />
            <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
              <Camera size={32} className="text-slate-400 mb-2" />
              <p className="font-bold text-slate-600">Clique para adicionar fotos ou videos do local</p>
              <p className="text-xs text-slate-400 mt-1">Arquivos opcionais. Selecionados: {attachments.length}</p>
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => setAttachments(Array.from(e.target.files ?? []))} />
            </label>

            <SectionTitle title="12. Observacoes" />
            <InputGroup label="Detalhes adicionais ou restricoes">
              <textarea rows={4} value={formData.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700 resize-none" placeholder="Ex: Predio so aceita obras das 9h as 17h. Existem moveis pesados na sala..." />
            </InputGroup>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mt-8">
              <SectionTitle title="13. Confirmacao Final" />
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.confirmacaoInformacoes} onChange={(e) => updateField('confirmacaoInformacoes', e.target.checked)} className="accent-[#9A077B] w-5 h-5 mt-0.5" />
                  <span className="text-sm font-medium text-slate-700">Confirmo que as informacoes detalhadas acima sao verdadeiras e podem ser usadas para dimensionar o orcamento.</span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.autorizacaoContato} onChange={(e) => updateField('autorizacaoContato', e.target.checked)} className="accent-[#9A077B] w-5 h-5 mt-0.5" />
                  <span className="text-sm font-medium text-slate-700">Autorizo o uso destes dados para contato posterior via WhatsApp ou ligacao.</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end space-x-4">
          <button onClick={handleClose} disabled={isSubmitting} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={() => void handleSubmit()} disabled={isSubmitting} className="px-8 py-3 rounded-xl font-black bg-[#9A077B] hover:bg-[#7F0665] text-white shadow-lg shadow-[#EFC6E3] transition uppercase tracking-widest flex items-center disabled:opacity-70 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <CheckCircle2 size={18} className="mr-2" />}
            {isSubmitting ? 'Salvando...' : 'Gerar Orcamento'}
          </button>
        </div>
      </div>
    </div>
  );
};
