/* ============================================================================
   CONTEÚDO DA CAMPANHA · ARQUIVO ÚNICO
   ----------------------------------------------------------------------------
   Fonte: "Briefing de Conteúdo para Landing Page do Dr. Bruno Resende",
   versão 2.0, 07/08/2026. Nenhum texto visível está escrito dentro de
   componente: para alterar a página, altere este arquivo.

   Campos marcados com PENDENTE precisam de dado real antes de publicar.
   A lista completa está no README.
   ========================================================================== */

export const candidato = {
  /* --------------------------------------------------------------------------
     IDENTIDADE
     ------------------------------------------------------------------------ */
  identidade: {
    nome: 'Dr. Bruno Resende',
    nomeUrna: 'BRUNO RESENDE',
    cargo: 'Deputado Federal',
    estado: 'Espírito Santo',
    numero: '4400',
    partido: 'União Brasil',
    federacao: 'Federação União Progressista (União Brasil + Progressistas)',
    cnpj: '68.464.782/0001-53',
    slogan: 'Cuida e salva vidas.',
    conceito: 'Cuidar da saúde é cuidar da gente.',
  },

  /* --------------------------------------------------------------------------
     01 · INÍCIO
     ------------------------------------------------------------------------ */
  hero: {
    headline: 'Fazer o cuidado chegar mais longe.',
    subheadline:
      'Médico especialista no tratamento do câncer. Da roça, em Mimoso do Sul, para a medicina e a política: uma trajetória dedicada a cuidar das pessoas e fazer o trabalho chegar a todo o Espírito Santo.',
    ctaPrimario: { texto: 'Conheça as propostas', href: '#propostas' },
    ctaSecundario: { texto: 'Fale com a campanha', href: '#contato' },

    /* Três provas verificáveis. Nenhuma delas é adjetivo. */
    provas: [
      { valor: '31.897', rotulo: 'votos em 2022', detalhe: 'eleito deputado estadual' },
      { valor: '5', rotulo: 'leis estaduais', detalhe: 'de saúde, em vigor' },
      { valor: '42', rotulo: 'municípios', detalhe: 'alcançados pelo mandato' },
    ],
  },

  /* --------------------------------------------------------------------------
     02 · SOBRE
     ------------------------------------------------------------------------ */
  sobre: {
    rotulo: 'Quem sou eu',
    titulo: 'Uma vida inteira aprendendo a cuidar.',

    biografia: [
      'Sou Bruno Resende. Nasci em Cachoeiro de Itapemirim e cresci na Fazenda Jacutinga, em Mimoso do Sul. Foi o trabalho da minha família com o café e o leite que ajudou a pagar meus estudos. Ainda menino, decidi que seria médico.',
      'Na faculdade, conheci de perto a realidade de pacientes com câncer e encontrei minha vocação. Especializei-me em radio-oncologia em Barretos, referência no tratamento oncológico, e escolhi voltar para o Espírito Santo. Em 2014, retornei a Cachoeiro, onde coordenei a radioterapia do Hospital Evangélico, fui diretor clínico e ajudei a implantar a primeira unidade de AVC fora da Grande Vitória.',
      'A medicina me ensinou que cuidar também é garantir acesso, estrutura e dignidade. Foi essa experiência que me levou à política. Em 2022, fui eleito deputado estadual com 31.897 votos. No mandato, a saúde continua sendo minha principal causa, com atuação também no agro, no esporte, no desenvolvimento e em políticas que chegam a municípios de todo o Estado.',
      'Sou um dos principais articuladores do Hospital do Câncer de Cachoeiro: um projeto que idealizei e que hoje está em construção. Agora, o próximo passo é levar a Brasília a experiência de quem aprendeu que cuidar é assumir responsabilidade e fazer acontecer.',
    ],

    citacao:
      'Na medicina, aprendi a cuidar de cada pessoa. Na política, transformei esse cuidado em leis, recursos e entregas. Agora, quero levar esse trabalho ainda mais longe.',

    /* TRAJETÓRIA, os sete marcos do briefing. A ordem é cronológica e o leitor
       precisa dela: é o argumento inteiro da candidatura em sete passos. */
    trajetoriaTitulo: 'Da roça ao plenário',
    trajetoria: [
      {
        marco: 'Origem',
        titulo: 'Fazenda Jacutinga, Mimoso do Sul',
        texto: 'Infância no campo. O café e o leite da família pagaram os estudos.',
      },
      {
        marco: 'Chamado',
        titulo: 'A decisão de ser médico',
        texto: 'Ainda menino, escolhe a medicina para cuidar das pessoas.',
      },
      {
        marco: 'Vocação',
        titulo: 'O encontro com a oncologia',
        texto: 'Na formação, o contato com pacientes com câncer define a escolha da especialidade.',
      },
      {
        marco: 'Barretos',
        titulo: 'Especialização em radio-oncologia',
        texto: 'Formação em um serviço de referência nacional ligado ao SUS.',
      },
      {
        marco: 'Volta para casa',
        titulo: 'Cachoeiro de Itapemirim, 2014',
        texto:
          'Coordenação da radioterapia e direção clínica no Hospital Evangélico. Implantação da primeira unidade de AVC fora da Grande Vitória.',
      },
      {
        marco: 'Política',
        titulo: 'Para ampliar o cuidado',
        texto: 'Entrada na vida pública para destravar projetos, recursos e políticas de saúde.',
      },
      {
        marco: 'Agora',
        titulo: 'Mandato e nova missão',
        texto:
          'Atuação estadual, Hospital do Câncer em construção e o objetivo de levar o cuidado mais longe em Brasília.',
      },
    ],

    /* GALERIA, sem `src`, o componente desenha um espaço reservado com a
       legenda. Substitua por 8 a 12 fotos reais em /public/assets/galeria/. */
    galeriaTitulo: 'A campanha por aí',
    galeria: [
      { legenda: 'A roça em Mimoso do Sul, onde tudo começou', src: null },
      { legenda: 'Radioterapia no Hospital Evangélico de Cachoeiro', src: null },
      { legenda: 'Obra do Hospital do Câncer de Cachoeiro', src: null },
      { legenda: 'Visita à unidade de AVC', src: null },
      { legenda: 'Agenda no interior do Estado', src: null },
      { legenda: 'Encontro com agentes comunitários de saúde', src: null },
      { legenda: 'Produtores rurais na região sul', src: null },
      { legenda: 'Assembleia Legislativa do Espírito Santo', src: null },
    ],

    /* VÍDEOS, reels do perfil oficial (@drbrunoresende_). O cartão mostra
       a capa baixada para /public/assets/videos/ e o modal carrega o próprio
       player do Instagram, que é o que mantém a métrica no perfil e evita
       hospedar vídeo de campanha em servidor nosso.

       `codigo` é o shortcode da URL (instagram.com/p/CODIGO/). Trocar o vídeo
       é trocar o código e a capa: nada mais no componente depende disto.
       Entrada sem `codigo` continua na página no estado "em breve". */
    videosTitulo: 'Em vídeo',
    videosPerfil: 'https://www.instagram.com/drbrunoresende_/',
    videos: [
      {
        codigo: 'DcWzmKlh3dV',
        titulo: 'Política é compromisso',
        descricao: 'A promessa que ele carrega desde que entrou na vida pública.',
        capa: '/assets/videos/DcWzmKlh3dV.jpg',
        local: 'Reunião com moradores de Itapemirim',
        legenda: [
          'Política não pode ser negócio. Política precisa ser compromisso com as pessoas.',
          'Neste sábado à tarde, durante uma reunião com moradores de Itapemirim, eu compartilhei uma promessa que carrego comigo desde que decidi entrar na vida pública: “Não permita que o dinheiro da corrupção construa um tijolo na sua casa.”',
          'Porque a corrupção pode parecer distante, mas suas consequências chegam à vida de quem mais precisa. Quando alguém vende o voto, não está vendendo apenas uma escolha. Pode estar abrindo mão de uma vaga de UTI para a própria mãe, de um hospital para atender o filho, de um emprego digno ou de serviços públicos que deveriam estar disponíveis para todos.',
          'Quatro anos depois de assumir um mandato, eu posso olhar para trás e afirmar: o dinheiro da corrupção nunca entrou na minha casa. E essa continuará sendo a minha maior promessa.',
        ],
      },
      {
        codigo: 'DcOeVezxJlT',
        titulo: 'Hospital do Câncer de Cachoeiro',
        descricao: 'A obra por dentro: leitos, UTIs, radioterapia e hemodiálise.',
        capa: '/assets/videos/DcOeVezxJlT.jpg',
        local: 'Canteiro de obras, Cachoeiro de Itapemirim',
        legenda: [
          'Hoje, talvez você enxergue apenas máquinas, movimentação e muita gente trabalhando. Mas o que está sendo construído aqui é muito maior.',
          'Estamos construindo um grande Hospital do Câncer, que vai transformar vidas e mudar a história da saúde em todo o Espírito Santo. Um hospital completo, com leitos, UTIs, uma nova e moderna radioterapia e um setor de hemodiálise preparado para atender quem mais precisa.',
          'Mas, acima de tudo, estamos construindo um lugar para cuidar de pessoas. Onde cada família poderá encontrar segurança e conforto em um dos momentos mais difíceis da vida. E essa transformação também vai gerar empregos, movimentar a economia e fortalecer toda a nossa região.',
          'Porque o que estamos construindo aqui não é apenas um hospital. É cuidado. É dignidade. É esperança.',
        ],
      },
      {
        codigo: 'DcG__83RNEP',
        titulo: 'Comitê de portas abertas',
        descricao: 'A abertura do comitê, onde a caminhada passa a ter endereço.',
        capa: '/assets/videos/DcG__83RNEP.jpg',
        local: 'Abertura do comitê, domingo 16',
        legenda: [
          'Neste domingo, 16, abrimos oficialmente as portas do nosso comitê: um espaço que nasce para reunir pessoas, ouvir ideias e fortalecer um projeto construído com diálogo, trabalho e, acima de tudo, com a participação de cada um.',
          'Mais do que um endereço, nosso comitê é um ponto de encontro para quem acredita que podemos fazer mais pelo Espírito Santo.',
          'A caminhada começou. E quero você junto comigo nessa jornada. Vamos juntos!',
        ],
      },
      {
        codigo: 'DcHrv4zx2MB',
        titulo: 'Vamos surpreender de novo',
        descricao: 'O recado que abre a caminhada por uma vaga em Brasília.',
        capa: '/assets/videos/DcHrv4zx2MB.jpg',
        local: 'Espírito Santo',
        legenda: ['Nós vamos surpreender esse estado de novo.'],
      },
      /* O quinto é o único que o celular não mostra: a grade fecha em quatro
         para caber em duas linhas de dois, e este é o de legenda mais curta,
         o que menos perde ao ficar de fora. Ver `.videos__grade` em
         sobre.css. */
      {
        codigo: 'DcLgdTtR8iq',
        titulo: 'Dr. Bruno chegou',
        descricao: 'A carreata na rua, à noite, com a campanha na porta de casa.',
        capa: '/assets/videos/DcLgdTtR8iq.jpg',
        local: 'Carreata pelo interior do Estado',
        legenda: ['Doutor Bruno chegou!'],
      },
    ],

    /* APOIOS, publicar apenas com autorização formal de uso de imagem e nome.
       Lista vazia = o bloco não aparece na página. */
    apoiosTitulo: 'Quem caminha junto',
    apoios: [],
  },

  /* --------------------------------------------------------------------------
     03 · PROPOSTAS
     Redação compatível com as atribuições de deputado federal: defender,
     propor, fiscalizar, articular, viabilizar. Nunca "vou administrar".
     ------------------------------------------------------------------------ */
  propostas: {
    rotulo: 'Propostas',
    titulo: 'Cinco frentes para o Espírito Santo.',
    chamada:
      'O que eu vou defender em Brasília, escrito do jeito que dá para cobrar depois. Toque em cada frente para ver os compromissos.',

    eixos: [
      {
        icone: 'saude',
        numero: '01',
        titulo: 'Saúde mais perto de quem precisa',
        resumo: 'Menos estrada até o atendimento.',
        itens: [
          'Defender a descentralização da saúde para reduzir deslocamentos e aproximar consultas, exames e tratamento das famílias.',
          'Atuar para viabilizar a expansão de mais de 1.000 leitos no Espírito Santo nos próximos cinco anos, com articulação e recursos federais.',
          'Defender uma política clara de fortalecimento dos hospitais de pequeno porte e da rede filantrópica.',
          'Ampliar o suporte à urgência e à emergência, com planejamento e financiamento da rede regional.',
        ],
      },
      {
        icone: 'oncologia',
        numero: '02',
        titulo: 'Câncer, AVC e diagnóstico no tempo certo',
        resumo: 'Onde o relógio decide o desfecho.',
        itens: [
          'Defender financiamento adequado para a oncologia e atualização da tabela SUS.',
          'Fortalecer a rede de diagnóstico precoce e de tratamento do câncer, inclusive para crianças e adolescentes.',
          'Defender a ampliação de serviços de reabilitação para pacientes que sofreram AVC.',
          'Buscar recursos e políticas que reduzam o tempo entre suspeita, diagnóstico e início do tratamento.',
        ],
      },
      {
        icone: 'agro',
        numero: '03',
        titulo: 'Agro e interior fortes',
        resumo: 'Quem produz longe também conta.',
        itens: [
          'Defender um ambiente econômico favorável a quem produz e gera renda no interior.',
          'Trabalhar para que recursos federais também cheguem aos municípios menores e às comunidades rurais.',
          'Valorizar o trabalho no campo como parte estratégica do desenvolvimento do Espírito Santo.',
        ],
      },
      {
        icone: 'desenvolvimento',
        numero: '04',
        titulo: 'Desenvolvimento com responsabilidade',
        resumo: 'Emprego hoje sem hipotecar amanhã.',
        itens: [
          'Atuar para que o Espírito Santo enfrente os efeitos da reforma tributária preservando competitividade e capacidade de investimento.',
          'Defender responsabilidade fiscal e controle do crescimento do custeio da máquina pública.',
          'Preservar um ambiente de negócios capaz de atrair investimentos, gerar emprego e sustentar políticas públicas.',
        ],
      },
      {
        icone: 'seguranca',
        numero: '05',
        titulo: 'Segurança e respeito ao dinheiro público',
        resumo: 'Cobrar resultado de cada real.',
        itens: [
          'Defender, no âmbito federal, mais estrutura, integração e recursos para o combate ao tráfico e às facções criminosas.',
          'Fortalecer fiscalização, transparência e mecanismos de combate à corrupção.',
          'Cobrar resultado na aplicação dos recursos públicos e priorizar políticas com impacto mensurável na vida das pessoas.',
        ],
      },
    ],

    chamadaFinal: 'Conheça o trabalho que já fizemos e veja por que é possível fazer mais pelo Espírito Santo.',
    ctaFinal: { texto: 'Ver o que já foi feito', href: '#conquistas' },
  },

  /* --------------------------------------------------------------------------
     04 · CONQUISTAS
     ------------------------------------------------------------------------ */
  conquistas: {
    rotulo: 'Prova de trabalho',
    titulo: 'Cuidar é fazer. E trabalho precisa aparecer.',
    chamada:
      'Nada aqui é promessa. É lei publicada, obra em execução e recurso destinado, com número, data e fonte para você conferir.',

    /* DESTAQUE, a entrega que sustenta a candidatura inteira.
       Redação travada pelo briefing: "idealizou e viabiliza". Nunca dizer que
       entregou ou inaugurou a obra: ela está em construção. */
    destaque: {
      etiqueta: 'Em construção',
      titulo: 'Hospital do Câncer de Cachoeiro',
      texto:
        'Idealizou e viabiliza o projeto, e acompanha sua execução. A segunda etapa teve ordem de serviço autorizada em janeiro de 2026.',
      dados: [
        { valor: '100', rotulo: 'novos leitos clínicos e cirúrgicos' },
        { valor: '24h', rotulo: 'de pronto atendimento oncológico' },
        { valor: '700 mil', rotulo: 'habitantes da macrorregião Sul' },
        { valor: 'set/2027', rotulo: 'conclusão prevista' },
      ],
      fonte: 'Governo do Espírito Santo / SESA, 15/01/2026. Investimento total previsto: R$ 263,3 milhões.',
    },

    /* AS LEIS, o argumento mais forte e o mais verificável. Cada uma tem
       número e ano: quem duvidar, procura. */
    leisTitulo: 'As leis que já viraram direito',
    // Cinco leis na lista abaixo; duas delas com autoria declarada no briefing.
    leisChamada: 'Cinco normas estaduais em vigor. Duas delas de autoria do mandato.',
    leis: [
      {
        lei: 'Lei nº 11.815',
        ano: '2023',
        titulo: 'Estatuto da Pessoa com Câncer',
        texto: 'Consolida os direitos de quem enfrenta o câncer no Espírito Santo.',
        autoria: false,
      },
      {
        lei: 'Lei nº 12.232',
        ano: '2024',
        titulo: 'Apoio às vítimas de AVC',
        texto:
          'Cria a política estadual de apoio, prevenção, tratamento, reabilitação e integração do cuidado às vítimas de AVC.',
        autoria: true,
      },
      {
        lei: 'Lei nº 12.481',
        ano: '2025',
        titulo: 'Linhas de cuidado para AVC e infarto',
        texto:
          'Implanta linhas de cuidado especializado para AVC e Infarto Agudo do Miocárdio, com atendimento prioritário, reabilitação e monitoramento de qualidade.',
        autoria: true,
      },
      {
        lei: 'Lei nº 12.482',
        ano: '2025',
        titulo: 'Oncologia pediátrica',
        texto: 'Institui a política estadual voltada à oncologia pediátrica.',
        autoria: false,
      },
      {
        lei: 'Lei nº 12.828',
        ano: '2026',
        titulo: 'Diagnóstico rápido de infarto',
        texto: 'Prevê o exame rápido de troponina no SUS estadual para apoiar o diagnóstico precoce de infarto.',
        autoria: false,
      },
    ],

    /* A unidade de AVC não é lei, é obra. Fica fora da lista acima de
       propósito, para a lista não misturar duas naturezas de entrega. */
    entregaExtra: {
      titulo: 'Primeira unidade de AVC fora da Grande Vitória',
      texto:
        'Ajudou a implantar a unidade no Hospital Evangélico de Cachoeiro de Itapemirim, encurtando a distância até o atendimento de urgência para todo o sul do Estado.',
    },

    /* ------------------------------------------------------------------------
       MAPA DO CUIDADO
       As coordenadas x/y são a posição geográfica real do município dentro da
       silhueta do Estado (a silhueta do manual é cartograficamente correta:
       proporção 0,617 contra 0,616 do ES real). Não são posições "a olho".
       Fórmula: x = (lon + 41,88) / 2,22; y = (−17,89 − lat) / 3,41
       ---------------------------------------------------------------------- */
    mapaTitulo: 'Onde o cuidado chegou',
    mapaChamada:
      'Cada ponto é um município que recebeu destinação do mandato. Toque para ver o valor.',
    mapaNota:
      'Destinações registradas no controle interno do mandato estadual entre 2023 e 2026. Planilha final em validação.',

    municipios: [
      { nome: 'Cachoeiro de Itapemirim', valor: 'R$ 490 mil', x: 0.345, y: 0.868, destaque: true },
      { nome: 'Castelo', valor: 'R$ 300 mil', x: 0.306, y: 0.796 },
      { nome: 'Colatina', valor: 'R$ 200 mil', x: 0.563, y: 0.484, detalhe: 'Hospital São José / Fundação Social Rural' },
      { nome: 'Guaçuí', valor: 'R$ 195 mil', x: 0.091, y: 0.846 },
      { nome: 'Mimoso do Sul', valor: 'R$ 140 mil', x: 0.232, y: 0.93, detalhe: 'A cidade onde ele cresceu' },
    ],

    /* NÚMEROS, os contadores animam ao entrar na tela.
       PENDENTE: validar a planilha final antes de publicar (briefing, item 6). */
    numeros: [
      { prefixo: 'R$ ', valor: 3, sufixo: ' mi', descricao: 'destinados pelo mandato entre 2023 e 2026' },
      { prefixo: '', valor: 42, sufixo: '', descricao: 'municípios alcançados em todas as regiões do Estado' },
      { prefixo: '', valor: 90, sufixo: '', descricao: 'destinações para saúde, assistência, esporte, idosos e agro' },
      { prefixo: '', valor: 45, sufixo: '%', descricao: 'do total direcionado a saúde e à pessoa com deficiência' },
    ],
  },

  /* --------------------------------------------------------------------------
     06 · CONTATO / PARTICIPE
     ------------------------------------------------------------------------ */
  contato: {
    rotulo: 'Participe',
    titulo: 'Política se faz ouvindo.',
    chamada:
      'Envie sua mensagem, conte o que sua cidade precisa e participe desse movimento para fazer o cuidado chegar mais longe.',

    /* Com `null`, o envio abre o WhatsApp com a mensagem já montada, funciona
       sem servidor. Com uma URL, o formulário passa a fazer POST nela. */
    endpointFormulario: null,

    whatsapp: null, // PENDENTE: número oficial da campanha, só dígitos: 55DD9XXXXXXXX
    mensagemWhatsapp: 'Olá! Vim pelo site do Dr. Bruno Resende 4400 e quero falar com a campanha.',

    assuntos: ['Saúde', 'Agro', 'Segurança', 'Desenvolvimento', 'Voluntariado', 'Outros'],

    consentimento:
      'Autorizo o contato da campanha por WhatsApp ou e-mail. Meus dados não serão compartilhados com terceiros.',
    consentimentoNota: 'PENDENTE: substituir pela redação de LGPD validada pelo jurídico da campanha.',

    voluntario: {
      titulo: 'Quero fazer parte',
      texto: 'A campanha é feita por gente que mora aqui. Marque como você pode ajudar na sua cidade.',
      opcoes: [
        'Divulgar nas redes sociais',
        'Panfletar no meu bairro',
        'Ajudar em eventos e caminhadas',
        'Ceder espaço para reunião',
        'Dirigir / transporte',
        'Sou da área da saúde',
      ],
    },

    confirmacao: {
      titulo: 'Mensagem registrada.',
      texto: 'Obrigado por escrever. A equipe da campanha responde por aqui mesmo.',
    },

    redes: [
      { nome: 'Instagram', arroba: '@drbrunoresende_', href: 'https://www.instagram.com/drbrunoresende_/' },
      { nome: 'Facebook', arroba: null, href: null }, // PENDENTE
      { nome: 'YouTube', arroba: null, href: null }, // PENDENTE
      { nome: 'TikTok', arroba: null, href: null }, // PENDENTE
    ],
  },

  /* --------------------------------------------------------------------------
     RODAPÉ
     ------------------------------------------------------------------------ */
  rodape: {
    // PENDENTE: inserir a redação obrigatória validada pelo jurídico eleitoral.
    disclaimer:
      'Conteúdo publicado sob responsabilidade da campanha. É proibido o anonimato e vedada a veiculação de conteúdo que ofenda a honra de terceiros.',
    creditos: 'Dr. Bruno Resende 4400 · Deputado Federal · Espírito Santo · 2026',
  },
}

/* Seções da navegação, a ordem aqui define a nav, as âncoras e o trilho. */
export const secoes = [
  { id: 'inicio', rotulo: 'Início' },
  { id: 'sobre', rotulo: 'Sobre' },
  { id: 'propostas', rotulo: 'Propostas' },
  { id: 'conquistas', rotulo: 'Conquistas' },
  { id: 'contato', rotulo: 'Contato' },
]

export const linkWhatsapp = (c = candidato) =>
  c.contato.whatsapp
    ? `https://wa.me/${c.contato.whatsapp}?text=${encodeURIComponent(c.contato.mensagemWhatsapp)}`
    : null

export const redesAtivas = (c = candidato) => c.contato.redes.filter((r) => r.href)
