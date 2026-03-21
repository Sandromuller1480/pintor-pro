import React, { useState } from 'react';
import { X, Camera, CheckCircle2 } from 'lucide-react';

interface ObraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ObraModal: React.FC<ObraModalProps> = ({ isOpen, onClose }) => {
  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [tipoImovel, setTipoImovel] = useState('');
  const [tipoPintura, setTipoPintura] = useState('');
  const [status, setStatus] = useState('CONCLUÍDO');

  if (!isOpen) return null;

  const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#000747] to-[#9A077B] p-6 text-white flex justify-between items-center z-10 shadow-md">
          <div>
            <h2 className="text-xl font-black tracking-wide">Adicionar Nova Obra</h2>
            <p className="text-white/80 text-sm font-medium">Mostre seu trabalho no portfólio</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form className="space-y-6">
            
            <InputGroup label="Título da Obra">
              <input 
                type="text" 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" 
                placeholder="Ex: Pintura Fachada Residencial" 
              />
            </InputGroup>

            <InputGroup label="Local ou Cidade">
              <input 
                type="text" 
                value={local}
                onChange={e => setLocal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" 
                placeholder="Ex: Condomínio Alphaville • São Paulo" 
              />
            </InputGroup>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Tipo de Imóvel">
                <select 
                  value={tipoImovel}
                  onChange={e => setTipoImovel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] text-slate-700"
                >
                  <option value="">Selecione...</option>
                  {['Residencial', 'Comercial', 'Industrial'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </InputGroup>

              <InputGroup label="Tipo de Pintura">
                <select 
                  value={tipoPintura}
                  onChange={e => setTipoPintura(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] text-slate-700"
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
                    />
                    <span className="text-sm font-bold text-slate-700">{s}</span>
                  </label>
                ))}
              </div>
            </InputGroup>

            <InputGroup label="Fotos e Vídeos">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <Camera size={32} className="text-slate-400 mb-2" />
                <p className="font-bold text-slate-600">Clique para selecionar os arquivos</p>
                <p className="text-xs text-slate-400 mt-1">Imagens atraentes trazem mais clientes para seu perfil</p>
                <input type="file" multiple accept="image/*,video/*" className="hidden" />
              </div>
            </InputGroup>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-4 shrink-0">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition">
            Cancelar
          </button>
          <button onClick={() => alert('Obra adicionada com sucesso no portfólio (MVP)!')} className="px-8 py-3 rounded-xl font-black bg-[#9A077B] hover:bg-[#7F0665] text-white shadow-lg shadow-[#EFC6E3] transition uppercase tracking-widest flex items-center">
            <CheckCircle2 size={18} className="mr-2" />
            Salvar Obra
          </button>
        </div>

      </div>
    </div>
  );
};
