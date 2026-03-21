// ============================================================
// merits.js — Definição dos méritos do sistema Honra ao Mérito
// ============================================================

// --- Méritos padrão do sistema (não editados via admin) ---
const MERITS = [
  {
    key: "works_on_my_machine",
    emoji: "🖥️",
    title: "Works on my Machine",
    description: "A desculpa padrão de todos os tempos.",
    badge: {
      backgroundColor: "#0d1117",
      borderColor: "#39d353",
      textColor: "#e6edf3",
      shape: "hexagon",
    },
  },
  {
    key: "testador_producao",
    emoji: "🔥",
    title: "Testador em Produção",
    description: "Para quem sempre pula o ambiente de homologação.",
    badge: {
      backgroundColor: "#1a0a00",
      borderColor: "#ff6b35",
      textColor: "#e6edf3",
      shape: "shield",
    },
  },
  {
    key: "senhor_cache",
    emoji: "🗄️",
    title: "Senhor do Cache",
    description: "Sempre acusa o Redis e acha que flush resolve tudo.",
    badge: {
      backgroundColor: "#0a0a1a",
      borderColor: "#7c6af7",
      textColor: "#e6edf3",
      shape: "circle",
    },
  },
  {
    key: "pythonista_purista",
    emoji: "🐍",
    title: "Pythonista Purista",
    description: "Quer resolver absolutamente tudo com um script Python.",
    badge: {
      backgroundColor: "#001a00",
      borderColor: "#3fb950",
      textColor: "#e6edf3",
      shape: "hexagon",
    },
  },
  {
    key: "sobrevivente_mysql",
    emoji: "💀",
    title: "Sobrevivente do MySQL",
    description: "Fez um UPDATE ou DELETE sem WHERE e continua empregado.",
    badge: {
      backgroundColor: "#1a0000",
      borderColor: "#f85149",
      textColor: "#e6edf3",
      shape: "star",
    },
  },
  {
    key: "commitador_sexta",
    emoji: "📅",
    title: "Commitador de Sexta",
    description: "O corajoso que adora deploy no fim do expediente.",
    badge: {
      backgroundColor: "#1a1000",
      borderColor: "#e3b341",
      textColor: "#e6edf3",
      shape: "shield",
    },
  },
  {
    key: "ctrl_c_ctrl_v",
    emoji: "📋",
    title: "Ctrl+C / Ctrl+V",
    description: "Sênior especializado em respostas do Stack Overflow e do Gepeto.",
    badge: {
      backgroundColor: "#0a1a1a",
      borderColor: "#58a6ff",
      textColor: "#e6edf3",
      shape: "circle",
    },
  },
  {
    key: "refatorador_infinito",
    emoji: "♾️",
    title: "Refatorador Infinito",
    description: "Reescreve o código três vezes e nunca entrega a feature.",
    badge: {
      backgroundColor: "#1a0a1a",
      borderColor: "#bc8cff",
      textColor: "#e6edf3",
      shape: "hexagon",
    },
  },
  {
    key: "gdd",
    emoji: "🎰",
    title: "GDD - Gambiarra Driven Dev",
    description: "Especialista em soluções temporárias que duram para sempre.",
    badge: {
      backgroundColor: "#1a1a00",
      borderColor: "#d29922",
      textColor: "#e6edf3",
      shape: "star",
    },
  },
  {
    key: "ta_valendo_nada",
    emoji: "📉",
    title: "Tá Valendo Nada",
    description: "Perdeu tanto a moral que até o estagiário da primeira semana manda em você.",
    badge: {
      backgroundColor: "#0f0a00",
      borderColor: "#d29922",
      textColor: "#e6edf3",
      shape: "shield",
    },
  },
  {
    key: "inimigo_qa",
    emoji: "💣",
    title: "Inimigo do QA",
    description: "Entrega código que faz o QA questionar a própria carreira.",
    badge: {
      backgroundColor: "#1a0a0a",
      borderColor: "#f85149",
      textColor: "#e6edf3",
      shape: "star",
    },
  },
  {
    key: "so_deus_sabe",
    emoji: "🙏",
    title: "Só Deus Sabe",
    description: "Escreveu um código tão misterioso que nem ele mesmo sabe como funciona.",
    badge: {
      backgroundColor: "#0a0814",
      borderColor: "#e3b341",
      textColor: "#e6edf3",
      shape: "star",
    },
  },
  {
    key: "inimigo_ux",
    emoji: "🖱️",
    title: "Inimigo do UX",
    description: "Entrega interfaces que fazem o usuário questionar suas escolhas de vida.",
    badge: {
      backgroundColor: "#1a000a",
      borderColor: "#ff2d78",
      textColor: "#e6edf3",
      shape: "shield",
    },
  },
  {
    key: "sinal_fumaca",
    emoji: "🪬",
    title: "Sinal de Fumaça",
    description: "Demora tanto pra responder que a equipe já estava considerando outros meios de comunicação.",
    badge: {
      backgroundColor: "#0f0f0f",
      borderColor: "#8b949e",
      textColor: "#e6edf3",
      shape: "circle",
    },
  },
  {
    key: "vou_ver_te_aviso",
    emoji: "📵",
    title: "Vou Ver e Te Aviso",
    description: "Clássico. Todo mundo sabe que não vai ver e muito menos avisar.",
    badge: {
      backgroundColor: "#0a0f0a",
      borderColor: "#3fb950",
      textColor: "#e6edf3",
      shape: "circle",
    },
  },
  {
    key: "mestre_magos",
    emoji: "🧙",
    title: "Mestre dos Magos",
    description: "Quando mais precisam dele, dá um jeito de sumir sem deixar rastro.",
    badge: {
      backgroundColor: "#08001a",
      borderColor: "#9d4edd",
      textColor: "#e6edf3",
      shape: "hexagon",
    },
  },
  {
    key: "rework_qualidade",
    emoji: "🔧",
    title: "Rework de Qualidade",
    description: "Refez tudo do zero e ficou exatamente igual ao que estava antes.",
    badge: {
      backgroundColor: "#0a0f1a",
      borderColor: "#79c0ff",
      textColor: "#e6edf3",
      shape: "hexagon",
    },
  },
  {
    key: "rapaz_ta_certo",
    emoji: "🤨",
    title: "Rapaz, Tá Certo Isso?",
    description: "Fez algo tão questionável que até o time parou pra olhar torto.",
    badge: {
      backgroundColor: "#0d0a14",
      borderColor: "#c9a0dc",
      textColor: "#e6edf3",
      shape: "circle",
    },
  },
  {
    key: "primeira_vez",
    emoji: "🫣",
    title: "Em Anos de Indústria",
    description: "Em todos esses anos nessa indústria vital... jura que foi sem querer.",
    badge: {
      backgroundColor: "#0a0a14",
      borderColor: "#a371f7",
      textColor: "#e6edf3",
      shape: "shield",
    },
  },
];

