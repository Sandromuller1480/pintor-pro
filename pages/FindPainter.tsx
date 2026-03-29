import React, { useEffect, useMemo, useState } from 'react';
import { PainterCard } from '../components/PainterCard';
import { Search, MapPin, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { NavigateToPage, Page, Painter } from '../types';
import { paintersService } from '../lib/services/paintersService';

interface FindPainterProps {
  setPage: NavigateToPage;
}

const normalizeText = (value: string) => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const matchesNormalizedTerm = (source: string, query: string) => {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  const normalizedSource = normalizeText(source);

  if (normalizedSource.includes(normalizedQuery)) {
    return true;
  }

  return normalizedQuery
    .split(' ')
    .every((term) => normalizedSource.includes(term));
};

export const FindPainter: React.FC<FindPainterProps> = ({ setPage }) => {
  const [searchDraft, setSearchDraft] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedLocationTerm, setAppliedLocationTerm] = useState('');
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyTopRated, setOnlyTopRated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPainters() {
      setLoading(true);
      setErrorMessage('');

      try {
        const data = await paintersService.getAll();

        if (!isMounted) return;

        setPainters(data);
      } catch (error) {
        console.error('Erro ao carregar vitrine de pintores:', error);
        if (!isMounted) return;
        setPainters([]);
        setErrorMessage('Nao foi possivel carregar os pintores agora.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPainters();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableSpecialties = useMemo(() => {
    return Array.from(
      new Set<string>(
        painters.flatMap((painter) => painter.specialties ?? [])
      )
    )
      .sort((firstItem, secondItem) => firstItem.localeCompare(secondItem, 'pt-BR'))
      .slice(0, 10);
  }, [painters]);

  const filteredPainters = useMemo(() => {
    const normalizedSearchTerm = normalizeText(appliedSearchTerm);
    const normalizedLocationTerm = normalizeText(appliedLocationTerm);

    return painters.filter((painter) => {
      const painterSearchIndex = [
        painter.name,
        painter.description,
        painter.location,
        ...(painter.specialties ?? [])
      ].join(' ');

      const matchesSearch = !normalizedSearchTerm || matchesNormalizedTerm(painterSearchIndex, normalizedSearchTerm);

      const matchesLocation = !normalizedLocationTerm || matchesNormalizedTerm(painter.location, normalizedLocationTerm);

      const matchesSpecialties = selectedSpecialties.length === 0 ||
        selectedSpecialties.every((specialty) => (
          painter.specialties.some((painterSpecialty) => normalizeText(painterSpecialty) === normalizeText(specialty))
        ));

      const matchesVerified = !onlyVerified || painter.verified;
      const matchesTopRated = !onlyTopRated || painter.topRated;

      return matchesSearch && matchesLocation && matchesSpecialties && matchesVerified && matchesTopRated;
    });
  }, [appliedLocationTerm, appliedSearchTerm, onlyTopRated, onlyVerified, painters, selectedSpecialties]);

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setAppliedSearchTerm(searchDraft);
    setAppliedLocationTerm(locationDraft);
  };

  const clearFilters = () => {
    setSearchDraft('');
    setLocationDraft('');
    setAppliedSearchTerm('');
    setAppliedLocationTerm('');
    setSelectedSpecialties([]);
    setOnlyVerified(false);
    setOnlyTopRated(false);
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((currentSpecialties) =>
      currentSpecialties.includes(specialty)
        ? currentSpecialties.filter((item) => item !== specialty)
        : [...currentSpecialties, specialty]
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 mb-12">
          <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={handleSearchSubmit}>
            <div className="md:col-span-5 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Qual tipo de pintura voce precisa?"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#9A077B] focus:border-transparent outline-none transition font-medium"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
            </div>
            <div className="md:col-span-4 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cidade ou regiao"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#9A077B] focus:border-transparent outline-none transition font-medium"
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-[#9A077B] text-white py-4 rounded-2xl font-bold hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3]"
              >
                Buscar Pintores
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center"><SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros</h3>
                <button className="text-xs text-[#9A077B] font-bold hover:underline" onClick={clearFilters}>Limpar</button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Especialidade</h4>
                  <div className="space-y-2">
                    {availableSpecialties.length > 0 ? availableSpecialties.map((specialty) => (
                      <label key={specialty} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedSpecialties.includes(specialty)}
                          onChange={() => toggleSpecialty(specialty)}
                          className="w-4 h-4 min-w-4 min-h-4 shrink-0 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-[#000747] transition">{specialty}</span>
                      </label>
                    )) : (
                      <p className="text-sm text-slate-400">Nenhuma especialidade disponivel.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Selo de Confianca</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={onlyVerified}
                        onChange={(e) => setOnlyVerified(e.target.checked)}
                        className="w-4 h-4 min-w-4 min-h-4 shrink-0 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]"
                      />
                      <span className="text-sm text-slate-600 group-hover:text-[#000747] transition">Verificado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={onlyTopRated}
                        onChange={(e) => setOnlyTopRated(e.target.checked)}
                        className="w-4 h-4 min-w-4 min-h-4 shrink-0 rounded border-slate-300 text-[#9A077B] focus:ring-[#9A077B]"
                      />
                      <span className="text-sm text-slate-600 group-hover:text-[#000747] transition">Top Avaliado</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#9A077B] rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold mb-2">Quer aparecer aqui?</h4>
                <p className="text-xs text-[#F7E3F1] mb-4 leading-relaxed">Profissionais aprovados aparecem na vitrine da PINTOR PRO e recebem contatos mais qualificados.</p>
                <button onClick={() => setPage(Page.Register)} className="w-full bg-white text-[#9A077B] py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition">
                  Cadastrar Perfil
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-500 font-medium">{filteredPainters.length} pintores encontrados</p>
              <div className="flex items-center gap-2 text-sm font-bold cursor-default text-slate-500">
                <span>Ordenar por: <span className="text-[#9A077B]">Mais recentes</span></span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                <div className="col-span-full py-20 text-center font-black text-slate-300 uppercase tracking-widest">Carregando pintores...</div>
              ) : filteredPainters.length > 0 ? (
                filteredPainters.map((painter) => (
                  <PainterCard key={painter.id} painter={painter} onClick={(id) => setPage(Page.PainterProfile, { painterId: id })} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium">Nenhum pintor encontrado com os filtros atuais.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
