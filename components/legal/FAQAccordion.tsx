import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { FAQItem } from '../../lib/legalContent';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const FAQSearch: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <label className="relative block">
    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Pesquisar ajuda, assinatura, privacidade..."
      className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#9A077B] focus:ring-4 focus:ring-[#FDF3FA]"
    />
  </label>
);

export const FAQAccordion: React.FC<{ items: FAQItem[] }> = ({ items }) => {
  const [query, setQuery] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const groupedItems = useMemo<Record<string, FAQItem[]>>(() => {
    const normalizedQuery = normalize(query.trim());
    const filteredItems = normalizedQuery
      ? items.filter((item) => normalize(`${item.category} ${item.question} ${item.answer}`).includes(normalizedQuery))
      : items;

    return filteredItems.reduce((groups: Record<string, FAQItem[]>, item) => {
      groups[item.category] = [...(groups[item.category] || []), item];
      return groups;
    }, {});
  }, [items, query]);

  return (
    <div className="space-y-8">
      <FAQSearch value={query} onChange={setQuery} />
      {Object.keys(groupedItems).map((category) => {
        const categoryItems = groupedItems[category];

        return (
        <section key={category} className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9A077B]">{category}</p>
          <div className="mt-4 divide-y divide-slate-100">
            {categoryItems.map((item) => {
              const isOpen = activeQuestion === item.question;
              return (
                <article key={item.question}>
                  <button
                    type="button"
                    onClick={() => setActiveQuestion(isOpen ? null : item.question)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-black text-[#000747]">{item.question}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180 text-[#9A077B]' : ''}`} />
                  </button>
                  {isOpen && <p className="pb-5 text-sm font-medium leading-relaxed text-slate-600">{item.answer}</p>}
                </article>
              );
            })}
          </div>
        </section>
        );
      })}
      {Object.keys(groupedItems).length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-bold text-slate-500">Nenhuma pergunta encontrada para sua busca.</p>
        </div>
      )}
    </div>
  );
};
