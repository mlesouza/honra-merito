// ============================================================
// theme.js — Seletor de temas do sistema
// ============================================================

const Theme = (() => {
  const STORAGE_KEY = "honra_merito_theme";

  const THEMES = [
    { id: "terminal",  name: "Terminal",  icon: "⌨️",  color: "#39d353" },
    { id: "cyberpunk", name: "Cyberpunk", icon: "⚡",  color: "#ff2d78" },
    { id: "aurora",    name: "Aurora",    icon: "🌌",  color: "#a78bfa" },
    { id: "midnight",  name: "Midnight",  icon: "🌙",  color: "#4f8bff" },
    { id: "sunset",    name: "Sunset",    icon: "🌅",  color: "#ff6b35" },
    { id: "forest",    name: "Forest",    icon: "🌿",  color: "#4caf50" },
    { id: "neon",      name: "Neon",      icon: "💡",  color: "#00ffcc" },
    { id: "dracula",   name: "Dracula",   icon: "🧛",  color: "#bd93f9" },
    { id: "nord",      name: "Nord",      icon: "❄️",  color: "#81a1c1" },
    { id: "rose",      name: "Rose",      icon: "🌸",  color: "#f43f8e" },
    { id: "ocean",     name: "Ocean",     icon: "🌊",  color: "#00b4d8" },
    { id: "amber",     name: "Amber",     icon: "🔥",  color: "#ff8c00" },
    { id: "monokai",   name: "Monokai",   icon: "🎨",  color: "#a6e22e" },
    { id: "light",     name: "Light",     icon: "☀️",  color: "#2563eb" },
  ];

  const apply = (themeId) => {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem(STORAGE_KEY, themeId);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: themeId } }));
  };

  const getCurrent = () => localStorage.getItem(STORAGE_KEY) ?? "terminal";

  const init = () => apply(getCurrent());

  const renderSwitcher = (containerEl) => {
    if (!containerEl) return;
    containerEl._cleanupTheme?.();

    const rebuild = () => {
      const current = getCurrent();
      const ct = THEMES.find((t) => t.id === current) ?? THEMES[0];

      containerEl.innerHTML = `
        <div class="theme-switcher" role="group" aria-label="Seletor de tema">
          <button class="theme-switcher__btn" aria-label="Trocar tema: ${ct.name}"
            aria-haspopup="true" aria-expanded="false" id="theme-toggle-btn">
            <span class="theme-switcher__dot" style="background:${ct.color}"></span>
            <span class="theme-switcher__label">${ct.name}</span>
            <span class="theme-switcher__chevron" aria-hidden="true">▾</span>
          </button>
          <div class="theme-switcher__dropdown" id="theme-dropdown" hidden role="menu"
            aria-labelledby="theme-toggle-btn">
            <div class="theme-grid">
              ${THEMES.map((t) => `
                <button
                  class="theme-tile ${t.id === current ? "theme-tile--active" : ""}"
                  data-theme="${t.id}"
                  role="menuitem"
                  aria-pressed="${t.id === current}"
                  aria-label="Tema ${t.name}"
                  title="${t.name}"
                  style="--c:${t.color}"
                >
                  <span class="theme-tile__icon">${t.icon}</span>
                  <span class="theme-tile__name">${t.name}</span>
                  ${t.id === current ? '<span class="theme-tile__check">✓</span>' : ""}
                </button>
              `).join("")}
            </div>
          </div>
        </div>`;

      const toggleBtn = containerEl.querySelector("#theme-toggle-btn");
      const dropdown  = containerEl.querySelector("#theme-dropdown");

      const toggle = (open) => {
        dropdown.hidden = !open;
        toggleBtn.setAttribute("aria-expanded", String(open));
      };

      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle(dropdown.hidden);
      });

      containerEl.querySelectorAll(".theme-tile").forEach((btn) => {
        btn.addEventListener("click", () => {
          apply(btn.dataset.theme);
          toggle(false);
          rebuild();
        });
      });
    };

    rebuild();

    const closeDropdown = (e) => {
      const dropdown = document.getElementById("theme-dropdown");
      if (dropdown && !containerEl.contains(e.target)) dropdown.hidden = true;
    };
    const closeOnEsc = (e) => {
      if (e.key === "Escape") {
        const dropdown = document.getElementById("theme-dropdown");
        if (dropdown) dropdown.hidden = true;
      }
    };

    document.addEventListener("click", closeDropdown);
    document.addEventListener("keydown", closeOnEsc);

    containerEl._cleanupTheme = () => {
      document.removeEventListener("click", closeDropdown);
      document.removeEventListener("keydown", closeOnEsc);
    };
  };

  return { init, apply, getCurrent, renderSwitcher, THEMES };
})();
