// ============================================================
// badge-generator.js — Geração de badges SVG dinâmicos
// ============================================================

const BadgeGenerator = (() => {

  // Retorna o path SVG para cada formato de badge
  const getShapePath = (shape, size) => {
    const half = size / 2;
    const cx = half;
    const cy = half;

    switch (shape) {
      case "hexagon": {
        const r = half * 0.88;
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 180) * (60 * i - 30);
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ");
        return `<polygon points="${points}" />`;
      }
      case "shield": {
        const w = size * 0.78;
        const h = size * 0.88;
        const ox = (size - w) / 2;
        const oy = (size - h) / 2;
        return `<path d="M${cx},${oy + h} C${ox},${oy + h * 0.65} ${ox},${oy + h * 0.35} ${ox},${oy} L${cx},${oy} L${ox + w},${oy} C${ox + w},${oy + h * 0.35} ${ox + w},${oy + h * 0.65} ${cx},${oy + h} Z" />`;
      }
      case "star": {
        const outerR = half * 0.88;
        const innerR = half * 0.40;
        const points = Array.from({ length: 10 }, (_, i) => {
          const angle = (Math.PI / 180) * (36 * i - 90);
          const r = i % 2 === 0 ? outerR : innerR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ");
        return `<polygon points="${points}" />`;
      }
      case "circle":
      default:
        return `<circle cx="${cx}" cy="${cy}" r="${half * 0.88}" />`;
    }
  };

  // Quebra texto em tspans para caber dentro do badge
  const wrapText = (text, maxChars, x, startY, lineHeight) => {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length <= maxChars) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Centraliza verticalmente o bloco de texto
    const totalHeight = lines.length * lineHeight;
    const firstY = startY - (totalHeight - lineHeight) / 2;

    return lines.map((line, i) =>
      `<tspan x="${x}" y="${firstY + i * lineHeight}">${escapeXml(line)}</tspan>`
    ).join("");
  };

  const escapeXml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Função principal: retorna string SVG pronta para innerHTML
  const render = (meritConfig, options = {}) => {
    const {
      size = 120,
      locked = false,
      count = 0
    } = options;

    const {
      emoji = "🏅",
      title = "Mérito",
      badge: {
        backgroundColor = "#0d1117",
        borderColor = "#39d353",
        textColor = "#e6edf3",
        shape = "hexagon"
      } = {}
    } = meritConfig;

    const filterId = `glow-${meritConfig.key ?? Math.random().toString(36).slice(2)}`;
    const half = size / 2;
    const emojiSize = size * 0.30;
    const fontSize = size * 0.092;
    const emojiY = half - size * 0.10;
    const textY = half + size * 0.20;
    const maxChars = Math.floor(size / 8.5);

    const shapeSvg = getShapePath(shape, size);
    const textTspans = wrapText(title, maxChars, half, textY, fontSize * 1.2);

    const lockedFilter = locked
      ? `style="filter: grayscale(1); opacity: 0.35;"`
      : "";

    const countBadge = count > 1
      ? `<g>
          <circle cx="${size * 0.82}" cy="${size * 0.18}" r="${size * 0.14}" fill="#e3b341" stroke="#0d1117" stroke-width="1.5"/>
          <text x="${size * 0.82}" y="${size * 0.23}" font-family="monospace" font-size="${size * 0.12}" font-weight="bold" fill="#0d1117" text-anchor="middle">×${count > 9 ? "9+" : count}</text>
        </g>`
      : "";

    return `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      overflow="visible"
      role="img"
      aria-label="${escapeXml(title)}: ${escapeXml(meritConfig.description ?? "")}"
      data-merit-key="${escapeXml(meritConfig.key ?? "")}"
      ${lockedFilter}
    >
      <defs>
        <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Sombra/glow da forma -->
      <g fill="${borderColor}" filter="url(#${filterId})" opacity="0.6">
        ${shapeSvg}
      </g>

      <!-- Borda colorida -->
      <g fill="${borderColor}">
        ${shapeSvg}
      </g>

      <!-- Fundo interno (menor) -->
      <g transform="scale(0.88) translate(${half * 0.136}, ${half * 0.136})" fill="${backgroundColor}">
        ${shapeSvg}
      </g>

      <!-- Emoji -->
      <text
        x="${half}"
        y="${emojiY}"
        font-size="${emojiSize}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${emoji}</text>

      <!-- Nome do mérito -->
      <text
        font-family="'Segoe UI', Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
        fill="${textColor}"
        text-anchor="middle"
        letter-spacing="-0.2"
      >${textTspans}</text>

      ${countBadge}
    </svg>`;
  };

  // Converte SVG para data URL base64 (para uso em <img src="...">)
  const toDataURL = (meritConfig, options = {}) => {
    const svg = render(meritConfig, options);
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  };

  return { render, toDataURL };
})();
