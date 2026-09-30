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
    fontFamily: "Geist",
    fontWeight: 600,
    fontSize: 260,
    letterSpacing: -0.06,
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
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  const isTyping = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
  document.addEventListener("keydown", (e) => {
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
    if (e.target.closest("input, button, a, .panel, .tech-title")) return;
    if (window.getSelection().toString()) return;
    e.clientX > window.innerWidth / 2 ? next() : prev();
  });

  let sx = 0, sy = 0;
  document.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (e.target.closest(".tech-title")) return;
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

  // ---------- Number converter ----------
  const decInput = document.getElementById("decInput");
  const bitsEl = document.getElementById("bits");
  for (let i = 0; i < 16; i++) bitsEl.appendChild(document.createElement("div"));
  function convert() {
    let v = Math.floor(Number(decInput.value));
    if (!Number.isFinite(v) || v < 0) v = 0;
    if (v > 65535) v = 65535;
    document.getElementById("outBin").textContent = v.toString(2);
    document.getElementById("outOct").textContent = v.toString(8);
    document.getElementById("outHex").textContent = v.toString(16).toUpperCase();
    [...bitsEl.children].forEach((d, i) => d.classList.toggle("on", (v >> (15 - i)) & 1));
  }
  decInput.addEventListener("input", convert);
  convert();

  // ---------- Text encoder ----------
  const textInput = document.getElementById("textInput");
  const charsEl = document.getElementById("chars");
  function encode() {
    charsEl.innerHTML = "";
    for (const ch of textInput.value) {
      const code = ch.codePointAt(0);
      const box = document.createElement("div");
      box.className = "ch";
      const c = document.createElement("div");
      c.className = "c";
      c.textContent = ch === " " ? "␣" : ch;
      const u = document.createElement("div");
      u.className = "code";
      u.textContent = `U+${code.toString(16).toUpperCase().padStart(4, "0")} · ${code}`;
      const b = document.createElement("div");
      b.className = "bin";
      b.textContent = code.toString(2).padStart(code > 255 ? 16 : 8, "0");
      box.append(c, u, b);
      charsEl.appendChild(box);
    }
  }
  textInput.addEventListener("input", encode);
  encode();

  // ---------- Logic gates ----------
  const state = { A: 0, B: 0 };
  function renderLogic() {
    const { A, B } = state;
    const set = (id, v) => {
      const el = document.getElementById(id);
      el.textContent = v;
      el.classList.toggle("on", v === 1);
    };
    set("gAnd", A & B);
    set("gOr", A | B);
    set("gNot", A ? 0 : 1);
    set("gXor", A ^ B);
  }
  ["A", "B"].forEach((k) => {
    const btn = document.getElementById(`bit${k}`);
    btn.addEventListener("click", () => {
      state[k] ^= 1;
      btn.querySelector("b").textContent = state[k];
      btn.setAttribute("aria-pressed", state[k] === 1);
      renderLogic();
    });
  });
  renderLogic();
})();
