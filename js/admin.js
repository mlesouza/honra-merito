// ============================================================
// admin.js — Lógica da página de administração
// Abas: Conceder Mérito | Criar Novo Mérito | Gerenciar
// ============================================================

const AdminPage = (() => {
  let currentDb = null;
  let badgePreviewDebounceTimer = null;

  // --- Utilitários ---

  const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });

  const slugify = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

  const sanitizeText = (input) =>
    String(input).replace(/<[^>]*>/g, "").trim().slice(0, 500);

  const getAllMeritsConfig = () => [...MERITS, ...(currentDb?.customMerits ?? [])];

  const findMeritConfig = (key) => getAllMeritsConfig().find((m) => m.key === key);

  const showStatus = (elementId, message, type = "success") => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = `status-message status-message--${type}`;
    el.hidden = false;
    el.setAttribute("aria-live", "polite");

    if (type === "success") {
      setTimeout(() => { el.hidden = true; }, 5000);
    }
  };

  const setButtonLoading = (btn, loading, originalText) => {
    btn.disabled = loading;
    btn.textContent = loading ? "Aguarde..." : originalText;
  };

  // --- População de selects ---

  const populateMemberSelect = (selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    const allMembers = [...CONFIG.MEMBERS, ...(currentDb?.members ?? [])]
      .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx);

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

  // --- Aba 1: Conceder Mérito ---

  const initGrantTab = () => {
    populateMemberSelect("grant-member");
    populateMeritSelect("grant-merit");

    const form = document.getElementById("grant-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const originalText = btn.textContent;

      const recipientId = sanitizeText(document.getElementById("grant-member").value);
      const meritKey = sanitizeText(document.getElementById("grant-merit").value);
      const reason = sanitizeText(document.getElementById("grant-reason").value);
      const givenBy = sanitizeText(document.getElementById("grant-giver").value);

      if (!recipientId || !meritKey) {
        showStatus("grant-status", "Preencha o membro e o mérito.", "error");
        return;
      }

      if (givenBy.length === 0) {
        showStatus("grant-status", "Informe seu nome (quem está dando o mérito).", "error");
        return;
      }

      setButtonLoading(btn, true, originalText);

      // UI otimista: mostra celebração imediatamente
      const meritConfig = findMeritConfig(meritKey);
      const allMembers = [...CONFIG.MEMBERS, ...(currentDb?.members ?? [])];
      const member = allMembers.find((m) => m.id === recipientId);

      if (meritConfig && member) {
        Celebration.trigger(meritConfig, member.name);
      }

      try {
        await GitHubAPI.updateDB((data) => {
          data.merits.push({
            id: generateUUID(),
            recipientId,
            meritKey,
            givenBy: givenBy || "Anônimo",
            reason: reason || null,
            timestamp: new Date().toISOString()
          });
          return data;
        }, `feat: concede mérito '${meritKey}' para ${recipientId}`);

        showStatus("grant-status", "Mérito concedido com sucesso! 🏅", "success");
        form.reset();

        // Recarrega db local para manter estado atual
        const { data } = await GitHubAPI.readDB();
        currentDb = data;
      } catch (err) {
        showStatus("grant-status", `Erro ao salvar: ${err.message}`, "error");
      } finally {
        setButtonLoading(btn, false, originalText);
      }
    });
  };

  // --- Aba 2: Criar Novo Mérito ---

  const updateBadgePreview = () => {
    const name = document.getElementById("new-merit-name")?.value ?? "";
    const description = document.getElementById("new-merit-desc")?.value ?? "";
    const emoji = document.getElementById("new-merit-emoji")?.value || "🏅";
    const bgColor = document.getElementById("new-merit-bg")?.value ?? "#0d1117";
    const borderColor = document.getElementById("new-merit-border")?.value ?? "#39d353";
    const textColor = document.getElementById("new-merit-text")?.value ?? "#e6edf3";
    const shape = document.getElementById("new-merit-shape")?.value ?? "hexagon";

    const previewContainer = document.getElementById("badge-preview");
    if (!previewContainer) return;

    const meritConfig = {
      key: "preview",
      emoji,
      title: name || "Novo Mérito",
      description,
      badge: { backgroundColor: bgColor, borderColor, textColor, shape }
    };

    previewContainer.innerHTML = BadgeGenerator.render(meritConfig, { size: 140 });
  };

  const debouncedPreview = () => {
    clearTimeout(badgePreviewDebounceTimer);
    badgePreviewDebounceTimer = setTimeout(updateBadgePreview, 150);
  };

  const initCreateTab = () => {
    updateBadgePreview();

    const previewInputs = [
      "new-merit-name", "new-merit-desc", "new-merit-emoji",
      "new-merit-bg", "new-merit-border", "new-merit-text", "new-merit-shape"
    ];

    previewInputs.forEach((id) => {
      document.getElementById(id)?.addEventListener("input", debouncedPreview);
    });

    const form = document.getElementById("create-merit-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const originalText = btn.textContent;

      const name = sanitizeText(document.getElementById("new-merit-name").value);
      const description = sanitizeText(document.getElementById("new-merit-desc").value);
      const emoji = sanitizeText(document.getElementById("new-merit-emoji").value);
      const bgColor = document.getElementById("new-merit-bg").value;
      const borderColor = document.getElementById("new-merit-border").value;
      const textColor = document.getElementById("new-merit-text").value;
      const shape = document.getElementById("new-merit-shape").value;

      if (!name || !description || !emoji) {
        showStatus("create-status", "Preencha todos os campos obrigatórios.", "error");
        return;
      }

      const key = slugify(name);
      const allMerits = getAllMeritsConfig();

      if (allMerits.some((m) => m.key === key)) {
        showStatus("create-status", `Já existe um mérito com a chave '${key}'. Escolha um nome diferente.`, "error");
        return;
      }

      setButtonLoading(btn, true, originalText);

      try {
        await GitHubAPI.updateDB((data) => {
          data.customMerits.push({
            key,
            emoji,
            title: name,
            description,
            badge: { backgroundColor: bgColor, borderColor, textColor, shape },
            createdAt: new Date().toISOString()
          });
          return data;
        }, `feat: cria mérito customizado '${key}'`);

        showStatus("create-status", `Mérito '${name}' criado com sucesso! ✨`, "success");
        form.reset();
        updateBadgePreview();

        const { data } = await GitHubAPI.readDB();
        currentDb = data;

        // Atualiza selects com o novo mérito
        populateMeritSelect("grant-merit");
        renderManageTab();
      } catch (err) {
        showStatus("create-status", `Erro ao criar mérito: ${err.message}`, "error");
      } finally {
        setButtonLoading(btn, false, originalText);
      }
    });
  };

  // --- Aba 3: Gerenciar ---

  const formatDate = (isoString) =>
    new Date(isoString).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  const renderManageTab = () => {
    if (!currentDb) return;

    renderRecentMerits();
    renderCustomMeritsList();
  };

  const renderRecentMerits = () => {
    const container = document.getElementById("recent-merits-list");
    if (!container) return;

    const allMembers = [...CONFIG.MEMBERS, ...(currentDb.members ?? [])];
    const recent = [...currentDb.merits].reverse().slice(0, 30);

    if (recent.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum mérito concedido ainda.</p>';
      return;
    }

    container.innerHTML = recent.map((merit) => {
      const member = allMembers.find((m) => m.id === merit.recipientId);
      const mc = getAllMeritsConfig().find((m) => m.key === merit.meritKey);
      if (!member || !mc) return "";

      return `
        <div class="manage-item" data-merit-id="${merit.id}">
          <div class="manage-item__info">
            <span>${mc.emoji} <strong>${mc.title}</strong> → ${member.avatar} ${member.name}</span>
            <span class="text-muted">${merit.reason ? `"${merit.reason}" · ` : ""}por ${merit.givenBy ?? "Anônimo"} · ${formatDate(merit.timestamp)}</span>
          </div>
          <button
            class="btn btn--danger btn--sm"
            data-action="remove-merit"
            data-id="${merit.id}"
            aria-label="Remover mérito de ${member.name}"
          >Remover</button>
        </div>
      `;
    }).join("");

    container.querySelectorAll("[data-action=remove-merit]").forEach((btn) => {
      btn.addEventListener("click", () => removeMerit(btn.dataset.id, btn));
    });
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
        <div class="manage-item__badge">${BadgeGenerator.render(mc, { size: 48 })}</div>
        <div class="manage-item__info">
          <span>${mc.emoji} <strong>${mc.title}</strong></span>
          <span class="text-muted">${mc.description}</span>
        </div>
        <button
          class="btn btn--danger btn--sm"
          data-action="delete-custom"
          data-key="${mc.key}"
          aria-label="Excluir mérito ${mc.title}"
        >Excluir</button>
      </div>
    `).join("");

    container.querySelectorAll("[data-action=delete-custom]").forEach((btn) => {
      btn.addEventListener("click", () => deleteCustomMerit(btn.dataset.key, btn));
    });
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

      const { data } = await GitHubAPI.readDB();
      currentDb = data;
      renderManageTab();
    } catch (err) {
      alert(`Erro ao remover: ${err.message}`);
      setButtonLoading(btn, false, originalText);
    }
  };

  const deleteCustomMerit = async (key, btn) => {
    if (!confirm(`Excluir o mérito customizado '${key}'? Os méritos já concedidos com ele serão mantidos no histórico.`)) return;

    const originalText = btn.textContent;
    setButtonLoading(btn, true, originalText);

    try {
      await GitHubAPI.updateDB((data) => {
        data.customMerits = data.customMerits.filter((m) => m.key !== key);
        return data;
      }, `fix: remove mérito customizado '${key}'`);

      const { data } = await GitHubAPI.readDB();
      currentDb = data;
      populateMeritSelect("grant-merit");
      renderManageTab();
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
      setButtonLoading(btn, false, originalText);
    }
  };

  // --- Tabs ---

  const initTabs = () => {
    const tabs = document.querySelectorAll(".tab-btn");
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        tabs.forEach((t) => {
          t.classList.remove("tab-btn--active");
          t.setAttribute("aria-selected", "false");
        });
        panels.forEach((p) => { p.hidden = true; });

        tab.classList.add("tab-btn--active");
        tab.setAttribute("aria-selected", "true");

        const panel = document.getElementById(`tab-${target}`);
        if (panel) panel.hidden = false;

        if (target === "manage") renderManageTab();
      });
    });
  };

  const init = async () => {
    await Auth.requireAuth();

    try {
      const { data } = await GitHubAPI.readDB();
      currentDb = data;
    } catch (err) {
      alert(`Erro ao carregar dados: ${err.message}`);
      return;
    }

    initTabs();
    initGrantTab();
    initCreateTab();
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => AdminPage.init());
