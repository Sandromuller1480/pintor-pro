import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  User,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CurrentClientProfile } from '../lib/services/clientSignupService';

type ScheduleVisitModalProps = {
  isOpen: boolean;
  painterId: string | null;
  painterName: string;
  painterLocation?: string;
  currentClientProfile?: CurrentClientProfile | null;
  onClose: () => void;
};

type FormData = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  preferredDate: string;
  preferredTime: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
  notes: string;
};

const INITIAL_FORM_DATA: FormData = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  preferredDate: '',
  preferredTime: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  reference: '',
  notes: ''
};

const buildInitialFormData = (currentClientProfile?: CurrentClientProfile | null): FormData => ({
  clientName: currentClientProfile?.fullName ?? '',
  clientPhone: currentClientProfile?.phone ?? '',
  clientEmail: currentClientProfile?.email ?? '',
  preferredDate: '',
  preferredTime: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  reference: '',
  notes: ''
});

type CitySuggestion = {
  city: string;
  uf: string;
};

type ViaCepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

type ViaCepStreetSuggestion = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
};

const municipalityCache = new Map<string, Promise<CitySuggestion[]>>();
let allMunicipalitiesPromise: Promise<CitySuggestion[]> | null = null;

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

const formatCep = (value: string) => {
  const digits = normalizeDigits(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const fetchCitiesByUf = async (uf: string) => {
  const normalizedUf = uf.trim().toUpperCase();

  if (!normalizedUf || normalizedUf.length !== 2) {
    return [];
  }

  if (!municipalityCache.has(normalizedUf)) {
    municipalityCache.set(
      normalizedUf,
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalizedUf}/municipios?orderBy=nome`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Nao foi possivel carregar as cidades.');
          }

          const data = await response.json() as Array<{ nome: string }>;
          return data.map((item) => ({
            city: item.nome,
            uf: normalizedUf
          }));
        })
    );
  }

  return municipalityCache.get(normalizedUf)!;
};

const fetchAllCities = async () => {
  if (!allMunicipalitiesPromise) {
    allMunicipalitiesPromise = fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Nao foi possivel carregar a base nacional de cidades.');
        }

        const data = await response.json() as Array<{
          nome: string;
          microrregiao?: {
            mesorregiao?: {
              UF?: {
                sigla?: string;
              };
            };
          };
        }>;

        return data
          .map((item) => ({
            city: item.nome,
            uf: item.microrregiao?.mesorregiao?.UF?.sigla?.toUpperCase() ?? ''
          }))
          .filter((item) => item.city && item.uf);
      });
  }

  return allMunicipalitiesPromise;
};

const fetchCepAddress = async (cep: string) => {
  const normalizedCep = normalizeDigits(cep);

  if (normalizedCep.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`);

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o CEP informado.');
  }

  const data = await response.json() as ViaCepAddress;

  if (data.erro) {
    return null;
  }

  return data;
};

const fetchStreetSuggestions = async (uf: string, city: string, street: string) => {
  const normalizedUf = uf.trim().toUpperCase();
  const normalizedCity = city.trim();
  const normalizedStreet = street.trim();

  if (normalizedUf.length !== 2 || normalizedCity.length < 2 || normalizedStreet.length < 3) {
    return [];
  }

  const response = await fetch(
    `https://viacep.com.br/ws/${encodeURIComponent(normalizedUf)}/${encodeURIComponent(normalizedCity)}/${encodeURIComponent(normalizedStreet)}/json/`
  );

  if (!response.ok) {
    throw new Error('Nao foi possivel buscar sugestoes de endereco.');
  }

  const data = await response.json() as ViaCepStreetSuggestion[] | { erro?: boolean };

  if (!Array.isArray(data)) {
    return [];
  }

  return data.slice(0, 8);
};

const buildVisitLocation = (formData: FormData) => {
  const streetBlock = [formData.street.trim(), formData.number.trim()].filter(Boolean).join(', ');
  const baseLocation = [streetBlock, formData.neighborhood.trim(), `${formData.city.trim()} - ${formData.state.trim().toUpperCase()}`]
    .filter(Boolean)
    .join(', ');
  const extras = [
    formData.cep.trim() ? `CEP ${formData.cep.trim()}` : '',
    formData.complement.trim() ? `Compl.: ${formData.complement.trim()}` : '',
    formData.reference.trim() ? `Ref.: ${formData.reference.trim()}` : ''
  ].filter(Boolean);

  return [baseLocation, ...extras].filter(Boolean).join(' | ');
};

const parseCityAndState = (value: string) => {
  const match = value.trim().match(/^(.*?)\s*-\s*([A-Za-z]{2})$/);

  if (!match) {
    return null;
  }

  return {
    city: match[1].trim(),
    uf: match[2].trim().toUpperCase()
  };
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeInsertError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Nao foi possivel registrar a solicitacao de visita agora.';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('painter_visit_requests') || normalizedMessage.includes('does not exist')) {
    return 'O recurso de agendamento ainda nao foi configurado no banco. Rode o SQL agendamentos_visitas_schema.sql no Supabase.';
  }

  return message;
};

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  painterId,
  painterName,
  painterLocation,
  currentClientProfile,
  onClose
}) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingStreets, setIsLoadingStreets] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<ViaCepStreetSuggestion[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildInitialFormData(currentClientProfile));
    setErrorMessage('');
    setSuccessMessage('');
    setIsLookingUpCep(false);
    setIsLoadingCities(false);
    setIsLoadingStreets(false);
    setCitySuggestions([]);
    setStreetSuggestions([]);
  }, [currentClientProfile, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const cepDigits = normalizeDigits(formData.cep);

    if (cepDigits.length !== 8) {
      return;
    }

    let cancelled = false;
    setIsLookingUpCep(true);

    void fetchCepAddress(cepDigits)
      .then((address) => {
        if (cancelled || !address) {
          return;
        }

        setFormData((currentData) => ({
          ...currentData,
          cep: formatCep(address.cep || cepDigits),
          street: address.logradouro || currentData.street,
          complement: address.complemento || currentData.complement,
          neighborhood: address.bairro || currentData.neighborhood,
          city: address.localidade || currentData.city,
          state: address.uf || currentData.state
        }));
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Erro ao consultar CEP:', error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLookingUpCep(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [formData.cep, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const cityTerm = formData.city.trim();
    const stateTerm = formData.state.trim().toUpperCase();

    if (cityTerm.length < 2) {
      setCitySuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoadingCities(true);

      const citySourcePromise = stateTerm.length === 2
        ? fetchCitiesByUf(stateTerm)
        : fetchAllCities();

      void citySourcePromise
        .then((cities) => {
          if (cancelled) {
            return;
          }

          const normalizedSearch = cityTerm.toLowerCase();
          setCitySuggestions(
            cities
              .filter((item) => item.city.toLowerCase().includes(normalizedSearch))
              .slice(0, 8)
          );
        })
        .catch((error) => {
          if (!cancelled) {
            console.error('Erro ao buscar cidades:', error);
            setCitySuggestions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingCities(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [formData.city, formData.state, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const stateTerm = formData.state.trim().toUpperCase();
    const cityTerm = formData.city.trim();
    const streetTerm = formData.street.trim();

    if (stateTerm.length !== 2 || cityTerm.length < 2 || streetTerm.length < 3) {
      setStreetSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoadingStreets(true);

      void fetchStreetSuggestions(stateTerm, cityTerm, streetTerm)
        .then((suggestions) => {
          if (!cancelled) {
            setStreetSuggestions(suggestions);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error('Erro ao buscar logradouros:', error);
            setStreetSuggestions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingStreets(false);
          }
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [formData.city, formData.state, formData.street, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value
    }));
  };

  const handleCityChange = (value: string) => {
    const parsedValue = parseCityAndState(value);

    if (parsedValue) {
      setFormData((currentData) => ({
        ...currentData,
        city: parsedValue.city,
        state: parsedValue.uf
      }));
      return;
    }

    updateField('city', value);
  };

  const handleStreetChange = (value: string) => {
    updateField('street', value);
  };

  const applyStreetSuggestion = (selectedStreet: string) => {
    const matchedSuggestion = streetSuggestions.find((item) => item.logradouro === selectedStreet);

    if (!matchedSuggestion) {
      updateField('street', selectedStreet);
      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      cep: formatCep(matchedSuggestion.cep || currentData.cep),
      street: matchedSuggestion.logradouro || currentData.street,
      neighborhood: matchedSuggestion.bairro || currentData.neighborhood,
      city: matchedSuggestion.localidade || currentData.city,
      state: matchedSuggestion.uf || currentData.state,
      complement: currentData.complement || matchedSuggestion.complemento || ''
    }));
  };

  const cityDatalistId = useMemo(() => `visit-city-suggestions-${painterId ?? 'public'}`, [painterId]);
  const streetDatalistId = useMemo(() => `visit-street-suggestions-${painterId ?? 'public'}`, [painterId]);
  const citySuggestionOptions = useMemo(() => {
    const hasExplicitUf = formData.state.trim().length === 2;

    return citySuggestions.map((item) => ({
      key: `${item.city}-${item.uf}`,
      value: hasExplicitUf ? item.city : `${item.city} - ${item.uf}`
    }));
  }, [citySuggestions, formData.state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!painterId) {
      setErrorMessage('Nao foi possivel identificar o pintor para este agendamento.');
      return;
    }

    if (
      !formData.clientName.trim() ||
      !formData.clientPhone.trim() ||
      !formData.clientEmail.trim() ||
      !formData.preferredDate ||
      !formData.preferredTime ||
      !formData.street.trim() ||
      !formData.neighborhood.trim() ||
      !formData.city.trim() ||
      !formData.state.trim()
    ) {
      setErrorMessage('Preencha nome, telefone, e-mail, data, horario, rua, bairro, cidade e UF da visita.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const composedLocation = buildVisitLocation(formData);

      const { error } = await supabase
        .from('painter_visit_requests')
        .insert({
          application_id: painterId,
          client_name: formData.clientName.trim(),
          client_phone: formData.clientPhone.trim(),
          client_email: formData.clientEmail.trim().toLowerCase(),
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          location: composedLocation,
          notes: formData.notes.trim() || null
        });

      if (error) {
        throw error;
      }

      setSuccessMessage(`Solicitacao de visita enviada para ${painterName}.`);
    } catch (error) {
      console.error('Erro ao solicitar visita:', error);
      setErrorMessage(normalizeInsertError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = Boolean(successMessage);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl my-4 sm:my-6 max-h-[calc(100vh-2rem)] sm:max-h-[85vh] rounded-[32px] bg-white text-slate-900 border border-slate-200 shadow-2xl shadow-slate-950/20 overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#000747]">Agendar Visita</h3>
            <p className="text-sm text-slate-500 font-medium">
              Envie uma solicitacao de visita para {painterName}{painterLocation ? ` em ${painterLocation}` : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 px-5 sm:px-6 py-5 sm:py-6 overflow-y-auto">
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={30} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-3">Solicitacao enviada</h4>
              <p className="text-slate-500 font-medium max-w-lg mx-auto mb-6">
                {successMessage} O pintor podera visualizar esse pedido e retornar a confirmacao pelo painel.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-[#9A077B] text-white font-black shadow-lg shadow-[#EFC6E3] hover:bg-[#7F0665] transition"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(event) => updateField('clientName', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(event) => updateField('clientPhone', event.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(event) => updateField('clientEmail', event.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                    placeholder="voce@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Data desejada
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      min={getTodayDate()}
                      value={formData.preferredDate}
                      onChange={(event) => updateField('preferredDate', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Horario desejado
                  </label>
                  <div className="relative">
                    <Clock3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={formData.preferredTime}
                      onChange={(event) => updateField('preferredTime', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-2 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Endereco da visita
                    </label>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {isLookingUpCep ? 'Buscando CEP...' : isLoadingCities ? 'Buscando cidades...' : isLoadingStreets ? 'Buscando logradouros...' : 'Preenchimento inteligente'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        CEP
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.cep}
                        onChange={(event) => updateField('cep', formatCep(event.target.value))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        UF
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(event) => updateField('state', event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 uppercase outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                        placeholder="MT"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Cidade
                      </label>
                      <input
                        type="text"
                        list={cityDatalistId}
                        value={formData.city}
                        onChange={(event) => handleCityChange(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                        placeholder="Digite a cidade"
                        required
                      />
                      <datalist id={cityDatalistId}>
                        {citySuggestionOptions.map((item) => (
                          <option key={item.key} value={item.value} />
                        ))}
                      </datalist>
                    </div>
                    <div className="md:col-span-4">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Rua / Logradouro
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          list={streetDatalistId}
                          value={formData.street}
                          onChange={(event) => handleStreetChange(event.target.value)}
                          onBlur={(event) => applyStreetSuggestion(event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                          placeholder="Digite a rua e escolha uma sugestao"
                          required
                        />
                        <datalist id={streetDatalistId}>
                          {streetSuggestions.map((item) => (
                            <option key={`${item.cep}-${item.logradouro}`} value={item.logradouro} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Numero
                      </label>
                      <input
                        type="text"
                        value={formData.number}
                        onChange={(event) => updateField('number', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                        placeholder="Ex: 126 ou S/N"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(event) => updateField('neighborhood', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                        placeholder="Bairro"
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={formData.complement}
                        onChange={(event) => updateField('complement', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                        placeholder="Apto, bloco, fundo..."
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Ponto de referencia
                      </label>
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(event) => updateField('reference', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                        placeholder="Ex: proximo ao mercado, esquina, portao azul..."
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Observacoes
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition resize-none"
                    placeholder="Ex: preciso de visita tecnica para medir fachada e avaliar infiltrações."
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-[#000747] transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <CalendarDays size={18} className="mr-2" />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Solicitar Visita'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
