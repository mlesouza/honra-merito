// ============================================================
// app.js — Lógica da página principal (index.html)
// Renderiza ranking e feed de méritos
// ============================================================

const App = (() => {
  const FEED_PAGE_SIZE = 20;
  let allMerits = [];
  let feedOffset = 0;
  let db = null;

  // Mescla méritos padrão (config.js) com méritos customizados (db.json)
  const getAllMeritsConfig = (customMerits = []) =>
    [...MERITS, ...customMerits];

  const findMeritConfig = (key, customMerits) =>
    getAllMeritsConfig(customMerits).find((m) => m.key === key);

  const findMember = (id) =>
    CONFIG.MEMBERS.find((m) => m.id === id) ?? db?.members?.find((m) => m.id === id);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // Renderiza um card de membro no ranking
  const renderMemberCard = (memberId, meritsList, customMerits) => {
    const member = findMember(memberId);
    if (!member) return "";

    const memberMerits = meritsList.filter((m) => m.recipientId === memberId);
    const total = memberMerits.length;

    // Últimos 3 badges distintos recebidos
    const lastThreeMerits = memberMerits
      .slice(-3)
      .reverse()
      .map((m) => findMeritConfig(m.meritKey, customMerits))
      .filter(Boolean);

    const badgesHtml = lastThreeMerits.map((mc) =>
      `<div class="badge-mini" title="${mc.title}">${BadgeGenerator.render(mc, { size: 48 })}</div>`
    ).join("");

    return `
      <a href="profile.html?id=${member.id}" class="member-card" aria-label="Ver perfil de ${member.name}">
        <div class="member-card__avatar">${member.avatar}</div>
        <div class="member-card__info">
          <span class="member-card__name">${member.name}</span>
          <span class="member-card__total">${total} mérito${total !== 1 ? "s" : ""}</span>
        </div>
        <div class="member-card__badges">${badgesHtml || '<span class="text-muted">Sem méritos ainda</span>'}</div>
      </a>
    `;
  };

  // Renderiza o ranking completo ordenado por total de méritos
  const renderRanking = (dbData) => {
    const container = document.getElementById("ranking-list");
    if (!container) return;

    const meritCounts = {};
    for (const merit of dbData.merits) {
      meritCounts[merit.recipientId] = (meritCounts[merit.recipientId] ?? 0) + 1;
    }

    const sortedMembers = [...CONFIG.MEMBERS, ...(dbData.members ?? [])]
      .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
      .sort((a, b) => (meritCounts[b.id] ?? 0) - (meritCounts[a.id] ?? 0));

    container.innerHTML = sortedMembers
      .map((m) => renderMemberCard(m.id, dbData.merits, dbData.customMerits))
      .join("") || '<p class="text-muted">Nenhum membro configurado ainda.</p>';
  };

  // Renderiza um item do feed
  const renderFeedItem = (merit, customMerits) => {
    const member = findMember(merit.recipientId);
    const meritConfig = findMeritConfig(merit.meritKey, customMerits);

    if (!member || !meritConfig) return "";

    const reasonHtml = merit.reason
      ? `<span class="feed-item__reason">"${merit.reason}"</span>`
      : "";

    return `
      <article class="feed-item" aria-label="Mérito concedido a ${member.name}">
        <div class="feed-item__icon">${meritConfig.emoji}</div>
        <div class="feed-item__body">
          <div class="feed-item__header">
            <span class="feed-item__recipient">${member.avatar} ${member.name}</span>
            <span class="feed-item__merit-name">${meritConfig.title}</span>
          </div>
          ${reasonHtml}
          <div class="feed-item__meta">
            <span class="feed-item__giver">por ${merit.givenBy ?? "Anônimo"}</span>
            <time class="feed-item__date" datetime="${merit.timestamp}">${formatDate(merit.timestamp)}</time>
          </div>
        </div>
      </article>
    `;
  };

  // Renderiza o feed com paginação
  const renderFeed = (dbData, reset = false) => {
    const container = document.getElementById("feed-list");
    const loadMoreBtn = document.getElementById("feed-load-more");
    if (!container) return;

    if (reset) {
      feedOffset = 0;
      container.innerHTML = "";
    }

    const sorted = [...dbData.merits].reverse();
    const page = sorted.slice(feedOffset, feedOffset + FEED_PAGE_SIZE);

    if (page.length === 0 && feedOffset === 0) {
      container.innerHTML = '<p class="text-muted feed-empty">Nenhum mérito concedido ainda. Seja o primeiro! 🏅</p>';
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      return;
    }

    container.insertAdjacentHTML("beforeend",
      page.map((m) => renderFeedItem(m, dbData.customMerits)).join("")
    );

    feedOffset += FEED_PAGE_SIZE;
    const hasMore = feedOffset < sorted.length;
    if (loadMoreBtn) loadMoreBtn.hidden = !hasMore;
  };

  const showLoading = (show) => {
    const loader = document.getElementById("loading-state");
    const main = document.getElementById("main-content");
    if (loader) loader.hidden = !show;
    if (main) main.hidden = show;
  };

  const showError = (message) => {
    const el = document.getElementById("error-state");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.setAttribute("aria-live", "polite");
  };

  const init = async () => {
    showLoading(true);

    try {
      const { data } = await GitHubAPI.readDB();
      db = data;
      renderRanking(data);
      renderFeed(data, true);
      allMerits = data.merits;

      const loadMoreBtn = document.getElementById("feed-load-more");
      loadMoreBtn?.addEventListener("click", () => renderFeed(data));
    } catch (err) {
      showError(err.message);
    } finally {
      showLoading(false);
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => App.init());
