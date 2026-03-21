// ============================================================
// auth.js — Lógica de autenticação simples por senha de equipe
// ============================================================

const Auth = (() => {
  const SESSION_KEY = "honra_merito_auth";

  const isAuthenticated = () =>
    sessionStorage.getItem(SESSION_KEY) === "true";

  const authenticate = (password) => {
    if (password === CONFIG.TEAM_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
  };

  // Exibe o formulário de senha e bloqueia o conteúdo protegido.
  // Resolve a promise quando a autenticação for bem-sucedida.
  const requireAuth = () => new Promise((resolve) => {
    if (isAuthenticated()) {
      resolve();
      return;
    }

    const overlay = document.getElementById("auth-overlay");
    const form = document.getElementById("auth-form");
    const input = document.getElementById("auth-password");
    const error = document.getElementById("auth-error");
    const content = document.getElementById("admin-content");

    overlay.hidden = false;
    content.hidden = true;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const password = input.value.trim();

      if (authenticate(password)) {
        overlay.hidden = true;
        content.hidden = false;
        resolve();
      } else {
        error.textContent = "Senha incorreta. Tente novamente.";
        error.hidden = false;
        input.value = "";
        input.focus();
      }
    }, { once: false });
  });

  return { isAuthenticated, authenticate, logout, requireAuth };
})();
