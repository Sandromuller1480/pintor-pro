import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Brush,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Droplets,
  Eye,
  Factory,
  Hammer,
  HelpCircle,
  Info,
  Layers3,
  MapPin,
  PaintBucket,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Users,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import { PainterCard } from '../components/PainterCard';
import { SPECIALTY_OPTIONS } from '../lib/painterProfileOptions';
import { paintersService } from '../lib/services/paintersService';
import { NavigateToPage, Page, Painter } from '../types';

import cimentoQueimadoImg from '../imagens/texturas/CIMENTO QUEIMADO COR CLARA.jpg';
import grafiatoImg from '../imagens/texturas/GRAFIATO COR CLARA.jpg';
import projetadaImg from '../imagens/texturas/PROJETADA COR CLARA.jpg';
import cabeloDeAnjoImg from '../imagens/texturas/TEXTURA COM CABELO DE ANJO.jpg';

type CategoryStep = {
  title: string;
  description: string;
};

type CategoryFaq = {
  question: string;
  answer: string;
};

type CategoryTexture = {
  title: string;
  image: string;
  aspect: string;
  benefits: string;
};

type PaintingCategory = {
  id: string;
  title: string;
  badge: string;
  summary: string;
  detailedDescription: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  specialties: string[];
  bestFor: string[];
  steps: CategoryStep[];
  technicalTips: string[];
  safetyRequirements: string[];
  faqs: CategoryFaq[];
  textures?: CategoryTexture[];
  estimatedDuration: string;
  difficultyLevel: 'Padrão' | 'Técnico' | 'Avançado' | 'Especializado';
};

type PaintingCategoriesProps = {
  setPage: NavigateToPage;
};

const normalizeText = (value: string) => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
);

