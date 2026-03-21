// ============================================================
// admin.js — Lógica das páginas de administração
// Páginas: admin.html | admin-grant.html | admin-create.html | admin-manage.html
// ============================================================

const AdminPage = (() => {
  let currentDb = null;
  let badgePreviewDebounceTimer = null;

  // ─── Utilitários compartilhados ───────────────────────────

  const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });

  const slugify = (text) =>
    text.toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

  const sanitizeText = (input) =>
    String(input).replace(/<[^>]*>/g, "").trim().slice(0, 500);

  const getAllMeritsConfig = () => [...MERITS, ...(currentDb?.customMerits ?? [])];
  const findMeritConfig   = (key) => getAllMeritsConfig().find((m) => m.key === key);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  const showStatus = (elementId, message, type = "success") => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = `status-message status-message--${type}`;
    el.hidden = false;
    if (type === "success") setTimeout(() => { el.hidden = true; }, 5000);
  };

  const setButtonLoading = (btn, loading, originalText) => {
    btn.disabled = loading;
    btn.textContent = loading ? "Aguarde..." : originalText;
  };

  // Requer login e retorna false se o usuário cancelar
  const requireAuth = async () => {
    const userBarEl = document.getElementById("user-bar");
    Auth.renderUserBar(userBarEl);
    try {
      await Auth.requireLogin();
    } catch {
      return false;
    }
    // Carrega DB para ter foto de perfil disponível no user bar
    try {
      await loadDB();
    } catch { /* ignora — cada init() vai tentar de novo */ }
    Auth.renderUserBar(userBarEl, currentDb?.users ?? []);
    return true;
  };

  const loadDB = async () => {
    const { data } = await GitHubAPI.readDB();
    currentDb = data;
  };

  const showPage = (id = "page-content") => {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
    // Hide full-screen loader
    const loader = document.getElementById("page-loader");
    if (loader) {
      loader.classList.add("page-loader--hiding");
      loader.addEventListener("transitionend", () => loader.remove(), { once: true });
      setTimeout(() => loader.remove(), 600); // fallback
    }
  };

  // ─── Selects ──────────────────────────────────────────────

  const populateMemberSelect = (selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;
    const allMembers = [...CONFIG.MEMBERS, ...(currentDb?.members ?? [])]
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
    select.innerHTML = '<option value="">Selecione um membro...</option>' +
      allMembers.map((m) => `<option value="${m.id}">${m.avatar} ${m.name}</option>`).join("");
  };

  const populateMeritSelect = (selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um mérito...</option>' +
      getAllMeritsConfig().map((m) =>
        `<option value="${m.key}">${m.emoji} ${m.title}</option>`
      ).join("");
  };

  // ─── Emoji Picker ─────────────────────────────────────────

  const EMOJI_GROUPS = [
    { label: "Conquistas",      icons: ["🏅","🥇","🥈","🥉","🏆","🎖️","🎯","🎗️","🏵️","👑","💎","🔮","🎀","🎫","🎪"] },
    { label: "Dev / Tech",      icons: ["💻","🖥️","⌨️","🖱️","📱","💾","💿","📡","🛰️","🔧","⚙️","🛠️","🔩","💡","🤖","👾","🧩","🔦","🔋","📲"] },
    { label: "Animais",         icons: ["🐍","🦁","🐯","🦊","🐺","🦅","🦋","🦈","🐉","🦄","🐸","🐙","🦂","🦖","🦇"] },
    { label: "Fogo / Elementos",icons: ["🔥","⚡","❄️","🌊","💨","🌪️","💥","☄️","🌋","🌈","🌙","⭐","🌟","💫","✨"] },
    { label: "Pessoas / RPG",   icons: ["🧙","🥷","🧛","🧟","🦹","🦸","🧝","👨‍💻","👩‍💻","🕵️","💀","☠️","👽","🤡","🃏"] },
    { label: "Objetos",         icons: ["🍕","🎮","🎲","🎸","🥁","🎤","🎨","🎬","🚀","⚔️","🔑","📜","🧪","💊","🏴‍☠️"] },
  ];

  const initEmojiPicker = () => {
    const trigger  = document.getElementById("emoji-trigger");
    const dropdown = document.getElementById("emoji-picker-dropdown");
    const display  = document.getElementById("emoji-display");
    const hidden   = document.getElementById("new-merit-emoji");
    if (!trigger || !dropdown) return;

    dropdown.insertAdjacentHTML("beforeend", EMOJI_GROUPS.map((g) => `
      <div class="emoji-group">
        <div class="emoji-group__label">${g.label}</div>
        <div class="emoji-group__grid">
          ${g.icons.map((e) => `<button type="button" class="emoji-opt" data-emoji="${e}" aria-label="${e}">${e}</button>`).join("")}
        </div>
      </div>
    `).join(""));

    const applyEmoji = (emoji) => {
      if (!emoji?.trim()) return;
      display.textContent = emoji;
      hidden.value = emoji;
      dropdown.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      debouncedPreview();
    };

    trigger.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const open = !dropdown.hidden;
      dropdown.hidden = open;
      trigger.setAttribute("aria-expanded", String(!open));
    });

    dropdown.addEventListener("click", (ev) => {
      const opt = ev.target.closest(".emoji-opt");
      if (opt) { applyEmoji(opt.dataset.emoji); return; }
      if (ev.target.closest("#emoji-custom-confirm")) {
        const inp = document.getElementById("emoji-custom-input");
        if (inp?.value.trim()) { applyEmoji(inp.value.trim()); inp.value = ""; }
      }
    });

    document.getElementById("emoji-custom-input")?.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const v = ev.target.value.trim();
        if (v) { applyEmoji(v); ev.target.value = ""; }
      }
    });

    document.addEventListener("click", (ev) => {
      if (!trigger.contains(ev.target) && !dropdown.contains(ev.target)) {
        dropdown.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  };

  // ─── Badge Preview ────────────────────────────────────────

  const updateBadgePreview = () => {
    const previewContainer = document.getElementById("badge-preview");
    if (!previewContainer) return;
    const meritConfig = {
      key: "preview",
      emoji:       document.getElementById("new-merit-emoji")?.value  || "🏅",
      title:       document.getElementById("new-merit-name")?.value   || "Novo Mérito",
      description: document.getElementById("new-merit-desc")?.value   || "",
      badge: {
        backgroundColor: document.getElementById("new-merit-bg")?.value     ?? "#0d1117",
        borderColor:     document.getElementById("new-merit-border")?.value ?? "#39d353",
        textColor:       document.getElementById("new-merit-text")?.value   ?? "#e6edf3",
        shape:           document.getElementById("new-merit-shape")?.value  ?? "hexagon",
      }
    };
    previewContainer.innerHTML = BadgeGenerator.render(meritConfig, { size: 140 });
  };

  const debouncedPreview = () => {
    clearTimeout(badgePreviewDebounceTimer);
    badgePreviewDebounceTimer = setTimeout(updateBadgePreview, 150);
  };

  // ─── Manage: remover méritos ──────────────────────────────

  const renderRecentMerits = () => {
    const container = document.getElementById("recent-merits-list");
    if (!container) return;
    const allMembers   = [...CONFIG.MEMBERS, ...(currentDb.members ?? [])];
    const recent       = [...currentDb.merits].reverse().slice(0, 30);
    const currentUserId = Auth.getCurrentUser()?.memberId;

    if (recent.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum mérito concedido ainda.</p>';
      return;
    }

    container.innerHTML = recent.map((merit) => {
      const member = allMembers.find((m) => m.id === merit.recipientId);
      const mc     = getAllMeritsConfig().find((m) => m.key === merit.meritKey);
      if (!member || !mc) return "";
      const canRemove = merit.givenById === currentUserId;
      return `
        <div class="manage-item" data-merit-id="${merit.id}">
          <div class="manage-item__info">
            <span>${mc.emoji} <strong>${mc.title}</strong> → ${member.avatar} ${member.name}</span>
            <span class="text-muted">${merit.reason ? `"${merit.reason}" · ` : ""}por ${merit.givenBy ?? "Anônimo"} · ${formatDate(merit.timestamp)}</span>
          </div>
          ${canRemove
            ? `<button class="btn btn--danger btn--sm" data-action="remove-merit" data-id="${merit.id}" aria-label="Remover">Remover</button>`
            : `<span class="manage-item__owner-lock" title="Apenas quem deu pode remover">🔒</span>`}
        </div>`;
    }).join("");

    container.querySelectorAll("[data-action=remove-merit]").forEach((btn) =>
      btn.addEventListener("click", () => removeMerit(btn.dataset.id, btn))
    );
  };

  const renderCustomMeritsList = () => {
    const container = document.getElementById("custom-merits-list");
    if (!container) return;
    const customs = currentDb.customMerits ?? [];
    if (customs.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum mérito customizado criado ainda.</p>';
      return;
    }
    container.innerHTML = customs.map((mc) => `
      <div class="manage-item" data-custom-key="${mc.key}">
        <div class="manage-item__badge">${BadgeGenerator.render(mc, { size: 48, showLabel: false })}</div>
        <div class="manage-item__info">
          <span>${mc.emoji} <strong>${mc.title}</strong></span>
          <span class="text-muted">${mc.description}</span>
        </div>
        <button class="btn btn--danger btn--sm" data-action="delete-custom" data-key="${mc.key}"
          aria-label="Excluir ${mc.title}">Excluir</button>
      </div>
    `).join("");

    container.querySelectorAll("[data-action=delete-custom]").forEach((btn) =>
      btn.addEventListener("click", () => deleteCustomMerit(btn.dataset.key, btn))
    );
  };

  const removeMerit = async (meritId, btn) => {
    if (!confirm("Remover este mérito? Esta ação não pode ser desfeita.")) return;
    const originalText = btn.textContent;
    setButtonLoading(btn, true, originalText);
    try {
      await GitHubAPI.updateDB((data) => {
        data.merits = data.merits.filter((m) => m.id !== meritId);
        return data;
      }, `fix: remove mérito ${meritId}`);
      await loadDB();
      renderRecentMerits();
      renderCustomMeritsList();
    } catch (err) {
      alert(`Erro ao remover: ${err.message}`);
      setButtonLoading(btn, false, originalText);
    }
  };

  const deleteCustomMerit = async (key, btn) => {
    if (!confirm(`Excluir o mérito '${key}'? Os registros já concedidos são mantidos.`)) return;
    const originalText = btn.textContent;
    setButtonLoading(btn, true, originalText);
    try {
      await GitHubAPI.updateDB((data) => {
        data.customMerits = data.customMerits.filter((m) => m.key !== key);
        return data;
      }, `fix: remove mérito customizado '${key}'`);
      await loadDB();
      renderRecentMerits();
      renderCustomMeritsList();
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
      setButtonLoading(btn, false, originalText);
    }
  };

  // ─── initHub (admin.html) ─────────────────────────────────

  const initHub = async () => {
    if (!await requireAuth()) return;
    showPage("admin-content");
  };

  // ─── initGrant (admin-grant.html) ────────────────────────

  const initGrant = async () => {
    if (!await requireAuth()) return;
    try { await loadDB(); } catch (err) { alert(`Erro: ${err.message}`); return; }
    showPage();

    populateMemberSelect("grant-member");
    populateMeritSelect("grant-merit");

    const currentUser = Auth.getCurrentUser();
    const giverDisplay = document.getElementById("grant-giver-display");
    if (giverDisplay && currentUser) {
      giverDisplay.innerHTML = `
        <span class="giver-display__avatar">${currentUser.avatar}</span>
        <span class="giver-display__name">${currentUser.name}</span>`;
    }

    // Preview do badge ao selecionar mérito
    const meritSelect = document.getElementById("grant-merit");
    const previewWrap = document.getElementById("merit-preview-wrap");
    const previewBadge = document.getElementById("merit-preview-badge");
    const previewInfo  = document.getElementById("merit-preview-info");

    meritSelect?.addEventListener("change", () => {
      const mc = findMeritConfig(meritSelect.value);
      if (!mc || !previewWrap) return;
      previewWrap.hidden = false;
      previewBadge.innerHTML = BadgeGenerator.render(mc, { size: 80 });
      previewInfo.innerHTML  = `<strong>${mc.title}</strong><br><span class="text-muted">${mc.description}</span>`;
    });

    const form = document.getElementById("grant-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const originalText = btn.textContent;

      const recipientId = sanitizeText(document.getElementById("grant-member").value);
      const meritKey    = sanitizeText(document.getElementById("grant-merit").value);
      const reason      = sanitizeText(document.getElementById("grant-reason").value);
      const givenBy     = Auth.getCurrentUser()?.name ?? "Anônimo";

      if (!recipientId || !meritKey) {
        showStatus("grant-status", "Preencha o membro e o mérito.", "error");
        return;
      }

      setButtonLoading(btn, true, originalText);

      const mc     = findMeritConfig(meritKey);
      const member = [...CONFIG.MEMBERS, ...(currentDb?.members ?? [])].find((m) => m.id === recipientId);
      if (mc && member) Celebration.trigger(mc, member.name);

      try {
        await GitHubAPI.updateDB((data) => {
          data.merits.push({
            id: generateUUID(),
            recipientId,
            meritKey,
            givenBy,
            givenById: Auth.getCurrentUser()?.memberId ?? null,
            reason: reason || null,
            timestamp: new Date().toISOString()
          });
          return data;
        }, `feat: concede mérito '${meritKey}' para ${recipientId}`);

        showStatus("grant-status", "Mérito concedido! 🏅", "success");
        form.reset();
        if (previewWrap) previewWrap.hidden = true;
        await loadDB();
      } catch (err) {
        showStatus("grant-status", `Erro: ${err.message}`, "error");
      } finally {
        setButtonLoading(btn, false, originalText);
      }
    });
  };

  // ─── initCreate (admin-create.html) ──────────────────────

  const initCreate = async () => {
    if (!await requireAuth()) return;
    try { await loadDB(); } catch (err) { alert(`Erro: ${err.message}`); return; }
    showPage();

    updateBadgePreview();
    initEmojiPicker();

    ["new-merit-name","new-merit-desc","new-merit-bg","new-merit-border","new-merit-text","new-merit-shape"]
      .forEach((id) => document.getElementById(id)?.addEventListener("input", debouncedPreview));

    const form = document.getElementById("create-merit-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const originalText = btn.textContent;

      const name        = sanitizeText(document.getElementById("new-merit-name").value);
      const description = sanitizeText(document.getElementById("new-merit-desc").value);
      const emoji       = sanitizeText(document.getElementById("new-merit-emoji").value);
      const bgColor     = document.getElementById("new-merit-bg").value;
      const borderColor = document.getElementById("new-merit-border").value;
      const textColor   = document.getElementById("new-merit-text").value;
      const shape       = document.getElementById("new-merit-shape").value;

      if (!name || !description || !emoji) {
        showStatus("create-status", "Preencha todos os campos obrigatórios.", "error");
        return;
      }

      const key = slugify(name);
      if (getAllMeritsConfig().some((m) => m.key === key)) {
        showStatus("create-status", `Já existe um mérito com a chave '${key}'.`, "error");
        return;
      }

      setButtonLoading(btn, true, originalText);

      try {
        await GitHubAPI.updateDB((data) => {
          data.customMerits.push({
            key, emoji, title: name, description,
            badge: { backgroundColor: bgColor, borderColor, textColor, shape },
            createdAt: new Date().toISOString()
          });
          return data;
        }, `feat: cria mérito customizado '${key}'`);

        showStatus("create-status", `Mérito '${name}' criado! ✨`, "success");
        form.reset();
        document.getElementById("emoji-display").textContent = "🏅";
        document.getElementById("new-merit-emoji").value = "🏅";
        updateBadgePreview();
        await loadDB();
      } catch (err) {
        showStatus("create-status", `Erro: ${err.message}`, "error");
      } finally {
        setButtonLoading(btn, false, originalText);
      }
    });
  };

  // ─── initManage (admin-manage.html) ──────────────────────

  const initManage = async () => {
    if (!await requireAuth()) return;

    const loading = document.getElementById("loading-state");
    const content = document.getElementById("manage-content");
    showPage();

    try {
      await loadDB();
      if (loading) loading.hidden = true;
      if (content) content.hidden = false;
      renderRecentMerits();
      renderCustomMeritsList();
    } catch (err) {
      if (loading) loading.hidden = true;
      alert(`Erro ao carregar: ${err.message}`);
    }
  };

  return { initHub, initGrant, initCreate, initManage };
})();
