// ============================================================
// profile.js — Lógica da página de perfil individual
// ============================================================

const ProfilePage = (() => {
  const getMemberId = () => new URLSearchParams(window.location.search).get("id");

  const getAllMeritsConfig = (customMerits = []) => [...MERITS, ...customMerits];

  const findMember = (id, dbMembers = []) =>
    [...CONFIG.MEMBERS, ...dbMembers].find((m) => m.id === id);

  const formatDate = (isoString) =>
    new Date(isoString).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  // Exibe o avatar (foto ou emoji) no cabeçalho do perfil
  const renderProfileAvatar = (memberId, member, users) => {
    const avatarEl = document.getElementById("profile-avatar");
    if (!avatarEl) return;
    avatarEl.innerHTML = AvatarUtils.getDisplay(memberId, users, member.avatar, 80);
  };

  // Exibe o botão de upload apenas para o próprio membro logado
  const initAvatarUpload = (memberId) => {
    const currentUser = Auth.getCurrentUser();
    if (currentUser?.memberId !== memberId) return;

    const label = document.getElementById("avatar-upload-label");
    const input = document.getElementById("avatar-file-input");
    const statusEl = document.getElementById("avatar-upload-status");

    if (!label || !input) return;
    label.hidden = false;

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      label.style.opacity = "0.5";
      label.style.pointerEvents = "none";
      if (statusEl) {
        statusEl.textContent = "Salvando foto...";
        statusEl.className = "status-message status-message--success";
        statusEl.hidden = false;
      }

      try {
        const dataUrl = await AvatarUtils.resize(file);
        await AvatarUtils.save(memberId, dataUrl);

        // Atualiza o avatar na tela sem recarregar
        const avatarEl = document.getElementById("profile-avatar");
        if (avatarEl) {
          avatarEl.innerHTML = AvatarUtils.getDisplay(memberId, [{ memberId, avatarDataUrl: dataUrl }], "", 80);
        }

        // Atualiza também a barra de usuário na sessão (cosmético)
        if (statusEl) statusEl.textContent = "Foto atualizada! ✓";
        setTimeout(() => { if (statusEl) statusEl.hidden = true; }, 3000);
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = err.message;
          statusEl.className = "status-message status-message--error";
        }
      } finally {
        label.style.opacity = "";
        label.style.pointerEvents = "";
        input.value = "";
      }
    });
  };

  // Renderiza bloco de estatísticas do perfil
  const renderProfileStats = (memberMerits, member) => {
    const container = document.getElementById("profile-stats");
    if (!container) return;

    const total = memberMerits.length;

    // Merit mais recebido
    const counts = {};
    for (const m of memberMerits) counts[m.meritKey] = (counts[m.meritKey] ?? 0) + 1;
    const topKey   = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const topEmoji = MERITS.find((m) => m.key === topKey)?.emoji ?? "🏅";

    // Givers únicos
    const uniqueGivers = new Set(memberMerits.map((m) => m.givenById ?? m.givenBy ?? "anon")).size;

    // Primeiro mérito
    const firstDate = memberMerits.length
      ? new Date(memberMerits[0].timestamp).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
      : "—";

    // Sequência (méritos nos últimos 7 dias)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = memberMerits.filter((m) => new Date(m.timestamp).getTime() >= oneWeekAgo).length;

    container.innerHTML = `
      <div class="profile-stat">
        <span class="profile-stat__value" id="pstat-total">${total}</span>
        <span class="profile-stat__label">Total</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat__value">${topKey ? topEmoji : "—"}</span>
        <span class="profile-stat__label">Favorito</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat__value" id="pstat-givers">${uniqueGivers}</span>
        <span class="profile-stat__label">Pessoas</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat__value" id="pstat-week">${thisWeek}</span>
        <span class="profile-stat__label">Essa semana</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat__value profile-stat__value--sm">${firstDate}</span>
        <span class="profile-stat__label">1º mérito</span>
      </div>
    `;

    // Count-up nos números
    if (typeof Animations !== "undefined") {
      const totalEl  = document.getElementById("pstat-total");
      const giversEl = document.getElementById("pstat-givers");
      const weekEl   = document.getElementById("pstat-week");
      if (totalEl)  Animations.countUp(totalEl,  total,         900);
      if (giversEl) Animations.countUp(giversEl, uniqueGivers, 700);
      if (weekEl)   Animations.countUp(weekEl,   thisWeek,     600);
    }
  };

  // Renderiza a vitrine de badges (desbloqueados e bloqueados)
  const renderBadgeShowcase = (memberMerits, allMeritsConfig) => {
    const container = document.getElementById("badge-showcase");
    if (!container) return;

    const meritCounts = {};
    for (const merit of memberMerits) {
      meritCounts[merit.meritKey] = (meritCounts[merit.meritKey] ?? 0) + 1;
    }

    container.innerHTML = allMeritsConfig.map((mc) => {
      const count = meritCounts[mc.key] ?? 0;
      const locked = count === 0;
      const badgeSvg = BadgeGenerator.render(mc, { size: 90, locked, count });

      return `
        <div class="badge-showcase-item ${locked ? "badge-showcase-item--locked" : ""}"
             title="${mc.title}: ${mc.description}${locked ? " (ainda não conquistado)" : ` (×${count})`}">
          ${badgeSvg}
        </div>
      `;
    }).join("");
  };

  // Renderiza o histórico completo de méritos recebidos
  const renderHistory = (memberMerits, allMeritsConfig) => {
    const container = document.getElementById("merit-history");
    if (!container) return;

    if (memberMerits.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum mérito recebido ainda.</p>';
      return;
    }

    container.innerHTML = [...memberMerits].reverse().map((merit) => {
      const mc = allMeritsConfig.find((m) => m.key === merit.meritKey);
      if (!mc) return "";

      const reasonHtml = merit.reason
        ? `<p class="history-item__reason">"${merit.reason}"</p>`
        : "";

      return `
        <article class="history-item">
          <div class="history-item__badge">${BadgeGenerator.render(mc, { size: 56, showLabel: false })}</div>
          <div class="history-item__info">
            <span class="history-item__title">${mc.emoji} ${mc.title}</span>
            ${reasonHtml}
            <div class="history-item__meta">
              <span>por ${merit.givenBy ?? "Anônimo"}</span>
              <time datetime="${merit.timestamp}">${formatDate(merit.timestamp)}</time>
            </div>
          </div>
        </article>
      `;
    }).join("");
  };

  const showLoading = (show) => {
    const loader = document.getElementById("loading-state");
    const content = document.getElementById("profile-content");
    if (loader) loader.hidden = !show;
    if (content) content.hidden = show;
    if (!show) {
      const pageLoader = document.getElementById("page-loader");
      if (pageLoader) {
        pageLoader.classList.add("page-loader--hiding");
        pageLoader.addEventListener("transitionend", () => pageLoader.remove(), { once: true });
        setTimeout(() => pageLoader.remove(), 600);
      }
    }
  };

  const showError = (message) => {
    const el = document.getElementById("error-state");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  };

  const init = async () => {
    Auth.renderUserBar(document.getElementById("user-bar"));
    const memberId = getMemberId();
    showLoading(true);

    try {
      const { data } = await GitHubAPI.readDB();
      const member = findMember(memberId, data.members ?? []);

      if (!member) {
        showError("Membro não encontrado. Verifique o parâmetro ?id= na URL.");
        return;
      }

      document.title = `${member.name} — Honra ao Mérito`;

      const nameEl = document.getElementById("profile-name");
      const totalEl = document.getElementById("profile-total");

      if (nameEl) nameEl.textContent = member.name;

      renderProfileAvatar(memberId, member, data.users ?? []);
      initAvatarUpload(memberId);

      const memberMerits = data.merits.filter((m) => m.recipientId === memberId);
      const total = memberMerits.length;
      if (totalEl) totalEl.textContent = `${total} mérito${total !== 1 ? "s" : ""}`;

      renderProfileStats(memberMerits, member);

      const allMeritsConfig = getAllMeritsConfig(data.customMerits ?? []);
      renderBadgeShowcase(memberMerits, allMeritsConfig);
      renderHistory(memberMerits, allMeritsConfig);

      // Re-renderiza badges quando o tema muda
      window.addEventListener("themechange", () => {
        renderBadgeShowcase(memberMerits, allMeritsConfig);
        renderHistory(memberMerits, allMeritsConfig);
      });
    } catch (err) {
      showError(err.message);
    } finally {
      showLoading(false);
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => ProfilePage.init());
