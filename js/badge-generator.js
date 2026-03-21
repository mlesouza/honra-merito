// ============================================================
// badge-generator.js — Geração de badges no estilo game card
// Mini (< 50px): círculo simples com emoji
// Card (>= 50px): card retangular estilo trading card
// ============================================================

const BadgeGenerator = (() => {

  const escapeXml = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const isColorDark = (hex) => {
    if (!hex || hex.length < 7) return true;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
  };

  // Quebra título em até 2 linhas usando largura em px
  const splitTitle = (title, maxWidthPx, fontSizePx) => {
    const avgCharW = fontSizePx * 0.60;
    const maxChars = Math.max(Math.floor(maxWidthPx / avgCharW), 6);
    const upper = title.toUpperCase();
    if (upper.length <= maxChars) return [upper];

    const words = upper.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      if (lines.length >= 2) break;
      const cand = cur ? `${cur} ${w}` : w;
      if (cand.length <= maxChars) {
        cur = cand;
      } else {
        if (cur) lines.push(cur);
        cur = w.length > maxChars ? w.slice(0, maxChars - 1) + "…" : w;
      }
    }
    if (cur && lines.length < 2) lines.push(cur);
    return lines.length ? lines : [upper.slice(0, maxChars)];
  };

  // Trunca descrição em 1 linha para o footer
  const truncateDesc = (text, maxWidthPx, fontSizePx) => {
    const avgCharW = fontSizePx * 0.58;
    const maxChars = Math.max(Math.floor(maxWidthPx / avgCharW), 8);
    if (!text) return "";
    return text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
  };

  // Retorna um fundo escuro visivelmente tintado com a cor do badge (para temas claros)
  const tintedDarkBg = (borderColor) => {
    const r = parseInt(borderColor.slice(1, 3), 16);
    const g = parseInt(borderColor.slice(3, 5), 16);
    const b = parseInt(borderColor.slice(5, 7), 16);
    const base = 28;
    return `#${Math.min(255, Math.round(base + r * 0.22)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(base + g * 0.22)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(base + b * 0.22)).toString(16).padStart(2, "0")}`;
  };

  const getEffectiveBg = (backgroundColor, borderColor) => {
    const theme = typeof document !== "undefined"
      ? document.documentElement?.getAttribute("data-theme")
      : null;
    if (theme === "light") return tintedDarkBg(borderColor);
    return backgroundColor;
  };

  // ——— Mini badge (< 50px) ———————————————————————————————
  const renderMini = (meritConfig, { size, locked, count }) => {
    const {
      emoji = "🏅",
      badge: { backgroundColor = "#0d1117", borderColor = "#39d353" } = {}
    } = meritConfig;

    const effectiveBg = getEffectiveBg(backgroundColor, borderColor);

    const displayEmoji = locked ? "🔒" : emoji;
    const half = size / 2;
    const r = (half - 1.5).toFixed(1);
    const uid = (meritConfig.key ?? Math.random().toString(36).slice(2)).replace(/[^a-z0-9]/gi, "");

    const countBadge = count > 1 ? `
      <circle cx="${(size * 0.8).toFixed(1)}" cy="${(size * 0.22).toFixed(1)}" r="${(size * 0.2).toFixed(1)}"
        fill="${borderColor}" stroke="${effectiveBg}" stroke-width="${(size * 0.05).toFixed(1)}"/>
      <text x="${(size * 0.8).toFixed(1)}" y="${(size * 0.22).toFixed(1)}"
        font-family="monospace" font-size="${(size * 0.17).toFixed(1)}" font-weight="800"
        text-anchor="middle" dominant-baseline="middle"
        fill="${isColorDark(borderColor) ? "#fff" : "#0d1117"}">×${count > 9 ? "9+" : count}</text>` : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
      role="img" aria-label="${escapeXml(meritConfig.title ?? "Mérito")}"
      data-merit-key="${escapeXml(meritConfig.key ?? "")}"
      ${locked ? 'style="opacity:0.35;filter:grayscale(1)"' : ""}>
      <defs>
        <radialGradient id="mg-${uid}" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${borderColor}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${borderColor}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="${half}" cy="${half}" r="${r}" fill="${effectiveBg}"/>
      <circle cx="${half}" cy="${half}" r="${r}" fill="url(#mg-${uid})"/>
      <circle cx="${half}" cy="${half}" r="${r}" fill="none" stroke="${borderColor}" stroke-width="2"/>
      <text x="${half}" y="${half}" font-size="${(size * 0.54).toFixed(1)}"
        text-anchor="middle" dominant-baseline="middle">${displayEmoji}</text>
      ${countBadge}
    </svg>`;
  };

  // ——— Card badge (>= 50px) ——————————————————————————————
  const renderCard = (meritConfig, { size, locked, count, showLabel }) => {
    const {
      emoji = "🏅",
      title = "Mérito",
      description = "",
      badge: { backgroundColor = "#0d1117", borderColor = "#39d353" } = {}
    } = meritConfig;

    const effectiveBg = getEffectiveBg(backgroundColor, borderColor);
    const displayEmoji = locked ? "🔒" : emoji;
    const uid = (meritConfig.key ?? Math.random().toString(36).slice(2)).replace(/[^a-z0-9]/gi, "");

    const W = size;

    // — Tipografia com auto-scaling —
    const titlePadX    = Math.round(size * 0.14); // margem lateral do título
    let titleFontSize  = Math.max(Math.round(size * 0.096), 9);
    let titleLines     = splitTitle(title, W - titlePadX * 2, titleFontSize);
    // Verifica se a linha mais longa cabe; se não, reduz o font-size
    const longestLine  = titleLines.reduce((a, b) => (a.length > b.length ? a : b), "");
    const maxFitSize   = Math.floor((W - titlePadX * 2) / (longestLine.length * 0.60));
    if (maxFitSize < titleFontSize) {
      titleFontSize = Math.max(maxFitSize, 7);
      titleLines    = splitTitle(title, W - titlePadX * 2, titleFontSize);
    }
    const titleLineH   = titleFontSize * 1.4;

    // — Zonas —
    // Header: altura proporcional com respiro vertical
    const headerH = titleLines.length > 1
      ? Math.round(size * 0.36)
      : Math.round(size * 0.27);

    const hasFooter = showLabel && size >= 58;
    const descFontSize = Math.max(Math.round(size * 0.078), 7);
    const footerH      = hasFooter ? Math.max(Math.round(size * 0.21), 20) : 0;

    const H = Math.round(W * 1.38);
    const bodyH  = H - headerH - footerH;
    const centerY = headerH + bodyH / 2;
    const emojiSize = Math.round(bodyH * 0.66);

    const cornerSz = Math.max(Math.round(size * 0.082), 6);
    const fgColor  = isColorDark(borderColor) ? "#ffffff" : "#0d1117";

    // — Title SVG —
    const titleCenterY = headerH / 2;
    const titleSvg = titleLines.length === 1
      ? `<text x="${W / 2}" y="${titleCenterY.toFixed(1)}"
           font-family="'Segoe UI',system-ui,sans-serif"
           font-size="${titleFontSize}" font-weight="800"
           text-anchor="middle" dominant-baseline="middle"
           fill="${borderColor}" letter-spacing="0.5"
         >${escapeXml(titleLines[0])}</text>`
      : (() => {
          const y0 = (titleCenterY - titleLineH * 0.46).toFixed(1);
          return `<text font-family="'Segoe UI',system-ui,sans-serif"
            font-size="${titleFontSize}" font-weight="800"
            text-anchor="middle" fill="${borderColor}" letter-spacing="0.5">
            <tspan x="${W / 2}" y="${y0}">${escapeXml(titleLines[0])}</tspan>
            <tspan x="${W / 2}" dy="${titleLineH.toFixed(1)}">${escapeXml(titleLines[1])}</tspan>
          </text>`;
        })();

    // — Footer SVG — (1 linha truncada)
    const descLine = hasFooter ? truncateDesc(description, W - 16, descFontSize) : "";
    const footerSvg = hasFooter && descLine
      ? `<text x="${W / 2}" y="${(H - footerH / 2).toFixed(1)}"
           font-family="'Segoe UI',system-ui,sans-serif"
           font-size="${descFontSize}" text-anchor="middle" dominant-baseline="middle"
           fill="#c9d1d9" opacity="0.85">${escapeXml(descLine)}</text>`
      : "";

    // — Count badge —
    const countBadge = count > 1 ? `
      <circle cx="${(W * 0.82).toFixed(1)}" cy="${(headerH + W * 0.13).toFixed(1)}" r="${(size * 0.115).toFixed(1)}"
        fill="${borderColor}" stroke="${effectiveBg}" stroke-width="${(size * 0.028).toFixed(1)}"/>
      <text x="${(W * 0.82).toFixed(1)}" y="${(headerH + W * 0.13).toFixed(1)}"
        font-family="monospace" font-size="${(size * 0.11).toFixed(1)}" font-weight="800"
        text-anchor="middle" dominant-baseline="middle" fill="${fgColor}">×${count > 9 ? "9+" : count}</text>` : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
      role="img" aria-label="${escapeXml(title)}"
      data-merit-key="${escapeXml(meritConfig.key ?? "")}"
      ${locked ? 'style="opacity:0.32;filter:grayscale(1)"' : ""}>
      <defs>
        <clipPath id="clip-${uid}">
          <rect x="0" y="0" width="${W}" height="${H}" rx="8"/>
        </clipPath>
        <pattern id="grid-${uid}" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="${borderColor}" stroke-width="0.28" opacity="0.2"/>
        </pattern>
        <radialGradient id="cg-${uid}" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="${borderColor}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${borderColor}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="hg-${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="${borderColor}" stop-opacity="0.04"/>
          <stop offset="50%"  stop-color="${borderColor}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${borderColor}" stop-opacity="0.04"/>
        </linearGradient>
        <filter id="eg-${uid}" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="${(size * 0.052).toFixed(1)}" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <g clip-path="url(#clip-${uid})">
        <!-- Background -->
        <rect x="0" y="0" width="${W}" height="${H}" fill="${effectiveBg}"/>
        <rect x="0" y="0" width="${W}" height="${H}" fill="url(#grid-${uid})"/>

        <!-- Header fill -->
        <rect x="0" y="0" width="${W}" height="${headerH}" fill="url(#hg-${uid})"/>
        <rect x="0" y="${headerH - 1.5}" width="${W}" height="1.5" fill="${borderColor}" opacity="0.6"/>

        <!-- Footer fill -->
        ${hasFooter ? `
        <rect x="0" y="${H - footerH}" width="${W}" height="${footerH}" fill="url(#hg-${uid})"/>
        <rect x="0" y="${H - footerH}" width="${W}" height="1.5" fill="${borderColor}" opacity="0.6"/>
        ` : ""}

        <!-- Center glow -->
        <ellipse cx="${W / 2}" cy="${centerY.toFixed(1)}" rx="${(W * 0.44).toFixed(1)}" ry="${(bodyH * 0.44).toFixed(1)}"
          fill="url(#cg-${uid})"/>

        <!-- Emoji -->
        <text x="${W / 2}" y="${centerY.toFixed(1)}" font-size="${emojiSize}"
          text-anchor="middle" dominant-baseline="middle"
          filter="url(#eg-${uid})">${displayEmoji}</text>

        ${countBadge}
      </g>

      <!-- Outer border -->
      <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="7"
        fill="none" stroke="${borderColor}" stroke-width="2.5"/>
      <!-- Inner dashed border -->
      <rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="5"
        fill="none" stroke="${borderColor}" stroke-width="0.6"
        stroke-dasharray="3,3" opacity="0.4"/>

      <!-- Title -->
      ${titleSvg}

      <!-- Header corner stars -->
      <text x="${(size * 0.1).toFixed(1)}" y="${(headerH * 0.6).toFixed(1)}"
        font-size="${cornerSz}" fill="${borderColor}" opacity="0.4">★</text>
      <text x="${(W - size * 0.1).toFixed(1)}" y="${(headerH * 0.6).toFixed(1)}"
        text-anchor="end" font-size="${cornerSz}" fill="${borderColor}" opacity="0.4">★</text>

      <!-- Footer description -->
      ${footerSvg}
    </svg>`;
  };

  // ——— Ponto de entrada ——————————————————————————————————
  const render = (meritConfig, options = {}) => {
    const { size = 120, locked = false, count = 0 } = options;
    const showLabel = options.showLabel ?? false; // descrição sempre no modal, nunca no card

    if (size < 50) return renderMini(meritConfig, { size, locked, count });
    return renderCard(meritConfig, { size, locked, count, showLabel });
  };

  // Para uso em <img src="...">
  const toDataURL = (meritConfig, options = {}) => {
    const svg = render(meritConfig, options);
    const bytes = new TextEncoder().encode(svg);
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return `data:image/svg+xml;base64,${btoa(binary)}`;
  };

  return { render, toDataURL };
})();
