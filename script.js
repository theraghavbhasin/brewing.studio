(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const palette = ["52,160,164", "22,138,173", "233,78,128"];

  /* Constellations ported from theraghavbhasin.com — same three star
     shapes (Big Dipper, Orion, Scorpius; Cassiopeia dropped since Brewing
     has 3 offerings, not 4), re-titled to Brewing Studio's actual service
     menu rather than the personal-site categories. Anchor percentages must
     match the .constellation-hit inline styles in index.html. */
  const CONSTELLATIONS = [
    {
      // Big Dipper (Ursa Major) — handle points away from the card.
      anchor: [16, 15],
      points: [
        [-234, -78], [-156, -52], [-78, -65], [0, -39],
        [-13, 39], [78, 52], [91, -26],
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
      sizes: [1, 1, 1.1, 1, 1, 1, 1.3],
      title: "Brand Strategy",
      desc: "Positioning and identity systems built to survive a boardroom, not just a pitch deck.",
    },
    {
      // Orion — shoulders, belt, sword, and feet.
      anchor: [84, 25],
      points: [
        [-91, -143], [91, -130], [-32.5, -26], [0, -19.5], [32.5, -13],
        [78, 130], [-71.5, 143], [0, 52],
      ],
      edges: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 6], [4, 5], [3, 7]],
      sizes: [1.3, 1.1, 1, 1, 1, 1, 1.3, 0.9],
      title: "Web Systems",
      desc: "Sites your team can run themselves — with a technical fallback for when it breaks.",
    },
    {
      // Scorpius — curving tail with a hooked stinger, claws reach outward.
      anchor: [15, 78],
      points: [
        [-182, -78], [-221, -130], [-130, -117], [-52, -65], [13, -13],
        [52, 52], [39, 130], [-13, 182], [-78, 195], [-117, 143], [-84.5, 97.5],
      ],
      edges: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]],
      sizes: [1, 1, 1, 1.4, 1, 1, 1, 1, 1, 1, 1],
      title: "Events & Print",
      desc: "Design, print, and on-the-ground execution — end to end.",
    },
  ];
  const CONSTELLATION_MIN_WIDTH = 1050;
  let hoveredConstellation = -1;
  let constellationsVisible = true;

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("brewing-theme");
  if (stored) root.setAttribute("data-theme", stored);

  function currentTheme() {
    return root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function syncThemeTooltip() {
    themeToggle?.setAttribute(
      "data-tooltip",
      currentTheme() === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
  syncThemeTooltip();

  themeToggle?.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("brewing-theme", next);
    syncThemeTooltip();
  });

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    const revealIfOnScreen = (el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("in-view");
        io.unobserve(el);
        return true;
      }
      return false;
    };

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
      // Elements already on screen at setup (e.g. a direct #section deep link)
      // may not cross the observer's threshold on its first callback, since
      // there's no further scroll to re-trigger it. Reveal those immediately.
      if (!revealIfOnScreen(el)) io.observe(el);
    });

    // A same-page anchor jump can complete after this script runs (deferred
    // scripts execute before the browser resolves the URL fragment in some
    // engines), landing the user mid-page with nothing revealed yet. Re-check
    // once more after load, when any such jump has settled.
    window.addEventListener("load", () => {
      document.querySelectorAll(".reveal:not(.in-view)").forEach(revealIfOnScreen);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- Scroll progress bar ---------- */
  const progressBar = document.getElementById("scroll-progress-bar");
  if (progressBar) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------- Headline decode effect (on load + re-triggerable on hover) ---------- */
  // Ported from theraghavbhasin.com: the original version here only ran
  // once via requestAnimationFrame with no way to fire again. This swaps in
  // the personal site's setTimeout-based scrambleText(), which can be
  // called again on mouseenter, and guards against overlapping runs.
  const gradientText = document.querySelector(".gradient-text");
  let scrambling = false;
  function scrambleText(el, final, { frames = 18, interval = 35 } = {}) {
    if (scrambling) return;
    scrambling = true;
    const glyphs = "!<>-_\\/[]{}—=+*^?#";
    let frame = 0;

    const tick = () => {
      frame++;
      const revealCount = Math.floor((frame / frames) * final.length);
      el.textContent = final
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < revealCount) return final[i];
          return glyphs[Math.floor(Math.random() * glyphs.length)];
        })
        .join("");

      if (frame < frames) {
        setTimeout(tick, interval);
      } else {
        el.textContent = final;
        scrambling = false;
      }
    };
    tick();
  }

  if (gradientText && !prefersReducedMotion) {
    const final = gradientText.dataset.text || gradientText.textContent;
    scrambleText(gradientText, final);
    gradientText.addEventListener("mouseenter", () => scrambleText(gradientText, final));
  }

  /* ---------- Custom cursor: HUD reticle ---------- */
  // Ported from theraghavbhasin.com, recolored to Brewing's teal/azure/
  // magenta tokens. Two independently-eased elements — dot follows tightly,
  // ring lags behind and spins continuously.
  if (!isCoarsePointer) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    const reticleEl = document.querySelector(".cursor-reticle");
    const dotEl = reticleEl?.querySelector(".reticle-dot");
    const ringEl = reticleEl?.querySelector(".reticle-ring");
    let dotX = mx, dotY = my, ringX = mx, ringY = my;

    function animateReticle() {
      dotX += (mx - dotX) * 0.55;
      dotY += (my - dotY) * 0.55;
      ringX += (mx - ringX) * 0.16;
      ringY += (my - ringY) * 0.16;
      if (dotEl) dotEl.style.translate = `${dotX}px ${dotY}px`;
      if (ringEl) ringEl.style.translate = `${ringX}px ${ringY}px`;
      requestAnimationFrame(animateReticle);
    }
    requestAnimationFrame(animateReticle);

    document.querySelectorAll("a, button, .tilt-card").forEach((el) => {
      el.addEventListener("mouseenter", () => reticleEl?.classList.add("active"));
      el.addEventListener("mouseleave", () => reticleEl?.classList.remove("active"));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!isCoarsePointer && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${relX * 0.18}px, ${relY * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ---------- Tilt cards ---------- */
  if (!isCoarsePointer && !prefersReducedMotion) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotY = (px - 0.5) * 10;
        const rotX = (0.5 - py) * 10;
        card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(700px) rotateX(0) rotateY(0)";
      });
    });
  }

  /* ---------- Calendly popup trigger ---------- */
  // Every "Schedule a Call" / "Schedule a call instead" control opens this popup.
  const CALENDLY_URL = "https://calendly.com/brewingstudio/20min";

  document.querySelectorAll("[data-calendly-trigger]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.Calendly) {
        window.Calendly.initPopupWidget({ url: CALENDLY_URL });
      } else {
        window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
      }
    });
  });

  /* ---------- Notify form: submits to Formspree, no custom backend needed ---------- */
  const form = document.getElementById("notify-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button");
    const label = btn.querySelector(".btn-label") || btn;
    const original = label.textContent;

    label.textContent = "Sending…";
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        label.textContent = "Got it — talk soon.";
        form.reset();
      } else {
        throw new Error("Formspree request failed");
      }
    } catch {
      label.textContent = "Couldn't send — try again?";
    }

    setTimeout(() => {
      label.textContent = original;
      btn.disabled = false;
    }, 3200);
  });

  /* ---------- Constellation hover/tap labels ---------- */
  const constellationLabel = document.getElementById("constellation-label");
  const constellationTitleEl = constellationLabel?.querySelector(".constellation-title");
  const constellationDescEl = constellationLabel?.querySelector(".constellation-desc");
  const constellationHits = document.getElementById("constellation-hits");

  function activateConstellation(index) {
    const data = CONSTELLATIONS[index];
    if (!data || !constellationLabel || !constellationsVisible) return;
    hoveredConstellation = index;
    constellationTitleEl.textContent = data.title;
    constellationDescEl.textContent = data.desc;
    const [ax, ay] = data.anchor;
    const rawLeft = (window.innerWidth * ax) / 100;
    const left = Math.min(Math.max(rawLeft, 130), window.innerWidth - 130);
    const top = ay < 50
      ? (window.innerHeight * ay) / 100 + 210
      : (window.innerHeight * ay) / 100 - 210;
    constellationLabel.style.left = `${left}px`;
    constellationLabel.style.top = `${top}px`;
    constellationLabel.classList.add("visible");
  }
  function deactivateConstellation() {
    hoveredConstellation = -1;
    constellationLabel?.classList.remove("visible");
  }

  document.querySelectorAll(".constellation-hit").forEach((hit) => {
    const index = Number(hit.dataset.index);
    if (!CONSTELLATIONS[index]) return;

    if (!isCoarsePointer) {
      hit.addEventListener("mouseenter", () => activateConstellation(index));
      hit.addEventListener("mouseleave", () => deactivateConstellation());
    }
    // Tap-to-toggle works alongside hover, since some devices report both.
    hit.addEventListener("click", (e) => {
      e.stopPropagation();
      if (hoveredConstellation === index) deactivateConstellation();
      else activateConstellation(index);
    });
  });
  // On touch devices there's no hover to dismiss the label, so any tap
  // outside a constellation's hit-area closes it.
  if (isCoarsePointer) {
    document.addEventListener("click", () => deactivateConstellation());
  }

  // Unlike theraghavbhasin.com (a single centered card, no scroll), this
  // page scrolls through several sections below the fold. The constellation
  // hit-areas and label are fixed to the viewport, so past the hero they'd
  // float on top of the Solutions cards, the notify form, and the footer.
  // Hide the whole layer once the hero has scrolled mostly out of view.
  function updateConstellationVisibility() {
    constellationsVisible = window.scrollY < window.innerHeight * 0.85;
    if (constellationHits) constellationHits.style.display = constellationsVisible ? "" : "none";
    if (!constellationsVisible) deactivateConstellation();
  }
  window.addEventListener("scroll", updateConstellationVisibility, { passive: true });
  updateConstellationVisibility();

  /* ---------- Backdrop canvas: constellation network ---------- */
  // Ported from theraghavbhasin.com's node-network background, recolored to
  // Brewing's teal/azure/magenta palette (same rgb triplets the previous
  // "brewing bubbles" version already used).
  const canvas = document.getElementById("brew-canvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    let nodes = [];
    let pointer = { x: null, y: null };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    }

    function seedNodes() {
      const count = Math.round((w * h) / 32000);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1.2 + Math.random() * 1.6,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
    }

    const LINK_DIST = 110;
    const POINTER_DIST = 160;

    function draw() {
      ctx.clearRect(0, 0, w, h);

      const g1 = ctx.createRadialGradient(w * 0.15, h * 0.1, 0, w * 0.15, h * 0.1, w * 0.6);
      g1.addColorStop(0, "rgba(22,138,173,0.10)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.75, 0, w * 0.85, h * 0.75, w * 0.55);
      g2.addColorStop(0, "rgba(52,160,164,0.08)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (pointer.x !== null) {
          const dx = n.x - pointer.x;
          const dy = n.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < POINTER_DIST) {
            const force = (1 - dist / POINTER_DIST) * 0.6;
            n.x += (dx / (dist || 1)) * force;
            n.y += (dy / (dist || 1)) * force;
          }
        }

        if (n.x < 0) n.x = w; if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h; if (n.y > h) n.y = 0;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = `rgba(22,138,173,${0.12 * (1 - dist / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color}, 0.8)`;
        ctx.fill();
      });

      if (window.innerWidth >= CONSTELLATION_MIN_WIDTH && constellationsVisible) drawConstellations();

      requestAnimationFrame(draw);
    }

    function drawConstellations() {
      const t = performance.now() / 1000;
      CONSTELLATIONS.forEach((c, i) => {
        const active = i === hoveredConstellation;
        const ax = (w * c.anchor[0]) / 100;
        const ay = (h * c.anchor[1]) / 100;
        const pts = c.points.map(([dx, dy]) => [ax + dx, ay + dy]);
        const twinkle = 0.55 + Math.sin(t * 1.4 + i) * 0.15;
        const baseAlpha = active ? 0.85 : twinkle * 0.4;

        ctx.strokeStyle = `rgba(22,138,173,${active ? 0.65 : baseAlpha * 0.5})`;
        ctx.lineWidth = active ? 2 : 1.4;
        c.edges.forEach(([ai, bi]) => {
          const [ax1, ay1] = pts[ai];
          const [bx1, by1] = pts[bi];
          ctx.beginPath();
          ctx.moveTo(ax1, ay1);
          ctx.lineTo(bx1, by1);
          ctx.stroke();
        });

        pts.forEach(([x, y], pi) => {
          const sizeMul = c.sizes?.[pi] ?? 1;
          ctx.beginPath();
          ctx.arc(x, y, (active ? 3.2 : 2.3) * sizeMul, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${baseAlpha})`;
          ctx.fill();
        });
      });
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }, { passive: true });
    window.addEventListener("mouseleave", () => { pointer.x = null; pointer.y = null; });

    resize();
    requestAnimationFrame(draw);
  }
})();
