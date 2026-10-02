// Interactive flow-matching demos.
//
// Uses the closed-form ("ideal") flow-matching velocity for a mixture of isotropic
// Gaussians. Convention (Lipman et al.; rectified flow; pi_0): noise at t = 0, data
// at t = 1, x_t = (1 - t) eps + t x1, and sampling integrates forward from 0 to 1.
//
// For centers mu_k, weights pi_k and per-component std s:
//   x_t | k ~ N(t mu_k, (t^2 s^2 + (1 - t)^2) I)
//   E[x1 | x_t, k] = mu_k + (t s^2 / (t^2 s^2 + (1 - t)^2)) (x_t - t mu_k)
//   v(x_t, t) = E[x1 - eps | x_t] = (E[x1 | x_t] - x_t) / (1 - t)
// With s = 0 and one center per training point this is the IS machine: it can only
// ever reproduce the training set.

(function () {
  "use strict";

  const STEPS = 70;
  const T_MAX = 0.998;   // stop just short of t = 1, then land on E[x1 | x_t]

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    const u = Math.max(r(), 1e-12), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // returns the velocity and the posterior mean E[x1 | x_t]
  function velocity(x, y, t, mix) {
    const b = 1 - t;
    const s2 = mix.s * mix.s;
    const var2 = t * t * s2 + b * b;
    const shrink = (t * s2) / var2;
    let maxl = -Infinity;
    const logw = new Array(mix.mu.length);
    for (let k = 0; k < mix.mu.length; k++) {
      const dx = x - t * mix.mu[k][0], dy = y - t * mix.mu[k][1];
      logw[k] = Math.log(mix.pi[k]) - (dx * dx + dy * dy) / (2 * var2);
      if (logw[k] > maxl) maxl = logw[k];
    }
    let z = 0, ex = 0, ey = 0;
    for (let k = 0; k < mix.mu.length; k++) {
      const w = Math.exp(logw[k] - maxl);
      z += w;
      const mx = mix.mu[k][0], my = mix.mu[k][1];
      ex += w * (mx + shrink * (x - t * mx));
      ey += w * (my + shrink * (y - t * my));
    }
    ex /= z; ey /= z;
    return { vx: (ex - x) / b, vy: (ey - y) / b, x1x: ex, x1y: ey };
  }

  const timeAt = (k) => T_MAX * (k / STEPS);

  // Integrate every particle from t = 0 to t = 1; returns trajectories[step][i] = [x, y].
  function integrate(noise, mix) {
    const traj = [noise.map((p) => p.slice())];
    let cur = noise.map((p) => p.slice());
    for (let k = 0; k < STEPS; k++) {
      const t0 = timeAt(k), dt = timeAt(k + 1) - t0;
      cur = cur.map(([x, y]) => {
        const v = velocity(x, y, t0, mix);
        if (k === STEPS - 1) return [v.x1x, v.x1y]; // land on the posterior mean
        return [x + dt * v.vx, y + dt * v.vy];
      });
      traj.push(cur);
    }
    return traj;
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ---------------------------------------------------------------- canvas helpers
  function makeView(canvas, extent) {
    const ctx = canvas.getContext("2d");
    const view = { canvas, ctx, extent, size: 0 };
    view.resize = function () {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 300;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      view.size = w;
    };
    view.px = (x) => ((x + extent) / (2 * extent)) * view.size;
    view.py = (y) => ((extent - y) / (2 * extent)) * view.size;
    view.toWorld = (cx, cy) => [(cx / view.size) * 2 * extent - extent, extent - (cy / view.size) * 2 * extent];
    view.clear = function () {
      ctx.clearRect(0, 0, view.size, view.size);
      ctx.strokeStyle = css("--rule");
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(view.px(-extent), view.py(0)); ctx.lineTo(view.px(extent), view.py(0));
      ctx.moveTo(view.px(0), view.py(-extent)); ctx.lineTo(view.px(0), view.py(extent));
      ctx.stroke();
    };
    view.dot = function (x, y, r, color, alpha) {
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(view.px(x), view.py(y), r, 0, 2 * Math.PI); ctx.fill();
      ctx.globalAlpha = 1;
    };
    view.cross = function (x, y, r, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      const X = view.px(x), Y = view.py(y);
      ctx.beginPath();
      ctx.moveTo(X - r, Y - r); ctx.lineTo(X + r, Y + r);
      ctx.moveTo(X - r, Y + r); ctx.lineTo(X + r, Y - r);
      ctx.stroke();
    };
    view.label = function (text, x, y, color, align) {
      ctx.fillStyle = color; ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.textAlign = align || "left";
      ctx.fillText(text, view.px(x), view.py(y));
    };
    view.trails = function (traj, upto, color) {
      ctx.strokeStyle = color; ctx.globalAlpha = 0.16; ctx.lineWidth = 1;
      const n = traj[0].length;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.moveTo(view.px(traj[0][i][0]), view.py(traj[0][i][1]));
        for (let k = 1; k <= upto; k++) ctx.lineTo(view.px(traj[k][i][0]), view.py(traj[k][i][1]));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    return view;
  }

  function animator(onFrame, slider) {
    let raf = null, k = 0;
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function play() {
      stop();
      k = 0;
      const tick = () => {
        k = Math.min(STEPS, k + 1);
        if (slider) slider.value = k;
        onFrame(k);
        if (k < STEPS) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    return { play, stop, set: (v) => { stop(); k = v; onFrame(k); } };
  }

  function noiseCloud(n, seed) {
    const r = rng(seed);
    return Array.from({ length: n }, () => [gauss(r), gauss(r)]);
  }

  // ---------------------------------------------------------------- demo 1: MSE vs flow
  // A bimodal "action distribution": two ways to get around the T.
  function mseVsFlow(root) {
    const extent = 2.4;
    const left = makeView(root.querySelector("canvas[data-role=mse]"), extent);
    const right = makeView(root.querySelector("canvas[data-role=flow]"), extent);
    const sep = root.querySelector("input[name=sep]");
    const split = root.querySelector("input[name=split]");
    const scrub = root.querySelector("input[name=t]");
    const tOut = root.querySelector("[data-out=t]");
    const readout = root.querySelector("[data-out=readout]");
    scrub.max = STEPS;

    let seed = 7, demos = [], mix = null, traj = null, noise = noiseCloud(220, 101), k = STEPS;

    function rebuild() {
      const d = parseFloat(sep.value), p = parseFloat(split.value);
      const s = 0.22;
      mix = { mu: [[-d, 0.55], [d, 0.55]], pi: [p, 1 - p], s };
      const r = rng(seed);
      demos = Array.from({ length: 90 }, () => {
        const m = r() < p ? 0 : 1;
        return [mix.mu[m][0] + s * gauss(r), mix.mu[m][1] + s * gauss(r)];
      });
      traj = integrate(noise, mix);
    }

    function draw(step) {
      k = step;
      const muted = css("--muted"), s1 = css("--s1"), s2 = css("--s2");
      tOut.textContent = step === STEPS ? "1" : timeAt(step).toFixed(2);

      // left: the regression answer is the conditional mean
      left.clear();
      const mean = demos.reduce((acc, q) => [acc[0] + q[0] / demos.length, acc[1] + q[1] / demos.length], [0, 0]);
      const ctx = left.ctx;
      ctx.strokeStyle = muted; ctx.lineWidth = 1;
      for (let rr = 0.4; rr < 3.2; rr += 0.4) {
        ctx.globalAlpha = 0.25;
        ctx.beginPath(); ctx.arc(left.px(mean[0]), left.py(mean[1]), (rr / (2 * extent)) * left.size, 0, 2 * Math.PI); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      demos.forEach((q) => left.dot(q[0], q[1], 2.6, muted, 0.7));
      left.cross(mean[0], mean[1], 7, s2);
      left.label("MSE optimum = mean", mean[0], mean[1] - 0.32, s2, "center");

      // right: flow samples
      right.clear();
      demos.forEach((q) => right.dot(q[0], q[1], 2.6, muted, 0.35));
      right.trails(traj, step, s1);
      traj[step].forEach((q) => right.dot(q[0], q[1], 2.1, s1, 0.9));

      // how many final samples are near the empty middle vs. a mode
      const final = traj[STEPS];
      const d = parseFloat(sep.value);
      const nearMean = final.filter((q) => Math.abs(q[0] - mean[0]) < 0.25 * Math.max(d, 0.4)).length;
      readout.textContent =
        `MSE prediction sits ${Math.abs(mean[0]).toFixed(2)} from center, ` +
        `${(Math.min(Math.abs(mean[0] - mix.mu[0][0]), Math.abs(mean[0] - mix.mu[1][0]))).toFixed(2)} from the nearest mode. ` +
        `${Math.round((100 * nearMean) / final.length)}% of flow samples land in that gap.`;
    }

    const anim = animator(draw, scrub);
    function refresh(playIt) { rebuild(); if (playIt) anim.play(); else draw(k); }

    sep.addEventListener("input", () => refresh(false));
    split.addEventListener("input", () => refresh(false));
    scrub.addEventListener("input", () => anim.set(parseInt(scrub.value, 10)));
    root.querySelector("button[data-act=play]").addEventListener("click", () => anim.play());
    root.querySelector("button[data-act=noise]").addEventListener("click", () => {
      noise = noiseCloud(220, Math.floor(Math.random() * 1e9)); seed++; refresh(true);
    });
    function onResize() { left.resize(); right.resize(); draw(k); }
    window.addEventListener("resize", onResize);
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => draw(k));
    window.addEventListener("themechange", () => draw(k));
    left.resize(); right.resize(); rebuild(); draw(0);
    observeOnce(root, () => anim.play());
  }

  // ---------------------------------------------------------------- demo 2: the ideal flow memorizes
  function memorize(root) {
    const extent = 2.4;
    const view = makeView(root.querySelector("canvas"), extent);
    const sigma = root.querySelector("input[name=sigma]");
    const sOut = root.querySelector("[data-out=sigma]");
    const scrub = root.querySelector("input[name=t]");
    const readout = root.querySelector("[data-out=readout]");
    scrub.max = STEPS;

    let points = [];
    const r0 = rng(3);
    for (let i = 0; i < 7; i++) {
      const th = -0.4 + (i / 6) * 2.4;
      points.push([Math.cos(th) * 1.3 - 0.3 + 0.08 * gauss(r0), Math.sin(th) * 1.3 - 0.2 + 0.08 * gauss(r0)]);
    }
    points.push([1.4, -1.3], [-1.6, -1.2], [0.2, -1.6]);
    let noise = noiseCloud(260, 202), traj = null, k = STEPS;

    function rebuild() {
      const s = parseFloat(sigma.value);
      sOut.textContent = s.toFixed(2);
      const mix = { mu: points, pi: points.map(() => 1 / points.length), s };
      traj = points.length ? integrate(noise, mix) : null;
    }
    function draw(step) {
      k = step;
      const muted = css("--muted"), s1 = css("--s1"), s2 = css("--s2");
      view.clear();
      if (!traj) { view.label("click to add training points", 0, 0, muted, "center"); return; }
      view.trails(traj, step, s1);
      traj[step].forEach((q) => view.dot(q[0], q[1], 1.9, s1, 0.85));
      points.forEach((q) => {
        view.ctx.strokeStyle = s2; view.ctx.lineWidth = 2;
        view.ctx.beginPath(); view.ctx.arc(view.px(q[0]), view.py(q[1]), 6, 0, 2 * Math.PI); view.ctx.stroke();
      });
      const final = traj[STEPS];
      const s = parseFloat(sigma.value);
      const exact = final.filter((q) => points.some((p) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.02)).length;
      readout.textContent = s === 0
        ? `${exact} of ${final.length} samples are exact copies of a training point.`
        : `${exact} of ${final.length} samples are exact copies. The rest are training points plus Gaussian blur, not new structure.`;
    }
    const anim = animator(draw, scrub);
    sigma.addEventListener("input", () => { rebuild(); draw(k); });
    scrub.addEventListener("input", () => anim.set(parseInt(scrub.value, 10)));
    root.querySelector("button[data-act=play]").addEventListener("click", () => anim.play());
    root.querySelector("button[data-act=clear]").addEventListener("click", () => { points = []; rebuild(); draw(STEPS); });
    view.canvas.addEventListener("pointerdown", (e) => {
      const rect = view.canvas.getBoundingClientRect();
      points.push(view.toWorld(e.clientX - rect.left, e.clientY - rect.top));
      rebuild(); anim.play();
    });
    window.addEventListener("resize", () => { view.resize(); draw(k); });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => draw(k));
    window.addEventListener("themechange", () => draw(k));
    view.resize(); rebuild(); draw(0);
    observeOnce(root, () => anim.play());
  }

  function observeOnce(el, fn) {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold: 0.35 });
    io.observe(el);
  }

  function init() {
    document.querySelectorAll("[data-demo=mse-vs-flow]").forEach(mseVsFlow);
    document.querySelectorAll("[data-demo=memorize]").forEach(memorize);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
