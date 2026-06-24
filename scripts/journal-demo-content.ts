/**
 * Matérias fictícias do jornal demo, inspiradas em notícias reais (jun. 2025–2026).
 * Textos reescritos para o Pesquisa Aqui — não são cópia de reportagens originais.
 */
export interface JournalSeedArticle {
  title: string;
  summary: string;
  content: string;
  category: string;
  city?: string;
  featured?: boolean;
  imageUrl?: string;
}

export const JOURNAL_DEMO_ARTICLES: JournalSeedArticle[] = [
  // —— CIDADE ——
  {
    title: "Linha 6-Laranja do Metrô entra em fase final de testes em São Paulo",
    summary:
      "Primeiro trecho entre Brasilândia e Perdizes deve abrir em outubro, com trens circulando em velocidade reduzida durante ensaios.",
    content:
      "O Metrô de São Paulo iniciou a fase final de testes operacionais na Linha 6-Laranja, que ligará a zona norte ao centro da capital. Composições já circulam entre canteiros de obras em velocidade de cerca de 14 km/h; em operação normal, os trens poderão atingir 80 km/h.\n\n" +
      "O primeiro trecho previsto para inauguração conecta Brasilândia a Perdizes, com oito estações. Equipes preparam testes de carga — sacos que simulam o peso máximo de passageiros — para validar frenagem e aceleração antes da abertura ao público.\n\n" +
      "Quando a linha estiver completa, o trajeto entre Brasilândia e São Joaquim deve levar cerca de 23 minutos, contra mais de uma hora em deslocamentos atuais de ônibus no horário de pico. A expectativa é transportar cerca de 630 mil pessoas por dia.",
    category: "cidade",
    city: "São Paulo",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80",
  },
  {
    title: "Monotrilho da Linha 17-Ouro terá operação assistida a partir de março",
    summary:
      "Trecho que liga Congonhas à rede metroferroviária passa por testes noturnos; funcionamento pleno está previsto para o segundo semestre.",
    content:
      "A Linha 17-Ouro do monotrilho paulistano, que conectará o Aeroporto de Congonhas às linhas 5-Lilás e 9-Esmeralda, deve iniciar operação assistida em março, inicialmente aos finais de semana e com horário reduzido.\n\n" +
      "Com mais de 80% das obras executadas, a linha contará com oito estações e trens de cinco vagões com ar-condicionado, iluminação em LED e sistema de operação automatizada. Cada composição terá capacidade para mais de 600 passageiros.\n\n" +
      "Moradores da zona sul aguardam há anos a integração do aeroporto ao transporte sobre trilhos. A previsão de operação plena está no terceiro trimestre do ano.",
    category: "cidade",
    city: "São Paulo",
    imageUrl: "https://images.unsplash.com/photo-1519003722824-194b4451a2ca?w=1200&q=80",
  },
  {
    title: "Caruaru registra recorde de movimentação no São João com quase R$ 740 milhões",
    summary:
      "65 dias de festa geraram 20 mil empregos na cidade pernambucana, com destaque para hospedagem e gastronomia.",
    content:
      "A edição 2025 do São João de Caruaru movimentou R$ 737,6 milhões na economia local, crescimento de 7% em relação ao ano anterior. O período de 65 dias de programação incluiu o tradicional São João na Roça, que percorreu 13 comunidades da zona rural.\n\n" +
      "Setores como comércio, hospedagem, alimentação e transporte registraram os maiores volumes. A prefeitura estima que a festa gerou cerca de 20 mil postos de trabalho diretos e indiretos.\n\n" +
      "Autoridades locais reforçam o papel do evento como motor de desenvolvimento e turismo no agreste pernambucano.",
    category: "cidade",
    city: "Caruaru",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
  },
  {
    title: "Petrolina recebe visitantes de 150 cidades no maior São João da história",
    summary:
      "Festa no Vale do São Francisco injetou cerca de R$ 320 milhões e usou reconhecimento facial na segurança do evento.",
    content:
      "Petrolina encerrou nove noites de programação junina com público recorde e impacto econômico estimado em R$ 320 milhões. Turistas de mais de 150 municípios brasileiros passaram pela cidade no período.\n\n" +
      "O pátio principal contou com 100 câmeras de monitoramento, incluindo tecnologia de reconhecimento facial, elogiada por especialistas em segurança de grandes eventos. Hotéis, bares e restaurantes reportaram ocupação elevada.\n\n" +
      "A organização projeta que o legado da festa fortaleça o calendário turístico do sertão pernambucano durante todo o ano.",
    category: "cidade",
    city: "Petrolina",
    imageUrl: "https://images.unsplash.com/photo-1467810563316-b5472e089e2a?w=1200&q=80",
  },

  // —— ESPORTE ——
  {
    title: "Brasil vence Paraguai na estreia de Ancelotti e garante vaga na Copa de 2026",
    summary:
      "Gol de Vinícius Júnior aos 43 minutos define jogo na Neo Química Arena e selou classificação antecipada nas Eliminatórias.",
    content:
      "Em sua primeira vitória à frente da seleção brasileira em território nacional, Carlo Ancelotti viu o time superar o Paraguai por 1 a 0 e garantir matematicamente a vaga na Copa do Mundo de 2026, que será disputada nos Estados Unidos, México e Canadá.\n\n" +
      "O gol saiu ainda no primeiro tempo: Matheus Cunha roubou a bola na linha de fundo e cruzou para Vinícius Júnior, que apenas escorou. A torcida lotou a Neo Química Arena e exibiu mosaico em homenagem ao técnico italiano, que completou 66 anos no dia do jogo.\n\n" +
      "Com 25 pontos nas Eliminatórias Sul-Americanas, o Brasil não pode mais ser alcançado pela zona de repescagem. Ancelotti elogiou o comprometimento do elenco e projetou ajustes para os dois jogos restantes da competição.",
    category: "esporte",
    city: "São Paulo",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
  },
  {
    title: "Ancelotti adota formação ofensiva e elogia 'jogo completo' da Seleção",
    summary:
      "Técnico italiano testou esquema com quatro atacantes contra adversário retrancado nas Eliminatórias.",
    content:
      "Após empate sem gols na estreia contra o Equador, Carlo Ancelotti optou por uma formação mais ousada diante do Paraguai, com quatro jogadores de frente e apenas dois meio-campistas de contenção.\n\n" +
      "Em coletiva, o treinador classificou a atuação como 'completa', destacando posse de bola e controle no primeiro tempo. Ele também agradeceu a recepção da torcida paulistana e projetou convocações amplas para o Mundial do ano que vem.\n\n" +
      "O Brasil segue na terceira posição das Eliminatórias, atrás de Argentina e Equador, mas com a classificação já assegurada.",
    category: "esporte",
    imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
  },
  {
    title: "Flamengo conquista tetracampeonato da Libertadores ao vencer Palmeiras",
    summary:
      "Cabeceio de Danilo no segundo tempo decide final em Lima e consagra o rubro-negro como maior vencedor do torneio no Brasil.",
    content:
      "O Flamengo levantou pela quarta vez o troféu da Copa Libertadores ao derrotar o Palmeiras por 1 a 0 no Estádio Monumental, em Lima. O gol saiu de cabeça de Danilo após escanteio de Arrascaeta, aos 21 minutos do segundo tempo.\n\n" +
      "A final reuniu torcidas em peso e teve chances para os dois lados. O Palmeiras chegou a desperdiçar oportunidade clara com Vitor Roque na reta final, mas o Flamengo segurou o resultado e festejou o título inédito no Peru.\n\n" +
      "Com a conquista, o rubro-negro se tornou o primeiro clube brasileiro tetracampeão continental.",
    category: "esporte",
    imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80",
  },
  {
    title: "Saquarema registra ocupação total de hotéis durante etapa do Mundial de Surfe",
    summary:
      "Cidade do litoral fluminense estima impacto de R$ 200 milhões com visitantes e transmissão internacional.",
    content:
      "A etapa brasileira do circuito mundial de surfe movimentou a economia de Saquarema (RJ) com 100% de ocupação hoteleira durante o evento. Restaurantes e comércio local também reportaram aumento expressivo no faturamento.\n\n" +
      "Autoridades estimam impacto econômico de cerca de R$ 200 milhões, somando hospedagem, gastronomia e serviços. A transmissão para dezenas de países reforçou a imagem do município como destino esportivo.\n\n" +
      "Surfistas e organizadores elogiaram a estrutura da praia e a receptividade da população local.",
    category: "esporte",
    city: "Saquarema",
    imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1200&q=80",
  },

  // —— NEGÓCIOS ——
  {
    title: "Festas juninas devem movimentar R$ 7,4 bilhões na economia brasileira",
    summary:
      "Projeção do setor de turismo aponta mais de 24 milhões de visitantes em quermesses e arraiais pelo país.",
    content:
      "A temporada junina de 2025 deve injetar até R$ 7,4 bilhões na economia nacional, segundo projeções do Ministério do Turismo. O número supera significativamente a movimentação registrada no ano anterior.\n\n" +
      "O impacto se concentra em alimentação, artesanato, hospedagem e serviços. O Nordeste lidera em volume de eventos, mas capitais do Sudeste também esperam crescimento no fluxo de turistas domésticos.\n\n" +
      "Especialistas destacam que marketing digital e influenciadores regionais podem ampliar o alcance das festas e atrair público de outras regiões.",
    category: "negocios",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
  },
  {
    title: "São Paulo projeta 520 mil turistas nas festas juninas e R$ 389 milhões em receita",
    summary:
      "Crescimento de 11,5% no fluxo de visitantes com pernoite impulsiona hotelaria e gastronomia no estado.",
    content:
      "Entre junho e agosto, São Paulo deve receber cerca de 520 mil turistas ligados às festividades juninas, alta de 11,5% em relação ao mesmo período de 2024. A receita estimada com viagens que incluem pernoite chega a R$ 389 milhões.\n\n" +
      "O varejo sazonal também cresce: itens como amendoim, canjica, doce de leite e decorações registraram aumento de quase 13% no faturamento em junho e julho, segundo dados do setor.\n\n" +
      "Consultorias apontam oportunidades para pequenos empreendedores que investem em experiências autênticas e produtos artesanais.",
    category: "negocios",
    city: "São Paulo",
    imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&q=80",
  },
  {
    title: "MEIs de gastronomia apostam em delivery e redes sociais durante o São João",
    summary:
      "Microempreendedores ampliam vendas de doces típicos e kits para festas com campanhas geolocalizadas.",
    content:
      "Microempreendedores individuais do ramo alimentício reportam aumento nas encomendas de quadrilha, kits juninos e marmitas temáticas. Muitos passaram a usar campanhas segmentadas por bairro e parcerias com influenciadores locais.\n\n" +
      "Plataformas de delivery registram pico de pedidos nos fins de semana de grande movimento nas cidades do interior. Especialistas em marketing digital recomendam fotos profissionais e horários de postagem alinhados ao público de cada região.\n\n" +
      "A combinação de presença física em quermesses e vendas online tornou-se estratégia comum para quem busca ampliar a renda na temporada.",
    category: "negocios",
    city: "Campina Grande",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80",
  },

  // —— CULTURA ——
  {
    title: "Quadrilha junina é reconhecida como manifestação da cultura nacional",
    summary:
      "Iniciativa fortalece preservação de danças e trajes típicos em festas de todo o país.",
    content:
      "A quadrilha junina ganhou reforço institucional como expressão da identidade cultural brasileira. Grupos de dança de Pernambuco, Paraíba, Minas Gerais e outros estados celebram o reconhecimento, que abre caminho para editais de fomento e registros patrimoniais.\n\n" +
      "Nas grandes festas, coreografias mesclam tradição e inovação, com arranjos musicais que dialogam com forró, xote e ritmos regionais. Escolas e academias reportam aumento de matrículas para oficinas de dança típica.\n\n" +
      "Organizadores defendem que o legado cultural das festas juninas vai além do entretenimento, gerando pertencimento e transmissão de saberes entre gerações.",
    category: "cultura",
    imageUrl: "https://images.unsplash.com/photo-1459749411177-041a6838c9c0?w=1200&q=80",
  },
  {
    title: "Arraial do Banho de São João atrai foliões ao Pantanal",
    summary:
      "Tradição de Corumbá e Ladário, patrimônio cultural desde 2021, une festa ribeirinha e turismo ecológico.",
    content:
      "O Arraial do Banho de São João, realizado em Corumbá e Ladário (MS), reúne milhares de pessoas em celebrações às margens do Pantanal. Reconhecido como patrimônio cultural do Brasil, o evento mistura dança, culinária regional e passeios de barco.\n\n" +
      "Hotéis e pousadas da região preparam pacotes que combinam festa junina e observação da fauna local. Artesãos vendem peças inspiradas na biodiversidade do bioma.\n\n" +
      "A programação reforça o turismo sustentável como alternativa de renda para comunidades ribeirinhas.",
    category: "cultura",
    city: "Corumbá",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80",
  },
  {
    title: "Maior São João do Cerrado em Brasília espera 170 mil pessoas",
    summary:
      "Evento no Plano Piloto deve gerar mais de 6 mil empregos temporários na capital federal.",
    content:
      "Brasília prepara uma das maiores festas juninas do Centro-Oeste, com apoio de órgãos de turismo e previsão de 170 mil visitantes. A estrutura inclui palcos múltiplos, praça de alimentação e área infantil temática.\n\n" +
      "Produtores culturais locais terão espaço dedicado para shows de música regional e exposições de artesanato do cerrado. A organização estima a criação de mais de 6 mil postos de trabalho diretos e indiretos.\n\n" +
      "O evento busca posicionar a capital como destino de turismo doméstico durante o mês de junho.",
    category: "cultura",
    city: "Brasília",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
  },

  // —— TECNOLOGIA ——
  {
    title: "Reconhecimento facial em festas juninas divide opiniões sobre privacidade",
    summary:
      "Grandes eventos no Nordeste adotam câmeras inteligentes; especialistas pedem transparência no uso de dados.",
    content:
      "A adoção de sistemas de reconhecimento facial em festas de grande porte, como as realizadas em Petrolina e outras cidades do Nordeste, gerou debate entre segurança pública e proteção de dados pessoais.\n\n" +
      "Fornecedores afirmam que a tecnologia agiliza a identificação de suspeitos e reduz filas em acessos. Já advogados e pesquisadores pedem políticas claras de armazenamento e descarte de imagens, além de auditoria independente.\n\n" +
      "A discussão coloca o Brasil no centro de um dilema global: como equilibrar inovação em eventos massivos com direitos fundamentais dos cidadãos.",
    category: "tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
  },
  {
    title: "Trens do monotrilho paulistano terão operação automatizada com baterias de reserva",
    summary:
      "Composições da Linha 17-Ouro usam sistema CBTC e podem percorrer até 8 km sem energia externa.",
    content:
      "A tecnologia embarcada nos trens da Linha 17-Ouro do Metrô de São Paulo inclui operação não tripulada (UTO) e comunicação baseada em rádio entre trens (CBTC), que permite intervalos menores entre composições.\n\n" +
      "Em caso de queda de energia na via, cada trem pode usar baterias próprias para percorrer até 8 quilômetros até a estação mais próxima. Portas de plataforma, elevadores e escadas rolantes passam por testes finais de comissionamento.\n\n" +
      "Engenheiros do projeto destacam que a linha representa um dos investimentos mais modernos em mobilidade urbana já realizados na América Latina.",
    category: "tecnologia",
    city: "São Paulo",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  },
  {
    title: "Pequenos negócios usam IA para personalizar ofertas em festas sazonais",
    summary:
      "Ferramentas de análise de comportamento ajudam quermesses a segmentar promoções por perfil de cliente.",
    content:
      "Empresas de tecnologia oferecem soluções que cruzam dados de geolocalização e histórico de compras para sugerir produtos em festas juninas. A proposta é aumentar a conversão de vendas em barracas e comércio ambulante.\n\n" +
      "Consultores recomendam que microempreendedores comecem com ferramentas gratuitas de redes sociais antes de investir em plataformas pagas. Chatbots simples também ganham espaço para responder horários e cardápios.\n\n" +
      "O uso responsável de dados continua sendo ponto de atenção para evitar práticas invasivas junto ao consumidor.",
    category: "tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
  },

  // —— SERVIÇOS ——
  {
    title: "Como aproveitar a temporada junina para divulgar seu negócio local",
    summary:
      "Especialistas listam cinco ações práticas: parcerias, cardápio temático, avaliações e presença digital.",
    content:
      "A alta circulação de pessoas nas festas juninas é oportunidade para oficinas, salões, restaurantes e prestadores de serviço ampliarem a clientela. O primeiro passo é atualizar perfis em plataformas de busca local com fotos recentes e horário de funcionamento.\n\n" +
      "Parcerias com barracas e food trucks podem gerar indicações cruzadas. Oferecer um serviço ou produto com temática junina — mesmo que simbólico — ajuda a aparecer nas redes sociais dos clientes.\n\n" +
      "Por fim, pedir avaliações após o atendimento fortalece a reputação online, fator decisivo para quem pesquisa serviços na região antes de fechar contrato.",
    category: "servicos",
    imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80",
  },
  {
    title: "Checklist de segurança para quem contrata serviços em períodos de alta demanda",
    summary:
      "Confirme CNPJ ou registro profissional, peça orçamento por escrito e desconfie de preços muito abaixo do mercado.",
    content:
      "Em épocas de festas e eventos, golpistas aproveitam a urgência do consumidor. Antes de contratar eletricistas, decoradores ou transporte para grupos, verifique referências e documentação do prestador.\n\n" +
      "Orçamentos detalhados por escrito evitam surpresas na hora do pagamento. Plataformas que exibem histórico de avaliações verificadas oferecem camada extra de confiança.\n\n" +
      "Em caso de serviços que exigem licença — como instalações elétricas em barracas — exija comprovante de habilitação e seguro quando aplicável.",
    category: "servicos",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
  },

  // —— GERAL ——
  {
    title: "Calendário junino movimenta turismo doméstico em todas as regiões do país",
    summary:
      "Ministério do Turismo destaca festas como motor de emprego e renda fora da alta temporada de verão.",
    content:
      "Mais de 24 milhões de pessoas devem participar de festividades juninas em 2025, consolidando junho como um dos meses mais importantes para o turismo interno brasileiro.\n\n" +
      "Além do Nordeste, estados do Sul e Centro-Oeste investem em arraiais que valorizam tradições locais. O objetivo é reduzir a sazonalidade do setor e distribuir renda ao longo do ano.\n\n" +
      "Especialistas recomendam que viajantes reservem hospedagem com antecedência e consultem a programação oficial de cada cidade para evitar lotação em dias de pico.",
    category: "geral",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  },
  {
    title: "Clima seco no interior alerta organizadores de festas ao ar livre",
    summary:
      "Defesa Civil reforça orientações sobre fogueiras, fogos de artifício e hidratação de equipes e público.",
    content:
      "Com temperaturas elevadas e baixa umidade em várias regiões, organizadores de festas juninas recebem orientações para revisar planos de combate a incêndio e ampliar pontos de água gratuita.\n\n" +
      "Bombeiros recomendam distância segura entre fogueiras e tendas, além de equipes treinadas para primeiros socorros. Em cidades com restrição ao uso de fogos, a substituição por projeções luminosas ganha adeptos.\n\n" +
      "A prevenção busca garantir que a celebração cultural não se transforme em risco à saúde pública.",
    category: "geral",
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&q=80",
  },
];

export const JOURNAL_DEMO_CLASSIFIEDS = [
  {
    title: "Kit festa junina completo para 50 pessoas",
    body: "Decoração, bandeirinhas, mesas e apoio na montagem. Atendemos empresas e condomínios na região metropolitana. Orçamento em 24h.",
    price: 890,
    contact: "11987654321",
    category: "eventos",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
  },
  {
    title: "Doces típicos para quermesse — encomendas",
    body: "Pé-de-moleque, cocada, brigadeiro de colher e cartola. Produção artesanal com entrega refrigerada. Mínimo 100 unidades por item.",
    price: 3.5,
    contact: "81999887766",
    category: "alimentos",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80",
  },
  {
    title: "Aluguel de som e iluminação para arraiais",
    body: "Pacotes para igrejas, escolas e associações. Técnico incluso no dia do evento. Consulte disponibilidade para junho e julho.",
    price: 1200,
    contact: "11955443322",
    category: "servicos",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
  },
  {
    title: "Trajes caipira adulto e infantil — locação",
    body: "Quadrilhas e casais: vestidos xadrez, camisas de chita e acessórios. Higienização inclusa. Retirada na loja ou entrega.",
    price: 45,
    contact: "83988776655",
    category: "moda",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
  },
];