const CATEGORIES: PaintingCategory[] = [
  {
    id: 'preparacao-superficie',
    title: 'Preparação de Superfície',
    badge: 'Base & Durabilidade',
    summary: 'A etapa mais crítica da pintura: limpeza, correção de patologias, remoção de umidade e seladores.',
    detailedDescription: 'Mais de 80% dos problemas de descascamento, bolhas e manchas decorrem de falhas na preparação da base. Profissionais qualificados inspecionam a alvenaria, tratam fissuras, aplicam fundo preparador ou selador e corrigem o reboco antes de qualquer demão de acabamento.',
    icon: Wrench,
    specialties: [
      'Preparo do reboco (Limpeza, Lixa, Selador/Fundo Preparador)',
      'Preparo do Acartonado (Lixa e Fundo Preparador)',
      'Reformas (Tratamento de patologias e Superficies)'
    ],
    bestFor: ['Paredes novas em reboco', 'Reformas com descascamento', 'Drywall e gesso acartonado', 'Eliminação de mofo e salitre'],
    steps: [
      { title: '1. Diagnóstico e Limpeza', description: 'Remoção de poeira, graxa, mofo com solução fungicida e raspagem de partes soltas.' },
      { title: '2. Tratamento de Fissuras', description: 'Abertura em "V" das trincas estáticas e aplicação de selante acrílico elastomérico com tela.' },
      { title: '3. Fundo Preparador ou Selador', description: 'Agregação das partículas soltas do reboco ou selagem de porosidade para homogeneizar absorção.' },
      { title: '4. Teste de Umidade', description: 'Verificação com medidor de umidade para garantir nível abaixo de 5% antes da massa.' }
    ],
    technicalTips: [
      'Reboco novo necessita de tempo de cura mínimo de 28 dias antes de receber qualquer produto.',
      'Em paredes que descascam ou esfarelam, use Fundo Preparador (solvente ou base água), nunca tinta pura direta.',
      'Gesso e drywall exigem fundo específico para gesso para não absorver toda a água da massa corrida.'
    ],
    safetyRequirements: [
      'Óculos de proteção contra respingos de produtos químicos',
      'Máscara PFF2 para lixamento e remoção de poeira mineral',
      'Luvas de borracha nitrílica para produtos de limpeza'
    ],
    faqs: [
      {
        question: 'Qual a diferença entre Selador Acrílico e Fundo Preparador?',
        answer: 'O Selador serve apenas para paredes novas de reboco curado, preenchendo a porosidade para economizar tinta. Já o Fundo Preparador é obrigatório em paredes antigas, rebocos fracos, esfarelados, gesso ou superfícies calcinadas, porque penetra e une as partículas soltas.'
      },
      {
        question: 'Por que a tinta descasca se não fizer a preparação correta?',
        answer: 'Sem a limpeza do pó e a aplicação do fundo agregador, a tinta cria uma película sobre a poeira solta, perdendo a aderência mecânica. Com a variação térmica e umidade, ela solta em placas inteiras.'
      }
    ],
    estimatedDuration: '1 a 3 dias dependendo da área',
    difficultyLevel: 'Técnico'
  },
  {
    id: 'massa-nivelamento',
    title: 'Massa e Nivelamento',
    badge: 'Superfície Espelhada',
    summary: 'Aplicação técnica de massa corrida ou acrílica com lixamento uniforme para obter paredes perfeitamente lisas.',
    detailedDescription: 'O nivelamento profissional transforma uma parede rústica em uma superfície plana e refinada com padrão "espelho". Exige domínio de desempenadeiras, lâminas de corte e lixadeiras com iluminação rasante para não deixar ondas, rebarbas ou marcas de lixa visíveis na luz solar.',
    icon: Layers3,
    specialties: [
      'Massa Corrida (Aplicacao e lixamento)',
      'Massa Acrilica (Aplicacao e lixamento)',
      'Lixadeiras: Pequenas, medias e grande porte'
    ],
    bestFor: ['Paredes internas residenciais', 'Áreas molháveis (cozinhas e banheiros)', 'Fachadas externas (Massa Acrílica)', 'Salas com luz indireta/LED rasante'],
    steps: [
      { title: '1. Primeira Demão de Enchimento', description: 'Aplicação com desempenadeira de aço inox ou rolo específico, preenchendo as imperfeições da alvenaria.' },
      { title: '2. Secagem e Queima', description: 'Respeito estrito ao intervalo de 4 a 6 horas entre demãos para evitar trincas por retração.' },
      { title: '3. Segunda Demão de Refinamento', description: 'Camada fina cruzada corrigindo microfuros e garantindo espessura homogênea.' },
      { title: '4. Lixamento Mecanizado com Luz Rasante', description: 'Lixamento com aspirador acoplado e holofote lateral revelando qualquer imperfeição antes da pintura.' }
    ],
    technicalTips: [
      'Massa corrida (PVA) é restrita a interiores secos. Em banheiros, cozinhas, lavanderias e muros use SEMPRE massa acrílica.',
      'Paredes com fita LED ou luz rasante necessitam do nível de acabamento Q4 (o mais alto padrão de nivelamento).',
      'Lixadeiras elétricas tipo girafa com aspirador reduzem até 90% da poeira suspensa dentro da residência.'
    ],
    safetyRequirements: [
      'Máscara respiratória facial PFF2',
      'Óculos de proteção selados contra pó fino',
      'Protetor auricular para lixadeiras orbitais e girafas'
    ],
    faqs: [
      {
        question: 'Posso usar massa corrida do lado de fora da casa?',
        answer: 'Não. A massa corrida tradicional é à base de PVA e se desintegra em contato com umidade ou chuva. Em áreas externas e banheiros, deve-se aplicar exclusivamente Massa Acrílica, que é resistente à água.'
      },
      {
        question: 'Quantas demãos de massa são necessárias para uma parede nova?',
        answer: 'Geralmente 2 a 3 demãos finas cruzadas. Camadas grossas nunca devem ser aplicadas de uma só vez, pois provocam trincas de retração e atrasam a cura.'
      }
    ],
    estimatedDuration: '2 a 4 dias para residências médias',
    difficultyLevel: 'Técnico'
  },
  {
    id: 'tintas-acabamentos',
    title: 'Tintas e Acabamentos Finos',
    badge: 'Cores & Resistência',
    summary: 'Pinturas de alto padrão em interiores e exteriores: fosco aveludado, acetinado, semibrilho e esmaltes nobres.',
    detailedDescription: 'A escolha da tinta certa e o controle de demãos determinam a lavabilidade, resistência à radiação UV e sofisticação estética do imóvel. Pintores especialistas realizam recortes perfeitos sem fita vazada, pintura sem marcas de rolo e acabamentos sedosos com durabilidade prolongada.',
    icon: PaintBucket,
    specialties: [
      'Tintas Acrilicas',
      'Tintas Solvente',
      'Acabamentos Finos'
    ],
    bestFor: ['Living e quartos de alto padrão', 'Fachadas com proteção antimofo', 'Apartamentos decorados', 'Ambientes com crianças e pets (tintas superlaváveis)'],
    steps: [
      { title: '1. Proteção Integral do Ambiente', description: 'Isolamento de pisos com plástico bolha e papelão ondulado, proteção de rodapés e tomadas.' },
      { title: '2. Recortes Perfeitos', description: 'Uso de trinchas de cerdas sintéticas nobres para recortes milimétricos em encontros de forros e cantos.' },
      { title: '3. Aplicação das Demãos Principais', description: 'Rolagem úmido sobre úmido no mesmo sentido para evitar reflexos ou "fantasmas" de rolo.' },
      { title: '4. Inspeção sob Luz Natural e Artificial', description: 'Conferência de cobertura, uniformidade de brilho e remoção das proteções com lâmina afiada.' }
    ],
    technicalTips: [
      'Acabamento Fosco disfarça pequenas irregularidades da parede; Acetinado destaca as linhas da arquitetura e é altamente lavável.',
      'Sempre respeite a diluição recomendada pelo fabricante: tinta com excesso de água perde poder de cobertura e descasca prematuramente.',
      'Aguarde o tempo de cura total da tinta (geralmente 14 a 28 dias) antes de efetuar lavagens com esponja macia.'
    ],
    safetyRequirements: [
      'Ventilação cruzada contínua no ambiente durante e após a aplicação',
      'Máscara para vapores orgânicos quando utilizar tintas base solvente',
      'Calçados com sola antiderrapante'
    ],
    faqs: [
      {
        question: 'Qual a diferença entre Fosco, Acetinado e Semibrilho?',
        answer: 'Fosco: reflexo zero, disfarça imperfeições de paredes grandes. Acetinado: brilho suave (efeito toque de seda), excelente lavabilidade, ideal para corredores e quartos. Semibrilho: reflexo nítido, máxima lavabilidade e impermeabilidade, comum em portas e esquadrias.'
      },
      {
        question: 'Como evitar manchas de rolo na parede?',
        answer: 'Trabalhar sempre com o rolo bem carregado (sem escorrer), rolando na mesma direção de cima para baixo e fechando a parede inteira sem pausas longas enquanto a tinta estiver úmida.'
      }
    ],
    estimatedDuration: '2 a 5 dias para residência completa',
    difficultyLevel: 'Padrão'
  },
  {
    id: 'efeitos-decorativos',
    title: 'Efeitos Decorativos & Texturas',
    badge: 'Arquitetura & Design',
    summary: 'Cimento queimado acetinado, grafiato hidrorrepelente, textura projetada e texturas nobres personalizadas.',
    detailedDescription: 'Os efeitos decorativos adicionam textura tátil, personalidade contemporânea e valorização imediata aos ambientes. Exigem mão de obra artística e altamente especializada com desempenadeiras de cantos arredondados, espátulas de efeito e aplicação precisa em camadas sucessivas.',
    icon: Sparkles,
    specialties: [
      'Pinturas com Efeitos',
      'Texturas',
      'Pistolas Industriais (Pinturas, Texturas e Efeitos)'
    ],
    bestFor: ['Paredes de destaque em salas', 'Fachadas residenciais e corporativas', 'Lojas e restaurantes de luxo', 'Varandas gourmet e muros externos'],
    textures: [
      {
        title: 'Cimento Queimado',
        image: cimentoQueimadoImg,
        aspect: 'Aspecto contemporâneo, aveludado e urbano',
        benefits: 'Indicado para salas, cabeceiras e áreas internas sofisticadas. Toque liso e suave.'
      },
      {
        title: 'Grafiato Rústico',
        image: grafiatoImg,
        aspect: 'Ranhuras expressivas com pedras de quartzo',
        benefits: 'Alta durabilidade externa, resistência a chuvas e disfarce completo de ondulações da parede.'
      },
      {
        title: 'Textura Projetada',
        image: projetadaImg,
        aspect: 'Relevo uniforme com efeito flocado prensado',
        benefits: 'Padrão ouro em prédios e sobrados. Alta barreira contra umidade externa e intempéries.'
      },
      {
        title: 'Textura Cabelo de Anjo',
        image: cabeloDeAnjoImg,
        aspect: 'Filamentos delicados com textura refinada',
        benefits: 'Efeito decorativo exclusivo para fachadas nobres e áreas de lazer.'
      }
    ],
    steps: [
      { title: '1. Fundo Primer na Cor do Efeito', description: 'Aplicação de primer na mesma tonalidade para evitar que o fundo branco transpareça nos veios.' },
      { title: '2. Primeira Camada de Base', description: 'Aplicação homogênea criando o leito de aderência com desempenadeira de inox sem rebarbas.' },
      { title: '3. Segunda Camada de Desenho / Manchas', description: 'Movimentos curtos e semicirculares para criar as nuances características de luz e sombra.' },
      { title: '4. Polimento e Verniz Protetor', description: 'Queima da superfície com desempenadeira e aplicação de resina acrílica ou cera protetora.' }
    ],
    technicalTips: [
      'Para cimento queimado, a desempenadeira deve ter bordas arredondadas polidas para não riscar a película fina.',
      'Em áreas externas, exija resina hidrorrepelente final para garantir que o efeito não manche com a água da chuva.',
      'Em paredes longas com texturas como grafiato, a aplicação deve ser feita em dupla (um espalha, outro risca) sem interrupção.'
    ],
    safetyRequirements: [
      'Óculos de proteção contra respingos de resina',
      'Luvas de proteção no manuseio de massas abrasivas de quartzo',
      'Equipamento de proteção respiratória'
    ],
    faqs: [
      {
        question: 'O cimento queimado pode molhar?',
        answer: 'Em áreas internas comuns, a cera ou verniz acrílico cria proteção contra respingos leves. Para banheiros e lavabos molháveis, deve ser aplicado um verniz poliuretano (PU) bicomponente de alta resistência.'
      },
      {
        question: 'Por que o grafiato e a projetada duram tanto em fachadas?',
        answer: 'Porque contêm minerais de quartzo selecionados e resinas acrílicas elastoméricas que suportam dilatação térmica provocada pelo sol e chuva sem fissurar.'
      }
    ],
    estimatedDuration: '2 a 4 dias por ambiente',
    difficultyLevel: 'Avançado'
  },
  {
    id: 'pintura-mecanizada',
    title: 'Pintura Mecanizada (Airless)',
    badge: 'Alta Produtividade',
    summary: 'Aplicação industrial e residencial com máquinas Airless, compressores e pistolas de alta pressão.',
    detailedDescription: 'A tecnologia de pintura mecanizada pulveriza a tinta a pressões elevadas sem ar, resultando em cobertura ultra uniforme, economia de material e velocidade até 5 vezes maior que o rolo tradicional. Ideal para forros de gesso extensos, galpões, condomínios e residências de grande porte.',
    icon: SprayCan,
    specialties: [
      'Airless',
      'Pistolas Industriais (Pinturas, Texturas e Efeitos)',
      'Compressores de Pequenos, Medios e grande porte'
    ],
    bestFor: ['Casas novas completas', 'Forros de gesso acartonado e ripados', 'Galpões comerciais e industriais', 'Grandes muros e estacionamentos'],
    steps: [
      { title: '1. Mascaramento Rigoroso (Envelopamento)', description: 'Vedação absoluta de janelas, pisos, vidros e portas com filme plástico eletrostático e fitas.' },
      { title: '2. Filtragem da Tinta e Ajuste do Bico', description: 'Coagem fina da tinta e seleção do bico reversível adequado (ex: 517 para paredes, 311 para portas).' },
      { title: '3. Teste de Leque e Pressão', description: 'Calibração da pressão na máquina para evitar respingos nas bordas do leque (rabos de cometa).' },
      { title: '4. Aplicação Contínua com 50% de Sobreposição', description: 'Pistola mantida a 30cm constante e perpendicular à parede para camada milimetricamente uniforme.' }
    ],
    technicalTips: [
      'O segredo do airless reside 70% na qualidade do isolamento prévio e 30% na destreza do operador do gatilho.',
      'Bicos desgastados aumentam o consumo de tinta em até 30%; troque os bicos conforme a quilometragem recomendada.',
      'Limpeza diária do sistema com solvente compatível garante a vida útil da bomba e do pistão da máquina.'
    ],
    safetyRequirements: [
      'Máscara de respiração com filtro duplo químico e mecânico para névoa',
      'Macacão de pintura Tyvek de corpo inteiro',
      'Trava de segurança na pistola contra acidentes com alta pressão (injeção cutânea)'
    ],
    faqs: [
      {
        question: 'A pintura com airless suja muito a casa?',
        answer: 'Quando realizada por pintor profissional com o devido mascaramento eletrostático e controle de pressão, o excesso de névoa é mínimo. Em ambientes vazios ou obras novas, é o método mais limpo e rápido existente.'
      },
      {
        question: 'Vale a pena pintar apartamento mobiliado com airless?',
        answer: 'Em apartamentos totalmente mobiliados e habitados, geralmente o rolo tradicional é mais prático devido ao tempo de proteção dos móveis. O airless brilha em obras limpas, forros e residências desocupadas.'
      }
    ],
    estimatedDuration: '1 a 2 dias para grandes metragens',
    difficultyLevel: 'Avançado'
  },
  {
    id: 'metais-madeira',
    title: 'Pintura em Metais e Madeira',
    badge: 'Proteção & Esmalte',
    summary: 'Tratamentos anticorrosivos em portões, grades e aplicação de vernizes, stains e lacas em marcenaria.',
    detailedDescription: 'Metais e madeiras sofrem ação direta da ferrugem, cupins e radiação solar. Pintores experientes aplicam fundos convertedores de ferrugem (primer galvite/epóxi) e vernizes marítimos com filtro solar de alta performance, garantindo durabilidade de anos sem descascar.',
    icon: Hammer,
    specialties: [
      'Pinturas em Metais (Tratamento especial)',
      'Pinturas em Madeira (Tratamento especial)',
      'Tintas Solvente'
    ],
    bestFor: ['Portões de aço ou alumínio', 'Grades e guarda-corpos', 'Pergolados e decks de piscina', 'Portas de madeira maciça e móveis'],
    steps: [
      { title: '1. Descontaminação e Lixamento', description: 'Remoção mecânica de pontos de oxidação e lixamento no sentido dos veios da madeira.' },
      { title: '2. Fundo Específico (Primer / Fundo Nivelador)', description: 'Galvite para galvanizados, zarcão para ferro ou seladora/fundo para madeira.' },
      { title: '3. Aplicação do Acabamento (Esmalte ou Verniz)', description: 'Aplicação a rolinho de espuma de alta densidade ou pistola para espelhamento sem marcas.' },
      { title: '4. Proteção contra Intempéries', description: 'Aplicação de verniz marítimo ou poliuretano com duplo filtro solar em áreas externas.' }
    ],
    technicalTips: [
      'Nunca aplique tinta direto sobre ferro galvanizado sem passar primer vinílico ou galvite, sob pena da tinta descascar em dias.',
      'Decks de madeira exigem Stain Impregnante que não forma película e não descasca, permitindo reaplicação sem raspar.',
      'Em esmaltes sintéticos à base de solvente, o tempo de secagem entre demãos deve ser respeitado rigorosamente.'
    ],
    safetyRequirements: [
      'Máscara respiratória para vapores orgânicos (solventes e tíner)',
      'Luvas de borracha resistentes a solventes',
      'Óculos de proteção contra fagulhas ao escovar metais com esmerilhadeira'
    ],
    faqs: [
      {
        question: 'Qual a diferença entre Verniz e Stain para madeira externa?',
        answer: 'O Verniz cria uma película impermeável rígida sobre a madeira que, com o sol, pode trincar e precisar de raspagem. O Stain penetra nas fibras, é hidrorrepelente, antifúngico e não descasca, facilitando manutenções futuras.'
      },
      {
        question: 'Como tratar ferrugem antes de pintar o portão?',
        answer: 'A ferrugem deve ser escovada mecanicamente com lixa de ferro ou escova de aço, seguida da aplicação de convertedor de ferrugem e primer anticorrosivo antes do esmalte final.'
      }
    ],
    estimatedDuration: '1 a 3 dias',
    difficultyLevel: 'Técnico'
  },
  {
    id: 'fachadas-altura',
    title: 'Fachadas e Trabalhos em Altura',
    badge: 'Segurança & NR-35',
    summary: 'Pintura externa de sobrados, edifícios e condomínios com equipe certificada na norma NR-35.',
    detailedDescription: 'Obras em fachadas e alturas exigem muito mais que habilidade com rolo: demandam rigor absoluto com segurança, inspeção diária de balancins e andaimes, uso de linhas de vida e produtos especiais elastoméricos que vedam microfissuras contra infiltrações causadas por chuvas com vento.',
    icon: Building2,
    specialties: [
      'NR-35 (trabalho em altura)',
      'EPIs',
      'Massa Acrilica (Aplicacao e lixamento)'
    ],
    bestFor: ['Fachadas prediais', 'Sobrados e muros altos', 'Condomínios residenciais fechados', 'Galpões com pé direito duplo/triplo'],
    steps: [
      { title: '1. Lavagem com Hidrojateamento de Alta Pressão', description: 'Remoção de fuligem, maresia, musgo e partículas desagregadas com lavadora industrial.' },
      { title: '2. Mapeamento de Fissuras e Teste de Percussão', description: 'Identificação de reboco oco e vedação com mastique de poliuretano elástico.' },
      { title: '3. Fundo Selador Elastomérico', description: 'Preenchimento e ancoragem para o sistema de proteção elástica da fachada.' },
      { title: '4. Aplicação de Tinta Emborrachada', description: 'Duas a três demãos de tinta elastomérica que estica e acompanha as dilatações da estrutura.' }
    ],
    technicalTips: [
      'Tinta emborrachada / elastomérica cria uma membrana elástica impermeável que previne infiltrações crônicas.',
      'Sempre solicite comprovante da validade do certificado NR-35 e ASO (Atestado de Saúde Ocupacional) de toda a equipe.',
      'Verifique os pontos de ancoragem da edificação antes da montagem de cadeirinhas suspensas ou andaimes.'
    ],
    safetyRequirements: [
      'Certificado NR-35 ativo e válido para todos os profissionais',
      'Cinto de segurança tipo paraquedista com trava-quedas acoplado em linha de vida independente',
      'Capacete jugular, botas de segurança e isolamento de área com cones e fita zebrada'
    ],
    faqs: [
      {
        question: 'O que é a NR-35 e por que o condomínio deve exigir?',
        answer: 'A NR-35 é a Norma Regulamentadora do Ministério do Trabalho para qualquer atividade executada acima de 2 metros de altura. Se houver um acidente e a equipe não possuir certificado e EPIs adequados, o síndico ou proprietário do imóvel pode responder civil e criminalmente.'
      },
      {
        question: 'O que é tinta emborrachada para fachada?',
        answer: 'É uma tinta especial à base de polímeros acrílicos que forma uma película flexível capaz de acompanhar a dilatação e contração natural das paredes, vedando microfissuras e impedindo infiltrações de água.'
      }
    ],
    estimatedDuration: '1 a 4 semanas para fachadas completas',
    difficultyLevel: 'Especializado'
  },
  {
    id: 'seguranca-profissional',
    title: 'Normas & Segurança Profissional',
    badge: 'Conformidade Legal',
    summary: 'Os padrões de proteção, certificação NR-35 e boas práticas operacionais que protegem a obra e o contratante.',
    detailedDescription: 'A segurança é inegociável na PINTOR PRO. Pintores profissionais de elite trabalham uniformizados, utilizam equipamentos de proteção individual (EPIs) homologados e conhecem os procedimentos técnicos para descarte correto de resíduos e proteção das instalações elétricas durante a obra.',
    icon: ShieldCheck,
    specialties: [
      'EPIs',
      'NR-35 (trabalho em altura)'
    ],
    bestFor: ['Obras corporativas e industriais', 'Condomínios com regimento interno rígido', 'Reformas em áreas habitadas', 'Obras de alto padrão'],
    steps: [
      { title: '1. Análise Preliminar de Risco (APR)', description: 'Mapeamento de fiações elétricas, pontos de ancoragem e circulação de moradores.' },
      { title: '2. Inspeção dos Equipamentos', description: 'Checagem de cabos de aço, cordas certificadas, andaimes travados e sapatas niveladas.' },
      { title: '3. Sinalização e Isolamento', description: 'Isolamento do perímetro inferior com fitas zebradas e placas de advertência.' },
      { title: '4. Descarte Ecológico de Embalagens', description: 'Armazenamento de latas de solventes e retalhos conforme a legislação ambiental.' }
    ],
    technicalTips: [
      'Jamais permita improvisos em escadas e andaimes (como tijolos sob pés de escada ou tábuas soltas).',
      'Ao contratar pintores na PINTOR PRO, você visualiza no perfil do profissional o selo de verificação de documentos e NR-35.',
      'A proteção de tomadas e interruptores evita curtos-circuitos durante a aplicação de massas úmidas.'
    ],
    safetyRequirements: [
      'Equipamentos com Certificado de Aprovação (CA) do MTE',
      'Inspeção diária dos Equipamentos de Proteção Individual e Coletiva',
      'Treinamento e capacitação contínua'
    ],
    faqs: [
      {
        question: 'Quem é responsável pelos EPIs dos pintores?',
        answer: 'O profissional credenciado e seu encarregado de equipe são os responsáveis legais pelo fornecimento e fiscalização do uso dos EPIs por toda a sua equipe na obra.'
      },
      {
        question: 'Pintores da PINTOR PRO possuem verificação de segurança?',
        answer: 'Sim, profissionais verificados passam por análise de documentação e atestados técnicos em conformidade com as normas vigentes.'
      }
    ],
    estimatedDuration: 'Presente em 100% da duração da obra',
    difficultyLevel: 'Especializado'
  }
];

