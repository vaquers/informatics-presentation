(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const counter = document.getElementById("counter");
  const progress = document.getElementById("progress");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  let current = 0;

  function go(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    current = index;
    slides.forEach((s, i) => {
      s.classList.toggle("active", i === index);
      s.classList.toggle("prev", i < index);
    });
    counter.textContent = `${index + 1} / ${slides.length}`;
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
    if (e.target.closest("input, button, a, .converter, .encoder, .logic, .code")) return;
    if (window.getSelection().toString()) return;
    e.clientX > window.innerWidth / 2 ? next() : prev();
  });

  // Swipe
  let sx = 0, sy = 0;
  document.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", (e) => {
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

  // ---------- Binary strips ----------
  const randBits = (n) => Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : 0)).join("");
  const strips = [document.getElementById("binaryStrip"), document.getElementById("finalBits")];
  const tickStrips = () => strips.forEach((el) => (el.textContent = randBits(48)));
  tickStrips();
  setInterval(tickStrips, 180);

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
      btn.textContent = `${k} = ${state[k]}`;
      btn.setAttribute("aria-pressed", state[k] === 1);
      renderLogic();
    });
  });
  renderLogic();

  // ---------- Background: matrix of bits ----------
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cols, drops, fontSize = 16;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(innerWidth / fontSize);
    drops = Array.from({ length: cols }, () => Math.random() * -innerHeight / fontSize);
  }
  resize();
  addEventListener("resize", resize);

  function draw() {
    ctx.fillStyle = "rgba(7, 7, 15, 0.12)";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = `${fontSize}px JetBrains Mono, monospace`;
    for (let i = 0; i < cols; i++) {
      if (i % 3 !== 0) continue;
      const y = drops[i] * fontSize;
      ctx.fillStyle = i % 2 ? "rgba(124, 92, 255, 0.35)" : "rgba(34, 211, 238, 0.28)";
      ctx.fillText(Math.random() > 0.5 ? "1" : "0", i * fontSize, y);
      if (y > innerHeight && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.35;
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  draw();
})();
