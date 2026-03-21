import React, { useState } from 'react';
import { X, Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ObraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
    {children}
  </div>
);

export const ObraModal: React.FC<ObraModalProps> = ({ isOpen, onClose }) => {
  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [tipoImovel, setTipoImovel] = useState('');
  const [tipoPintura, setTipoPintura] = useState('');
  const [status, setStatus] = useState('CONCLUÍDO');
  
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!titulo || !local || !tipoImovel || !tipoPintura) {
      setError('Por favor, preencha todos os campos obrigatórios (Título, Local e Tipos).');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Você precisa estar logado para salvar uma obra.');
      }

      let imagem_url = null;
      let video_url = null;

      // Fazer upload dos arquivos
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const isVideo = file.type.startsWith('video/');
        // Cria a pasta automaticamente baseada no caminho
        const filePath = isVideo ? `videos/${user.id}/${fileName}` : `fotos/${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('portfolio-obras')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-obras')
          .getPublicUrl(filePath);

        // Pega apenas a primeira imagem e o primeiro vídeo para exibir na vitrine principal (MVP)
        if (isVideo && !video_url) {
          video_url = publicUrl;
        } else if (!isVideo && !imagem_url) {
          imagem_url = publicUrl;
        }
      }

      // Salvar no Banco de Dados
      const { error: dbError } = await supabase
        .from('obras')
        .insert({
          pintor_id: user.id,
          titulo,
          local,
          tipo_imovel: tipoImovel,
          tipo_pintura: tipoPintura,
          status,
          imagem_url,
          video_url
        });

      if (dbError) throw dbError;

      alert('Obra salva com sucesso no banco de dados!');
      
      // Limpar form
      setTitulo(''); setLocal(''); setTipoImovel(''); setTipoPintura(''); setFiles([]);
      onClose();
      
      // Um pequeno truque para recarregar a página ou notificar o componente pai (MVP)
      window.location.reload(); 

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao salvar a obra. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#000747] to-[#9A077B] p-6 text-white flex justify-between items-center z-10 shadow-md">
          <div>
            <h2 className="text-xl font-black tracking-wide">Adicionar Nova Obra</h2>
            <p className="text-white/80 text-sm font-medium">Mostre seu trabalho no portfólio</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-white/20 rounded-full transition disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
          <form className="space-y-5" onSubmit={handleSubmit} id="obraForm">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center text-sm font-bold">
                <AlertCircle size={18} className="mr-2" />
                {error}
              </div>
            )}

            <InputGroup label="Título da Obra">
              <input 
                type="text" 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700 font-medium" 
                placeholder="Ex: Pintura Fachada Residencial" 
                disabled={isSubmitting}
              />
            </InputGroup>

            <InputGroup label="Local ou Cidade">
              <input 
                type="text" 
                value={local}
                onChange={e => setLocal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700 font-medium" 
                placeholder="Ex: Condomínio Alphaville • São Paulo" 
                disabled={isSubmitting}
              />
            </InputGroup>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Tipo de Imóvel">
                <select 
                  value={tipoImovel}
                  onChange={e => setTipoImovel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] text-slate-700 font-medium"
                  disabled={isSubmitting}
                >
                  <option value="">Selecione...</option>
                  {['Residencial', 'Comercial', 'Industrial'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </InputGroup>

              <InputGroup label="Tipo de Pintura">
                <select 
                  value={tipoPintura}
                  onChange={e => setTipoPintura(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] text-slate-700 font-medium"
                  disabled={isSubmitting}
                >
                  <option value="">Selecione...</option>
                  {['Textura', 'Acrílica', 'Verniz', 'Epóxi', 'Massa Corrida'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </InputGroup>
            </div>

            <InputGroup label="Status">
              <div className="flex gap-4">
                {['CONCLUÍDO', 'EM ANDAMENTO'].map(s => (
                  <label key={s} className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
                    <input 
                      type="radio" 
                      name="status" 
                      value={s} 
                      checked={status === s}
                      onChange={() => setStatus(s)}
                      className="accent-[#9A077B]" 
                      disabled={isSubmitting}
                    />
                    <span className="text-sm font-bold text-slate-700">{s}</span>
                  </label>
                ))}
              </div>
            </InputGroup>

            <InputGroup label="Fotos e Vídeos">
              <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer relative">
                {isSubmitting ? (
                   <Loader2 size={32} className="text-[#9A077B] animate-spin mb-2" />
                ) : (
                   <Camera size={32} className="text-slate-400 mb-2" />
                )}
                <p className="font-bold text-slate-600">Clique para selecionar os arquivos</p>
                <p className="text-xs text-slate-400 mt-1">Imagens atraentes trazem mais clientes para seu perfil</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={e => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                  disabled={isSubmitting}
                />
                {files.length > 0 && (
                  <div className="absolute top-4 right-4 bg-[#9A077B] text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                    {files.length} arquivo(s)
                  </div>
                )}
              </label>
            </InputGroup>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-4 shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="obraForm"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl font-black bg-[#9A077B] hover:bg-[#7F0665] text-white shadow-lg shadow-[#EFC6E3] transition uppercase tracking-widest flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><CheckCircle2 size={18} className="mr-2" /> Salvar Obra</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
