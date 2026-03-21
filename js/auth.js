// ============================================================
// auth.js — Autenticação individual por membro
// Registro requer senha da equipe. Login usa senha própria.
// ============================================================

const Auth = (() => {
  const SESSION_KEY = "honra_merito_user";

  // Hash SHA-256 via Web Crypto API nativa do browser
  const hashPassword = async (password) => {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const getSession = () => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  };

  const isLoggedIn = () => getSession() !== null;
  const getCurrentUser = () => getSession();

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    // Navega para a raiz em vez de reload para garantir limpeza de bfcache
    const root = window.location.pathname.split("/").slice(0, -1).join("/") + "/index.html";
    window.location.replace(root);
  };

  const login = async (dbData, memberId, password) => {
    const hash = await hashPassword(password);
    const userRecord = dbData.users?.find(
      (u) => u.memberId === memberId && u.passwordHash === hash
    );
    if (!userRecord) return { success: false, error: "Usuário ou senha incorretos." };

    const allMembers = [...CONFIG.MEMBERS, ...(dbData.members ?? [])];
    const member = allMembers.find((m) => m.id === memberId);

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      memberId,
      name: member?.name ?? memberId,
      avatar: member?.avatar ?? "🧑‍💻"
    }));
    return { success: true };
  };

  const register = async (dbData, memberId, teamPassword, newPassword) => {
    if (teamPassword !== CONFIG.TEAM_PASSWORD)
      return { success: false, error: "Senha da equipe incorreta." };

    const allMembers = [...CONFIG.MEMBERS, ...(dbData.members ?? [])];
    if (!allMembers.find((m) => m.id === memberId))
      return { success: false, error: "Membro não encontrado na equipe." };

    if (dbData.users?.find((u) => u.memberId === memberId))
      return { success: false, error: "Este membro já possui cadastro. Faça login." };

    if (newPassword.length < 4)
      return { success: false, error: "A senha deve ter pelo menos 4 caracteres." };

    const passwordHash = await hashPassword(newPassword);
    return { success: true, passwordHash };
  };

  // Renderiza a barra de usuário — suporta array de users para mostrar foto
  const renderUserBar = (containerEl, users = []) => {
    if (!containerEl) return;

    // Limpa listener anterior se houver
    containerEl._cleanupMenu?.();

    const user = getCurrentUser();

    if (!user) {
      containerEl.innerHTML = `
        <button class="user-bar__btn btn btn--sm btn--secondary" id="ub-login-btn"
          aria-label="Entrar no sistema">Entrar</button>`;
      containerEl.querySelector("#ub-login-btn")?.addEventListener("click", () => {
        showLoginModal().then(() => window.location.reload()).catch(() => {});
      });
      return;
    }

    // Avatar: foto do banco ou emoji do perfil
    const userRecord = users.find((u) => u.memberId === user.memberId);
    const avatarHtml = userRecord?.avatarDataUrl
      ? `<img src="${userRecord.avatarDataUrl}" class="avatar-photo" style="width:28px;height:28px;border:none;" alt="" aria-hidden="true" />`
      : `<span class="user-menu__emoji" aria-hidden="true">${user.avatar}</span>`;

    containerEl.innerHTML = `
      <div class="user-menu">
        <button class="user-menu__trigger" aria-haspopup="true" aria-expanded="false"
          aria-label="Menu de ${user.name}">
          <span class="user-menu__avatar">${avatarHtml}</span>
          <span class="user-menu__name">${user.name}</span>
          <span class="user-menu__chevron" aria-hidden="true">▾</span>
        </button>
        <div class="user-menu__dropdown" hidden role="menu">
          <a href="profile.html?id=${user.memberId}" class="user-menu__item" role="menuitem">
            <span aria-hidden="true">👤</span> Meu Perfil
          </a>
          <div class="user-menu__sep" role="separator"></div>
          <a href="admin-grant.html" class="user-menu__item" role="menuitem">
            <span aria-hidden="true">🏅</span> Dar Mérito
          </a>
          <a href="admin-create.html" class="user-menu__item" role="menuitem">
            <span aria-hidden="true">✨</span> Criar Mérito
          </a>
          <a href="admin-manage.html" class="user-menu__item" role="menuitem">
            <span aria-hidden="true">🗂️</span> Gerenciar
          </a>
          <div class="user-menu__sep" role="separator"></div>
          <button class="user-menu__item user-menu__item--danger" id="ub-logout-btn" role="menuitem">
            <span aria-hidden="true">🚪</span> Sair
          </button>
        </div>
      </div>`;

    const trigger  = containerEl.querySelector(".user-menu__trigger");
    const dropdown = containerEl.querySelector(".user-menu__dropdown");

    const toggleMenu = (open) => {
      dropdown.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu(dropdown.hidden);
    });

    const closeOnOutside = (e) => {
      if (!containerEl.contains(e.target)) toggleMenu(false);
    };
    const closeOnEsc = (e) => {
      if (e.key === "Escape") toggleMenu(false);
    };

    document.addEventListener("click", closeOnOutside);
    document.addEventListener("keydown", closeOnEsc);

    // Permite limpeza quando renderUserBar for chamada novamente
    containerEl._cleanupMenu = () => {
      document.removeEventListener("click", closeOnOutside);
      document.removeEventListener("keydown", closeOnEsc);
    };

    containerEl.querySelector("#ub-logout-btn")?.addEventListener("click", logout);
  };

  // Constrói e exibe o modal de login/registro
  const showLoginModal = () => new Promise((resolve, reject) => {
    document.getElementById("auth-modal")?.remove();

    const allMembers = CONFIG.MEMBERS;
    const memberOptions = allMembers
      .map((m) => `<option value="${m.id}">${m.avatar} ${m.name}</option>`)
      .join("");

    const modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Autenticação");
    modal.innerHTML = `
      <div class="auth-modal__backdrop"></div>
      <div class="auth-modal__box">
        <div class="auth-modal__tabs" role="tablist" aria-label="Opções de acesso">
          <button class="auth-tab auth-tab--active" data-tab="login"
            role="tab" aria-selected="true" aria-controls="auth-panel-login">Entrar</button>
          <button class="auth-tab" data-tab="register"
            role="tab" aria-selected="false" aria-controls="auth-panel-register">Criar conta</button>
        </div>

        <!-- Painel Login -->
        <div id="auth-panel-login" class="auth-tab-panel" role="tabpanel">
          <form id="login-form" action="javascript:void(0)" method="post" novalidate>
            <div class="form-group">
              <label for="login-member" class="form-label">Quem é você?</label>
              <select id="login-member" class="form-select" required aria-required="true">
                <option value="">Selecione...</option>
                ${memberOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="login-password" class="form-label">Sua senha</label>
              <input type="password" id="login-password" class="form-input"
                placeholder="Digite sua senha..." required autocomplete="current-password" />
            </div>
            <div id="login-error" class="error-message" hidden role="alert" aria-live="assertive"></div>
            <button type="submit" class="btn btn--primary btn--full">Entrar</button>
          </form>
        </div>

        <!-- Painel Registro -->
        <div id="auth-panel-register" class="auth-tab-panel" hidden role="tabpanel">
          <p class="auth-modal__hint">Para criar sua conta você precisa da <strong>senha da equipe</strong>.</p>
          <form id="register-form" action="javascript:void(0)" method="post" novalidate>
            <div class="form-group">
              <label for="reg-member" class="form-label">Quem é você?</label>
              <select id="reg-member" class="form-select" required aria-required="true">
                <option value="">Selecione...</option>
                ${memberOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="reg-team-password" class="form-label">Senha da equipe</label>
              <input type="password" id="reg-team-password" class="form-input"
                placeholder="Peça ao líder da equipe..." required />
            </div>
            <div class="form-group">
              <label for="reg-password" class="form-label">Crie sua senha</label>
              <input type="password" id="reg-password" class="form-input"
                placeholder="Mínimo 4 caracteres..." required autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label for="reg-confirm" class="form-label">Confirme sua senha</label>
              <input type="password" id="reg-confirm" class="form-input"
                placeholder="Repita a senha..." required autocomplete="new-password" />
            </div>
            <div id="register-error" class="error-message" hidden role="alert" aria-live="assertive"></div>
            <div id="register-success" class="status-message status-message--success" hidden aria-live="polite"></div>
            <button type="submit" class="btn btn--primary btn--full">Criar conta</button>
          </form>
        </div>
      </div>`;

    document.body.appendChild(modal);
    modal.querySelector("#login-member")?.focus();

    // Alternância de abas
    modal.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        modal.querySelectorAll(".auth-tab").forEach((t) => {
          t.classList.remove("auth-tab--active");
          t.setAttribute("aria-selected", "false");
        });
        modal.querySelectorAll(".auth-tab-panel").forEach((p) => { p.hidden = true; });
        tab.classList.add("auth-tab--active");
        tab.setAttribute("aria-selected", "true");
        document.getElementById(`auth-panel-${tab.dataset.tab}`).hidden = false;
      });
    });

    // Submit do login
    modal.querySelector("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type=submit]");
      const memberId = modal.querySelector("#login-member").value;
      const password = modal.querySelector("#login-password").value;
      const errorEl = modal.querySelector("#login-error");

      if (!memberId || !password) {
        errorEl.textContent = "Preencha todos os campos.";
        errorEl.hidden = false;
        return;
      }

      btn.disabled = true;
      btn.textContent = "Entrando...";
      errorEl.hidden = true;

      try {
        const { data } = await GitHubAPI.readDB();
        const result = await login(data, memberId, password);
        if (result.success) {
          modal.remove();
          resolve(getCurrentUser());
        } else {
          errorEl.textContent = result.error;
          errorEl.hidden = false;
        }
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = "Entrar";
      }
    });

    // Submit do registro
    modal.querySelector("#register-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type=submit]");
      const memberId = modal.querySelector("#reg-member").value;
      const teamPassword = modal.querySelector("#reg-team-password").value;
      const newPassword = modal.querySelector("#reg-password").value;
      const confirm = modal.querySelector("#reg-confirm").value;
      const errorEl = modal.querySelector("#register-error");
      const successEl = modal.querySelector("#register-success");

      errorEl.hidden = true;
      successEl.hidden = true;

      if (!memberId || !teamPassword || !newPassword || !confirm) {
        errorEl.textContent = "Preencha todos os campos.";
        errorEl.hidden = false;
        return;
      }
      if (newPassword !== confirm) {
        errorEl.textContent = "As senhas não coincidem.";
        errorEl.hidden = false;
        return;
      }

      btn.disabled = true;
      btn.textContent = "Criando conta...";

      try {
        const { data } = await GitHubAPI.readDB();
        const result = await register(data, memberId, teamPassword, newPassword);

        if (!result.success) {
          errorEl.textContent = result.error;
          errorEl.hidden = false;
          return;
        }

        await GitHubAPI.updateDB((db) => {
          if (!db.users) db.users = [];
          db.users.push({ memberId, passwordHash: result.passwordHash });
          return db;
        }, `chore: cadastra usuário ${memberId}`);

        successEl.textContent = "Conta criada com sucesso! Agora faça login na aba ao lado.";
        successEl.hidden = false;
        e.target.reset();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = "Criar conta";
      }
    });

    // Fechar ao clicar no backdrop
    modal.querySelector(".auth-modal__backdrop").addEventListener("click", () => {
      modal.remove();
      reject(new Error("Login cancelado."));
    });
  });

  // Garante que o usuário está logado antes de continuar
  const requireLogin = () => {
    if (isLoggedIn()) return Promise.resolve(getCurrentUser());
    return showLoginModal();
  };

  return {
    isLoggedIn,
    getCurrentUser,
    logout,
    requireLogin,
    renderUserBar,
    showLoginModal
  };
})();
