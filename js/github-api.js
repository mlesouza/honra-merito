// ============================================================
// github-api.js — Módulo de comunicação com a GitHub Contents API
// Responsável exclusivamente por leitura e escrita do db.json
// ============================================================

const GitHubAPI = (() => {
  const DB_PATH = "data/db.json";

  const buildHeaders = () => ({
    "Authorization": `Bearer ${CONFIG.GITHUB_PAT}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  });

  const buildUrl = (path) =>
    `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;

  // Traduz erros HTTP da API do GitHub em mensagens amigáveis
  const interpretApiError = (status, path) => {
    const messages = {
      401: "Token inválido ou expirado. Verifique o config.js.",
      403: "Sem permissão de escrita no repositório. Verifique o escopo do seu PAT.",
      404: `Arquivo '${path}' não encontrado. Inicialize o repositório conforme o README.`,
      409: "Conflito de versão detectado. O sistema vai tentar novamente automaticamente.",
      422: "Dados inválidos enviados para a API. Verifique o formato do db.json.",
      500: "Erro interno do GitHub. Tente novamente em alguns instantes.",
      503: "GitHub indisponível no momento. Tente novamente em breve."
    };
    return messages[status] ?? `Erro inesperado (HTTP ${status}). Tente novamente.`;
  };

  // Lê o arquivo db.json e retorna { data, sha }
  const fetchFile = async (path = DB_PATH) => {
    const response = await fetch(buildUrl(path), {
      method: "GET",
      headers: buildHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(interpretApiError(response.status, path));
    }

    const file = await response.json();
    const raw = file.content.replace(/\n/g, "");
    // Decodifica base64 → bytes → UTF-8 (suporta emojis e caracteres multi-byte)
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    const content = JSON.parse(new TextDecoder().decode(bytes));
    return { data: content, sha: file.sha };
  };

  // Escreve o db.json com o SHA atual para evitar conflitos
  const writeFile = async (data, sha, message = "chore: atualiza db.json via Honra ao Mérito") => {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    const response = await fetch(buildUrl(DB_PATH), {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({
        message,
        content,
        sha,
        branch: CONFIG.GITHUB_BRANCH
      })
    });

    if (!response.ok) {
      const status = response.status;
      throw Object.assign(new Error(interpretApiError(status, DB_PATH)), { status });
    }

    return response.json();
  };

  // Lê o banco de dados completo
  const readDB = async () => {
    try {
      return await fetchFile(DB_PATH);
    } catch (err) {
      if (!navigator.onLine) {
        throw new Error("Sem conexão. Verifique sua internet.");
      }
      throw err;
    }
  };

  // Aplica uma função de transformação no db.json com retry automático em caso de conflito 409
  const updateDB = async (transformFn, commitMessage) => {
    const attemptWrite = async () => {
      const { data, sha } = await readDB();
      const updatedData = transformFn(data);
      return writeFile(updatedData, sha, commitMessage);
    };

    try {
      return await attemptWrite();
    } catch (err) {
      // Retry automático em caso de conflito de SHA (409)
      if (err.status === 409) {
        return await attemptWrite();
      }
      throw err;
    }
  };

  return { readDB, updateDB };
})();
