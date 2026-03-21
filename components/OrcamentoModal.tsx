import React, { useState } from 'react';
import { X, Plus, Trash2, Camera, CheckCircle2 } from 'lucide-react';

interface OrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Ambiente = { id: string, nome: string, area: string, peDireito: string, superficie: string };

export const OrcamentoModal: React.FC<OrcamentoModalProps> = ({ isOpen, onClose }) => {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([
    { id: Date.now().toString(), nome: '', area: '', peDireito: 'Padrão', superficie: '' }
  ]);
  
  const [prepServicos, setPrepServicos] = useState<string[]>([]);
  const [compNecessidade, setCompNecessidade] = useState<string[]>([]);
  const [servicosExtras, setServicosExtras] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddAmbiente = () => {
    setAmbientes([...ambientes, { id: Date.now().toString(), nome: '', area: '', peDireito: 'Padrão', superficie: '' }]);
  };

  const handleRemoveAmbiente = (id: string) => {
    setAmbientes(ambientes.filter(a => a.id !== id));
  };

  const updateAmbiente = (id: string, field: keyof Ambiente, value: string) => {
    setAmbientes(ambientes.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[], item: string) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#000747] to-[#9A077B] p-6 text-white flex justify-between items-center z-10 shadow-md">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-black tracking-wide">Formulário Profissional de Orçamento</h2>
              <p className="text-white/80 text-sm font-medium">Pintura Imobiliária - Cadastro Detalhado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
          <form className="space-y-6">

            {/* 1. Dados do Cliente */}
            <SectionTitle title="1. Dados do Cliente" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Nome completo"><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="Nome do cliente" /></InputGroup>
              <InputGroup label="CPF / CNPJ"><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="000.000.000-00" /></InputGroup>
              <InputGroup label="Telefone (WhatsApp)"><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="(00) 00000-0000" /></InputGroup>
              <InputGroup label="E-mail"><input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="cliente@email.com" /></InputGroup>
              
              <InputGroup label="Tipo de cliente">
                <div className="flex flex-wrap gap-3 mt-2">
                  {['Pessoa física', 'Empresa', 'Imobiliária'].map(t => (
                    <label key={t} className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                      <input type="radio" name="clienteTipo" value={t} className="accent-[#9A077B]" />
                      <span className="text-sm font-medium text-slate-700">{t}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
            </div>

            {/* 2. Dados do Imóvel */}
            <SectionTitle title="2. Dados do Imóvel" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <InputGroup label="Endereço completo"><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="Rua, Número, Bairro" /></InputGroup>
              </div>
              <InputGroup label="Cidade / Estado"><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700" placeholder="Sua Cidade - UF" /></InputGroup>
              
              <InputGroup label="Tipo de imóvel">
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#9A077B] text-slate-700">
                  {['Casa', 'Apartamento', 'Comercial', 'Industrial', 'Rural'].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </InputGroup>
              
              <InputGroup label="Situação">
                <div className="flex flex-wrap gap-4 mt-2">
                  {['Novo', 'Usado', 'Reforma'].map(t => (
                    <label key={t} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="imovelSit" value={t} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{t}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
              
              <InputGroup label="Imóvel está:">
                <div className="flex flex-wrap gap-4 mt-2">
                  {['Vazio', 'Mobiliado', 'Em uso'].map(t => (
                    <label key={t} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="imovelStatus" value={t} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{t}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
            </div>

            {/* 3. Detalhamento das Áreas */}
            <SectionTitle title="3. Detalhamento das Áreas" />
            <div className="space-y-4">
              {ambientes.map((amb, index) => (
                <div key={amb.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl relative">
                  <h4 className="font-bold text-[#000747] mb-4 flex items-center justify-between">
                    Ambiente {index + 1}
                    {ambientes.length > 1 && (
                      <button type="button" onClick={() => handleRemoveAmbiente(amb.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center">
                        <Trash2 size={16} className="mr-1" /> Remover
                      </button>
                    )}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputGroup label="Nome do ambiente"><input type="text" placeholder="Ex: Sala" className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={amb.nome} onChange={e => updateAmbiente(amb.id, 'nome', e.target.value)} /></InputGroup>
                    <InputGroup label="Área (m²)"><input type="text" placeholder="Ex: 25" className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={amb.area} onChange={e => updateAmbiente(amb.id, 'area', e.target.value)} /></InputGroup>
                    <InputGroup label="Pé direito">
                      <select className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={amb.peDireito} onChange={e => updateAmbiente(amb.id, 'peDireito', e.target.value)}>
                         <option>Padrão</option>
                         <option>Alto</option>
                      </select>
                    </InputGroup>
                    <InputGroup label="Superfície">
                      <select className="w-full border rounded-lg px-3 py-2 text-sm outline-[#9A077B]" value={amb.superficie} onChange={e => updateAmbiente(amb.id, 'superficie', e.target.value)}>
                         <option value="">Selecione...</option>
                         {['Reboco', 'Gesso', 'Drywall', 'Madeira', 'Metal'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </InputGroup>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddAmbiente} className="flex items-center text-[#9A077B] font-bold text-sm bg-[#9A077B]/10 px-4 py-2 rounded-xl hover:bg-[#9A077B]/20 transition">
                <Plus size={16} className="mr-1" /> Adicionar Ambiente
              </button>
            </div>

            {/* 4. Tipo de Pintura */}
            <SectionTitle title="4. Tipo de Pintura" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputGroup label="Tipo de serviço">
                {['Pintura interna', 'Pintura externa', 'Ambas'].map(t => (
                  <label key={t} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="pinturaServ" value={t} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Tipo de acabamento">
                 {['Fosco', 'Semi-brilho', 'Acetinado', 'Brilhante'].map(t => (
                  <label key={t} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="pinturaAcabamento" value={t} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Tipo de tinta">
                 {['Acrílica', 'Látex', 'Epóxi', 'Esmalte', 'Emborrachada', 'A definir'].map(t => (
                  <label key={t} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="pinturaTinta" value={t} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </InputGroup>
            </div>

            {/* 5. Preparação da Superfície */}
            <SectionTitle title="5. Preparação da Superfície" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InputGroup label="Situação atual da parede">
                 <div className="flex flex-wrap gap-2 mt-2">
                  {['Nova', 'Boa', 'Com rachaduras', 'Com infiltração', 'Descascando'].map(t => (
                    <label key={t} className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-2 border rounded-lg">
                      <input type="radio" name="prepSit" value={t} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{t}</span>
                    </label>
                  ))}
                 </div>
               </InputGroup>
               <InputGroup label="Serviços necessários (Múltipla escolha)">
                 <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Lixamento', 'Massa corrida', 'Massa acrílica', 'Selador', 'Fundo preparador', 'Tratamento de mofo', 'Correção de fissuras'].map(t => (
                    <label key={t} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" onChange={() => toggleArrayItem(setPrepServicos, prepServicos, t)} className="accent-[#9A077B] w-4 h-4 rounded" />
                      <span className="text-sm text-slate-700">{t}</span>
                    </label>
                  ))}
                 </div>
               </InputGroup>
            </div>

            {/* 6. Complexidade do Serviço */}
            <SectionTitle title="6. Complexidade do Serviço" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputGroup label="Altura do trabalho">
                {['Até 3m', '3m a 6m', 'Acima de 6m'].map(t => (
                  <label key={t} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="compAlt" value={t} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Necessidade de">
                 {['Andaime', 'Escada', 'Plataforma elevatória'].map(t => (
                  <label key={t} className="flex items-center space-x-2 cursor-pointer mt-2">
                    <input type="checkbox" onChange={() => toggleArrayItem(setCompNecessidade, compNecessidade, t)} className="accent-[#9A077B] w-4 h-4 rounded" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </InputGroup>
              <InputGroup label="Acesso ao local">
                 {['Fácil', 'Médio', 'Difícil'].map(t => (
                  <label key={t} className="flex items-center space-x-2 cursor-pointer mt-2 bg-slate-50 px-3 py-2 border rounded-lg">
                    <input type="radio" name="compAce" value={t} className="accent-[#9A077B]" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </InputGroup>
            </div>

            {/* 7. Serviços Extras */}
            <SectionTitle title="7. Serviços Extras" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Proteção de móveis', 'Proteção de piso', 'Limpeza pós-obra', 'Remoção de tinta antiga', 'Aplicação de textura', 'Grafiato', 'Efeito decorativo'].map(t => (
                <label key={t} className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-50 border rounded-xl hover:bg-slate-100 transition">
                  <input type="checkbox" onChange={() => toggleArrayItem(setServicosExtras, servicosExtras, t)} className="accent-[#9A077B] w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700 leading-tight">{t}</span>
                </label>
              ))}
            </div>

            {/* 8. Cores e Personalização */}
            <SectionTitle title="8. Cores e Personalização" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <InputGroup label="Já possui cores definidas?">
                 <div className="flex gap-4 mt-2">
                  {['Sim', 'Não'].map(t => (
                    <label key={t} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="corDef" value={t} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{t}</span>
                    </label>
                  ))}
                 </div>
               </InputGroup>
               <InputGroup label="Quantidade de cores">
                  <select className="w-full border bg-slate-50 rounded-lg px-3 py-2 outline-[#9A077B] mt-2">
                    {['1', '2–3', '4+'].map(opt => <option key={opt}>{opt}</option>)}
                  </select>
               </InputGroup>
               <InputGroup label="Deseja consultoria de cores?">
                 <div className="flex gap-4 mt-2">
                  {['Sim', 'Não'].map(t => (
                    <label key={t} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="corConsul" value={t} className="accent-[#9A077B]" />
                      <span className="text-sm text-slate-700">{t}</span>
                    </label>
                  ))}
                 </div>
               </InputGroup>
            </div>

            {/* 9 & 10. Prazo & Fornecimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <SectionTitle title="9. Prazo e Urgência" />
                <InputGroup label="Data ideal de início"><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-[#9A077B]" /></InputGroup>
                <InputGroup label="Prazo estimado na cabeça do cliente"><input type="text" placeholder="Ex: 1 semana, 15 dias" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-[#9A077B]" /></InputGroup>
                <InputGroup label="Urgência">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Normal', 'Urgente', 'Muito urgente'].map(t => (
                      <label key={t} className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-2 border rounded-lg">
                        <input type="radio" name="urgencia" value={t} className="accent-[#9A077B]" />
                        <span className="text-sm text-slate-700">{t}</span>
                      </label>
                    ))}
                  </div>
                </InputGroup>
              </div>
              <div>
                <SectionTitle title="10. Fornecimento" />
                <InputGroup label="Materiais serão:">
                  <div className="flex flex-col gap-3 mt-2">
                    {['Fornecidos pelo cliente', 'Fornecidos pelo profissional', 'A combinar'].map(t => (
                      <label key={t} className="flex items-center space-x-3 cursor-pointer bg-slate-50 px-4 py-3 border rounded-xl hover:bg-slate-100 transition">
                        <input type="radio" name="fornec" value={t} className="accent-[#9A077B] w-4 h-4" />
                        <span className="text-sm font-bold text-slate-700">{t}</span>
                      </label>
                    ))}
                  </div>
                </InputGroup>
              </div>
            </div>

            {/* 11. Imagens e 12. Observações */}
            <SectionTitle title="11. Imagens do Local (Opcionais)" />
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
               <Camera size={32} className="text-slate-400 mb-2" />
               <p className="font-bold text-slate-600">Clique para adicionar Fotos ou Vídeos do local</p>
               <p className="text-xs text-slate-400 mt-1">Imagens ajudam a dar orçamentos mais precisos</p>
               <input type="file" multiple className="hidden" />
            </div>

            <SectionTitle title="12. Observações" />
            <InputGroup label="Detalhes adicionais ou restrições">
              <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-[#9A077B] transition text-slate-700 resize-none" placeholder="Ex: Prédio só aceita obras das 9h as 17h. Existem móveis pesados na sala..."></textarea>
            </InputGroup>

            {/* 13. Confirmação */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mt-8">
               <SectionTitle title="13. Confirmação Final" />
               <div className="space-y-4">
                 <label className="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" className="accent-[#9A077B] w-5 h-5 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">Confirmo que as informações detalhadas acima são verdadeiras e podem ser usadas para dimensionar o orçamento.</span>
                 </label>
                 <label className="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" className="accent-[#9A077B] w-5 h-5 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">Autorizo o uso destes dados para formulação comercial e contato posterior (WhatsApp/Call).</span>
                 </label>
               </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end space-x-4">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">
            Cancelar
          </button>
          <button onClick={() => alert('Orçamento salvo com sucesso!')} className="px-8 py-3 rounded-xl font-black bg-[#9A077B] hover:bg-[#7F0665] text-white shadow-lg shadow-[#EFC6E3] transition uppercase tracking-widest flex items-center">
            <CheckCircle2 size={18} className="mr-2" />
            Gerar Orçamento
          </button>
        </div>

      </div>
    </div>
  );
};
