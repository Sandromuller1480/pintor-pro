
import React, { useEffect, useState } from 'react';
import { PainterCard } from '../components/PainterCard';
import { Search, MapPin, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { NavigateToPage, Page, Painter } from '../types';
import { paintersService } from '../lib/paintersService';

interface FindPainterProps {
  setPage: NavigateToPage;
}

export const FindPainter: React.FC<FindPainterProps> = ({ setPage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPainters() {
      setLoading(true);
      const data = await paintersService.getAll();
      setPainters(data);
      setLoading(false);
    }
    loadPainters();
  }, []);

  const filteredPainters = painters.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Área de Busca do Cabeçalho */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Qual tipo de pintura você precisa?"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:col-span-4 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cidade ou CEP"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition font-medium"
              />
            </div>
            <div className="md:col-span-3">
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                Buscar Pintores
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Barra Lateral de Filtros */}
          <aside className="lg:w-72 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center"><SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros</h3>
                <button className="text-xs text-blue-600 font-bold hover:underline" onClick={() => setSearchTerm('')}>Limpar</button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Especialidade</h4>
                  <div className="space-y-2">
                    {['Laca', 'Cimento Queimado', 'Airless', 'Epóxi', 'Fachadas', 'Residencial'].map(s => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                        <span className="text-sm text-slate-600 group-hover:text-black transition">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Selo de Confiança</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                      <span className="text-sm text-slate-600 group-hover:text-black transition">Verificado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                      <span className="text-sm text-slate-600 group-hover:text-black transition">Top Avaliado</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Avaliação Mínima</h4>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold hover:border-blue-600 hover:text-blue-600 transition">
                        {n}+
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold mb-2">Quer aparecer aqui?</h4>
                <p className="text-xs text-blue-100 mb-4 leading-relaxed">Milhares de clientes buscam pintores qualificados todos os dias.</p>
                <button onClick={() => setPage(Page.Register)} className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition">
                  Cadastrar Perfil
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
            </div>
          </aside>

          {/* Lista de Resultados */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-500 font-medium">{filteredPainters.length} pintores encontrados</p>
              <div className="flex items-center gap-2 text-sm font-bold cursor-pointer hover:text-blue-600 transition">
                <span>Ordenar por: <span className="text-blue-600">Relevância</span></span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                <div className="col-span-full py-20 text-center font-black text-slate-300 uppercase tracking-widest">Carregando Elite...</div>
              ) : filteredPainters.length > 0 ? (
                filteredPainters.map(painter => (
                  <PainterCard key={painter.id} painter={painter} onClick={(id) => setPage(Page.PainterProfile, { painterId: id })} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium">Nenhum pintor encontrado com esse termo.</div>
              )}
            </div>

            {/* Paginação */}
            <div className="mt-12 flex justify-center gap-2">
              <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 hover:border-blue-600 hover:text-blue-600 transition">1</button>
              <button className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-200">2</button>
              <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 hover:border-blue-600 hover:text-blue-600 transition">3</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
