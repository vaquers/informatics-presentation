(() => {
  const ACCENT = "#a7ef9e";
  const slides = [...document.querySelectorAll(".slide")];
  const pad = (n) => String(n).padStart(2, "0");
  const curNum = document.getElementById("curNum");
  const sectionName = document.getElementById("sectionName");
  const progress = document.getElementById("progress");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  document.getElementById("totalNum").textContent = pad(slides.length);
  // Section numbers follow slide order, so slides can be added or moved freely
  document.querySelectorAll(".slide .s-index").forEach((el, i) => (el.textContent = pad(i + 1)));

  // ---------- Background ----------
  const terminal = window.createFaultyTerminal(document.getElementById("terminal"), {
    scale: 1.5,
    gridMul: [2, 1],
    digitSize: 1.2,
    timeScale: 0.5,
    scanlineIntensity: 0.5,
    glitchAmount: 1,
    flickerAmount: 1,
    noiseAmp: 1,
    chromaticAberration: 0,
    dither: 0,
    curvature: 0.1,
    tint: ACCENT,
    mouseReact: true,
    mouseStrength: 0.5,
    pageLoadAnimation: true,
    brightness: 0.7,
    dpr: 1,
  });

  // ---------- Title ----------
  window.createTechText(document.getElementById("techTitle"), {
    text: "my family",
    fontFamily: "Unbounded",
    fontWeight: 700,
    fontSize: 260,
    letterSpacing: -0.04,
    color: "#ecefe8",
    accentColor: ACCENT,
    reveal: "letter",
    dashLength: 4,
    dashGap: 2,
    specks: 15,
  });

  // ---------- Navigation ----------
  let current = 0;
  function go(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    current = index;
    const focused = document.activeElement;
    if (focused && focused !== document.body && !slides[index].contains(focused)) focused.blur();
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
    const isTitle = slides[index].classList.contains("title-slide");
    document.body.classList.toggle("on-title", index === 0);
    terminal?.setBrightness(isTitle ? 0.75 : 0.4);
    curNum.textContent = pad(index + 1);
    sectionName.textContent = slides[index].dataset.name || "";
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
    history.replaceState(null, "", `#${index + 1}`);
    document.dispatchEvent(new CustomEvent("slidechange", { detail: index }));
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  const isTyping = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
  document.addEventListener("keydown", (e) => {
    // The gallery keeps the arrow keys while it has focus; Esc gives them back
    if (document.activeElement?.closest?.(".flex-carousel, .circular-carousel")) return;
    if (isTyping(document.activeElement)) {
      if (e.key === "Escape") document.activeElement.blur();
      return;
    }
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(slides.length - 1);
    else if (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "а") toggleFullscreen();
  });

  // Click on empty area: right half = next, left half = prev
  document.getElementById("deck").addEventListener("click", (e) => {
    if (e.target.closest("input, button, a, .panel, .tech-title, .gallery, .pet-carousel")) return;
    if (window.getSelection().toString()) return;
    e.clientX > window.innerWidth / 2 ? next() : prev();
  });

  let sx = 0, sy = 0;
  document.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (e.target.closest(".tech-title, .gallery, .pet-carousel")) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prev();
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  document.getElementById("fs").addEventListener("click", toggleFullscreen);

  const fromHash = () => {
    const n = parseInt(location.hash.slice(1), 10);
    return Number.isFinite(n) ? n - 1 : 0;
  };
  addEventListener("hashchange", () => go(fromHash()));
  go(fromHash());

  // ---------- Elapsed timer ----------
  const clock = document.getElementById("clock");
  const t0 = Date.now();
  setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    clock.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  }, 1000);
})();
