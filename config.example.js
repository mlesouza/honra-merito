// ============================================================
// config.example.js — Template de configuração
// Copie este arquivo para js/config.js e preencha os campos
// ⚠️ NUNCA commite o js/config.js com dados reais
// ============================================================

const CONFIG = {
  // --- GitHub ---
  GITHUB_OWNER: "seu-usuario",        // Usuário ou organização do GitHub
  GITHUB_REPO: "honra-ao-merito",     // Nome do repositório (geralmente o mesmo que o fork)
  GITHUB_BRANCH: "main",
  GITHUB_PAT: "ghp_SEU_TOKEN_AQUI",  // Personal Access Token — veja o README para criar um

  // --- Autenticação da equipe ---
  // Senha para acessar a página de admin (/admin.html)
  TEAM_PASSWORD: "suasenha123",

  // --- Membros da equipe ---
  // Adicione um objeto por membro. O campo "id" deve ser único e sem espaços.
  MEMBERS: [
    { id: "membro1", name: "Nome do Membro 1", avatar: "🧑‍💻" },
    { id: "membro2", name: "Nome do Membro 2", avatar: "👩‍💻" },
    { id: "membro3", name: "Nome do Membro 3", avatar: "🧑‍🔬" }
  ]
};

// --- Méritos padrão do sistema ---
// Para adicionar novos méritos padrão, inclua um objeto nesta lista.
// Para criar méritos pela interface, use a página admin.html (Aba "Criar Novo Mérito").
const MERITS = [
  {
    key: "works_on_my_machine",
    emoji: "🖥️",
    title: "Works on my Machine",
    description: "A desculpa padrão de todos os tempos.",
    badge: { backgroundColor: "#0d1117", borderColor: "#39d353", textColor: "#e6edf3", shape: "hexagon" }
  },
  {
    key: "testador_producao",
    emoji: "🔥",
    title: "Testador em Produção",
    description: "Para quem sempre pula o ambiente de homologação.",
    badge: { backgroundColor: "#1a0a00", borderColor: "#ff6b35", textColor: "#e6edf3", shape: "shield" }
  },
  {
    key: "senhor_cache",
    emoji: "🗄️",
    title: "Senhor do Cache",
    description: "Sempre acusa o Redis e acha que flush resolve tudo.",
    badge: { backgroundColor: "#0a0a1a", borderColor: "#7c6af7", textColor: "#e6edf3", shape: "circle" }
  },
  {
    key: "pythonista_purista",
    emoji: "🐍",
    title: "Pythonista Purista",
    description: "Quer resolver absolutamente tudo com um script Python.",
    badge: { backgroundColor: "#001a00", borderColor: "#3fb950", textColor: "#e6edf3", shape: "hexagon" }
  },
  {
    key: "sobrevivente_mysql",
    emoji: "💀",
    title: "Sobrevivente do MySQL",
    description: "Fez um UPDATE ou DELETE sem WHERE e continua empregado.",
    badge: { backgroundColor: "#1a0000", borderColor: "#f85149", textColor: "#e6edf3", shape: "star" }
  },
  {
    key: "commitador_sexta",
    emoji: "📅",
    title: "Commitador de Sexta",
    description: "O corajoso que adora deploy no fim do expediente.",
    badge: { backgroundColor: "#1a1000", borderColor: "#e3b341", textColor: "#e6edf3", shape: "shield" }
  },
  {
    key: "ctrl_c_ctrl_v",
    emoji: "📋",
    title: "Ctrl+C / Ctrl+V",
    description: "Sênior especializado em respostas do Stack Overflow e do Gepeto.",
    badge: { backgroundColor: "#0a1a1a", borderColor: "#58a6ff", textColor: "#e6edf3", shape: "circle" }
  },
  {
    key: "refatorador_infinito",
    emoji: "♾️",
    title: "Refatorador Infinito",
    description: "Reescreve o código três vezes e nunca entrega a feature.",
    badge: { backgroundColor: "#1a0a1a", borderColor: "#bc8cff", textColor: "#e6edf3", shape: "hexagon" }
  },
  {
    key: "gdd",
    emoji: "🎰",
    title: "GDD - Gambiarra Driven Dev",
    description: "Especialista em soluções temporárias que duram para sempre.",
    badge: { backgroundColor: "#1a1a00", borderColor: "#d29922", textColor: "#e6edf3", shape: "star" }
  }
];
