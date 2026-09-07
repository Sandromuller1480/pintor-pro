import React, { useMemo, useState } from 'react';
import { Page } from '../types';
import {
  BookOpen,
  FileText,
  Video,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Search,
  X,
  Layers,
  FileCheck,
  HelpCircle
} from 'lucide-react';

interface AcademyProps {
  setPage?: (p: Page) => void;
}

type ContentType = 'guide' | 'tool' | 'video';
type Category = 'tecnica' | 'negocios' | 'modelos' | 'efeitos';

interface AcademyItem {
  id: string;
  type: ContentType;
  category: Category;
  title: string;
  subtitle: string;
  readTimeOrDuration: string;
  badge: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Essencial';
  featured?: boolean;
  authorOrSource: string;
  description: string;
  guideContent?: {
    summary: string;
    toolsNeeded?: string[];
    steps: {
      title: string;
      description: string;
      tip?: string;
      warning?: string;
    }[];
    proTips?: string[];
    checklist?: string[];
  };
  toolContent?: {
    format: string;
    instructions: string;
    textToCopy: string;
  };
  videoContent?: {
    youtubeId: string;
    channel: string;
    keyTakeaways: string[];
  };
}

const ACADEMY_ITEMS: AcademyItem[] = [
  // 1. GUIAS TÉCNICOS DE LEITURA
  {
    id: 'patologias-umidade',
    type: 'guide',
    category: 'tecnica',
    title: 'Diagnóstico & Cura de Umidade, Eflorescência e Mofo',
    subtitle: 'Identifique a causa raiz antes de pintar e elimine o retrabalho definitivo.',
    readTimeOrDuration: '4 min de leitura',
    badge: 'Manual de Campo',
    level: 'Essencial',
    featured: true,
    authorOrSource: 'Manual Técnico PINTOR PRO',
    description: 'Aprenda a diferenciar umidade ascendente de vazamento pontual e saiba qual fundo preparador ou impermeabilizante aplicar para não soltar a tinta.',
    guideContent: {
      summary: 'Pintar sobre parede úmida é a principal causa de perda de clientes e disputas na pintura civil. Este guia fornece o método de 4 passos para identificar, sanar e aplicar a barreira química correta antes do acabamento.',
      toolsNeeded: [
        'Higrômetro ou teste do plástico adesivo',
        'Espátula de aço rígida',
        'Escova de cerdas de aço',
        'Solução de água sanitária (1:1)',
        'Fundo preparador base solvente ou impermeabilizante acrílico'
      ],
      steps: [
        {
          title: 'Passo 1: Teste da Umidade (Teste do Plástico)',
          description: 'Cole um quadrado de plástico transparente (30x30cm) na parede com fita crepe em todas as bordas. Aguarde 24 a 48 horas. Se o plástico condensar água por dentro, a umidade vem da parede (infiltração ou lençol). Se condensar por fora, é problema de ventilação do cômodo.',
          tip: 'Nunca aplique massa corrida tradicional em áreas onde o teste do plástico condensou água.'
        },
        {
          title: 'Passo 2: Raspagem Profunda e Limpeza de Esporos',
          description: 'Remova toda a camada solta, bolhas e tinta empolada com espátula até atingir o reboco são. Lave a área mofada com solução de água + água sanitária (proporção 1:1) e deixe agir por 4 horas antes de enxaguar.',
          warning: 'Lixar mofo a seco espalha esporos por todo o imóvel e contamina o ambiente e seus pulmões. Sempre lave antes!'
        },
        {
          title: 'Passo 3: Aplicação de Barreira Bloqueadora',
          description: 'Aplique 2 a 3 demãos cruzadas de impermeabilizante específico para rodapés ou fundo preparador de paredes à base de solvente (o base solvente penetra e aglutina os poros do reboco). Respeite o intervalo de 4 a 6 horas.',
          tip: 'Em rodapés com umidade de solo, a barreira deve subir pelo menos 30 cm acima da linha visível da mancha.'
        },
        {
          title: 'Passo 4: Regularização e Acabamento',
          description: 'Use exclusivamente massa acrílica externa ou argamassa polimérica para nivelar. Finalize com tinta acrílica Premium com aditivo antimofo.'
        }
      ],
      proTips: [
        'Sempre documente fotos com data antes da raspagem e avise o cliente por escrito no contrato que vícios estruturais de encanamento são responsabilidade civil do proprietário.',
        'Ao aplicar fundo preparador, ele não deve criar película brilhante de verniz; se brilhou, dilua mais para que penetre no substrato.'
      ],
      checklist: [
        'Teste de condensação realizado',
        'Área raspada até o reboco firme',
        'Fungicida aplicado e seco',
        'Fundo preparador ou impermeabilizante aplicado',
        'Massa acrílica lixada e limpa sem pó'
      ]
    }
  },
  {
    id: 'cimento-queimado-perfeito',
    type: 'guide',
    category: 'efeitos',
    title: 'Cimento Queimado Sem Manchas Nem Rebarbas',
    subtitle: 'O segredo da queima, ferramentas com canto arredondado e espessura milimétrica.',
    readTimeOrDuration: '5 min de leitura',
    badge: 'Efeito de Alto Padrão',
    level: 'Intermediário',
    featured: true,
    authorOrSource: 'Especialista em Efeitos PINTOR PRO',
    description: 'Guia definitivo de como aplicar a massa de efeito decorativo garantindo nuances elegantes sem riscos indesejados da desempenadeira.',
    guideContent: {
      summary: 'O cimento queimado é um dos efeitos mais requisitados em apartamentos de alto padrão e permite cobrar até 3x mais por metro quadrado do que uma pintura convencional. O segredo está na pressão e no tipo de desempenadeira.',
      toolsNeeded: [
        'Desempenadeira de aço inox com cantos arredondados (borda chanfrada)',
        'Espátula de inox',
        'Fita crepe automotiva verde ou azul',
        'Lixas grão 400 e 600',
        'Cera de carnaúba ou verniz acrílico fosco'
      ],
      steps: [
        {
          title: '1. Preparação da Base (Fundo Homogêneo)',
          description: 'A parede deve estar perfeitamente nivelada, selada e com fundo fosco na cor aproximada do cimento queimado. Qualquer ondulação na massa corrida aparecerá no efeito.',
          tip: 'Pinte a parede com uma demão de tinta acrílica cinza antes de começar o efeito; isso evita que o fundo branco apareça em falhas milimétricas.'
        },
        {
          title: '2. Primeira Demão: Cobertura Rasa',
          description: 'Aplique a massa especial de cimento queimado em camadas finíssimas, fazendo movimentos curtos e aleatórios em meia-lua. Mantenha a desempenadeira em ângulo de 30° a 45°. Não tente queimar agora, apenas cubra.',
          warning: 'Nunca use desempenadeira de cantos retos comuns; ela deixa riscos pretos nas bordas que estragam o efeito.'
        },
        {
          title: '3. Segunda Demão: O Desenho das Manchas',
          description: 'Após 3 a 4 horas de secagem, aplique a segunda demão em pontos menores, retirando o excesso imediatamente com a lâmina quase deitada. É essa raspagem suave que cria o contraste clássico de claro e escuro.',
          tip: 'Trabalhe sempre de cima para baixo e sem parar no meio de uma parede para não criar emendas.'
        },
        {
          title: '4. Polimento e Proteção Final',
          description: 'Após secagem de 24h, faça um lixamento leve com lixa 600 só para remover poeira de ponta. Em seguida, queime com a própria lâmina limpa de inox ou aplique cera de carnaúba com flanela para toque aveludado.'
        }
      ],
      proTips: [
        'Para ambientes externos ou lavabos, finalize com verniz poliuretano base água ou resina acrílica para hidro-repelência.',
        'Ao orçar cimento queimado, inclua a proteção total do piso, pois respingos de resina são difíceis de remover.'
      ]
    }
  },
  {
    id: 'preparacao-drywall-gesso',
    type: 'guide',
    category: 'tecnica',
    title: 'Preparação de Drywall e Gesso Novo sem Descascar',
    subtitle: 'Por que o selador comum descasca no gesso e como selar a poeira corretamente.',
    readTimeOrDuration: '4 min de leitura',
    badge: 'Norma Técnica',
    level: 'Iniciante',
    authorOrSource: 'Normas ABNT & Prática de Campo',
    description: 'Aprenda a diferença crucial entre Fundo Preparador e Selador Acrílico em placas de gesso e juntas de drywall recém-instaladas.',
    guideContent: {
      summary: 'Gesso novo e drywall soltam um pó fino constante. Aplicar tinta ou selador comum diretamente sobre esse pó cria uma película solta que descasca como papel no primeiro puxão de fita crepe.',
      toolsNeeded: [
        'Fundo preparador à base de água ou solvente',
        'Rolo de lã de pelo baixo (anti-gota)',
        'Lâmpada LED ou refletor para luz rasante',
        'Massa para junta e fita de papel microperfurada'
      ],
      steps: [
        {
          title: '1. Tempo de Cura e Poeira Residual',
          description: 'Gesso liso aplicado em alvenaria precisa de no mínimo 30 dias de cura para perder a alcalinidade. Em drywall, limpe todo o pó das placas com pano levemente umedecido ou vassoura macia.',
          warning: 'Selador comum não penetra na poeira de gesso. Ele empasta e solta em placas.'
        },
        {
          title: '2. Aplicação Rigorosa de Fundo Preparador',
          description: 'O Fundo Preparador possui partículas microscópicas que entram nos poros do gesso e aglutinam a poeira, transformando-a em uma base sólida e aderente para a massa ou tinta.',
          tip: 'Dilua rigorosamente conforme a embalagem do fabricante. Fundo preparador puro demais pode vitrificar e repelir a tinta seguinte.'
        },
        {
          title: '3. Conferência com Luz Rasante',
          description: 'Coloque uma lâmpada ou refletor encostado na parede iluminando de lado. Todas as imperfeições e emendas de placa ficarão visíveis para correção antes da pintura final.'
        }
      ]
    }
  },
  {
    id: 'precificacao-m2-sem-prejuizo',
    type: 'guide',
    category: 'negocios',
    title: 'Como Calcular o Valor do m² Sem Tomar Prejuízo na Obra',
    subtitle: 'A fórmula matemática simples para não pagar para trabalhar e saber cobrar o valor justo.',
    readTimeOrDuration: '5 min de leitura',
    badge: 'Finanças PRO',
    level: 'Essencial',
    featured: true,
    authorOrSource: 'Gestão Financeira PINTOR PRO',
    description: 'Pare de chutar orçamentos no olho. Aprenda a calcular sua diária técnica, custos ocultos e margem de segurança.',
    guideContent: {
      summary: 'Muitos pintores excelentes fecham obras no prejuízo porque não calculam deslocamento, dias de chuva, preparação demorada e custos com ajudante. Use a fórmula oficial da PINTOR PRO.',
      steps: [
        {
          title: '1. Defina o seu "Salário Alvo" Mensal',
          description: 'Quanto você precisa faturar limpo por mês para viver com tranquilidade e reinvestir em ferramentas? Divida esse valor por 20 dias úteis de trabalho. Essa é a sua Diária Mínima Base (DMB).',
          tip: 'Exemplo: Quero R$ 6.000,00 limpos / 20 dias = R$ 300,00 por dia de diária técnica do mestre.'
        },
        {
          title: '2. Adicione os Custos Operacionais Diários (COD)',
          description: 'Some transporte diário (combustível/passagem), alimentação, desgaste de lixas/fitas/rolos e ajudante (se houver).',
          tip: 'Exemplo: R$ 300 (você) + R$ 120 (ajudante) + R$ 50 (transporte e café) + R$ 30 (ferramentas) = Custo Real por Dia: R$ 500,00.'
        },
        {
          title: '3. Calcule o Rendimento Real da Obra (m²/dia)',
          description: 'Uma parede lisa nova rende 40 a 60 m²/dia por homem. Uma parede com muita massa corrida, lixamento e recorte em gesso rende 15 a 25 m²/dia. Calcule quantos dias reais a obra vai demorar.',
          warning: 'Nunca orce sem ver o estado real das paredes ou solicitar fotos claras com luz rasante.'
        },
        {
          title: '4. Aplique a Margem de Segurança (15% a 20%)',
          description: 'Em reformas sempre acontecem imprevistos: atraso na entrega de tinta pelo cliente, chuva em áreas externas ou correções de última hora. Adicione 20% sobre o total de dias estimados.'
        }
      ],
      proTips: [
        'Rodapés, portas e molduras de teto não devem ser cobrados por metro quadrado, mas sim por METRO LINEAR ou por UNIDADE, pois o tempo de recorte é muito maior que o de rolagem.',
        'Ao entregar a proposta, liste tudo o que está e o que NÃO ESTÁ incluso (ex: "Não inclui reparo elétrico ou troca de fechaduras").'
      ]
    }
  },
  {
    id: 'padrao-atendimento-obra-limpa',
    type: 'guide',
    category: 'negocios',
    title: 'O Padrão de Obra Limpa: Como Fazer o Cliente Pagar Mais com Sorriso no Rosto',
    subtitle: 'Por que clientes exigentes valorizam mais a organização e proteção do que a velocidade.',
    readTimeOrDuration: '3 min de leitura',
    badge: 'Atendimento Elite',
    level: 'Essencial',
    authorOrSource: 'Padrão de Qualidade PINTOR PRO',
    description: 'Passo a passo de forração profissional, rotina diária de limpeza e como pedir avaliações 5 estrelas sem constrangimento.',
    guideContent: {
      summary: 'A reclamação número 1 dos clientes sobre prestadores de serviços de reforma não é a cor da tinta, mas a sujeira, pó e respingos em pisos e móveis. Quem domina a proteção vira o pintor mais indicado da região.',
      steps: [
        {
          title: '1. O Kit Obrigatório de Proteção',
          description: 'Use papelão ondulado ou manta salva-piso no chão fixado com fita crepe automotiva. Lonas plásticas leves devem ser usadas exclusivamente para cobrir móveis, nunca para o piso (lona no piso rasga e escorrega).',
          tip: 'Invista R$ 80 em um rolo de plástico eletrostático com fita acoplada (fita adesiva com filme). Protege janelas em 2 minutos.'
        },
        {
          title: '2. A Regra dos Últimos 20 Minutos do Dia',
          description: 'Nunca saia da obra largando ferramentas espalhadas. Pare 20 minutos antes do fim do expediente, junte o lixo em saco reforçado, varra o pó e alinhe baldes e escadas num canto organizado.',
          tip: 'O cliente chega do trabalho no fim da tarde. Ver a casa organizada transmite segurança e justifica seu valor.'
        },
        {
          title: '3. A Entrega e o Pedido de Avaliação',
          description: 'No último dia, faça uma vistoria acompanhada com o cliente. Após ele elogiar o serviço, envie imediatamente o link do seu perfil na PINTOR PRO pelo WhatsApp pedindo a avaliação com fotos.'
        }
      ]
    }
  },

  // 2. MODELOS & FERRAMENTAS PARA COPIAR / BAIXAR
  {
    id: 'modelo-contrato-pintura',
    type: 'tool',
    category: 'modelos',
    title: 'Modelo Oficial de Contrato de Prestação de Serviços de Pintura',
    subtitle: 'Proteja-se contra inadimplência, retrabalho gratuito e alterações de escopo.',
    readTimeOrDuration: 'Pronto para uso',
    badge: 'Documento Jurídico',
    level: 'Essencial',
    featured: true,
    authorOrSource: 'Jurídico PINTOR PRO',
    description: 'Contrato completo em formato de texto claro e direto. Basta preencher os dados, copiar para o WhatsApp ou imprimir para assinatura.',
    toolContent: {
      format: 'Texto / Word / WhatsApp',
      instructions: 'Substitua os campos entre colchetes [COMO ESTE] com os dados da sua obra. Você pode copiar o texto completo com 1 clique e enviar diretamente para o cliente aprovar.',
      textToCopy: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PINTURA IMOBILIÁRIA

CONTRATANTE: [Nome do Cliente], CPF: [000.000.000-00], Telefone: [(__) _____-____], Endereço da Obra: [Rua, Número, Bairro, Cidade - UF].

CONTRATADO: [Seu Nome ou Nome da sua Empresa], CPF/CNPJ: [000.000.000-00], Telefone: [(__) _____-____].

CLÁUSULA 1ª - DO OBJETO E ESCOPO
O presente contrato tem por objeto a execução de serviços especializados de pintura no imóvel acima citado, compreendendo exclusivamente os seguintes serviços:
- [Ex: Lixamento e aplicação de 2 demãos de tinta acrílica em todas as paredes internas (salas e quartos)]
- [Ex: Aplicação de massa corrida pontual e pintura de tetos]
- [Ex: Aplicação de efeito cimento queimado na parede de destaque da sala]

Parágrafo Único: Qualquer serviço adicional não discriminado neste contrato (ex: pintura de portas, grades, áreas externas ou reparos elétricos/hidráulicos) será objeto de orçamento e termo aditivo à parte.

CLÁUSULA 2ª - DOS MATERIAIS
O fornecimento de tintas, massas, fitas, lixas, lonas e solventes é de responsabilidade exclusiva do(a) [CONTRATANTE / CONTRATADO], devendo estar disponíveis no local antes do início dos trabalhos. Ferramentas de aplicação (rolos, pincéis, escadas, desempenadeiras) são de responsabilidade do CONTRATADO.

CLÁUSULA 3ª - DO PRAZO
Os serviços terão início no dia [DD/MM/AAAA], com previsão de conclusão estimada para [DD/MM/AAAA], ressalvados atrasos decorrentes de chuvas (em áreas externas), falta de materiais ou atrasos na liberação do imóvel.

CLÁUSULA 4ª - DO VALOR E FORMA DE PAGAMENTO
Pela execução dos serviços descritos, o(a) CONTRATANTE pagará ao CONTRATADO o valor total de R$ [_____,__] ([valor por extenso]), dividido da seguinte forma:
- Entrada (início dos trabalhos): R$ [_____,__] via PIX/Transferência;
- Parcela intermediária (na fase de acabamento/50% da obra): R$ [_____,__];
- Parcela final (na entrega da obra após vistoria): R$ [_____,__].

CLÁUSULA 5ª - DA GARANTIA E VISTORIA FINAL
O CONTRATADO concede garantia técnica de 90 (noventa) dias sobre a mão de obra aplicada, contados a partir da data de entrega e assinatura do Termo de Vistoria, excluindo-se problemas oriundos de infiltrações estruturais pré-existentes, mau uso ou movimentação do imóvel.

Por estarem justos e contratados, assinam o presente instrumento.

Local: [Cidade - UF], Data: [DD/MM/AAAA].

___________________________________________
[Nome do Contratante]

___________________________________________
[Seu Nome / PINTOR PRO]`
    }
  },
  {
    id: 'termo-vistoria-entrega',
    type: 'tool',
    category: 'modelos',
    title: 'Termo de Vistoria de Entrega e Recebimento de Obra',
    subtitle: 'O documento que comprova que o cliente aprovou o acabamento e libera o pagamento final.',
    readTimeOrDuration: 'Pronto para uso',
    badge: 'Segurança PRO',
    level: 'Essencial',
    authorOrSource: 'Padrão Operacional PINTOR PRO',
    description: 'Evite que o cliente te chame 3 meses depois cobrando reparo de arranhão feito por montadores de móveis.',
    toolContent: {
      format: 'Texto para WhatsApp ou Assinatura Física',
      instructions: 'Ao finalizar a obra, caminhe com o cliente pelos cômodos, preencha a data e colete o aceite por escrito ou confirmação de WhatsApp.',
      textToCopy: `TERMO DE VISTORIA E RECEBIMENTO FINAL DE SERVIÇOS DE PINTURA

Eu, [Nome do Cliente], proprietário/responsável pelo imóvel localizado em [Endereço Completo], declaro para os devidos fins que:

1. Realizei nesta data, juntamente com o profissional [Seu Nome], a vistoria final e detalhada de todos os serviços de pintura contratados;
2. Os acabamentos, recortes, tonalidades e uniformidade de paredes, tetos e detalhes foram inspecionados e APROVADOS integralmente, atendendo ao padrão acordado;
3. O imóvel foi entregue limpo, desobstruído de ferramentas e com as proteções retiradas;
4. Reconheço a conclusão integral do contrato, autorizando a quitação da parcela final no valor de R$ [_____,__].

Ressalvas ou pequenos retoques combinados (se houver):
[Nenhuma ressalva / ou listar pontos específicos com prazo para ajuste].

Data: [DD/MM/AAAA]

Assinatura do Cliente: _____________________________________
Assinatura do Pintor: ______________________________________`
    }
  },
  {
    id: 'tabela-rendimento-tintas',
    type: 'tool',
    category: 'modelos',
    title: 'Tabela Rápida de Rendimento e Consumo Médio por m²',
    subtitle: 'Calcule a quantidade exata de galões e latas sem faltar e sem sobrar material.',
    readTimeOrDuration: 'Tabela de Bolso',
    badge: 'Cálculo Rápido',
    level: 'Essencial',
    authorOrSource: 'Engenharia de Aplicação PINTOR PRO',
    description: 'Referência rápida de consumo médio por demão para orçamentos e listas de materiais confiáveis.',
    toolContent: {
      format: 'Tabela Prática',
      instructions: 'Considere sempre 2 a 3 demãos para cobertura perfeita. Divida a área total pelo rendimento acabado indicado abaixo.',
      textToCopy: `TABELA DE RENDIMENTO MÉDIO ACABADO (2 A 3 DEMÃOS)

1. Tinta Acrílica Premium Fosca (Lata 18L):
- Reboco novo selado: 90 a 110 m² acabados
- Repintura lisa sobre parede clara: 130 a 150 m² acabados
- Parede com massa corrida/gesso: 120 a 140 m² acabados

2. Tinta Acrílica Semi-brilho / Acetinada (Lata 18L):
- Rende em média 110 a 130 m² acabados (exige parede perfeitamente emassada)

3. Esmalte Sintético / Base Água (Galão 3,6L):
- Portas de madeira (ambos os lados): cerca de 4 a 5 portas completas por galão
- Grades e portões metálicos: 15 a 20 m² acabados por galão

4. Massa Corrida / Acrílica (Barrica 25kg):
- Nivelamento completo (2 demãos finas): 20 a 30 m² por barrica
- Apenas correção pontual e furos: 60 a 80 m²

5. Fundo Preparador de Paredes (Galão 3,6L):
- Rendimento: 35 a 55 m² por demão (o fundo preparador aplica-se em demão única bem esticada).

Dica PINTOR PRO: Sempre adicione 10% de margem técnica para recortes e absorção irregular.`
    }
  },

  // 3. CURADORIA DE VÍDEOS DE GRANDES FABRICANTES (YOUTUBE)
  {
    id: 'video-cimento-queimado-oficial',
    type: 'video',
    category: 'efeitos',
    title: 'Aula Prática: Efeito Cimento Queimado Passo a Passo',
    subtitle: 'Demonstração técnica de aplicação, espalhamento e queima correta.',
    readTimeOrDuration: 'Vídeo Oficial • 8 min',
    badge: 'Curadoria de Fabricante',
    level: 'Intermediário',
    authorOrSource: 'Canal Oficial Fabricante Parceiro',
    description: 'Veja na prática como segurar a desempenadeira, a quantidade certa de produto e como evitar emendas visíveis na parede.',
    videoContent: {
      youtubeId: '9bZkp7q19f0',
      channel: 'Tintas Suvinil Oficial',
      keyTakeaways: [
        'Desempenadeira de inox chanfrada evita riscos escuros nas bordas.',
        'A primeira demão deve ser contínua em toda a parede sem pausas.',
        'A queima acontece na segunda demão com a lâmina limpa e sem excesso de produto.'
      ]
    }
  },
  {
    id: 'video-airless-iniciante',
    type: 'video',
    category: 'tecnica',
    title: 'Guia de Entrada na Pintura Mecanizada Airless',
    subtitle: 'Como regular pressão, escolher bico e pintar 3x mais rápido sem névoa excessiva.',
    readTimeOrDuration: 'Vídeo Oficial • 12 min',
    badge: 'Tecnologia em Obra',
    level: 'Avançado',
    authorOrSource: 'Wagner / Especialistas Airless Brasil',
    description: 'Tudo o que você precisa saber antes de comprar sua primeira máquina airless: manutenção, tipos de bicos e diluição.',
    videoContent: {
      youtubeId: 'fJ9rUzIMcZQ',
      channel: 'Wagner Brasil / PINTOR PRO Curadoria',
      keyTakeaways: [
        'A pressão excessiva não cobre mais, apenas gera névoa e gasta tinta.',
        'Mantenha a pistola sempre a 30 cm perpendicular à parede.',
        'A limpeza do filtro do punho e do pescador deve ser feita todo final de expediente.'
      ]
    }
  }
];

export const Academy: React.FC<AcademyProps> = ({ setPage }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | Category>('all');
  const [selectedType, setSelectedType] = useState<'all' | ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeItem, setActiveItem] = useState<AcademyItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readCompletedIds, setReadCompletedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pintor_pro_academy_completed');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleReadCompleted = (id: string) => {
    setReadCompletedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('pintor_pro_academy_completed', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleDownloadTxt = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredItems = useMemo(() => {
    return ACADEMY_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return matchesCategory && matchesType && matchesSearch;
    });
  }, [selectedCategory, selectedType, searchQuery]);

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Top Banner Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-[#180d24] via-slate-950 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#9A077B]/15 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9A077B]/20 border border-[#9A077B]/40 text-[#f39ce0] text-xs font-black uppercase tracking-widest mb-6">
              <Award size={16} className="text-[#C93EA6]" />
              PINTOR PRO Academy • Centro Oficial de Capacitação
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
              Domine a Técnica, a Gestão e{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C93EA6] via-[#f178cf] to-[#ffb8ee]">
                Venda Obras de Alto Padrão
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mb-10">
              Manuais de campo objetivos, modelos prontos de contratos para usar no WhatsApp e curadoria de conhecimentos das maiores marcas de tintas do país.
            </p>

            {/* Destaques rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <Clock size={24} />
                </div>
                <div className="text-sm font-bold text-white">Leitura Rápida</div>
                <div className="text-xs text-slate-400">3 a 5 min no celular</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <FileText size={24} />
                </div>
                <div className="text-sm font-bold text-white">Modelos Prontos</div>
                <div className="text-xs text-slate-400">Contratos e checklists</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <TrendingUp size={24} />
                </div>
                <div className="text-sm font-bold text-white">Mais Lucro</div>
                <div className="text-xs text-slate-400">Precificação sem erro</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-sm font-bold text-white">100% Grátis</div>
                <div className="text-xs text-slate-400">Para membros PRO</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Busca e Filtros */}
      <section className="py-8 bg-slate-900/60 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Campo de Busca */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar (ex: umidade, cimento, contrato, m²)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C93EA6] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filtro de Formato / Tipo */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedType === 'all'
                    ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedType('guide')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedType === 'guide'
                    ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BookOpen size={14} />
                Manuais Técnicos
              </button>
              <button
                onClick={() => setSelectedType('tool')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedType === 'tool'
                    ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText size={14} />
                Modelos & Contratos
              </button>
              <button
                onClick={() => setSelectedType('video')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedType === 'video'
                    ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Video size={14} />
                Aulas Recomendadas
              </button>
            </div>
          </div>

          {/* Subfiltros de Tema */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60 overflow-x-auto text-xs">
            <span className="text-slate-400 font-semibold mr-1">Filtrar por Tema:</span>
            {[
              { key: 'all', label: 'Todos os Temas' },
              { key: 'tecnica', label: '🛠️ Superfícies & Patologias' },
              { key: 'efeitos', label: '🎨 Efeitos Decorativos' },
              { key: 'negocios', label: '💼 Precificação & Negócios' },
              { key: 'modelos', label: '📥 Contratos & Checklists' }
            ].map((theme) => (
              <button
                key={theme.key}
                onClick={() => setSelectedCategory(theme.key as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                  selectedCategory === theme.key
                    ? 'bg-slate-800 text-white border border-[#9A077B]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lista de Conteúdos da Academy */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 max-w-xl mx-auto p-8">
            <HelpCircle size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum conteúdo encontrado</h3>
            <p className="text-slate-400 text-sm mb-6">
              Não encontramos nenhum material com o termo "{searchQuery}". Tente usar palavras como "umidade", "cimento", "contrato" ou limpe os filtros.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedType('all');
              }}
              className="px-6 py-2.5 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-full text-xs font-bold transition"
            >
              Ver Todos os Conteúdos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isCompleted = readCompletedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 group relative overflow-hidden"
                >
                  {/* Linha superior com tags */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-800 text-[#f178cf] border border-[#9A077B]/30">
                        {item.type === 'guide' && <BookOpen size={12} />}
                        {item.type === 'tool' && <FileCheck size={12} />}
                        {item.type === 'video' && <Video size={12} />}
                        {item.badge}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {item.readTimeOrDuration}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-[#f39ce0] transition mb-2.5 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mb-6">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400">
                        Nível: <strong className="text-slate-200">{item.level}</strong>
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                          <Check size={10} /> Concluído
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveItem(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#9A077B] hover:bg-[#b0138f] transition shadow-md shadow-[#9A077B]/20"
                    >
                      {item.type === 'guide' && 'Ler Manual'}
                      {item.type === 'tool' && 'Ver & Copiar'}
                      {item.type === 'video' && 'Assistir'}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Seção Estratégica: Por que a Academy valoriza o seu Perfil */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-[#1e0f2d] to-slate-900 border border-[#9A077B]/40 rounded-[32px] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9A077B]/30 border border-[#9A077B]/50 text-[#f39ce0] text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles size={14} />
                  Diferencial Competitivo no Marketplace
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
                  Clientes de alto padrão pagam até 3x mais por quem tem{' '}
                  <span className="text-[#C93EA6]">Método e Segurança</span>
                </h2>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                  A maioria das disputas de preço na pintura acontece porque o cliente não enxerga a diferença técnica entre um aplicador amador e um mestre pintor. Ao aplicar os contratos oficiais, checklists de entrega e diagnósticos da PINTOR PRO Academy, você transmite autoridade imediata desde a primeira conversa.
                </p>

                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-200">
                  <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Zero prejuízos com cálculo de m²
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Contratos assinados sem dor de cabeça
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Indicações automáticas de clientes satisfeitos
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
                <div className="w-full max-w-sm bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-center">
                  <Award size={40} className="text-[#C93EA6] mx-auto mb-3" />
                  <h4 className="text-white font-black text-base mb-1">Quer receber mais obras?</h4>
                  <p className="text-slate-400 text-xs mb-4">
                    Mantenha seu portfólio sempre atualizado na PINTOR PRO e destaque suas especialidades técnicas.
                  </p>
                  {setPage && (
                    <button
                      onClick={() => setPage(Page.Register)}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-black transition"
                    >
                      Cadastrar / Atualizar Portfólio
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MODAL 1: LEITOR DE MANUAL TÉCNICO COMPLETO */}
      {/* ============================================================ */}
      {activeItem && activeItem.type === 'guide' && activeItem.guideContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Cabeçalho do Modal */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#9A077B]/20 text-[#f39ce0] border border-[#9A077B]/40">
                    {activeItem.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{activeItem.readTimeOrDuration}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeItem.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{activeItem.authorOrSource}</p>
              </div>

              <button
                onClick={() => setActiveItem(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Artigo / Leitura */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
              {/* Resumo */}
              <div className="bg-slate-950/80 border-l-4 border-[#9A077B] p-4 rounded-r-2xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#f39ce0] mb-1">
                  Resumo Executivo para a Obra
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm font-medium">
                  {activeItem.guideContent.summary}
                </p>
              </div>

              {/* Ferramentas Necessárias */}
              {activeItem.guideContent.toolsNeeded && (
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-2 flex items-center gap-1.5">
                    <Layers size={14} className="text-[#C93EA6]" />
                    Ferramentas & Materiais Recomendados
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                    {activeItem.guideContent.toolsNeeded.map((tool, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C93EA6]" />
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Passos Detalhados */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Passo a Passo Prático de Aplicação
                </h4>
                {activeItem.guideContent.steps.map((step, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <h5 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#9A077B] text-white flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </span>
                      {step.title}
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-300 pl-8">
                      {step.description}
                    </p>

                    {step.tip && (
                      <div className="ml-8 mt-2 p-3 bg-[#9A077B]/10 border border-[#9A077B]/30 rounded-xl text-xs text-slate-200 flex items-start gap-2">
                        <span className="text-amber-400 text-sm">💡</span>
                        <div>
                          <strong className="text-[#f39ce0]">Dica de Ouro PRO:</strong> {step.tip}
                        </div>
                      </div>
                    )}

                    {step.warning && (
                      <div className="ml-8 mt-2 p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-200 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-red-300">Atenção / Erro Comum:</strong> {step.warning}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dicas Gerais */}
              {activeItem.guideContent.proTips && activeItem.guideContent.proTips.length > 0 && (
                <div className="bg-gradient-to-r from-slate-950 via-[#190b24] to-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#f39ce0] mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    Padrão de Qualidade PINTOR PRO
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeItem.guideContent.proTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#C93EA6] font-bold">✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => toggleReadCompleted(activeItem.id)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 ${
                  readCompletedIds.includes(activeItem.id)
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {readCompletedIds.includes(activeItem.id) ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    Manual Marcado como Concluído
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Marcar como Estudado
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveItem(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-full text-xs font-bold transition"
              >
                Fechar Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: VISUALIZADOR E COPIADOR DE MODELOS / CONTRATOS */}
      {/* ============================================================ */}
      {activeItem && activeItem.type === 'tool' && activeItem.toolContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Topo do Modal */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    {activeItem.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{activeItem.toolContent.format}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeItem.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{activeItem.toolContent.instructions}</p>
              </div>

              <button
                onClick={() => setActiveItem(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Área de Visualização do Texto */}
            <div className="p-6 overflow-y-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all max-h-96 overflow-y-auto">
                {activeItem.toolContent.textToCopy}
              </div>
            </div>

            {/* Barra de Ações de Cópia e Download */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 text-center sm:text-left">
                💡 Clique em "Copiar Texto" e cole diretamente no WhatsApp do seu cliente ou no Word.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() =>
                    handleDownloadTxt(activeItem.toolContent!.textToCopy, activeItem.id)
                  }
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  Baixar .TXT
                </button>

                <button
                  onClick={() =>
                    handleCopyText(activeItem.toolContent!.textToCopy, activeItem.id)
                  }
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#9A077B]/20"
                >
                  {copiedId === activeItem.id ? (
                    <>
                      <Check size={14} className="text-emerald-300" />
                      Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copiar Texto Formatado
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: PLAYER DE VÍDEO CURADO (YOUTUBE EMBED) */}
      {/* ============================================================ */}
      {activeItem && activeItem.type === 'video' && activeItem.videoContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950/60 text-red-300 border border-red-800/40 mb-2 inline-block">
                  {activeItem.badge} • {activeItem.videoContent.channel}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {activeItem.title}
                </h2>
              </div>

              <button
                onClick={() => setActiveItem(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Vídeo Responsivo */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${activeItem.videoContent.youtubeId}`}
                  title={activeItem.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Destaques do Vídeo */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#f39ce0] mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Principais Lições Desta Aula
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                  {activeItem.videoContent.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#C93EA6] font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <a
                href={`https://www.youtube.com/watch?v=${activeItem.videoContent.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
              >
                <ExternalLink size={14} />
                Abrir no YouTube
              </a>

              <button
                onClick={() => setActiveItem(null)}
                className="px-6 py-2 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-full text-xs font-bold transition"
              >
                Fechar Vídeo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
