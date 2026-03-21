// ============================================================
// badge-generator.js — Geração de badges SVG dinâmicos
// Design: emoji grande centrado na forma, label abaixo (fora)
// ============================================================

const BadgeGenerator = (() => {

  // Gera polígono regular com n lados
  const regularPolygon = (cx, cy, r, n, offsetDeg = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (Math.PI / 180) * (360 / n * i + offsetDeg);
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");

  // Path SVG da forma do badge (sempre num viewBox size×size)
  const getShapePath = (shape, size) => {
    const half = size / 2;
    const cx = half, cy = half;
    const r88 = half * 0.88;

    switch (shape) {
      case "hexagon":
        return `<polygon points="${regularPolygon(cx, cy, r88, 6, -30)}" />`;

      case "pentagon":
        return `<polygon points="${regularPolygon(cx, cy, r88, 5, -90)}" />`;

      case "shield": {
        const w = size * 0.76, h = size * 0.86;
        const ox = (size - w) / 2, oy = (size - h) / 2;
        return `<path d="M${cx},${(oy+h).toFixed(2)}
          C${ox.toFixed(2)},${(oy+h*0.65).toFixed(2)} ${ox.toFixed(2)},${(oy+h*0.35).toFixed(2)} ${ox.toFixed(2)},${oy.toFixed(2)}
          L${cx},${oy.toFixed(2)}
          L${(ox+w).toFixed(2)},${oy.toFixed(2)}
          C${(ox+w).toFixed(2)},${(oy+h*0.35).toFixed(2)} ${(ox+w).toFixed(2)},${(oy+h*0.65).toFixed(2)} ${cx},${(oy+h).toFixed(2)} Z" />`;
      }

      case "diamond": {
        const r = r88;
        return `<polygon points="${cx},${(cy-r).toFixed(2)} ${(cx+r*0.7).toFixed(2)},${cy} ${cx},${(cy+r).toFixed(2)} ${(cx-r*0.7).toFixed(2)},${cy}" />`;
      }

      case "star5": {
        // Estrela de 5 pontas
        const outerR = r88, innerR = half * 0.40;
        const pts = Array.from({ length: 10 }, (_, i) => {
          const a = (Math.PI / 180) * (36 * i - 90);
          const ri = i % 2 === 0 ? outerR : innerR;
          return `${(cx + ri * Math.cos(a)).toFixed(2)},${(cy + ri * Math.sin(a)).toFixed(2)}`;
        }).join(" ");
        return `<polygon points="${pts}" />`;
      }

      case "star": // alias legado
      case "star8": {
        // Estrela de 8 pontas (burst)
        const outerR = r88, innerR = half * 0.52;
        const pts = Array.from({ length: 16 }, (_, i) => {
          const a = (Math.PI / 180) * (22.5 * i - 90);
          const ri = i % 2 === 0 ? outerR : innerR;
          return `${(cx + ri * Math.cos(a)).toFixed(2)},${(cy + ri * Math.sin(a)).toFixed(2)}`;
        }).join(" ");
        return `<polygon points="${pts}" />`;
      }

      case "scroll": {
        // Pergaminho / crachá arredondado vertically (pill badge)
        const rx = size * 0.42, ry = half * 0.88;
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" />`;
      }

      case "circle":
      default:
        return `<circle cx="${cx}" cy="${cy}" r="${r88.toFixed(2)}" />`;
    }
  };

  const escapeXml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Quebra texto em no máximo maxLines linhas com maxChars por linha
  const wrapLabel = (text, maxChars, maxLines = 2) => {
    const words = text.split(" ");
    const lines = [];
    let current = "";
    for (const word of words) {
      if (lines.length >= maxLines) break;
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word.length > maxChars ? word.slice(0, maxChars - 1) + "…" : word;
      }
    }
    if (current && lines.length < maxLines) lines.push(current);
    return lines;
  };

  // Verifica luminância: true = cor escura
  const isColorDark = (hex) => {
    if (!hex || hex.length < 7) return true;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.4;
  };

  // Função principal
  const render = (meritConfig, options = {}) => {
    const { size = 120, locked = false, count = 0 } = options;

    // showLabel: true quando size >= 64 (showcase, preview, history)
    const showLabel = options.showLabel ?? (size >= 64);

    let {
      emoji = "🏅",
      title = "Mérito",
      badge: {
        backgroundColor = "#0d1117",
        borderColor = "#39d353",
        shape = "hexagon"
      } = {}
    } = meritConfig;

    // Adapta cores para tema light
    const currentTheme = document.documentElement?.getAttribute("data-theme") ?? "terminal";
    if (currentTheme === "light" && isColorDark(backgroundColor)) {
      backgroundColor = "#f1f5f9";
    }

    const uid = (meritConfig.key ?? Math.random().toString(36).slice(2))
      .replace(/[^a-z0-9]/gi, "");
    const filterId    = `ds-${uid}`;
    const hlId        = `hl-${uid}`;

    const half        = size / 2;
    const innerScale  = 0.84;
    const innerTrans  = +(half * (1 / innerScale - 1)).toFixed(2);

    // Emoji centrado na forma (sem texto interno)
    const emojiSize   = size * 0.44;
    const displayEmoji = locked ? "🔒" : emoji;

    // Label abaixo da forma
    const labelFontSize  = Math.max(Math.round(size * 0.115), 9);
    const labelLineH     = labelFontSize * 1.3;
    const labelPaddingY  = size * 0.08;            // espaço entre forma e label
    const maxLabelChars  = Math.max(Math.floor(size / 6), 6);
    const labelLines     = showLabel ? wrapLabel(title, maxLabelChars, 2) : [];
    const labelHeight    = showLabel ? labelPaddingY + labelLines.length * labelLineH + 4 : 0;
    const totalHeight    = size + labelHeight;

    // Cor da label: usa variável CSS para funcionar em qualquer tema
    const labelFill = currentTheme === "light" ? "#1e293b" : "#e6edf3";

    const shapeSvg   = getShapePath(shape, size);

    // Contador no canto superior direito da forma
    const cR  = size * 0.155;
    const cCx = size * 0.82;
    const cCy = size * 0.20;
    const countBadge = count > 1
      ? `<g>
          <circle cx="${cCx}" cy="${cCy}" r="${cR}"
            fill="${borderColor}"
            stroke="${backgroundColor}" stroke-width="${(size * 0.025).toFixed(1)}" />
          <text x="${cCx}" y="${cCy}"
            font-family="monospace" font-size="${(size * 0.13).toFixed(1)}"
            font-weight="800" text-anchor="middle" dominant-baseline="middle"
            fill="${isColorDark(borderColor) ? "#ffffff" : "#0d1117"}"
          >×${count > 9 ? "9+" : count}</text>
        </g>`
      : "";

    // Linhas do label como tspans
    const labelStartY = size + labelPaddingY + labelFontSize;
    const labelSvg = labelLines.map((line, i) =>
      `<tspan x="${half}" dy="${i === 0 ? 0 : labelLineH}">${escapeXml(line)}</tspan>`
    ).join("");

    return `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${totalHeight.toFixed(0)}"
      viewBox="0 0 ${size} ${totalHeight.toFixed(0)}"
      overflow="visible"
      role="img"
      aria-label="${escapeXml(title)}: ${escapeXml(meritConfig.description ?? "")}"
      data-merit-key="${escapeXml(meritConfig.key ?? "")}"
      ${locked ? 'style="opacity:0.32; filter:grayscale(1);"' : ""}
    >
      <defs>
        <filter id="${filterId}" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="${+(size * 0.022).toFixed(1)}"
            stdDeviation="${+(size * 0.04).toFixed(1)}"
            flood-color="${borderColor}" flood-opacity="0.7" />
        </filter>
        <radialGradient id="${hlId}" cx="38%" cy="22%" r="55%">
          <stop offset="0%"   stop-color="rgba(255,255,255,0.22)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)"    />
        </radialGradient>
      </defs>

      <!-- Borda com drop shadow -->
      <g fill="${borderColor}" filter="url(#${filterId})">${shapeSvg}</g>

      <!-- Fundo interno -->
      <g transform="scale(${innerScale}) translate(${innerTrans},${innerTrans})"
         fill="${backgroundColor}">${shapeSvg}</g>

      <!-- Reflexo glossy -->
      <g transform="scale(${innerScale}) translate(${innerTrans},${innerTrans})"
         fill="url(#${hlId})">${shapeSvg}</g>

      <!-- Emoji grande, centrado na forma -->
      <text x="${half}" y="${half}"
        font-size="${emojiSize.toFixed(1)}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${displayEmoji}</text>

      <!-- Contador (só quando >1) -->
      ${countBadge}

      ${showLabel && labelLines.length > 0 ? `
      <!-- Label abaixo da forma -->
      <text
        x="${half}" y="${labelStartY.toFixed(1)}"
        font-family="'Segoe UI', system-ui, sans-serif"
        font-size="${labelFontSize}"
        font-weight="600"
        fill="${labelFill}"
        text-anchor="middle"
        letter-spacing="-0.2"
      >${labelSvg}</text>` : ""}
    </svg>`;
  };

  // Para uso em <img src="...">
  const toDataURL = (meritConfig, options = {}) => {
    const svg = render(meritConfig, options);
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  };

  return { render, toDataURL };
})();
