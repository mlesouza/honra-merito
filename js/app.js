// ============================================================
// app.js — Lógica da página principal (index.html)
// ============================================================

const App = (() => {
  const FEED_PAGE_SIZE = 20;
  let feedOffset = 0;
  let db = null;

  const getAllMeritsConfig = (customMerits = []) => [...MERITS, ...customMerits];
  const findMeritConfig = (key, customMerits) =>
    getAllMeritsConfig(customMerits).find((m) => m.key === key);
  const findMember = (id) =>
    CONFIG.MEMBERS.find((m) => m.id === id) ?? db?.members?.find((m) => m.id === id);

  const relativeTime = (isoString) => {
    const secs = Math.floor((Date.now() - new Date(isoString)) / 1000);
    if (secs < 60)    return "agora há pouco";
    if (secs < 3600)  return `há ${Math.floor(secs / 60)} min`;
    if (secs < 86400) return `há ${Math.floor(secs / 3600)} h`;
    if (secs < 604800) return `há ${Math.floor(secs / 86400)} dias`;
    return new Date(isoString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const formatDate = (isoString) =>
    new Date(isoString).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  // ——— Stats ————————————————————————————————————————————

  const renderStats = (dbData) => {
    const totalEl   = document.getElementById("stat-total-merits");
    const membersEl = document.getElementById("stat-members");
    const uniqueEl  = document.getElementById("stat-unique-merits");
    const weekEl    = document.getElementById("stat-this-week");
    const monthEl   = document.getElementById("stat-this-month");
    const avgEl     = document.getElementById("stat-avg");
    if (!totalEl) return;

    const totalMerits  = dbData.merits.length;
    const totalMembers = [...CONFIG.MEMBERS, ...(dbData.members ?? [])]
      .filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i).length;
    const uniqueTypes  = new Set(dbData.merits.map((m) => m.meritKey)).size;
    const oneWeekAgo   = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo  = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const thisWeek     = dbData.merits.filter((m) => new Date(m.timestamp) >= oneWeekAgo).length;
    const thisMonth    = dbData.merits.filter((m) => new Date(m.timestamp) >= oneMonthAgo).length;
    const avg          = totalMembers > 0 ? (totalMerits / totalMembers) : 0;

    Animations.countUp(totalEl,   totalMerits,  900);
    Animations.countUp(membersEl, totalMembers, 700);
    Animations.countUp(uniqueEl,  uniqueTypes,  750);
    Animations.countUp(weekEl,    thisWeek,     600);
    Animations.countUp(monthEl,   thisMonth,    700);
    if (avgEl) avgEl.textContent = avg.toFixed(1);
  };

  // ——— Pódio Top 3 ——————————————————————————————————————

  const buildMeritCounts = (merits) => {
    const counts = {};
    for (const m of merits) counts[m.recipientId] = (counts[m.recipientId] ?? 0) + 1;
    return counts;
  };

  const buildSortedMembers = (dbData) => {
    const counts = buildMeritCounts(dbData.merits);
    return [...CONFIG.MEMBERS, ...(dbData.members ?? [])]
      .filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i)
      .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  };

  const renderPodium = (dbData) => {
    const container = document.getElementById("podium");
    if (!container) return;

    const sorted = buildSortedMembers(dbData).slice(0, 3);
    if (sorted.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:var(--space-8)">Nenhum mérito concedido ainda.</p>';
      return;
    }

    const counts = buildMeritCounts(dbData.merits);
    // Display order: 2nd, 1st, 3rd (classic podium)
    const displayOrder = sorted.length >= 3
      ? [sorted[1], sorted[0], sorted[2]]
      : sorted.length === 2 ? [sorted[1], sorted[0]] : [sorted[0]];

    const RANK_EMOJI  = ["🥇", "🥈", "🥉"];

    container.innerHTML = displayOrder.map((member) => {
      const rank  = sorted.indexOf(member); // 0-based
      const total = counts[member.id] ?? 0;
      const avatarHtml = AvatarUtils.getDisplay(member.id, dbData.users ?? [], member.avatar, rank === 0 ? 80 : 64);

      const recentBadges = [...dbData.merits]
        .filter((m) => m.recipientId === member.id)
        .slice(-3).reverse()
        .map((m) => findMeritConfig(m.meritKey, dbData.customMerits))
        .filter(Boolean);

      const badgesHtml = recentBadges.map((mc) =>
        `<div class="badge-mini" data-tooltip="${mc.title}">${BadgeGenerator.render(mc, { size: 36, showLabel: false })}</div>`
      ).join("");

      return `
        <a href="profile.html?id=${member.id}" class="podium-card podium-card--rank-${rank + 1}"
           aria-label="Ver perfil de ${member.name}, ${RANK_EMOJI[rank]} lugar">
          <div class="podium-card__crown">${RANK_EMOJI[rank]}</div>
          <div class="podium-card__avatar">${avatarHtml}</div>
          <div class="podium-card__name">${member.name}</div>
          <div class="podium-card__total">${total} mérito${total !== 1 ? "s" : ""}</div>
          <div class="podium-card__badges">${badgesHtml}</div>
          <div class="podium-card__stand podium-card__stand--rank-${rank + 1}"></div>
        </a>`;
    }).join("");

    // Ativa scroll reveal nos novos cards
    setTimeout(() => Animations.observeNew(".podium-card"), 50);
  };

  // ——— Ranking compacto (#4+) ————————————————————————————

  const renderRankRow = (member, rank, dbData) => {
    const total = dbData.merits.filter((m) => m.recipientId === member.id).length;
    const recentBadges = [...dbData.merits]
      .filter((m) => m.recipientId === member.id)
      .slice(-3).reverse()
      .map((m) => findMeritConfig(m.meritKey, dbData.customMerits))
      .filter(Boolean);

    const badgesHtml = recentBadges.map((mc) =>
      `<div class="badge-mini" data-tooltip="${mc.title}">${BadgeGenerator.render(mc, { size: 34, showLabel: false })}</div>`
    ).join("");

    const avatarHtml = AvatarUtils.getDisplay(member.id, dbData.users ?? [], member.avatar, 36);

    return `
      <a href="profile.html?id=${member.id}" class="rank-row" aria-label="Ver perfil de ${member.name}, posição ${rank}">
        <span class="rank-row__pos">#${rank}</span>
        <div class="rank-row__avatar">${avatarHtml}</div>
        <div class="rank-row__info">
          <span class="rank-row__name">${member.name}</span>
          <span class="rank-row__count">${total} mérito${total !== 1 ? "s" : ""}</span>
        </div>
        <div class="rank-row__badges">${badgesHtml}</div>
      </a>`;
  };

  const renderRanking = (dbData) => {
    const container = document.getElementById("ranking-list");
    if (!container) return;

    const sorted = buildSortedMembers(dbData);
    const belowPodium = sorted.slice(3);

    if (belowPodium.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = belowPodium
      .map((m, i) => renderRankRow(m, i + 4, dbData))
      .join("");

    Animations.stagger("#ranking-list", ".rank-row", 45);
    setTimeout(() => Animations.observeNew(".rank-row"), 50);
  };

  // ——— Feed ——————————————————————————————————————————————

  const removeMeritFromFeed = async (meritId, articleEl) => {
    try { await Auth.requireLogin(); } catch { return; }

    const currentUserId = Auth.getCurrentUser()?.memberId;
    const merit = db?.merits?.find((m) => m.id === meritId);
    if (merit?.givenById && merit.givenById !== currentUserId) {
      alert("Apenas quem deu este mérito pode apagá-lo.");
      return;
    }
    if (!confirm("Apagar este mérito? A ação não pode ser desfeita.")) return;

    articleEl.style.opacity = "0.4";
    articleEl.style.pointerEvents = "none";

    try {
      await GitHubAPI.updateDB((data) => {
        data.merits = data.merits.filter((m) => m.id !== meritId);
        return data;
      }, `fix: remove mérito ${meritId}`);
      articleEl.remove();
      const { data } = await GitHubAPI.readDB();
      db = data;
      renderPodium(data);
      renderRanking(data);
    } catch (err) {
      alert(`Erro ao apagar: ${err.message}`);
      articleEl.style.opacity = "";
      articleEl.style.pointerEvents = "";
    }
  };

  const renderFeedItem = (merit, dbData) => {
    const member = findMember(merit.recipientId);
    const meritConfig = findMeritConfig(merit.meritKey, dbData.customMerits);
    if (!member || !meritConfig) return "";

    const reasonHtml = merit.reason
      ? `<span class="feed-item__reason">"${merit.reason}"</span>` : "";

    const avatarHtml = AvatarUtils.getDisplay(merit.recipientId, dbData.users ?? [], member.avatar, 28);

    return `
      <article class="feed-item" data-merit-id="${merit.id}" aria-label="Mérito concedido a ${member.name}">
        <div class="feed-item__icon">${meritConfig.emoji}</div>
        <div class="feed-item__body">
          <div class="feed-item__header">
            <span class="feed-item__recipient">${avatarHtml} ${member.name}</span>
            <span class="feed-item__merit-name">${meritConfig.title}</span>
          </div>
          ${reasonHtml}
          <div class="feed-item__meta">
            <span class="feed-item__giver">por ${merit.givenBy ?? "Anônimo"}</span>
            <time class="feed-item__date" datetime="${merit.timestamp}" title="${formatDate(merit.timestamp)}">${relativeTime(merit.timestamp)}</time>
          </div>
        </div>
        <button class="feed-item__delete" data-action="delete-merit" data-id="${merit.id}"
          aria-label="Apagar mérito de ${member.name}" title="Apagar mérito">🗑️</button>
      </article>`;
  };

  const renderFeed = (dbData, reset = false) => {
    const container = document.getElementById("feed-list");
    const loadMoreBtn = document.getElementById("feed-load-more");
    if (!container) return;

    if (reset) { feedOffset = 0; container.innerHTML = ""; }

    const sorted = [...dbData.merits].reverse();
    const page = sorted.slice(feedOffset, feedOffset + FEED_PAGE_SIZE);

    if (page.length === 0 && feedOffset === 0) {
      container.innerHTML = '<p class="text-muted feed-empty">Nenhum mérito concedido ainda. Seja o primeiro! 🏅</p>';
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      return;
    }

    container.insertAdjacentHTML("beforeend", page.map((m) => renderFeedItem(m, dbData)).join(""));
    feedOffset += FEED_PAGE_SIZE;
    if (loadMoreBtn) loadMoreBtn.hidden = feedOffset >= sorted.length;
  };

  // ——— Méritos em Alta ——————————————————————————————————

  const renderPopularMerits = (dbData) => {
    const container = document.getElementById("popular-merits");
    if (!container) return;

    const allMerits = getAllMeritsConfig(dbData.customMerits);
    const counts = {};
    for (const m of dbData.merits) counts[m.meritKey] = (counts[m.meritKey] ?? 0) + 1;

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (sorted.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding:var(--space-4)">Nenhum mérito concedido ainda.</p>';
      return;
    }

    const maxCount = sorted[0][1];
    const pcts = [];
    container.innerHTML = sorted.map(([key, count], i) => {
      const mc = allMerits.find((m) => m.key === key);
      if (!mc) { pcts.push(0); return ""; }
      const pct = Math.round((count / maxCount) * 100);
      pcts.push(pct);
      return `
        <div class="merit-pop-item anim-fade-up" style="animation-delay:${i * 55}ms">
          <div class="merit-pop-item__badge">${BadgeGenerator.render(mc, { size: 38, showLabel: false })}</div>
          <div class="merit-pop-item__info">
            <div class="merit-pop-item__top">
              <span class="merit-pop-item__name">${mc.title}</span>
              <span class="merit-pop-item__count">${count}×</span>
            </div>
            <div class="merit-pop-item__bar-track">
              <div class="merit-pop-item__bar-fill" data-pct="${pct}"></div>
            </div>
          </div>
        </div>`;
    }).join("");

    // Anima as barras no próximo frame (garante transição CSS)
    requestAnimationFrame(() => {
      container.querySelectorAll(".merit-pop-item__bar-fill").forEach((el, i) => {
        setTimeout(() => { el.style.width = `${pcts[i] ?? 0}%`; }, i * 55 + 100);
      });
    });
  };

  // ——— Top Dadores ——————————————————————————————————————

  const renderTopGivers = (dbData) => {
    const container = document.getElementById("top-givers");
    if (!container) return;

    const allMembers = [...CONFIG.MEMBERS, ...(dbData.members ?? [])]
      .filter((m, i, a) => a.findIndex((x) => x.id === m.id) === i);

    // Conta por givenById quando disponível, senão por givenBy (string)
    const countById = {};
    const countByName = {};
    for (const m of dbData.merits) {
      if (m.givenById) countById[m.givenById] = (countById[m.givenById] ?? 0) + 1;
      else if (m.givenBy) countByName[m.givenBy] = (countByName[m.givenBy] ?? 0) + 1;
    }

    const givers = [
      ...Object.entries(countById).map(([id, n]) => ({ id, name: allMembers.find((m) => m.id === id)?.name ?? id, count: n })),
      ...Object.entries(countByName).map(([name, n]) => ({ id: null, name, count: n })),
    ].sort((a, b) => b.count - a.count).slice(0, 6);

    if (givers.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding:var(--space-4)">Nenhum mérito concedido ainda.</p>';
      return;
    }

    container.innerHTML = givers.map((g, i) => {
      const member = g.id ? allMembers.find((m) => m.id === g.id) : null;
      const avatarHtml = g.id
        ? AvatarUtils.getDisplay(g.id, dbData.users ?? [], member?.avatar, 32)
        : `<span class="avatar-emoji" style="font-size:1.2rem">🧑‍💻</span>`;
      const profileHref = g.id ? `profile.html?id=${g.id}` : "#";
      return `
        <a href="${profileHref}" class="giver-row anim-fade-up" style="animation-delay:${i * 55}ms"
           aria-label="${g.name} deu ${g.count} mérito${g.count !== 1 ? "s" : ""}">
          <span class="giver-row__rank">#${i + 1}</span>
          <div class="giver-row__avatar">${avatarHtml}</div>
          <div class="giver-row__info">
            <span class="giver-row__name">${g.name}</span>
            <span class="giver-row__count">${g.count} dado${g.count !== 1 ? "s" : ""}</span>
          </div>
          <span class="giver-row__badge">🎁</span>
        </a>`;
    }).join("");
  };

  // ——— Gráfico de Atividade Mensal ——————————————————————

  const renderActivityChart = (dbData) => {
    const container = document.getElementById("activity-chart");
    if (!container) return;

    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("pt-BR", { month: "short" }), count: 0 });
    }

    for (const m of dbData.merits) {
      const d = new Date(m.timestamp);
      const entry = months.find((mo) => mo.year === d.getFullYear() && mo.month === d.getMonth());
      if (entry) entry.count++;
    }

    const maxCount = Math.max(...months.map((m) => m.count), 1);

    container.innerHTML = `
      <div class="activity-bars">
        ${months.map((mo, i) => {
          const pct = Math.round((mo.count / maxCount) * 100);
          const isCurrentMonth = mo.year === now.getFullYear() && mo.month === now.getMonth();
          return `
            <div class="activity-bar-col" style="animation-delay:${i * 40}ms">
              <span class="activity-bar-col__count">${mo.count > 0 ? mo.count : ""}</span>
              <div class="activity-bar-col__track">
                <div class="activity-bar-col__fill${isCurrentMonth ? " activity-bar-col__fill--current" : ""}"
                     style="height:${Math.max(pct, mo.count > 0 ? 4 : 0)}%;transition-delay:${i * 40 + 150}ms"
                     data-tooltip="${mo.count} mérito${mo.count !== 1 ? "s" : ""} em ${mo.label}/${mo.year}"></div>
              </div>
              <span class="activity-bar-col__label">${mo.label}</span>
            </div>`;
        }).join("")}
      </div>`;
  };

  // ——— Init ——————————————————————————————————————————————

  const showError = (message) => {
    const el = document.getElementById("error-state");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  };

  const hidePageLoader = () => {
    const loader = document.getElementById("page-loader");
    if (!loader) return;
    loader.classList.add("page-loader--hiding");
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
    setTimeout(() => loader.remove(), 600);
  };

  const showSkeletons = () => {
    // Stats — pulsa os valores
    document.querySelectorAll(".stat-card__value").forEach((el) => {
      el.innerHTML = `<span class="skel skel--inline" style="width:38px;height:30px;"></span>`;
    });

    // Podium — 3 cards fantasma
    const podium = document.getElementById("podium");
    if (podium) {
      podium.innerHTML = [2, 1, 3].map((rank) => `
        <div class="podium-card podium-card--rank-${rank} podium-card--skeleton">
          <div class="skel skel--circle" style="width:24px;height:24px;margin-bottom:4px;"></div>
          <div class="skel skel--circle" style="width:${rank===1?72:56}px;height:${rank===1?72:56}px;"></div>
          <div class="skel skel--line" style="width:70px;height:11px;margin-top:8px;"></div>
          <div class="skel skel--line" style="width:44px;height:9px;margin-top:4px;"></div>
          <div class="podium-card__stand podium-card__stand--rank-${rank}"></div>
        </div>`).join("");
    }

    // Ranking — linhas fantasma
    const ranking = document.getElementById("ranking-list");
    if (ranking) {
      ranking.innerHTML = Array.from({ length: 4 }, (_, i) => `
        <div class="rank-row rank-row--skeleton" style="animation-delay:${i * 80}ms">
          <span class="skel skel--line" style="width:22px;height:12px;"></span>
          <div class="skel skel--circle" style="width:34px;height:34px;"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
            <div class="skel skel--line" style="width:${70 + i * 10}px;height:12px;"></div>
            <div class="skel skel--line" style="width:48px;height:9px;"></div>
          </div>
        </div>`).join("");
    }

    // Méritos em Alta — linhas fantasma
    const popularMerits = document.getElementById("popular-merits");
    if (popularMerits) {
      popularMerits.innerHTML = Array.from({ length: 6 }, (_, i) => `
        <div class="merit-pop-item merit-pop-item--skeleton" style="animation-delay:${i * 50}ms">
          <div class="skel skel--circle" style="width:38px;height:38px;flex-shrink:0;"></div>
          <div class="merit-pop-item__info" style="flex:1">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <div class="skel skel--line" style="width:${80 + i * 12}px;height:11px;"></div>
              <div class="skel skel--line" style="width:24px;height:11px;"></div>
            </div>
            <div class="skel skel--line" style="width:100%;height:6px;border-radius:3px;"></div>
          </div>
        </div>`).join("");
    }

    // Top Dadores — linhas fantasma
    const topGivers = document.getElementById("top-givers");
    if (topGivers) {
      topGivers.innerHTML = Array.from({ length: 5 }, (_, i) => `
        <div class="giver-row giver-row--skeleton" style="animation-delay:${i * 60}ms">
          <div class="skel skel--line" style="width:20px;height:11px;"></div>
          <div class="skel skel--circle" style="width:32px;height:32px;"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
            <div class="skel skel--line" style="width:${70 + i * 15}px;height:12px;"></div>
            <div class="skel skel--line" style="width:44px;height:9px;"></div>
          </div>
        </div>`).join("");
    }

    // Activity Chart — barras fantasma
    const activityChart = document.getElementById("activity-chart");
    if (activityChart) {
      activityChart.innerHTML = `
        <div class="activity-bars">
          ${Array.from({ length: 12 }, (_, i) => `
            <div class="activity-bar-col" style="animation-delay:${i * 30}ms">
              <span></span>
              <div class="activity-bar-col__track">
                <div class="skel" style="width:100%;height:${20 + Math.random() * 60}%;border-radius:var(--radius-sm) var(--radius-sm) 0 0;"></div>
              </div>
              <div class="skel skel--line" style="width:26px;height:9px;"></div>
            </div>`).join("")}
        </div>`;
    }

    // Feed — cards fantasma
    const feed = document.getElementById("feed-list");
    if (feed) {
      feed.innerHTML = Array.from({ length: 5 }, (_, i) => `
        <div class="feed-item feed-item--skeleton" style="animation-delay:${i * 60}ms">
          <div class="skel skel--circle" style="width:36px;height:36px;flex-shrink:0;"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;gap:8px;align-items:center;">
              <div class="skel skel--line" style="width:90px;height:13px;"></div>
              <div class="skel skel--line" style="width:70px;height:13px;border-radius:var(--radius-full);"></div>
            </div>
            <div class="skel skel--line" style="width:60%;height:11px;"></div>
            <div class="skel skel--line" style="width:40%;height:9px;"></div>
          </div>
        </div>`).join("");
    }
  };

  const init = async () => {
    const userBarEl = document.getElementById("user-bar");
    Auth.renderUserBar(userBarEl);

    // Mostra conteúdo com skeletons enquanto carrega
    document.getElementById("home-hero")?.removeAttribute("hidden");
    const mainSections = document.getElementById("main-sections");
    if (mainSections) mainSections.hidden = false;
    // Remove inline loading-state (o page-loader cobre tudo)
    const inlineLoader = document.getElementById("loading-state");
    if (inlineLoader) inlineLoader.hidden = true;
    showSkeletons();

    try {
      const { data } = await GitHubAPI.readDB();
      db = data;

      hidePageLoader();

      // Re-renderiza user bar com foto de perfil se disponível
      Auth.renderUserBar(userBarEl, data.users ?? []);

      renderStats(data);
      renderPodium(data);
      renderPopularMerits(data);
      renderTopGivers(data);
      renderActivityChart(data);
      renderRanking(data);
      renderFeed(data, true);

      document.getElementById("feed-load-more")?.addEventListener("click", () => renderFeed(db ?? data));

      document.getElementById("feed-list")?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action='delete-merit']");
        if (!btn) return;
        const article = btn.closest("article[data-merit-id]");
        if (article) removeMeritFromFeed(btn.dataset.id, article);
      });

      window.addEventListener("themechange", () => {
        renderPodium(db ?? data);
        renderRanking(db ?? data);
      });
    } catch (err) {
      hidePageLoader();
      showError(err.message);
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => App.init());
