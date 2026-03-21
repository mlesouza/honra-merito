// ============================================================
// animations.js — Animações de entrada, scroll reveal e utilidades
// ============================================================

const Animations = (() => {

  // Scroll reveal com IntersectionObserver — observa [data-reveal], .podium-card e .rank-row
  const initScrollReveal = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });

    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    // Também observa classes com animação própria via CSS
    document.querySelectorAll(".podium-card, .rank-row").forEach((el) => observer.observe(el));
  };

  // Re-observa novos elementos adicionados ao DOM após o init
  const observeNew = (selector) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });
    document.querySelectorAll(selector).forEach((el) => {
      if (!el.classList.contains("is-visible")) observer.observe(el);
    });
  };

  // Aplica stagger a itens de uma lista já renderizada
  const stagger = (parentSelector, childSelector = ":scope > *", baseDelay = 60) => {
    const parent = document.querySelector(parentSelector);
    if (!parent) return;
    parent.querySelectorAll(childSelector).forEach((el, i) => {
      el.style.animationDelay = `${i * baseDelay}ms`;
      el.classList.add("anim-fade-up");
    });
  };

  // Animação de contagem para números
  const countUp = (el, target, duration = 800) => {
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  // Efeito de ripple em botões
  const initRipple = () => {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn--primary, .btn--secondary, .fab");
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.cssText = `
        left:${e.clientX - rect.left}px;
        top:${e.clientY - rect.top}px;
      `;
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  };

  const init = () => {
    initScrollReveal();
    initRipple();
  };

  return { init, stagger, countUp, observeNew };
})();

document.addEventListener("DOMContentLoaded", () => Animations.init());
