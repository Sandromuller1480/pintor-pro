import React, { useEffect } from 'react';
import { Logo } from '../Logo';
import { LegalSection } from '../../lib/legalContent';
import { PINTOR_PRO_LEGAL_CONFIG } from '../../lib/legalConfig';

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
  children?: React.ReactNode;
}

export const LegalVersionBadge: React.FC = () => (
  <span className="inline-flex rounded-full border border-[#9A077B]/20 bg-[#FDF3FA] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#9A077B]">
    Versao {PINTOR_PRO_LEGAL_CONFIG.legalVersion} - {PINTOR_PRO_LEGAL_CONFIG.documentsLastUpdatedAt}
  </span>
);

export const LegalTableOfContents: React.FC<{ sections: LegalSection[] }> = ({ sections }) => (
  <nav className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 lg:block">
    <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Sumario</p>
    <div className="space-y-2">
      {sections.map((section) => (
        <a key={section.id} href={`#${section.id}`} className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-[#FDF3FA] hover:text-[#9A077B]">
          {section.title}
        </a>
      ))}
    </div>
  </nav>
);

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ eyebrow, title, description, sections, children }) => {
  useEffect(() => {
    document.title = `${title} | Pintor Pro`;
    const metaDescription = document.querySelector('meta[name="description"]');
    metaDescription?.setAttribute('content', description);
  }, [description, title]);

  return (
  <div className="min-h-screen bg-slate-50">
    <section className="border-b border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Logo className="mb-8 h-14" color="#000747" />
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9A077B]">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-[#000747] sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-slate-500">{description}</p>
        <div className="mt-6">
          <LegalVersionBadge />
        </div>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
      <LegalTableOfContents sections={sections} />
      <div className="space-y-6">
        {children}
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-[#000747]">{section.title}</h2>
            <div className="mt-4 space-y-3 text-base font-medium leading-relaxed text-slate-600">
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {section.bullets && (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold leading-relaxed text-slate-600">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  </div>
  );
};
