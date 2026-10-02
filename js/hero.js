// Home page header: Gaussian noise transported onto points sampled from a target shape
// (my name, a robot arm, ...),
// by integrating the closed-form flow-matching ODE for that point cloud.
// Same math as /js/flow-demo.js: noise at t = 0, data at t = 1, x_t = (1 - t) eps + t x1,
// v(x_t, t) = (E[x1 | x_t] - x_t) / (1 - t), integrated forward from t = 0 to 1.
(function () {
  "use strict";
  const canvas = document.querySelector(".hero canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const tOut = document.querySelector("[data-hero=t]");
  const replay = document.querySelector("[data-hero=replay]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const STEPS = 90, T_MAX = 0.997, BLUR = 0.022;
  let W = 0, H = 0, unit = 1, cx = 0, cy = 0;
  let centers = [], parts = [], colors = [], step = 0, raf = null, seed = 1;

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function rng(s) {
    return function () {
      s = (s + 0x6d2b79f5) >>> 0; let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { const u = Math.max(r(), 1e-12), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // ---- target shapes. Each painter fills a W x H offscreen canvas; points are sampled
  // from the filled pixels. To add a shape, add a painter here and a button in about.md.
  const SHAPES = {
    name: {
      label: "the name Anthony Kuang",
      paint(o) {
        let size = H * 0.78;
        o.font = `600 ${size}px Fraunces, Georgia, serif`;
        const text = "Anthony Kuang";
        const w = o.measureText(text).width;
        if (w > W * 0.98) { size *= (W * 0.98) / w; o.font = `600 ${size}px Fraunces, Georgia, serif`; }
        o.textBaseline = "alphabetic";
        o.fillText(text, 0, H * 0.5 + size * 0.34);
      },
    },
    arm: {
      label: "a robot arm reaching for a cube",
      // drawn in a 650 x 200 design box: long links so the arm spans the banner.
      // Uniform scale (joints stay round), shrunk to fit on narrow screens.
      paint(o) {
        const k = Math.min(H / 200, (W * 0.94) / 650), x0 = W / 2 - 325 * k, y0 = (H - 200 * k) / 2;
        const P = (x, y) => [x0 + x * k, y0 + y * k];
        const link = (a, b, w) => {
          o.lineWidth = w * k; o.lineCap = "round";
          o.beginPath(); o.moveTo(...P(...a)); o.lineTo(...P(...b)); o.stroke();
        };
        const disk = (c, r) => { o.beginPath(); o.arc(...P(...c), r * k, 0, 2 * Math.PI); o.fill(); };
        o.strokeStyle = o.fillStyle;
        // base plate and turret
        o.beginPath(); o.roundRect(...P(20, 178), 180 * k, 16 * k, 4 * k); o.fill();
        o.beginPath(); o.moveTo(...P(62, 178)); o.lineTo(...P(158, 178)); o.lineTo(...P(138, 146)); o.lineTo(...P(82, 146)); o.closePath(); o.fill();
        // links and joints: shoulder -> elbow -> wrist
        const shoulder = [110, 136], elbow = [338, 36], wrist = [566, 92];
        link(shoulder, elbow, 30); link(elbow, wrist, 24);
        disk(shoulder, 24); disk(elbow, 20); disk(wrist, 15);
        // gripper: wrist stalk, palm, two open fingers around the cube
        link(wrist, [588, 124], 14);
        link([558, 132], [620, 118], 10);
        link([560, 134], [566, 172], 8);
        link([618, 120], [628, 162], 8);
        // the cube it's about to grasp, with clear air between it and the fingers
        o.beginPath(); o.roundRect(...P(578, 152), 32 * k, 32 * k, 3 * k); o.fill();
        // hollow out the joints so they read as joints
        o.globalCompositeOperation = "destination-out";
        disk(shoulder, 12); disk(elbow, 10); disk(wrist, 7);
        o.globalCompositeOperation = "source-over";
      },
    },
  };
  let shape = "name";

  function sampleShape(kind) {
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d");
    o.fillStyle = "#000";
    SHAPES[kind].paint(o);
    const data = o.getImageData(0, 0, W, H).data;
    const pts = [];
    const stride = Math.max(2, Math.round(W / 420));
    for (let y = 0; y < H; y += stride) for (let x = 0; x < W; x += stride) {
      if (data[(y * W + x) * 4 + 3] > 140) pts.push([x, y]);
    }
    const r = rng(7);
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
    const M = Math.min(pts.length, W < 600 ? 900 : 1800);
    return pts.slice(0, M).map(([x, y]) => [(x - cx) / unit, (y - cy) / unit]);
  }

  function velocity(x, y, t) {
    const a = t, b = 1 - t, s2 = BLUR * BLUR, var2 = a * a * s2 + b * b, shrink = (a * s2) / var2;
    let maxl = -Infinity;
    const n = centers.length, lw = velocity.buf || (velocity.buf = new Float64Array(8192));
    for (let k = 0; k < n; k++) {
      const dx = x - a * centers[k][0], dy = y - a * centers[k][1];
      const l = -(dx * dx + dy * dy) / (2 * var2); lw[k] = l; if (l > maxl) maxl = l;
    }
    let z = 0, ex = 0, ey = 0;
    for (let k = 0; k < n; k++) {
      const w = Math.exp(lw[k] - maxl);
      if (w < 1e-12) continue;
      z += w;
      const mx = centers[k][0], my = centers[k][1];
      ex += w * (mx + shrink * (x - a * mx)); ey += w * (my + shrink * (y - a * my));
    }
    ex /= z; ey /= z;
    return [(ex - x) / b, (ey - y) / b, ex, ey];
  }

  function setup() {
    const dpr = window.devicePixelRatio || 1;
    W = Math.round(canvas.clientWidth); H = Math.round(canvas.clientHeight);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    unit = H * 0.42; cx = W * 0.5; cy = H * 0.5;
    centers = sampleShape(shape);
    reset();
  }

  function reset() {
    const r = rng(seed++);
    parts = Array.from({ length: Math.round(centers.length * 1.25) }, () => [gauss(r), gauss(r)]);
    colors = parts.map(() => { const u = r(); return u < 0.1 ? "s2" : u < 0.2 ? "s1" : "ink"; });
    step = 0;
  }

  function draw(final) {
    const pal = { ink: css("--ink"), s1: css("--s1"), s2: css("--s2") };
    ctx.clearRect(0, 0, W, H);
    const rad = final ? 1.7 : 1.4;
    for (const key of ["ink", "s1", "s2"]) {
      ctx.fillStyle = pal[key];
      ctx.globalAlpha = key === "ink" ? 0.86 : 0.95;
      ctx.beginPath();
      for (let i = 0; i < parts.length; i++) {
        if (colors[i] !== key) continue;
        const X = cx + parts[i][0] * unit, Y = cy + parts[i][1] * unit;
        ctx.moveTo(X + rad, Y); ctx.arc(X, Y, rad, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function advance() {
    const t0 = T_MAX * (step / STEPS), t1 = T_MAX * ((step + 1) / STEPS), dt = t1 - t0;
    const last = step === STEPS - 1;
    parts = parts.map(([x, y]) => {
      const v = velocity(x, y, t0);
      return last ? [v[2], v[3]] : [x + dt * v[0], y + dt * v[1]];
    });
    step++;
    if (tOut) tOut.textContent = step >= STEPS ? "1.00" : t1.toFixed(2);
  }

  function play() {
    if (raf) cancelAnimationFrame(raf);
    reset();
    if (reduce) {
      parts = centers.map((c) => c.slice()); step = STEPS;
      if (tOut) tOut.textContent = "1.00";
      draw(true); return;
    }
    let pause = 18; // hold on the noise for a moment so it reads as noise
    const tick = () => {
      if (pause-- > 0) { draw(false); raf = requestAnimationFrame(tick); return; }
      advance();
      draw(step >= STEPS);
      if (step < STEPS) raf = requestAnimationFrame(tick);
    };
    if (tOut) tOut.textContent = "0.00";
    raf = requestAnimationFrame(tick);
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (Math.round(canvas.clientWidth) !== W) { setup(); play(); } }, 200);
  });
  window.addEventListener("themechange", () => draw(step >= STEPS));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => draw(step >= STEPS));
  canvas.addEventListener("click", play);
  if (replay) replay.addEventListener("click", play);

  // shape toggle: a new target distribution, sampled from fresh noise
  const toggles = Array.from(document.querySelectorAll("[data-shape]"));
  toggles.forEach((btn) => btn.addEventListener("click", () => {
    const next = btn.getAttribute("data-shape");
    if (!SHAPES[next] || next === shape) return;
    shape = next;
    toggles.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    canvas.setAttribute("aria-label", "Particles flowing from Gaussian noise into " + SHAPES[shape].label);
    centers = sampleShape(shape);
    play();
  }));

  const start = () => { setup(); play(); };
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load("600 120px Fraunces"), new Promise((r) => setTimeout(r, 1500))]).then(start);
  } else start();
})();