const QUICK_PROJECT_DIAGNOSTICS = [
  {
    label: 'Paredes & Tetos Internos',
    targetCategoryIndex: 1, // Massa e Nivelamento
    icon: Layers3,
    description: 'Nivelamento liso, correção de buracos e pintura suave'
  },
  {
    label: 'Cimento Queimado & Texturas',
    targetCategoryIndex: 3, // Efeitos Decorativos
    icon: Sparkles,
    description: 'Paredes de destaque com estilo industrial ou rústico'
  },
  {
    label: 'Fachadas, Sobrados & Altura',
    targetCategoryIndex: 6, // Fachadas e Altura
    icon: Building2,
    description: 'Pintura externa, proteção elastomérica e NR-35'
  },
  {
    label: 'Pintura Rápida com Airless',
    targetCategoryIndex: 4, // Pintura Mecanizada
    icon: SprayCan,
    description: 'Alta produtividade para casas novas ou galpões'
  },
  {
    label: 'Portões, Grades & Madeiras',
    targetCategoryIndex: 5, // Metais e Madeira
    icon: Hammer,
    description: 'Esmalte anticorrosivo e vernizes com filtro solar'
  },
  {
    label: 'Reboco Novo ou Descascando',
    targetCategoryIndex: 0, // Preparação de Superfície
    icon: Wrench,
    description: 'Tratamento de fissuras, mofo e fundo preparador'
  }
];

