import { PINTOR_PRO_LEGAL_CONFIG } from './legalConfig';

export type LegalSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

export type FAQItem = {
  category: string;
  question: string;
  answer: string;
};

const company = PINTOR_PRO_LEGAL_CONFIG;

export const legalContactSummary = [
  `Razao social: ${company.companyName}`,
  `Nome fantasia: ${company.tradeName}`,
  `CNPJ: ${company.cnpj}`,
  `Endereco empresarial: ${company.businessAddress}`,
  `Cidade/UF: ${company.cityState}`,
  `Suporte: ${company.supportEmail}`,
  `Privacidade e LGPD: ${company.privacyEmail}`,
  `Canal de privacidade: ${company.privacyOfficer}`,
  `Dominio oficial: ${company.officialDomain}`,
  `Ultima atualizacao: ${company.documentsLastUpdatedAt}`
];

export const termsSections: LegalSection[] = [
  {
    id: 'identificacao',
    title: '1. Identificacao da plataforma',
    body: [
      'A Pintor Pro e uma plataforma tecnologica que conecta clientes interessados em servicos de pintura a pintores profissionais cadastrados.',
      'A Pintor Pro nao executa servicos de pintura, nao emprega pintores, nao define valores dos servicos e nao participa diretamente das negociacoes entre clientes e pintores.'
    ],
    bullets: legalContactSummary
  },
  {
    id: 'aceitacao',
    title: '2. Aceitacao dos termos',
    body: [
      'Ao criar uma conta ou utilizar funcionalidades autenticadas, o usuario declara que leu e concordou com estes Termos de Uso e com a Politica de Privacidade.',
      'O aceite deve ser realizado de forma ativa, sem caixas previamente marcadas.'
    ]
  },
  {
    id: 'requisitos',
    title: '3. Requisitos de uso',
    body: ['O usuario deve ter capacidade legal, informar dados verdadeiros, manter a conta atualizada, proteger sua senha e usar a plataforma de maneira licita.'],
    bullets: ['Cadastro independente permitido apenas para maiores de 18 anos.', 'A conta e pessoal e nao deve ser compartilhada.', 'Acessos suspeitos devem ser comunicados ao suporte.']
  },
  {
    id: 'natureza',
    title: '4. Natureza da Pintor Pro',
    body: ['A Pintor Pro fornece tecnologia para aproximar clientes e pintores independentes. A plataforma nao e parte dos contratos de pintura celebrados entre usuarios.'],
    bullets: ['Nao e empresa de pintura.', 'Nao contrata pintores em nome de clientes.', 'Nao representa clientes ou pintores.', 'Nao estabelece precos.', 'Nao recebe pagamentos dos servicos de pintura.', 'Nao garante contratacao, execucao ou qualidade do servico.']
  },
  {
    id: 'pintores',
    title: '5. Cadastro do pintor',
    body: ['O cadastro inicial do pintor e gratuito. O profissional e responsavel pela veracidade das informacoes, portfolio, fotografias, experiencia e documentos enviados.'],
    bullets: ['O pintor deve possuir capacidade tecnica e condicoes de seguranca para os servicos que oferece.', 'Conteudos copiados, falsos, ofensivos ou ilegais podem ser removidos.']
  },
  {
    id: 'teste-assinatura',
    title: '6. Teste gratuito e assinatura',
    body: [
      `O pintor recebe teste gratuito de 30 dias e, apos o vencimento, carencia adicional de ${company.subscriptionGracePeriodDays} dias para regularizar a assinatura.`,
      'Ao final da carencia, sem assinatura ativa, o dashboard profissional sera parcialmente bloqueado, mantendo acesso a pagamento, suporte e documentos legais.'
    ],
    bullets: ['Nao ha cobranca automatica sem contratacao expressa.', 'O acesso completo retorna apos confirmacao de pagamento valido.', 'O perfil publico pode ficar oculto enquanto a assinatura estiver inativa.']
  },
  {
    id: 'planos',
    title: '7. Planos, precos e renovacao',
    body: ['Antes da contratacao, a plataforma deve informar valor total, periodicidade, recursos, forma de pagamento, vencimento, regras de cancelamento e consequencias da inadimplencia.']
  },
  {
    id: 'cancelamento',
    title: '8. Cancelamento da assinatura',
    body: ['O cancelamento da assinatura deve ser solicitado pelo dashboard quando disponivel ou pelo suporte. O cancelamento da renovacao nao exclui automaticamente a conta.']
  },
  {
    id: 'inadimplencia',
    title: '9. Inadimplencia e bloqueio',
    body: ['Em caso de falta de pagamento, a Pintor Pro podera enviar avisos, aplicar a carencia configurada, bloquear recursos profissionais e restaurar o acesso apos regularizacao.']
  },
  {
    id: 'clientes',
    title: '10. Cadastro e utilizacao pelo cliente',
    body: ['Clientes podem pesquisar perfis publicos sem cadastro. Para mensagens, visitas, orcamentos, avaliacoes e negociacoes, o cliente deve estar autenticado e fornecer dados verdadeiros.']
  },
  {
    id: 'negociacoes',
    title: '11. Orcamentos, visitas, contratos e pagamentos',
    body: ['Solicitacoes, mensagens, orcamentos, visitas e contratos sao negociados diretamente entre cliente e pintor. A Pintor Pro apenas fornece ferramentas tecnologicas de registro e comunicacao.'],
    bullets: ['A Pintor Pro nao define o valor do orcamento.', 'O pagamento do servico de pintura deve ser feito diretamente ao pintor.', 'A plataforma nao garante pagamento, estorno, execucao ou conclusao da obra.']
  },
  {
    id: 'conduta',
    title: '12. Comunicacao, seguranca e suspensao',
    body: ['Mensagens podem ser registradas para operacao, seguranca, suporte, prevencao de fraude e exercicio de direitos. Contas podem ser limitadas, suspensas ou excluidas em caso de fraude, golpe, assedio, discriminacao, conteudo ilegal ou violacao dos termos.']
  },
  {
    id: 'responsabilidades',
    title: '13. Responsabilidades',
    body: ['O pintor responde pela execucao, qualidade tecnica, seguranca e garantias oferecidas. O cliente responde pela veracidade das informacoes, acesso ao imovel e pagamentos acordados. A Pintor Pro responde pela operacao dos recursos tecnologicos sob sua responsabilidade.']
  },
  {
    id: 'limitacoes',
    title: '14. Limitacoes legais',
    body: ['As limitacoes previstas nestes Termos serao aplicadas somente na extensao permitida pela legislacao brasileira. Nenhuma disposicao destes Termos afasta direitos ou responsabilidades que nao possam ser legalmente excluidos.']
  },
  {
    id: 'alteracoes',
    title: '15. Alteracoes e contato',
    body: ['A Pintor Pro podera atualizar estes Termos. Alteracoes relevantes devem ser comunicadas e, quando necessario, exigir novo aceite. Duvidas devem ser enviadas ao canal de suporte informado nesta pagina.']
  }
];

