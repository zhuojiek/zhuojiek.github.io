// Interactive figures for the robot policy evaluation post.
//   [data-demo=ranking] correlation vs. ranking error between real and sim scores (drag the sim scores)
//   [data-demo=arena]   pairwise arena: noisy head-to-head matches -> Bradley–Terry ranking
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
    const t = el("text", Object.assign({ x, y, "font-size": 12, fill: css("--muted") }, opts || {}), parent);
    t.textContent = str;
    return t;
  }
  function onTheme(fn) {
    window.addEventListener("themechange", fn);
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", fn);
  }
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0; let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pearson(a, b) {
    const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
    return da && db ? num / Math.sqrt(da * db) : 0;
  }
  function kendall(a, b) {
    let c = 0, d = 0;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
      const s = Math.sign(a[i] - a[j]) * Math.sign(b[i] - b[j]);
      if (s > 0) c++; else if (s < 0) d++;
    }
    return (c - d) / ((a.length * (a.length - 1)) / 2);
  }

  // ------------------------------------------------ correlation vs. ranking error
  // Six made-up policies with known real-world success rates. The reader drags each
  // policy's sim score; we report Pearson r and the mean maximum rank violation (MMRV):
  // for each policy, the largest real-world gap to a policy the sim orders the wrong way.
  function ranking(root) {
    const wrap = root.querySelector(".chart-wrap");
    const readout = root.querySelector("[data-out=readout]");
    const W = 640, H = 340, m = { l: 52, r: 18, t: 16, b: 46 }, w = W - m.l - m.r, h = H - m.t - m.b;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Scatter plot of real versus sim success rate for six policies; drag points vertically" }, wrap);
    const real = [0.22, 0.35, 0.48, 0.6, 0.72, 0.85];
    const presets = {
      reset: [0.1, 0.16, 0.3, 0.28, 0.42, 0.5],
      ordered: [0.04, 0.05, 0.06, 0.07, 0.08, 0.55],
      flipped: [0.12, 0.2, 0.28, 0.4, 0.46, 0.3],
    };
    let sim = presets.reset.slice(), drag = -1;
    const X = (v) => m.l + v * w, Y = (v) => m.t + h - v * h;

    function rankError() {
      let total = 0; const worst = [];
      for (let i = 0; i < real.length; i++) {
        let mx = 0, jw = -1;
        for (let j = 0; j < real.length; j++) {
          if (i === j) continue;
          if ((real[i] - real[j]) * (sim[i] - sim[j]) < 0 && Math.abs(real[i] - real[j]) > mx) { mx = Math.abs(real[i] - real[j]); jw = j; }
        }
        total += mx; worst.push(jw);
      }
      return { mmrv: total / real.length, worst };
    }

    function draw() {
      svg.innerHTML = "";
      const rule = css("--rule"), ink = css("--ink"), s1 = css("--s1"), s2 = css("--s2"), paper = css("--paper");
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
        el("line", { x1: m.l, x2: m.l + w, y1: Y(v), y2: Y(v), stroke: rule }, svg);
        el("line", { x1: X(v), x2: X(v), y1: m.t, y2: m.t + h, stroke: rule }, svg);
        text(svg, m.l - 8, Y(v) + 4, Math.round(v * 100) + "%", { "text-anchor": "end" });
        text(svg, X(v), m.t + h + 16, Math.round(v * 100) + "%", { "text-anchor": "middle" });
      });
      text(svg, m.l + w / 2, H - 8, "real-world success rate (known)", { "text-anchor": "middle", fill: ink });
      text(svg, 14, m.t + h / 2, "sim success rate (drag)", { transform: `rotate(-90 14 ${m.t + h / 2})`, "text-anchor": "middle", fill: ink });
      el("line", { x1: X(0), y1: Y(0), x2: X(1), y2: Y(1), stroke: rule, "stroke-dasharray": "4 4" }, svg);

      const { mmrv, worst } = rankError();
      worst.forEach((j, i) => { if (j >= 0) el("line", { x1: X(real[i]), y1: Y(sim[i]), x2: X(real[j]), y2: Y(sim[j]), stroke: s2, "stroke-width": 2, opacity: 0.8 }, svg); });
      real.forEach((r, i) => {
        const bad = worst[i] >= 0;
        el("circle", { cx: X(r), cy: Y(sim[i]), r: 9, fill: bad ? s2 : s1, stroke: paper, "stroke-width": 2, style: "cursor:ns-resize", "data-i": i }, svg);
        text(svg, X(r), Y(sim[i]) + 4, String.fromCharCode(65 + i), { "text-anchor": "middle", fill: paper, "font-size": 10, "font-weight": 700, "pointer-events": "none" });
      });
      const r = pearson(real, sim);
      readout.innerHTML = `Pearson <i>r</i> = <b>${r.toFixed(2)}</b> · ranking error (MMRV) = <b>${(mmrv * 100).toFixed(1)}</b> points` +
        (mmrv === 0 ? " · the sim orders every policy correctly" : " · red pairs are ordered the wrong way round");
    }

    function toVal(evt) {
      const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return Math.min(1, Math.max(0, (m.t + h - p.y) / h));
    }
    svg.addEventListener("pointerdown", (e) => { const i = e.target.getAttribute && e.target.getAttribute("data-i"); if (i !== null) { drag = +i; svg.setPointerCapture(e.pointerId); e.preventDefault(); } });
    svg.addEventListener("pointermove", (e) => { if (drag < 0) return; sim[drag] = toVal(e); draw(); });
    svg.addEventListener("pointerup", () => { drag = -1; });
    root.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { sim = presets[b.dataset.preset].slice(); draw(); }));
    onTheme(draw);
    draw();
  }

  // ------------------------------------------------ pairwise arena
  // Hidden "true" strengths theta_i. Each match: two policies run back to back, the evaluator
  // prefers i with probability sigmoid(theta_i - theta_j). We fit Bradley–Terry by the
  // standard MM iterations (with one pseudo-win and loss against an average opponent).
  function arena(root) {
    const wrap = root.querySelector(".chart-wrap");
    const readout = root.querySelector("[data-out=readout]");
    const similar = root.querySelector("input[name=similar]");
    const names = ["Policy A", "Policy B", "Policy C", "Policy D", "Policy E", "Policy F"];
    const theta = [-1.2, -0.5, 0.1, 0.3, 0.9, 1.4];
    const n = theta.length;
    let wins, games, total, est, r;
    const W = 640, H = 270, m = { l: 74, r: 54, t: 12, b: 34 }, w = W - m.l - m.r;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "True versus estimated strength of six policies" }, wrap);

    function reset() {
      wins = Array.from({ length: n }, () => Array(n).fill(0));
      games = Array.from({ length: n }, () => Array(n).fill(0));
      total = 0; est = Array(n).fill(0); r = rng(7);
    }
    function fit() {
      let p = Array(n).fill(1);
      for (let it = 0; it < 200; it++) {
        const next = p.map((pi, i) => {
          let w_i = 1, denom = 2 / (pi + 1);           // pseudo-games against a strength-1 opponent
          for (let j = 0; j < n; j++) if (j !== i && games[i][j]) { w_i += wins[i][j]; denom += games[i][j] / (pi + p[j]); }
          return w_i / denom;
        });
        const g = Math.exp(next.reduce((s, x) => s + Math.log(x), 0) / n);
        p = next.map((x) => x / g);
      }
      est = p.map(Math.log);
    }
    function pickPair() {
      if (!similar.checked || total < 12) {
        const i = Math.floor(r() * n); let j = Math.floor(r() * (n - 1)); if (j >= i) j++;
        return [i, j];
      }
      // match policies whose current estimates are close: most informative comparisons
      const weights = []; let sum = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const wgt = Math.exp(-3 * Math.abs(est[i] - est[j])); weights.push([i, j, wgt]); sum += wgt; }
      let u = r() * sum;
      for (const [i, j, wgt] of weights) { u -= wgt; if (u <= 0) return r() < 0.5 ? [i, j] : [j, i]; }
      return [0, 1];
    }
    function play(k) {
      for (let t = 0; t < k; t++) {
        const [i, j] = pickPair();
        const pi = 1 / (1 + Math.exp(-(theta[i] - theta[j])));
        const iw = r() < pi;
        games[i][j]++; games[j][i]++;
        if (iw) wins[i][j]++; else wins[j][i]++;
        total++;
      }
      fit(); draw();
    }
    function draw() {
      svg.innerHTML = "";
      const rule = css("--rule"), ink = css("--ink"), s1 = css("--s1"), s2 = css("--s2");
      const lo = -2.5, hi = 2.5, X = (v) => m.l + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * w;
      const rowH = (H - m.t - m.b) / n;
      [-2, -1, 0, 1, 2].forEach((v) => {
        el("line", { x1: X(v), x2: X(v), y1: m.t, y2: H - m.b, stroke: rule }, svg);
        text(svg, X(v), H - m.b + 16, (v > 0 ? "+" : "") + v, { "text-anchor": "middle" });
      });
      text(svg, m.l + w / 2, H - 4, "strength (log-odds of winning against an average policy)", { "text-anchor": "middle", fill: ink });
      const centred = est.map((e) => e - est.reduce((s, x) => s + x, 0) / n + theta.reduce((s, x) => s + x, 0) / n);
      const order = centred.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map((x) => x[1]);
      for (let i = 0; i < n; i++) {
        const y = m.t + rowH * (n - 1 - i) + rowH / 2;
        text(svg, m.l - 10, y + 4, names[i], { "text-anchor": "end", fill: ink });
        el("line", { x1: X(theta[i]), x2: X(centred[i]), y1: y, y2: y, stroke: rule, "stroke-width": 2 }, svg);
        el("circle", { cx: X(theta[i]), cy: y, r: 6, fill: "none", stroke: s2, "stroke-width": 2 }, svg);
        if (total) el("circle", { cx: X(centred[i]), cy: y, r: 6, fill: s1 }, svg);
        if (total) text(svg, W - m.r + 8, y + 4, "#" + (order.indexOf(i) + 1), { fill: ink });
      }
      const tau = total ? kendall(theta, est) : 0;
      readout.innerHTML = total
        ? `${total} matches · Kendall τ between estimated and true ranking = <b>${tau.toFixed(2)}</b>${tau === 1 ? " · ranking fully recovered" : ""}`
        : "No matches yet. Each match runs two policies back to back and an evaluator picks the better rollout.";
    }
    root.querySelectorAll("[data-run]").forEach((b) => b.addEventListener("click", () => play(+b.dataset.run)));
    root.querySelector("[data-reset]").addEventListener("click", () => { reset(); draw(); });
    onTheme(draw);
    reset(); draw();
  }

  function init() {
    document.querySelectorAll("[data-demo=ranking]").forEach(ranking);
    document.querySelectorAll("[data-demo=arena]").forEach(arena);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
