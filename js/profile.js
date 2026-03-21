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

  // Renderiza a vitrine de badges (desbloqueados e bloqueados)
  const renderBadgeShowcase = (memberMerits, allMeritsConfig) => {
    const container = document.getElementById("badge-showcase");
    if (!container) return;

    // Conta quantas vezes cada mérito foi recebido
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
          ${!locked ? `<span class="badge-showcase-item__count" aria-label="${count} vez${count !== 1 ? "es" : ""}">×${count}</span>` : ""}
          <span class="badge-showcase-item__label">${locked ? "🔒" : mc.emoji}</span>
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

    const sorted = [...memberMerits].reverse();

    container.innerHTML = sorted.map((merit) => {
      const mc = allMeritsConfig.find((m) => m.key === merit.meritKey);
      if (!mc) return "";

      const reasonHtml = merit.reason
        ? `<p class="history-item__reason">"${merit.reason}"</p>`
        : "";

      return `
        <article class="history-item">
          <div class="history-item__badge">${BadgeGenerator.render(mc, { size: 56 })}</div>
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
      const allDbMembers = data.members ?? [];
      const member = findMember(memberId, allDbMembers);

      if (!member) {
        showError("Membro não encontrado. Verifique o parâmetro ?id= na URL.");
        return;
      }

      document.title = `${member.name} — Honra ao Mérito`;

      const nameEl = document.getElementById("profile-name");
      const avatarEl = document.getElementById("profile-avatar");
      const totalEl = document.getElementById("profile-total");

      if (nameEl) nameEl.textContent = member.name;
      if (avatarEl) avatarEl.textContent = member.avatar;

      const memberMerits = data.merits.filter((m) => m.recipientId === memberId);
      const total = memberMerits.length;

      if (totalEl) totalEl.textContent = `${total} mérito${total !== 1 ? "s" : ""}`;

      const allMeritsConfig = [...MERITS, ...(data.customMerits ?? [])];

      renderBadgeShowcase(memberMerits, allMeritsConfig);
      renderHistory(memberMerits, allMeritsConfig);
    } catch (err) {
      showError(err.message);
    } finally {
      showLoading(false);
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => ProfilePage.init());