export const privacySections: LegalSection[] = [
  { id: 'controlador', title: '1. Quem controla os dados', body: ['A controladora dos dados da plataforma Pintor Pro e a empresa identificada abaixo.'], bullets: legalContactSummary },
  { id: 'dados', title: '2. Quais dados podem ser coletados', body: ['Podemos tratar dados de cadastro, dados profissionais de pintores, dados de clientes, dados de negociacao, dados tecnicos e dados de assinatura.'], bullets: ['Nome, e-mail, telefone, endereco, cidade, estado e foto.', 'Portfolio, experiencia, regioes atendidas, documentos de verificacao e status do perfil.', 'Mensagens, anexos, orcamentos, propostas, contratos, aceites e historico.', 'IP, navegador, dispositivo, logs, cookies e eventos de seguranca.'] },
  { id: 'origem', title: '3. Como os dados sao obtidos', body: ['Os dados podem ser fornecidos diretamente pelo usuario, gerados durante o uso, recebidos por prestadores de pagamento, ferramentas de seguranca, analise ou integracoes autorizadas.'] },
  { id: 'finalidades', title: '4. Para quais finalidades usamos dados', body: ['Usamos dados para criar contas, exibir perfis, permitir buscas, processar assinaturas, operar chat, visitas, orcamentos, contratos, suporte, seguranca, prevencao de fraude, notificacoes, melhoria da plataforma e cumprimento legal.'] },
  { id: 'bases', title: '5. Bases legais', body: ['As bases legais podem incluir execucao de contrato, procedimentos preliminares, cumprimento legal, exercicio regular de direitos, legitimo interesse, consentimento quando necessario, protecao do credito e prevencao a fraude.'] },
  { id: 'publicos', title: '6. Dados publicos dos pintores', body: ['Informacoes profissionais podem aparecer publicamente, como nome profissional, foto, cidade, regioes atendidas, servicos, biografia, portfolio, avaliacoes e selos. CPF, senha, documentos, dados bancarios e informacoes internas de assinatura nao devem ser publicos.'] },
  { id: 'compartilhamento', title: '7. Compartilhamento de dados', body: ['Dados podem ser compartilhados com fornecedores de hospedagem, banco de dados, autenticacao, pagamentos, e-mail, armazenamento, monitoramento, seguranca, atendimento, contabilidade, assessoria juridica e autoridades quando legalmente exigido. A Pintor Pro nao vende dados pessoais.'] },
  { id: 'usuarios', title: '8. Dados compartilhados entre usuarios', body: ['Cliente e pintor podem acessar dados necessarios para negociacao, como nome, telefone quando liberado, endereco do servico, mensagens, orcamentos e contratos. Cada usuario deve usar esses dados apenas para a finalidade da negociacao.'] },
  { id: 'retencao', title: '9. Retencao e exclusao', body: ['Dados serao mantidos pelo periodo necessario para prestacao do servico, cumprimento legal, seguranca, prevencao de fraude, exercicio de direitos e resolucao de disputas. Depois disso, podem ser excluidos, anonimizados ou bloqueados.'] },
  { id: 'direitos', title: '10. Direitos dos titulares', body: ['O titular pode solicitar confirmacao de tratamento, acesso, correcao, anonimização, bloqueio ou eliminacao quando aplicavel, portabilidade, informacao sobre compartilhamento, revogacao de consentimento, oposicao e revisao de decisoes automatizadas.'] },
  { id: 'seguranca', title: '11. Seguranca e incidentes', body: ['Adotamos medidas tecnicas e administrativas razoaveis, como senhas criptografadas, HTTPS, controle de acesso, logs, backups e monitoramento. Nenhum sistema e absolutamente seguro. Incidentes serao avaliados e comunicados quando exigido por lei.'] },
  { id: 'cookies', title: '12. Cookies e comunicacoes', body: ['Cookies essenciais viabilizam a plataforma. Cookies de preferencias, desempenho e marketing dependem de escolha do usuario quando necessario. Comunicacoes de marketing devem permitir cancelamento simples; mensagens essenciais de conta podem continuar.'] },
  { id: 'menores', title: '13. Criancas e adolescentes', body: ['A plataforma nao e destinada ao cadastro independente de menores de 18 anos.'] },
  { id: 'contato', title: '14. Contato', body: [`Solicitacoes de privacidade devem ser enviadas pelo formulario de privacidade ou pelo e-mail ${company.privacyEmail}.`] }
];

