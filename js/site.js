// Site chrome: theme toggle, reading progress, table of contents, sidenotes.
(function () {
  "use strict";
  const root = document.documentElement;

  // ---- theme toggle (explicit choice persists; otherwise follow the OS)
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const dark = root.getAttribute("data-theme")
        ? root.getAttribute("data-theme") === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      const next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      window.dispatchEvent(new Event("themechange"));
    });
  }

  // ---- reading progress (articles only)
  const bar = document.querySelector(".progress span");
  const article = document.querySelector(".article .prose");
  if (bar && article) {
    const update = () => {
      const r = article.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
      bar.style.width = (p * 100).toFixed(2) + "%";
    };
    document.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // ---- table of contents from h2s, with scroll-spy
  const toc = document.querySelector(".toc ol");
  if (toc && article) {
    const heads = Array.from(article.querySelectorAll("h2[id]"));
    heads.forEach((h) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
    });
    const links = Array.from(toc.querySelectorAll("a"));
    if ("IntersectionObserver" in window && heads.length) {
      let current = null;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) current = e.target.id; });
        // the last heading above the fold wins
        const above = heads.filter((h) => h.getBoundingClientRect().top < window.innerHeight * 0.35);
        const id = above.length ? above[above.length - 1].id : current;
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + id));
      }, { rootMargin: "0px 0px -60% 0px" });
      heads.forEach((h) => io.observe(h));
    }
  }

  // ---- sidenotes: number them and drop a marker in the text
  document.querySelectorAll(".sidenote").forEach((sn, i) => {
    const n = i + 1;
    const ref = document.createElement("sup");
    ref.className = "sn-ref";
    ref.textContent = n;
    sn.parentNode.insertBefore(ref, sn);
    const num = document.createElement("span");
    num.className = "sn-num";
    num.textContent = n;
    sn.insertBefore(num, sn.firstChild);
  });
})();