// --- Méritos secretos — desbloqueados por condições especiais ---
// condition({ meritCounts, allRegularKeys, totalMerits, uniqueGivers, memberMerits }) => boolean
const SECRET_MERITS = [
  {
    key: "__bichao__",
    emoji: "👑",
    title: "CE É O BICHÃO MESMO",
    description: "Hein doido. Conquistou todos os méritos. Lenda absoluta da equipe.",
    hint: "Parece que você ainda não colecionou tudo que existe por aqui...",
    badge: { backgroundColor: "#0d0a00", borderColor: "#ffd700", textColor: "#ffd700" },
    secret: true,
    condition: ({ meritCounts, allRegularKeys }) =>
      allRegularKeys.every((k) => (meritCounts[k] ?? 0) > 0),
  },
  {
    key: "__ctrl_v_master__",
    emoji: "📋",
    title: "CTRL+V MASTER",
    description: "Copiou tanto que o Stack Overflow te manda cartão de natal.",
    hint: "O Stack Overflow ainda não te adicionou como colaborador... mas tá chegando lá.",
    badge: { backgroundColor: "#001020", borderColor: "#58a6ff", textColor: "#58a6ff" },
    secret: true,
    condition: ({ meritCounts }) => (meritCounts["ctrl_c_ctrl_v"] ?? 0) >= 5,
  },
  {
    key: "__veterano_guerra__",
    emoji: "🎖️",
    title: "VETERANO DE GUERRA",
    description: "Sobreviveu a mais de 10 méritos sem pedir demissão.",
    hint: "Você ainda não acumulou cicatrizes suficientes para esse título.",
    badge: { backgroundColor: "#100a00", borderColor: "#e3b341", textColor: "#e3b341" },
    secret: true,
    condition: ({ totalMerits }) => totalMerits >= 10,
  },
  {
    key: "__queridinho__",
    emoji: "🥰",
    title: "QUERIDINHO DO TIME",
    description: "Todo mundo te ama. Ou te odeia. Mas você tem muitos méritos.",
    hint: "Ainda não são pessoas suficientes falando de você pelas costas.",
    badge: { backgroundColor: "#0a0014", borderColor: "#bc8cff", textColor: "#bc8cff" },
    secret: true,
    condition: ({ uniqueGivers }) => uniqueGivers >= 4,
  },
  {
    key: "__recidivista__",
    emoji: "🔄",
    title: "RECIDIVISTA CONFESSO",
    description: "Recebeu o mesmo mérito 3 vezes. Não aprende, né?",
    hint: "Você ainda não repetiu o suficiente para o time desistir de te corrigir.",
    badge: { backgroundColor: "#0a1a00", borderColor: "#3fb950", textColor: "#3fb950" },
    secret: true,
    condition: ({ meritCounts }) => Object.values(meritCounts).some((c) => c >= 3),
  },
  {
    key: "__testador_serial__",
    emoji: "💥",
    title: "TESTADOR SERIAL",
    description: "Mandou para produção tantas vezes que virou ritual de equipe.",
    hint: "O ambiente de produção ainda não te reconhece como usuário frequente.",
    badge: { backgroundColor: "#1a0500", borderColor: "#ff6b35", textColor: "#ff6b35" },
    secret: true,
    condition: ({ meritCounts }) => (meritCounts["testador_producao"] ?? 0) >= 3,
  },
  {
    key: "__speed_run__",
    emoji: "⚡",
    title: "SPEED RUN",
    description: "Conseguiu 3 méritos na mesma semana. Produtividade ou caos?",
    hint: "Você ainda não foi 'reconhecido' vezes suficientes em uma única semana.",
    badge: { backgroundColor: "#0a0a1a", borderColor: "#a5f3fc", textColor: "#a5f3fc" },
    secret: true,
    condition: ({ memberMerits }) => {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return memberMerits.filter((m) => new Date(m.timestamp).getTime() >= oneWeekAgo).length >= 3;
    },
  },
  {
    key: "__dupla_encrenca__",
    emoji: "🌪️",
    title: "DUPLA ENCRENCA",
    description: "Inimigo do QA E testador em produção. Combinação explosiva.",
    hint: "Você ainda não alcançou o nível máximo de discórdia com processos.",
    badge: { backgroundColor: "#1a0010", borderColor: "#ff79c6", textColor: "#ff79c6" },
    secret: true,
    condition: ({ meritCounts }) =>
      (meritCounts["inimigo_qa"] ?? 0) >= 1 && (meritCounts["testador_producao"] ?? 0) >= 1,
  },
  {
    key: "__lenda__",
    emoji: "🌟",
    title: "LENDA VIVA",
    description: "20 méritos. Isso já não é mais uma carreira, é um personagem.",
    hint: "A história ainda não tem páginas suficientes sobre você.",
    badge: { backgroundColor: "#0a0800", borderColor: "#f0e68c", textColor: "#f0e68c" },
    secret: true,
    condition: ({ totalMerits }) => totalMerits >= 20,
  },
  {
    key: "__combo_gambiarra__",
    emoji: "🎪",
    title: "COMBO SUPREMO",
    description: "GDD + Refatorador Infinito + Ctrl+C/V. A santíssima trindade do caos.",
    hint: "Parece que você ainda não dominou todas as artes proibidas do desenvolvimento.",
    badge: { backgroundColor: "#0f0020", borderColor: "#d4a1ff", textColor: "#d4a1ff" },
    secret: true,
    condition: ({ meritCounts }) =>
      (meritCounts["gdd"] ?? 0) >= 1 &&
      (meritCounts["refatorador_infinito"] ?? 0) >= 1 &&
      (meritCounts["ctrl_c_ctrl_v"] ?? 0) >= 1,
  },
];

// Compat alias para código legado que usa SECRET_MERIT (singular)
const SECRET_MERIT = SECRET_MERITS[0];
