// Interactive figures for the RL posts.
//   [data-demo=gae]          weights GAE(λ) puts on future TD errors δ_{t+l}
//   [data-demo=overestimate] bias of max_a Q̂(a) vs. the double estimator
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, x, y, str, opts) {
    const t = el("text", Object.assign({ x, y, "font-family": "Inter, sans-serif", "font-size": 11, fill: css("--muted") }, opts || {}), parent);
    t.textContent = str;
    return t;
  }
  function onTheme(fn) {
    window.addEventListener("themechange", fn);
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", fn);
  }
  function tipper(wrap) {
    const tip = document.createElement("div");
    tip.className = "chart-tip";
    wrap.appendChild(tip);
    return {
      show(html, x, y) { tip.innerHTML = html; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.style.opacity = 1; },
      hide() { tip.style.opacity = 0; },
    };
  }

  // ------------------------------------------------------------------ GAE weights
  function gae(root) {
    const gIn = root.querySelector("input[name=gamma]"), lIn = root.querySelector("input[name=lambda]");
    const gOut = root.querySelector("[data-out=gamma]"), lOut = root.querySelector("[data-out=lambda]");
    const readout = root.querySelector("[data-out=readout]");
    const wrap = root.querySelector(".chart-wrap");
    const svg = el("svg", { viewBox: "0 0 760 280", role: "img", "aria-label": "Bar chart of GAE weights on future TD errors" }, wrap);
    const tip = tipper(wrap);
    const L = 60, m = { l: 46, r: 16, t: 18, b: 40 }, w = 760 - m.l - m.r, h = 280 - m.t - m.b;
    const bw = w / L;

    function draw() {
      const g = parseFloat(gIn.value), lam = parseFloat(lIn.value);
      gOut.textContent = g.toFixed(3); lOut.textContent = lam.toFixed(2);
      svg.innerHTML = "";
      const rule = css("--rule"), ink = css("--ink-2"), s1 = css("--s1"), s2 = css("--s2"), paper = css("--paper");
      // grid + axes
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
        const y = m.t + h - v * h;
        el("line", { x1: m.l, x2: m.l + w, y1: y, y2: y, stroke: rule, "stroke-width": 1 }, svg);
        text(svg, m.l - 8, y + 4, v.toFixed(2), { "text-anchor": "end" });
      });
      [0, 10, 20, 30, 40, 50].forEach((l) => text(svg, m.l + l * bw + bw / 2, m.t + h + 16, String(l), { "text-anchor": "middle" }));
      text(svg, m.l + w / 2, m.t + h + 34, "l, steps into the future", { "text-anchor": "middle", fill: ink });
      text(svg, 12, m.t + h / 2, "weight on δ at step t + l", { transform: `rotate(-90 12 ${m.t + h / 2})`, "text-anchor": "middle", fill: ink });

      // bars: (γλ)^l
      const gl = g * lam;
      for (let l = 0; l < L; l++) {
        const v = Math.pow(gl, l);
        const bh = Math.max(v * h, v > 0 ? 1 : 0);
        const x = m.l + l * bw + 1, y = m.t + h - bh;
        const bar = el("rect", { x, y, width: Math.max(bw - 2, 1), height: bh, rx: Math.min(2, (bw - 2) / 2), fill: s1 }, svg);
        const hit = el("rect", { x: m.l + l * bw, y: m.t, width: bw, height: h, fill: "transparent" }, svg);
        hit.addEventListener("pointerenter", () => {
          bar.setAttribute("opacity", 0.75);
          const r = svg.getBoundingClientRect(), sx = r.width / 760;
          tip.show(`l = ${l}<br>GAE: ${v.toFixed(3)}<br>λ = 1: ${Math.pow(g, l).toFixed(3)}`, (m.l + l * bw + bw / 2) * sx, y * sx);
        });
        hit.addEventListener("pointerleave", () => { bar.removeAttribute("opacity"); tip.hide(); });
      }
      // reference: λ = 1 (Monte Carlo minus baseline) weights γ^l
      let d = "";
      for (let l = 0; l < L; l++) d += (l ? "L" : "M") + (m.l + l * bw + bw / 2).toFixed(1) + " " + (m.t + h - Math.pow(g, l) * h).toFixed(1);
      el("path", { d, fill: "none", stroke: s2, "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      const lx = m.l + 40 * bw, ly = m.t + h - Math.pow(g, 40) * h;
      el("circle", { cx: lx + bw / 2, cy: ly, r: 4, fill: s2, stroke: paper, "stroke-width": 2 }, svg);
      text(svg, lx + bw / 2 + 8, ly - 8, "λ = 1 (Monte Carlo)", { fill: ink });

      const horizon = gl >= 0.999999 ? Infinity : 1 / (1 - gl);
      const half = gl <= 0 ? 1 : Math.ceil(Math.log(0.5) / Math.log(gl));
      readout.innerHTML = lam === 0
        ? `λ = 0: all weight on δ<sub>t</sub>, the one-step TD error. Lowest variance, but the estimate is only as good as V.`
        : `Effective horizon 1/(1−γλ) ≈ <b>${horizon === Infinity ? "∞" : horizon.toFixed(1)}</b> steps. Each TD error's weight halves every ${isFinite(half) ? half : "∞"} steps.`;
    }
    gIn.addEventListener("input", draw); lIn.addEventListener("input", draw);
    onTheme(draw);
    draw();
  }

  // ------------------------------------------------------------------ overestimation
  function overestimate(root) {
    const nIn = root.querySelector("input[name=n]"), sIn = root.querySelector("input[name=sigma]");
    const nOut = root.querySelector("[data-out=n]"), sOut = root.querySelector("[data-out=sigma]");
    const readout = root.querySelector("[data-out=readout]");
    const wrap = root.querySelector(".chart-wrap");
    const svg = el("svg", { viewBox: "0 0 760 280", role: "img", "aria-label": "Histograms of the max estimator and the double estimator" }, wrap);
    const tip = tipper(wrap);
    const m = { l: 46, r: 16, t: 24, b: 40 }, w = 760 - m.l - m.r, h = 280 - m.t - m.b;
    const X0 = -4, X1 = 6, BINS = 50, TRIALS = 6000;
    let seed = 11;

    function rng(s) {
      return function () {
        s = (s + 0x6d2b79f5) >>> 0; let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function gauss(r) { const u = Math.max(r(), 1e-12), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

    function simulate() {
      const n = parseInt(nIn.value, 10), sigma = parseFloat(sIn.value), r = rng(seed);
      const single = new Float64Array(TRIALS), dbl = new Float64Array(TRIALS);
      for (let k = 0; k < TRIALS; k++) {
        let best = -Infinity, arg = 0;
        const qb = new Array(n);
        for (let a = 0; a < n; a++) {
          const qa = sigma * gauss(r); qb[a] = sigma * gauss(r);
          if (qa > best) { best = qa; arg = a; }
        }
        single[k] = best;       // max_a Q̂_A(a): pick and evaluate with the same noisy estimate
        dbl[k] = qb[arg];       // Q̂_B(argmax_a Q̂_A(a)): pick with A, evaluate with B
      }
      return { n, sigma, single, dbl };
    }
    function hist(arr) {
      const c = new Array(BINS).fill(0), bw = (X1 - X0) / BINS;
      arr.forEach((v) => { const i = Math.floor((v - X0) / bw); if (i >= 0 && i < BINS) c[i]++; });
      return c;
    }
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const fmt = (v) => (Math.abs(v) < 0.005 ? "0.00" : (v > 0 ? "+" : "") + v.toFixed(2));

    function draw() {
      const sim = simulate();
      nOut.textContent = sim.n; sOut.textContent = sim.sigma.toFixed(2);
      const hs = hist(sim.single), hd = hist(sim.dbl);
      const ymax = Math.max(...hs, ...hd) * 1.1;
      const sx = (v) => m.l + ((v - X0) / (X1 - X0)) * w, sy = (c) => m.t + h - (c / ymax) * h;
      const rule = css("--rule"), ink = css("--ink-2"), s1 = css("--s1"), s2 = css("--s2"), muted = css("--muted");
      svg.innerHTML = "";
      for (let v = X0; v <= X1; v += 2) {
        el("line", { x1: sx(v), x2: sx(v), y1: m.t, y2: m.t + h, stroke: rule }, svg);
        text(svg, sx(v), m.t + h + 16, (v > 0 ? "+" : "") + v, { "text-anchor": "middle" });
      }
      el("line", { x1: m.l, x2: m.l + w, y1: m.t + h, y2: m.t + h, stroke: css("--rule-strong") }, svg);
      text(svg, m.l + w / 2, m.t + h + 34, "estimated value of the greedy action (true value of every action = 0)", { "text-anchor": "middle", fill: ink });

      const bw = (X1 - X0) / BINS;
      function area(c, color) {
        let d = `M${sx(X0)} ${sy(0)}`;
        c.forEach((v, i) => { d += `L${sx(X0 + i * bw)} ${sy(v)}L${sx(X0 + (i + 1) * bw)} ${sy(v)}`; });
        d += `L${sx(X1)} ${sy(0)}Z`;
        el("path", { d, fill: color, "fill-opacity": 0.16, stroke: color, "stroke-width": 2, "stroke-linejoin": "round" }, svg);
      }
      area(hd, s1); area(hs, s2);

      // true value + means, direct-labelled
      el("line", { x1: sx(0), x2: sx(0), y1: m.t - 6, y2: m.t + h, stroke: muted, "stroke-width": 1, "stroke-dasharray": "2 3" }, svg);
      const ms = mean(sim.single), md = mean(sim.dbl);
      [[md, s1, "double: "], [ms, s2, "max: "]].forEach(([v, color, lab], i) => {
        el("line", { x1: sx(v), x2: sx(v), y1: m.t, y2: m.t + h, stroke: color, "stroke-width": 2 }, svg);
        const right = sx(v) < m.l + w - 120;
        text(svg, sx(v) + (right ? 6 : -6), m.t + 10 + i * 15, `${lab}${fmt(v)}`, { fill: ink, "font-weight": 600, "text-anchor": right ? "start" : "end" });
      });

      // crosshair hover
      const hover = el("rect", { x: m.l, y: m.t, width: w, height: h, fill: "transparent" }, svg);
      const cross = el("line", { y1: m.t, y2: m.t + h, stroke: ink, "stroke-width": 1, opacity: 0 }, svg);
      hover.addEventListener("pointermove", (e) => {
        const r = svg.getBoundingClientRect(), scale = r.width / 760;
        const vx = (e.clientX - r.left) / scale;
        const i = Math.min(BINS - 1, Math.max(0, Math.floor(((vx - m.l) / w) * BINS)));
        const cx = sx(X0 + (i + 0.5) * bw);
        cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("opacity", 0.4);
        const lo = (X0 + i * bw).toFixed(1), hi = (X0 + (i + 1) * bw).toFixed(1);
        tip.show(`[${lo}, ${hi})<br>max: ${hs[i]} · double: ${hd[i]}`, cx * scale, m.t * scale + 8);
      });
      hover.addEventListener("pointerleave", () => { cross.setAttribute("opacity", 0); tip.hide(); });

      readout.innerHTML = sim.n === 1
        ? `With one action there is nothing to choose between, so both estimators are unbiased.`
        : `Over ${TRIALS.toLocaleString()} trials, the max estimator overestimates by <b>${ms.toFixed(2)}</b> (about ${(ms / sim.sigma).toFixed(2)}σ). The double estimator's mean is ${fmt(md)}, which is unbiased up to sampling noise.`;
    }
    nIn.addEventListener("input", draw); sIn.addEventListener("input", draw);
    root.querySelector("button[data-act=resample]").addEventListener("click", () => { seed++; draw(); });
    onTheme(draw);
    draw();
  }

  function init() {
    document.querySelectorAll("[data-demo=gae]").forEach(gae);
    document.querySelectorAll("[data-demo=overestimate]").forEach(overestimate);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