export const PaintingCategories: React.FC<PaintingCategoriesProps> = ({ setPage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [allPainters, setAllPainters] = useState<Painter[]>([]);
  const [isLoadingPainters, setIsLoadingPainters] = useState(true);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [previewTexture, setPreviewTexture] = useState<CategoryTexture | null>(null);

  useEffect(() => {
    document.title = 'Categorias de Pintura Profissional | Pintor Pro';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Conheça os processos técnicos, normas, materiais e contrate pintores especialistas em cada categoria de pintura imobiliária de alto padrão.'
      );
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchPainters() {
      try {
        const data = await paintersService.getAll();
        if (isMounted) {
          setAllPainters(data);
        }
      } catch (error) {
        console.error('Erro ao buscar pintores para categorias:', error);
      } finally {
        if (isMounted) {
          setIsLoadingPainters(false);
        }
      }
    }

    void fetchPainters();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedTerm = normalizeText(searchTerm);

    if (!normalizedTerm) {
      return CATEGORIES.map((category, index) => ({ category, index }));
    }

    return CATEGORIES
      .map((category, index) => ({ category, index }))
      .filter(({ category }) => {
        const searchableText = [
          category.title,
          category.badge,
          category.summary,
          category.detailedDescription,
          ...category.specialties,
          ...category.bestFor,
          ...category.technicalTips
        ].join(' ');

        return normalizeText(searchableText).includes(normalizedTerm);
      });
  }, [searchTerm]);

  const selectedCategory = CATEGORIES[selectedCategoryIndex] ?? CATEGORIES[0];
  const SelectedCategoryIcon = selectedCategory.icon;
  const registeredSpecialtiesSet = useMemo(() => new Set(SPECIALTY_OPTIONS), []);

  const matchingPainters = useMemo(() => {
    if (!allPainters || allPainters.length === 0) {
      return [];
    }

    const categorySpecialtiesLower = selectedCategory.specialties.map((spec) => normalizeText(spec));

    return allPainters.filter((painter) => {
      if (!painter.specialties || painter.specialties.length === 0) {
        return false;
      }

      return painter.specialties.some((specialty) => {
        const normalizedSpec = normalizeText(specialty);
        return categorySpecialtiesLower.some((categorySpec) => (
          normalizedSpec.includes(categorySpec) || categorySpec.includes(normalizedSpec)
        ));
      });
    });
  }, [allPainters, selectedCategory]);

  const paintersPerCategoryCount = useMemo(() => {
    const countMap: Record<number, number> = {};

    CATEGORIES.forEach((cat, index) => {
      const catSpecs = cat.specialties.map((s) => normalizeText(s));
      const count = allPainters.filter((painter) => (
        painter.specialties?.some((spec) => {
          const norm = normalizeText(spec);
          return catSpecs.some((c) => norm.includes(c) || c.includes(norm));
        })
      )).length;

      countMap[index] = count;
    });

    return countMap;
  }, [allPainters]);

  const handleSelectCategory = (index: number) => {
    setSelectedCategoryIndex(index);
    setExpandedFaqIndex(0);
    const element = document.getElementById('categoria-detalhe');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#FDF3FA] selection:text-[#9A077B]">
      {/* Top Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-14 sm:py-20">
        <div className="absolute right-0 top-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#FDF3FA] to-[#FCE8F6] opacity-70 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EFC6E3] bg-[#FDF3FA] px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#9A077B]">
                <Sparkles size={14} className="text-[#9A077B]" />
                Guia Técnico & Marketplace
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#000747] sm:text-5xl lg:text-6xl">
                Categorias de <span className="text-[#9A077B]">Pintura Pro</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg font-medium leading-relaxed text-slate-600">
                Cada etapa de uma obra exige conhecimentos e ferramentas distintas. Conheça as técnicas, etapas e contrate os profissionais especialistas certificados na plataforma.
              </p>

              {/* Quick stats banner */}
              <div className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="text-[#9A077B]" size={18} />
                  <span>8 Especialidades Estruturadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-[#9A077B]" size={18} />
                  <span>Critérios NR-35 & Segurança</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="text-[#9A077B]" size={18} />
                  <span>Contratação Direta de Especialistas</span>
                </div>
              </div>
            </div>

            {/* Live Search Card */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 sm:p-8 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#000747]">
                Buscar por técnica, material ou acabamento
              </label>
              <div className="relative mt-3">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: cimento queimado, airless, fachada, massa corrida..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-[#9A077B] focus:ring-4 focus:ring-[#FDF3FA]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
                    title="Limpar busca"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {searchTerm && (
                <p className="mt-3 text-xs font-bold text-[#9A077B]">
                  {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}
                </p>
              )}

              {/* Quick Suggestion Tags */}
              <div className="mt-5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">
                  Termos frequentes
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Cimento Queimado', 'Airless', 'Massa Acrílica', 'Fachada', 'Verniz', 'Reboco'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setSearchTerm(term)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#9A077B] hover:text-[#9A077B]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Diagnostics Selector ("O que a sua obra precisa?") */}
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#9A077B]">Assistente Rápido</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#000747]">O que a sua obra precisa hoje?</h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-md">
              Clique em uma das necessidades comuns abaixo para ir direto ao método técnico correto e ver profissionais especializados.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {QUICK_PROJECT_DIAGNOSTICS.map((diag) => {
              const DiagIcon = diag.icon;
              const isSelected = selectedCategoryIndex === diag.targetCategoryIndex;

              return (
                <button
                  key={diag.label}
                  type="button"
                  onClick={() => handleSelectCategory(diag.targetCategoryIndex)}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#9A077B] bg-[#FDF3FA] shadow-sm text-[#000747]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className={`p-2.5 rounded-xl mb-3 ${isSelected ? 'bg-[#9A077B] text-white' : 'bg-slate-100 text-[#9A077B]'}`}>
                    <DiagIcon size={20} />
                  </span>
                  <span className="text-xs sm:text-sm font-black tracking-tight leading-tight block mb-1">
                    {diag.label}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 leading-snug line-clamp-2">
                    {diag.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Interactive Category Explorer */}
      <section id="categoria-detalhe" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[22rem,1fr] items-start">
          {/* Left Navigation: Categories List */}
          <aside className="space-y-3 sticky top-24">
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Categorias ({filteredCategories.length})
              </span>
              <span className="text-xs font-bold text-slate-500">
                Selecione para explorar
              </span>
            </div>

            {filteredCategories.length > 0 ? (
              filteredCategories.map(({ category, index }) => {
                const Icon = category.icon;
                const isSelected = selectedCategoryIndex === index;
                const paintersCount = paintersPerCategoryCount[index] ?? 0;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelectCategory(index)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#9A077B] bg-white text-[#000747] shadow-[0_12px_30px_rgba(154,7,123,0.12)] ring-1 ring-[#9A077B]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#EFC6E3] hover:text-[#000747]'
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                        isSelected ? 'bg-[#9A077B] text-white shadow-md shadow-[#9A077B]/30' : 'bg-slate-50 text-[#9A077B]'
                      }`}
                    >
                      <Icon size={22} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-sm font-black uppercase tracking-tight truncate">
                          {category.title}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {category.badge}
                        </span>
                        {paintersCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {paintersCount} {paintersCount === 1 ? 'pintor' : 'pintores'}
                          </span>
                        )}
                      </div>
                    </span>

                    <ChevronRight
                      className={`h-5 w-5 shrink-0 transition ${
                        isSelected ? 'text-[#9A077B] translate-x-1' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-black text-[#000747]">Nenhuma categoria com esse termo</p>
                <p className="mt-1 text-xs text-slate-500">Tente buscar por termos mais genéricos.</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-xs font-black text-[#9A077B] uppercase tracking-wider underline"
                >
                  Limpar busca
                </button>
              </div>
            )}

            {/* Quick Helper Box */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[#000747] mb-2">
                <HelpCircle size={16} className="text-[#9A077B]" />
                Dúvida na contratação?
              </div>
              <p className="leading-relaxed text-slate-500">
                Pintores verificados pela PINTOR PRO possuem comprovação técnica, portfólio real e garantia de execução.
              </p>
              <button
                type="button"
                onClick={() => setPage(Page.HowItWorks)}
                className="mt-3 text-xs font-bold text-[#9A077B] hover:underline inline-flex items-center gap-1"
              >
                Como funciona para clientes <ArrowRight size={12} />
              </button>
            </div>
          </aside>

          {/* Right Detail Pane: Rich Technical Guide & Real Painters */}
          <div className="space-y-8">
            {/* Category Banner Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-8">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDF3FA] text-[#9A077B] shadow-inner">
                      <SelectedCategoryIcon size={28} />
                    </div>
                    <div>
                      <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {selectedCategory.badge}
                      </span>
                      <span className="ml-2 text-xs font-bold text-slate-400">
                        Nível: <span className="text-[#000747]">{selectedCategory.difficultyLevel}</span>
                      </span>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#000747]">
                    {selectedCategory.title}
                  </h2>
                  <p className="mt-3 text-base sm:text-lg font-semibold leading-relaxed text-[#9A077B]">
                    {selectedCategory.summary}
                  </p>
                  <p className="mt-4 text-sm sm:text-base font-normal leading-relaxed text-slate-600">
                    {selectedCategory.detailedDescription}
                  </p>
                </div>

                <div className="flex flex-col gap-3 shrink-0 lg:w-56">
                  <button
                    type="button"
                    onClick={() => {
                      const element = document.getElementById('especialistas-categoria');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setPage(Page.Home);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A077B] px-5 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7F0665] shadow-lg shadow-[#9A077B]/20 text-center"
                  >
                    <Brush size={16} />
                    Ver Pintores
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage(Page.Home)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 text-center"
                  >
                    Buscar na minha cidade
                  </button>

                  <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
                    <Clock size={14} />
                    <span>Duração: {selectedCategory.estimatedDuration}</span>
                  </div>
                </div>
              </div>

              {/* Recommended For & Specialties Grid */}
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {/* Specialties registered */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                    <BadgeCheck size={16} className="text-[#9A077B]" />
                    Especialidades Oficiais PINTOR PRO
                  </h3>
                  <div className="space-y-2.5">
                    {selectedCategory.specialties.map((spec) => (
                      <div
                        key={spec}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-[#EFC6E3] hover:bg-white"
                      >
                        <CheckCircle2 size={18} className="text-[#9A077B] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-[#000747]">{spec}</p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {registeredSpecialtiesSet.has(spec as (typeof SPECIALTY_OPTIONS)[number])
                              ? 'Critério ativo no credenciamento e filtro da plataforma.'
                              : 'Requisito técnico associado ao serviço.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best for tags & Safety */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                      <Droplets size={16} className="text-[#9A077B]" />
                      Aplicações Mais Indicadas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory.bestFor.map((item) => (
                        <span
                          key={item}
                          className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Safety box */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-900 mb-2">
                      <ShieldAlert size={16} className="text-amber-600" />
                      Requisitos de Segurança da Categoria
                    </div>
                    <ul className="space-y-1 text-xs text-amber-950/80 font-medium">
                      {selectedCategory.safetyRequirements.map((req) => (
                        <li key={req} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step by step execution guide */}
              <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9A077B]">
                    Metodologia Profissional
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#000747]">
                    Etapas de Execução Recomendadas
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {selectedCategory.steps.map((step, idx) => (
                    <div
                      key={step.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 relative"
                    >
                      <span className="text-2xl font-black text-[#9A077B]/30 block mb-1">
                        0{idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-[#000747] mb-2 leading-tight">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real Textures Showcase (when applicable) */}
              {selectedCategory.textures && selectedCategory.textures.length > 0 && (
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9A077B]">
                        Amostras Visuais
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-[#000747]">
                        Texturas & Efeitos Mais Procurados
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Clique para ampliar os detalhes do efeito
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {selectedCategory.textures.map((tex) => (
                      <div
                        key={tex.title}
                        onClick={() => setPreviewTexture(tex)}
                        className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-[#9A077B] hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="relative h-44 overflow-hidden bg-slate-100">
                          <img
                            src={tex.image}
                            alt={tex.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <span className="text-white text-xs font-bold inline-flex items-center gap-1.5">
                              <Eye size={14} /> Ver detalhes
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <h4 className="text-sm font-black text-[#000747] group-hover:text-[#9A077B] transition">
                            {tex.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {tex.aspect}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Tips from pros */}
              <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="rounded-2xl bg-[#000747] p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-white/10 text-[#C93EA6]">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider">
                        Dicas de Ouro do Pintor Pro
                      </h4>
                      <p className="text-xs text-slate-300">
                        Recomendações técnicas para não ter retrabalho nem prejuízo com material
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-200 font-medium">
                    {selectedCategory.technicalTips.map((tip, i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                        <span className="text-[#C93EA6] font-black block mb-1">#0{i + 1}</span>
                        <p className="leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Frequently Asked Questions */}
              <div className="mt-10 pt-8 border-t border-slate-100">
                <h3 className="text-lg sm:text-xl font-black text-[#000747] mb-6 flex items-center gap-2">
                  <HelpCircle size={20} className="text-[#9A077B]" />
                  Perguntas Frequentes sobre esta Categoria
                </h3>

                <div className="space-y-3">
                  {selectedCategory.faqs.map((faq, faqIdx) => {
                    const isOpen = expandedFaqIndex === faqIdx;

                    return (
                      <div
                        key={faq.question}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqIndex(isOpen ? null : faqIdx)}
                          className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition hover:bg-slate-100/60"
                        >
                          <span className="text-sm font-black text-[#000747] pr-4">
                            {faq.question}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#9A077B]' : ''
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-slate-600 border-t border-slate-200/60 pt-3">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* REAL PAINTERS CONNECTED SECTION */}
            <div id="especialistas-categoria" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">
                    Profissionais Credenciados
                  </span>
                  <h3 className="text-2xl font-black text-[#000747]">
                    Pintores Especialistas em {selectedCategory.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Profissionais na plataforma que possuem esta especialidade verificada no perfil.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPage(Page.Home)}
                  className="text-xs font-black uppercase tracking-wider text-[#9A077B] hover:text-[#7F0665] flex items-center gap-1 shrink-0"
                >
                  Ver todos na Home <ArrowRight size={14} />
                </button>
              </div>

              {isLoadingPainters ? (
                <div className="py-16 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#9A077B] border-r-transparent" />
                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">
                    Buscando especialistas cadastrados...
                  </p>
                </div>
              ) : matchingPainters.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {matchingPainters.map((painter) => (
                    <PainterCard
                      key={painter.id}
                      painter={painter}
                      onClick={(id) => setPage(Page.PainterProfile, { painterId: id })}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Users size={24} />
                  </div>
                  <h4 className="text-base font-black text-[#000747]">
                    Novos pintores desta especialidade estão em credenciamento
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                    Você pode buscar outros pintores gerais de alto padrão na página inicial ou solicitar um orçamento informando a necessidade de {selectedCategory.title.toLowerCase()}.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setPage(Page.Home)}
                      className="rounded-xl bg-[#9A077B] px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#7F0665] transition shadow-md shadow-[#9A077B]/20"
                    >
                      Explorar Todos os Pintores
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(Page.Register)}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Sou Pintor e Domino essa Técnica
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="bg-gradient-to-r from-[#000747] via-[#020d58] to-[#000747] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#C93EA6] mb-4">
            Padrão Ouro da Pintura
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-3xl mx-auto">
            Pronto para transformar o seu imóvel com a elite da pintura?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
            Consulte orçamentos detalhados, tire dúvidas e agende visitas técnicas com profissionais verificados e avaliados por clientes reais.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage(Page.Home)}
              className="rounded-xl bg-[#9A077B] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#7F0665] transition shadow-xl shadow-black/30"
            >
              Encontrar Especialistas na Minha Cidade
            </button>
            <button
              type="button"
              onClick={() => setPage(Page.Register)}
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-white/20 transition backdrop-blur-sm"
            >
              Cadastrar como Pintor Profissional
            </button>
          </div>
        </div>
      </section>

      {/* Texture Detail Modal */}
      {previewTexture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewTexture(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
              title="Fechar"
            >
              <X size={20} />
            </button>

            <div className="h-72 w-full overflow-hidden rounded-2xl bg-slate-100 mb-5">
              <img
                src={previewTexture.image}
                alt={previewTexture.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-[#9A077B]" />
              <h3 className="text-xl font-black text-[#000747]">
                {previewTexture.title}
              </h3>
            </div>
            <p className="text-sm font-semibold text-[#9A077B] mb-2">
              {previewTexture.aspect}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              {previewTexture.benefits}
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewTexture(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewTexture(null);
                  setPage(Page.Home);
                }}
                className="rounded-xl bg-[#9A077B] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#7F0665] transition shadow-md shadow-[#9A077B]/20"
              >
                Buscar Pintores deste Efeito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
