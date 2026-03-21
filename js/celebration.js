// ============================================================
// celebration.js — Animação de confetti + modal de celebração
// Usa Canvas API — sem bibliotecas externas
// ============================================================

const Celebration = (() => {
  const PHRASES = [
    "Mais um badge na carreira!",
    "A glória é sua! (por enquanto...)",
    "Que orgulho... ou vergonha?",
    "A equipe não esquecerá disso.",
    "Registrado para a posteridade!",
    "Histórico é histórico!",
    "Seu legado está garantido.",
    "Uma conquista memorável!",
    "Isso vai pro currículo? Perguntando por alguém.",
    "Parabéns! Ou sentimos muito. Depende do mérito."
  ];

  let confettiCanvas = null;
  let animFrameId = null;
  let particles = [];

  const COLORS = [
    "#39d353", "#58a6ff", "#f85149", "#e3b341",
    "#bc8cff", "#ff6b35", "#3fb950", "#7c6af7"
  ];

  const createParticle = (canvas) => ({
    x: Math.random() * canvas.width,
    y: -10,
    size: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speedX: (Math.random() - 0.5) * 4,
    speedY: Math.random() * 4 + 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    opacity: 1,
    shape: Math.random() > 0.5 ? "rect" : "circle"
  });

  const drawParticle = (ctx, p) => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);

    if (p.shape === "rect") {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const startConfetti = () => {
    confettiCanvas = document.createElement("canvas");
    confettiCanvas.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none; z-index: 9998;
    `;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    document.body.appendChild(confettiCanvas);

    const ctx = confettiCanvas.getContext("2d");
    particles = Array.from({ length: 120 }, () => createParticle(confettiCanvas));

    const animate = () => {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.speedY += 0.05; // gravidade suave

        if (p.y > confettiCanvas.height * 0.7) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0) drawParticle(ctx, p);
      });

      particles = particles.filter((p) => p.opacity > 0);

      if (particles.length > 0) {
        animFrameId = requestAnimationFrame(animate);
      } else {
        stopConfetti();
      }
    };

    animFrameId = requestAnimationFrame(animate);
  };

  const stopConfetti = () => {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (confettiCanvas?.parentNode) {
      confettiCanvas.parentNode.removeChild(confettiCanvas);
      confettiCanvas = null;
    }
    particles = [];
  };

  // Exibe o modal de celebração com badge, título, destinatário e frase aleatória
  const showModal = (meritConfig, recipientName, onClose) => {
    const existing = document.getElementById("celebration-modal");
    if (existing) existing.remove();

    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const badgeSvg = BadgeGenerator.render(meritConfig, { size: 140 });

    const modal = document.createElement("div");
    modal.id = "celebration-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `Mérito concedido: ${meritConfig.title}`);
    modal.innerHTML = `
      <div class="celebration-backdrop"></div>
      <div class="celebration-content">
        <div class="celebration-badge">${badgeSvg}</div>
        <h2 class="celebration-title">${meritConfig.emoji} ${meritConfig.title}</h2>
        <p class="celebration-recipient">🎉 Parabéns, <strong>${recipientName}</strong>!</p>
        <p class="celebration-phrase">${phrase}</p>
        <button class="celebration-close btn btn--primary" aria-label="Fechar celebração">Fechar</button>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
      modal.classList.add("celebration-fade-out");
      setTimeout(() => {
        modal.remove();
        stopConfetti();
        onClose?.();
      }, 300);
    };

    modal.querySelector(".celebration-close").addEventListener("click", close);
    modal.querySelector(".celebration-backdrop").addEventListener("click", close);

    // Fecha automaticamente após 4 segundos
    setTimeout(close, 4000);

    // Foco no modal para acessibilidade
    modal.querySelector(".celebration-close").focus();
  };

  // Ponto de entrada: inicia confetti + exibe modal
  const trigger = (meritConfig, recipientName, onClose) => {
    startConfetti();
    showModal(meritConfig, recipientName, onClose);

    // Para confetti após 3 segundos mesmo que ainda haja partículas
    setTimeout(() => {
      if (particles.length > 0) {
        particles.forEach((p) => { p.speedY += 1; });
      }
    }, 3000);
  };

  return { trigger };
})();
