// CircularCarousel (React Bits) — vanilla DOM / CSS 3D port, no dependencies.

const PRESETS = {
  cylinder: { axis: "y", tilt: -5, perspective: 2500, curve: 1, spread: 1, inward: false, billboard: false, backfaces: true, window: 0 },
  orbit: { axis: "y", tilt: -16, perspective: 1500, curve: 0, spread: 1.45, inward: false, billboard: true, backfaces: false, window: 0 },
  wheel: { axis: "x", tilt: 0, perspective: 1800, curve: 0, spread: 1, inward: false, billboard: false, backfaces: true, window: 1.7 },
  panorama: { axis: "y", tilt: 0, perspective: 0, curve: 1, spread: 1, inward: true, billboard: false, backfaces: false, window: 0 },
};

const INTRO_LENGTH = { assemble: 1500, rise: 1400, spin: 1800, none: 0 };
const TILES = 8;
const OVERLAP = 2.5;
const DRAG_THRESHOLD = 5;
const SPRING = 118;
const SETTLE_SPEED = 9;
const CAPTION_SPACE = 76;
const TO_RAD = Math.PI / 180;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const wrap = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;
const easeOut = (t) => 1 - Math.pow(1 - t, 4);
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

const rotateX = (p, deg) => {
  const r = deg * TO_RAD, c = Math.cos(r), s = Math.sin(r);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotateY = (p, deg) => {
  const r = deg * TO_RAD, c = Math.cos(r), s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

const el = (tag, cls, parent) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
};

export function createCircularCarousel(root, opts = {}) {
  const o = {
    items: [], preset: "cylinder", intro: "rise", cardWidth: 220, aspectRatio: 1, gap: 25,
    autoplay: "drift", speed: 14, interval: 3, direction: "left", draggable: true, momentum: 0.6,
    snap: true, pauseOnHover: true, focusOnClick: true, parallax: 0.3, stretch: 0.5, depthFade: 0.55,
    fadeColor: "#000000", innerShade: 0.6, cornerRadius: 12, captions: false,
    // A short list is repeated so the ring does not look empty; captions still count the originals
    minCards: 0,
    ...opts,
  };
  const original = o.items;
  const list = Array.from({ length: Math.max(original.length, o.minCards || 0) }, (_, i) => original[i % original.length]);
  const realCount = original.length;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const count = list.length;
  const shape = PRESETS[o.preset] ? o.preset : "cylinder";
  const layout = PRESETS[shape];
  const axis = layout.axis;
  const tiltValue = o.tilt ?? layout.tilt;
  const curveValue = layout.billboard ? 0 : clamp(o.curve ?? layout.curve, 0, 1);
  const cardW = Math.max(40, o.cardWidth);
  const cardH = cardW / clamp(o.aspectRatio, 0.2, 5);
  const along = axis === "x" ? cardH : cardW;
  const step = 360 / count;

  const radius = (() => {
    const n = Math.max(count, 3);
    const pitch = (along + o.gap) * layout.spread;
    const chord = pitch / (2 * Math.sin(Math.PI / n));
    const arc = (n * pitch) / (2 * Math.PI);
    return Math.max(chord + (arc - chord) * curveValue, along * 0.6);
  })();

  const tiles = (() => {
    const total = curveValue > 0.001 ? TILES : 1;
    const length = along / total;
    const bend = curveValue > 0.001 ? radius / curveValue : 0;
    return Array.from({ length: total }, (_, index) => {
      const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
      const end = (index + 1) * length + (index < total - 1 ? OVERLAP / 2 : 0);
      const center = (start + end) / 2 - along / 2;
      const alpha = bend ? center / bend : 0;
      const shift = bend ? bend * Math.sin(alpha) : center;
      const sink = bend ? bend * (1 - Math.cos(alpha)) : 0;
      const depth = layout.inward ? sink : -sink;
      const turn = ((layout.inward ? -alpha : alpha) * 180) / Math.PI;
      const move = axis === "x"
        ? `translate3d(0px, ${shift}px, ${depth}px) rotateX(${-turn}deg)`
        : `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
      return { index, total, start, end, size: end - start, move };
    });
  })();

  const s = {
    count, step, radius, layout, axis, tilt: tiltValue,
    perspective: layout.inward ? radius : (o.perspective ?? layout.perspective),
    cardW, cardH,
    intro: reduced ? "none" : o.intro in INTRO_LENGTH ? o.intro : "rise",
    autoplay: reduced ? "off" : o.autoplay,
    speed: o.speed, interval: Math.max(0.5, o.interval), draggable: o.draggable,
    momentum: clamp(o.momentum, 0, 1), snap: o.snap, pauseOnHover: o.pauseOnHover,
    parallax: reduced ? 0 : clamp(o.parallax, 0, 1), stretch: reduced ? 0 : clamp(o.stretch, 0, 1),
    depthFade: clamp(o.depthFade, 0, 1), captions: o.captions,
  };

  // ---------- DOM ----------
  root.classList.add("circular-carousel");
  root.style.setProperty("--cc-fade", o.fadeColor);
  root.style.setProperty("--cc-radius", `${Math.max(0, o.cornerRadius)}px`);
  root.style.setProperty("--cc-inner", (1 - clamp(o.innerShade, 0, 1)).toFixed(3));
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", "Image carousel");
  root.tabIndex = 0;
  root.dataset.axis = axis;
  root.dataset.shape = shape;
  if (o.draggable) root.setAttribute("data-draggable", "");

  const view = el("div", "circular-carousel__view", root);
  const stage = el("div", "circular-carousel__stage", view);
  const camera = el("div", "circular-carousel__camera", stage);
  const ring = el("div", "circular-carousel__ring", camera);

  const renderTile = (item, tile, back, parent) => {
    const strip = back ? tile.total - 1 - tile.index : tile.index;
    const first = strip === 0;
    const last = strip === tile.total - 1;
    const r = "var(--cc-radius)";
    const frameRadius = axis === "x"
      ? `${first ? r : 0} ${first ? r : 0} ${last ? r : 0} ${last ? r : 0}`
      : `${first ? r : 0} ${last ? r : 0} ${last ? r : 0} ${first ? r : 0}`;
    const offset = back ? along - tile.end : tile.start;
    const size = tile.size;
    const t = el("div", "circular-carousel__tile", parent);
    t.setAttribute("aria-hidden", "true");
    if (axis === "x") Object.assign(t.style, { left: `${-cardW / 2}px`, top: `${-size / 2}px`, width: `${cardW}px`, height: `${size}px` });
    else Object.assign(t.style, { left: `${-size / 2}px`, top: `${-cardH / 2}px`, width: `${size}px`, height: `${cardH}px` });
    t.style.transform = tile.move + (back ? (axis === "x" ? " rotateX(180deg)" : " rotateY(180deg)") : "");
    const frame = el("div", "circular-carousel__frame", t);
    frame.style.height = `${axis === "x" ? size : cardH}px`;
    frame.style.borderRadius = frameRadius;
    const img = el("img", "circular-carousel__photo", frame);
    img.src = item.src;
    img.alt = "";
    img.draggable = false;
    img.decoding = "async";
    if (axis === "x") Object.assign(img.style, { left: "0px", top: `${-offset}px`, width: `${cardW}px`, height: `${cardH}px` });
    else Object.assign(img.style, { left: `${-offset}px`, top: "0px", width: `${cardW}px`, height: `${cardH}px` });
    if (back) el("div", "circular-carousel__inner", frame);
    el("div", "circular-carousel__shade", frame);
  };

  const cards = list.map((item, index) => {
    const card = el("div", "circular-carousel__card", ring);
    card.dataset.ccIndex = index;
    card.setAttribute("role", "group");
    card.setAttribute("aria-roledescription", "slide");
    card.setAttribute("aria-label", `${item.title || item.alt || `Image ${index + 1}`}, ${(index % realCount) + 1} of ${realCount}`);
    for (const tile of tiles) renderTile(item, tile, false, card);
    if (layout.backfaces) for (const tile of tiles) renderTile(item, tile, true, card);
    return card;
  });

  // caption
  let titleEl = null, reels = [];
  if (o.captions) {
    const cap = el("div", "circular-carousel__caption", root);
    cap.setAttribute("aria-hidden", "true");
    titleEl = el("span", "circular-carousel__title", cap);
    const countEl = el("span", "circular-carousel__count", cap);
    const digits = el("span", "circular-carousel__digits", countEl);
    reels = [0, 1].map(() => {
      const d = el("span", "circular-carousel__digit", digits);
      const reel = el("span", "circular-carousel__reel", d);
      for (let n = 0; n < 10; n++) el("span", "", reel).textContent = n;
      return reel;
    });
    el("span", "circular-carousel__slash", countEl).textContent = "/";
    el("span", "", countEl).textContent = String(realCount).padStart(2, "0");
  }
  const live = el("div", "circular-carousel__live", root);
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");

  const showActive = (index) => {
    const real = index % realCount;
    const item = list[index];
    if (titleEl) {
      titleEl.textContent = item.title || item.alt || "";
      if (item.subtitle) el("span", "circular-carousel__subtitle", titleEl).textContent = item.subtitle;
      titleEl.style.animation = "none";
      void titleEl.offsetWidth;
      titleEl.style.animation = "";
      String(real + 1).padStart(2, "0").split("").forEach((dg, k) => {
        reels[k].style.transform = `translateY(${-Number(dg) * 10}%)`;
      });
    }
    live.textContent = `${item.title || item.alt || `Image ${real + 1}`}, ${real + 1} of ${realCount}`;
    o.onChange?.(real);
  };

  // ---------- Engine ----------
  const state = {
    angle: 0, velocity: 0, target: null, dir: 0, press: null, drag: false, hover: false,
    pointer: { inside: false, x: 0, y: 0 }, yaw: 0, pitch: 0, intro: null, introDone: false,
    holdUntil: 0, stepAt: 0, suppressClick: false, wheelTimer: 0, fit: 1, shift: 0, drop: 0, last: 0,
  };
  let ready = false;
  let activeIndex = 0;
  let raf = 0;
  let visible = true;
  const dragSign = layout.inward ? -1 : 1;
  state.dir = (o.direction === "right" ? 1 : -1) * dragSign;

  const nearest = (angle) => Math.round(angle / s.step) * s.step;

  const measure = () => {
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const room = s.captions ? CAPTION_SPACE : 0;
    const width = rect.width * 0.94;
    const height = (rect.height - room) * 0.92;
    const P = s.perspective;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    if (s.layout.inward) {
      minX = -width / 2; maxX = width / 2; minY = -s.cardH / 2; maxY = s.cardH / 2;
    } else {
      const corners = [[-s.cardW / 2, -s.cardH / 2], [s.cardW / 2, -s.cardH / 2], [-s.cardW / 2, s.cardH / 2], [s.cardW / 2, s.cardH / 2]];
      const limit = s.layout.window ? s.layout.window * s.step : 180;
      for (let a = -limit; a <= limit; a += limit / 24) {
        for (const [cx, cy] of corners) {
          let p;
          if (s.axis === "x") {
            p = rotateX([cx, cy, s.radius], -a);
            p = rotateY([p[0], p[1], p[2] - s.radius], s.tilt);
          } else if (s.layout.billboard) {
            const c = rotateY([0, 0, s.radius], a);
            p = rotateX([c[0] + cx, cy, c[2] - s.radius], s.tilt);
          } else {
            p = rotateY([cx, cy, s.radius], a);
            p = rotateX([p[0], p[1], p[2] - s.radius], s.tilt);
          }
          if (p[2] >= P * 0.95) continue;
          const k = P / (P - p[2]);
          minX = Math.min(minX, p[0] * k); maxX = Math.max(maxX, p[0] * k);
          minY = Math.min(minY, p[1] * k); maxY = Math.max(maxY, p[1] * k);
        }
      }
    }
    // Grow as well as shrink, so the ring keeps filling its box after fullscreen or a resize
    const fit = Math.min(o.maxFit ?? 1, width / Math.max(maxX - minX, 1), height / Math.max(maxY - minY, 1));
    state.fit = fit;
    state.shift = -((minY + maxY) / 2) * fit - room / 2;
    state.drop = s.axis === "x" ? (rect.width / fit) * 0.55 + s.cardW : (rect.height / fit) * 0.55 + s.cardH;
    stage.style.perspective = `${P}px`;
    stage.style.transform = `translate3d(0, ${state.shift}px, 0) scale(${fit})`;
  };

  const introCard = (elapsed, landing) => {
    if (!state.intro) return { radius: 1, lift: 0 };
    const type = state.intro.type;
    const reach = Math.abs(wrap(landing + state.angle));
    if (type === "assemble") {
      const p = easeOut(clamp((elapsed - (reach / 180) * 420) / 1080, 0, 1));
      return { radius: 1 + 0.6 * (1 - p), lift: 0 };
    }
    if (type === "rise") {
      const p = easeOutQuint(clamp((elapsed - (reach / 180) * 480) / 900, 0, 1));
      return { radius: 1, lift: (1 - p) * state.drop };
    }
    if (type === "spin") {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
      return { radius: 1 + 0.28 * (1 - p), lift: 0 };
    }
    return { radius: 1, lift: 0 };
  };

  const advance = (dt, now) => {
    if (!state.introDone && ready) {
      if (!state.intro) {
        if (s.intro === "none") state.introDone = true;
        else state.intro = { type: s.intro, start: now };
      }
      if (state.intro && now - state.intro.start >= INTRO_LENGTH[state.intro.type]) {
        state.intro = null;
        state.introDone = true;
      }
    }
    const paused = (s.pauseOnHover && state.hover) || state.drag || now < state.holdUntil;
    const cruise = s.autoplay === "drift" && !paused && !state.intro ? s.speed * state.dir : 0;
    let busy = Boolean(state.intro) || state.drag;

    if (state.drag || state.intro) {
      state.velocity = state.drag ? state.velocity : 0;
    } else if (state.target !== null) {
      let remaining = dt;
      const damping = 2 * Math.sqrt(SPRING);
      while (remaining > 0) {
        const h = Math.min(remaining, 1 / 240);
        const accel = SPRING * (state.target - state.angle) - damping * state.velocity;
        state.velocity += accel * h;
        state.angle += state.velocity * h;
        remaining -= h;
      }
      if (Math.abs(state.target - state.angle) < 0.004 && Math.abs(state.velocity) < 0.03) {
        state.angle = state.target;
        state.velocity = 0;
        state.target = null;
      }
      busy = true;
    } else {
      const tau = 0.18 + s.momentum * 1.5;
      state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));
      state.angle += state.velocity * dt;
      if (cruise === 0 && s.snap && Math.abs(state.velocity) < SETTLE_SPEED) state.target = nearest(state.angle);
      busy = busy || cruise !== 0 || Math.abs(state.velocity) > 0.01 || state.target !== null;
    }

    if (s.autoplay === "step" && !paused && !state.intro && state.introDone) {
      if (!state.stepAt) state.stepAt = now + s.interval * 1000;
      if (now >= state.stepAt) {
        state.target = (state.target ?? nearest(state.angle)) + s.step * state.dir;
        state.stepAt = now + s.interval * 1000;
      }
      busy = true;
    } else {
      state.stepAt = 0;
    }
    if (now < state.holdUntil) busy = true;

    const ease = 1 - Math.exp(-dt / 0.35);
    const aimYaw = state.pointer.inside ? state.pointer.x * s.parallax * 9 : 0;
    const aimPitch = state.pointer.inside ? -state.pointer.y * s.parallax * 6 : 0;
    state.yaw += (aimYaw - state.yaw) * ease;
    state.pitch += (aimPitch - state.pitch) * ease;
    if (Math.abs(aimYaw - state.yaw) > 0.01 || Math.abs(aimPitch - state.pitch) > 0.01) busy = true;
    return busy;
  };

  const render = (now) => {
    const elapsed = state.intro ? now - state.intro.start : 0;
    const swell = 1 + s.stretch * 0.12 * Math.min(1, Math.abs(state.velocity) / 420);
    let spinOffset = 0;
    if (state.intro?.type === "spin") spinOffset = -300 * state.dir * (1 - easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1)));
    else if (state.intro?.type === "assemble") spinOffset = -32 * state.dir * (1 - easeOut(clamp(elapsed / INTRO_LENGTH.assemble, 0, 1)));
    const angle = state.angle + spinOffset;
    const R = s.radius * swell;

    if (s.axis === "x") {
      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateY(${s.tilt + state.yaw}deg) rotateX(${state.pitch}deg)`;
      ring.style.transform = `rotateX(${-angle}deg)`;
    } else if (s.layout.inward) {
      camera.style.transform = `translate3d(0, 0, ${s.perspective - 1}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.style.transform = `rotateY(${angle}deg)`;
    } else {
      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.style.transform = `rotateY(${angle}deg)`;
    }

    for (let index = 0; index < s.count; index++) {
      const card = cards[index];
      const base = index * s.step;
      const mod = introCard(elapsed, base);
      const r = R * mod.radius;
      let transform;
      if (s.axis === "x") transform = `rotateX(${-base}deg) translateZ(${r}px)`;
      else if (s.layout.inward) transform = `rotateY(${base}deg) translateZ(${-r}px)`;
      else {
        transform = `rotateY(${base}deg) translateZ(${r}px)`;
        if (s.layout.billboard) transform += ` rotateY(${-(base + angle)}deg)`;
      }
      if (mod.lift) transform += s.axis === "x" ? ` translateX(${mod.lift}px)` : ` translateY(${mod.lift}px)`;
      card.style.transform = transform;
      const world = wrap(base + angle);
      const facing = Math.cos(world * TO_RAD);
      if (s.layout.inward) card.style.visibility = Math.abs(world) > 86 ? "hidden" : "";
      card.style.setProperty("--cc-depth", (s.depthFade * Math.pow((1 - facing) / 2, 1.25)).toFixed(3));
    }

    const index = ((Math.round(-state.angle / s.step) % s.count) + s.count) % s.count || 0;
    if (index !== activeIndex) {
      activeIndex = index;
      showActive(index);
    }
  };

  const frame = (now) => {
    raf = 0;
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
    state.last = now;
    const busy = advance(dt, now);
    render(now);
    if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
    else state.last = 0;
  };
  const wake = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; state.last = 0; }
    else wake();
  });
  new ResizeObserver(() => { measure(); wake(); }).observe(root);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
    else { cancelAnimationFrame(raf); raf = 0; state.last = 0; }
  }).observe(root);

  root.addEventListener("wheel", (event) => {
    if (!s.draggable) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
    if (!delta) return;
    event.preventDefault();
    const perPixel = 180 / (Math.PI * s.radius * state.fit);
    state.target = null;
    state.angle -= delta * perPixel * dragSign;
    state.velocity = -delta * perPixel * dragSign * 30;
    state.holdUntil = performance.now() + 1600;
    clearTimeout(state.wheelTimer);
    state.wheelTimer = setTimeout(() => {
      if (s.snap) state.target = nearest(state.angle + state.velocity * 0.12);
      wake();
    }, 140);
    wake();
  }, { passive: false });

  const focusIndex = (index) => {
    let target = -index * s.step;
    target += 360 * Math.round((state.angle - target) / 360);
    state.target = target;
    state.holdUntil = performance.now() + 2800;
    wake();
  };
  const stepBy = (delta) => {
    const base = state.target ?? Math.round(state.angle / s.step) * s.step;
    state.target = base - delta * s.step * dragSign;
    state.holdUntil = performance.now() + 2800;
    wake();
  };

  const updatePointer = (event) => {
    const rect = root.getBoundingClientRect();
    state.pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    state.pointer.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
  };

  root.addEventListener("pointerdown", (event) => {
    state.suppressClick = false;
    if (!s.draggable || event.button !== 0) return;
    state.press = { id: event.pointerId, x: event.clientX, y: event.clientY, angle: state.angle, moved: false, origin: 0, samples: [{ time: performance.now(), angle: state.angle }] };
  });
  root.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") {
      state.pointer.inside = true;
      updatePointer(event);
    }
    const press = state.press;
    if (!press || press.id !== event.pointerId) { wake(); return; }
    const delta = s.axis === "x" ? event.clientY - press.y : event.clientX - press.x;
    const cross = s.axis === "x" ? event.clientX - press.x : event.clientY - press.y;
    if (!press.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      if (Math.abs(cross) > Math.abs(delta) * 1.2 && event.pointerType !== "mouse") { state.press = null; return; }
      press.moved = true;
      press.origin = delta;
      state.drag = true;
      state.target = null;
      state.velocity = 0;
      root.setAttribute("data-dragging", "");
      try { root.setPointerCapture(event.pointerId); } catch { /* capture is optional */ }
    }
    const perPixel = 180 / (Math.PI * s.radius * state.fit);
    state.angle = press.angle + (delta - press.origin) * perPixel * dragSign;
    const now = performance.now();
    press.samples.push({ time: now, angle: state.angle });
    while (press.samples.length > 2 && now - press.samples[0].time > 110) press.samples.shift();
    wake();
  });
  const releasePointer = (event) => {
    const press = state.press;
    if (!press || press.id !== event.pointerId) return;
    state.press = null;
    if (!press.moved) return;
    state.drag = false;
    root.removeAttribute("data-dragging");
    state.suppressClick = true;
    const first = press.samples[0];
    const last = press.samples[press.samples.length - 1];
    const span = (last.time - first.time) / 1000;
    const velocity = span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;
    state.velocity = velocity;
    if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);
    const coasting = s.autoplay === "drift" && !(s.pauseOnHover && state.hover && event.pointerType === "mouse");
    if (s.snap && !coasting) {
      const tau = 0.18 + s.momentum * 1.5;
      state.target = Math.round((state.angle + velocity * tau * 0.55) / s.step) * s.step;
    }
    wake();
  };
  root.addEventListener("pointerup", releasePointer);
  root.addEventListener("pointercancel", releasePointer);
  root.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    state.hover = true;
    wake();
  });
  root.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") { state.hover = false; state.pointer.inside = false; }
    wake();
  });
  root.addEventListener("click", (event) => {
    if (state.suppressClick) { state.suppressClick = false; return; }
    const card = event.target.closest?.("[data-cc-index]");
    if (!card) return;
    const index = Number(card.dataset.ccIndex);
    if (o.focusOnClick) focusIndex(index);
    o.onItemClick?.(list[index], index % realCount);
  });
  root.addEventListener("keydown", (event) => {
    const forward = axis === "x" ? "ArrowDown" : "ArrowRight";
    const backward = axis === "x" ? "ArrowUp" : "ArrowLeft";
    if (event.key === forward) stepBy(1);
    else if (event.key === backward) stepBy(-1);
    else if (event.key === "Home") focusIndex(0);
    else if (event.key === "End") focusIndex(count - 1);
    else if (event.key === "Escape") root.blur(); // hand the keyboard back to the slide deck
    else if (event.key === "Enter" || event.key === " ") o.onItemClick?.(list[activeIndex], activeIndex % realCount);
    else return;
    event.preventDefault();
  });

  // Preload the first images, then reveal and play the intro
  const load = (src) => new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => (image.decode ? image.decode().then(resolve, resolve) : resolve());
    image.onerror = resolve;
    image.src = src;
  });
  Promise.race([
    Promise.all(original.slice(0, 12).map((i) => load(i.src))),
    new Promise((r) => setTimeout(r, 2400)),
  ]).then(() => {
    ready = true;
    state.introDone = false;
    state.intro = null;
    root.setAttribute("data-ready", "");
    wake();
  });

  measure();
  render(performance.now());
  showActive(0);
  wake();

  return { wake };
}