export const cookieSections: LegalSection[] = [
  { id: 'o-que-sao', title: '1. O que sao cookies', body: ['Cookies sao pequenos arquivos ou identificadores usados para manter a sessao, lembrar preferencias, medir desempenho e melhorar a experiencia.'] },
  { id: 'tipos', title: '2. Tipos utilizados', body: ['A Pintor Pro pode usar cookies essenciais, preferencias, desempenho e marketing. Cookies nao essenciais podem depender da escolha do usuario.'], bullets: ['Essenciais: login, seguranca e funcionamento basico.', 'Preferencias: escolhas de interface.', 'Desempenho: metricas agregadas e melhoria do produto.', 'Marketing: comunicacoes e campanhas, quando houver consentimento aplicavel.'] },
  { id: 'controle', title: '3. Como controlar', body: ['O usuario pode aceitar todos, rejeitar nao essenciais ou ajustar preferencias no banner de cookies. A recusa de cookies nao essenciais nao impede o uso basico da plataforma.'] },
  { id: 'contato', title: '4. Contato', body: [`Duvidas sobre cookies podem ser enviadas para ${company.privacyEmail}.`] }
];

export const faqItems: FAQItem[] = [
  { category: 'Sobre a Pintor Pro', question: 'O que e a Pintor Pro?', answer: 'A Pintor Pro e uma plataforma digital que conecta clientes interessados em servicos de pintura a pintores profissionais cadastrados.' },
  { category: 'Sobre a Pintor Pro', question: 'A Pintor Pro realiza servicos de pintura?', answer: 'Nao. A Pintor Pro fornece tecnologia para aproximar clientes e pintores. Os servicos sao executados diretamente pelos profissionais cadastrados.' },
  { category: 'Cadastro de pintores', question: 'O pintor e funcionario da Pintor Pro?', answer: 'Nao. Pintores atuam como profissionais independentes. O cadastro ou assinatura nao cria vinculo empregaticio, sociedade, franquia ou exclusividade.' },
  { category: 'Cadastro de pintores', question: 'O cadastro do pintor e gratuito?', answer: 'Sim. O cadastro inicial e gratuito.' },
  { category: 'Assinaturas', question: 'O pintor possui periodo de teste?', answer: 'Sim. Apos criar a conta profissional, o pintor recebe 30 dias gratuitos para testar os recursos.' },
  { category: 'Assinaturas', question: 'O que acontece depois dos 30 dias gratuitos?', answer: `Depois dos 30 dias, o pintor tem mais ${company.subscriptionGracePeriodDays} dias de carencia para contratar ou pagar uma assinatura. Sem assinatura ativa ao final da carencia, o dashboard e bloqueado parcialmente.` },
  { category: 'Assinaturas', question: 'O pintor perde a conta quando o dashboard e bloqueado?', answer: 'Nao. Ele continua podendo fazer login, mas acessa somente a area de assinatura, pagamento, suporte, configuracoes essenciais e documentos legais.' },
  { category: 'Busca e contratacao', question: 'A Pintor Pro escolhe o pintor para o cliente?', answer: 'Nao. O cliente escolhe livremente o profissional com base nas informacoes disponiveis no perfil.' },
  { category: 'Orcamentos e visitas', question: 'A Pintor Pro define o valor do orcamento?', answer: 'Nao. Precos, materiais, prazos e formas de pagamento sao definidos diretamente entre cliente e pintor.' },
  { category: 'Pagamentos dos servicos', question: 'Como o cliente paga o pintor?', answer: 'O pagamento do servico deve ser realizado diretamente ao pintor, pela forma combinada entre as partes. A Pintor Pro nao recebe nem repassa valores de obras.' },
  { category: 'Contratos', question: 'Quem e responsavel pelo contrato do servico?', answer: 'Cliente e pintor sao responsaveis por conferir escopo, valores, materiais, prazos, garantias e demais condicoes antes do aceite.' },
  { category: 'Chat e comunicacao', question: 'Posso compartilhar telefone ou endereco no chat?', answer: 'Compartilhe somente informacoes necessarias para a negociacao e evite documentos, senhas, codigos e dados sensiveis fora dos canais adequados.' },
  { category: 'Seguranca e privacidade', question: 'Como solicitar meus dados?', answer: 'Use a pagina de solicitacao de privacidade para pedir acesso, correcao, exportacao, exclusao ou outras demandas LGPD.' },
  { category: 'Cancelamento e exclusao da conta', question: 'Como excluir a conta?', answer: 'O usuario deve acessar Configuracoes > Privacidade e conta > Excluir minha conta. Alguns registros podem ser preservados por obrigacao legal, seguranca ou exercicio de direitos.' },
  { category: 'Suporte', question: 'Como entrar em contato com o suporte?', answer: `Envie uma mensagem para ${company.supportEmail}.` }
];
