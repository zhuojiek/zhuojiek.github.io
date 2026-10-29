---
permalink: /
title: "Zhuojie Kuang"
layout: base
redirect_from:
  - /about/
  - /about.html
---
<div class="home">

<section class="hero">
  <h1>Zhuojie Kuang</h1>
  <canvas aria-label="Particles flowing from Gaussian noise into the name Zhuojie Kuang"></canvas>
  <p class="hero-caption">
    <span>Can you match my flow? · t = <span data-hero="t">0.00</span></span>
    <span class="hero-controls">
      <span class="shape-toggle" role="group" aria-label="Target distribution">
        <button type="button" data-shape="name" aria-pressed="true" aria-label="Zhuojie Kuang">\(\aleph_0\)</button>
        <button type="button" data-shape="hanzi" aria-pressed="false" aria-label="邝卓杰">杰</button>
        <button type="button" data-shape="arm" aria-pressed="false">🤖</button>
      </span>
      <button type="button" data-hero="replay">Resample \(\mathcal{N}(0, I)\) ↻</button>
    </span>
  </p>
</section>

<section class="intro">
  <div>
    <p class="lead">Hi, I'm Zhuojie! I'm a 3rd year CS undergrad at UC Berkeley.</p>
    <p>I'm currently a research intern at <a href="https://www.roboticscenter.ai">Robotics Center</a> and previously did research on <a href="https://darrellgroup.github.io"> unified models</a>.</p>
    <p>I am interested in developing robots that continuously improve through real and simulated interactions, using both learned approaches (VLAs, WAMs, RL) and agentic reasoning (CaP, Agentic Robotics). I am studying to become a full-stack roboticist with knowledge of the <a href="/coursework/">entire stack</a>, from actuators and control to distributed training and RL.</p>
    <p class="seeking"><strong>I'm currently looking for a research opportunity in robot learning.</strong> If you're a robotics researcher with an open project, please reach out to me at <a href="mailto:anthonykuang@berkeley.edu">anthonykuang@berkeley.edu</a>.</p>
    <!-- <p class="seeking"><strong>I always love to talk about Robotics and AI.</strong> Feel free to chat with me anything at <a href="mailto:anthonykuang@berkeley.edu">anthonykuang@berkeley.edu</a> or WeChat</p> -->
  </div>
  <aside class="spec">
    <img src="/images/portrait.jpg" alt="Zhuojie Kuang">
    <dl>
      <div><dt>Contact</dt><dd><a href="https://github.com/shimamooo?tab=repositories">GitHub</a> · <a href="https://x.com/zhuojiek">Twitter</a> · <a href="mailto:anthonykuang@berkeley.edu">Email</a></dd></div>
    </dl>
  </aside>
</section>

<section class="section">
  <div class="section-head"><h2>Research</h2><a href="/research/">All research →</a></div>
  {% include research-list.html group="current" embeds=true %}
  {% include research-list.html group="course" compact=true %}
  {% include research-list.html group="ongoing" %}
  {% include research-list.html group="workshop" %}
</section>

<section class="section">
  <div class="section-head"><h2>Projects</h2><a href="/blog/">All posts →</a></div>
  <div class="cards">
  {% assign featured = site.posts | where: "featured", true %}
  {% for p in featured %}
    <a class="card" href="{{ p.url | relative_url }}">
      <div class="card-img"><img src="{{ p.image | relative_url }}" alt="" loading="lazy"{% if p.card_fit %} class="{{ p.card_fit }}"{% endif %}></div>
      <div class="card-body">
        <div class="card-meta"><span>{{ p.date | date: "%b %Y" }}</span>{% if p.context %}<span>{{ p.context }}</span>{% endif %}{% if p.interactive %}<span class="demo-flag">● Interactive</span>{% endif %}</div>
        <h3>{{ p.title }}</h3>
        <p>{{ p.description }}</p>
      </div>
    </a>
  {% endfor %}
  </div>
</section>

<section class="section">
  <div class="section-head"><h2>Miscellaneous</h2></div>
  <p class="group-note" style="margin:0">
    I am a big fan of <a href="https://www.youtube.com/watch?v=heP3LWn8-KQ">Damian Lillard</a> and similarly grew up in East Oakland. I sometimes enjoy playing the 
    <a href="https://www.youtube.com/watch?v=hnmUMC_tGN8">keyboard</a>. I attend and help host the <a href="https://x.com/saturdayrobotic">Saturday Robotics</a> reading groups.
  </p>
  <div class="x-posts">
  {% for url in site.data.tweets %}
    <div class="x-post"><blockquote class="twitter-tweet" data-dnt="true" data-conversation="none"><a href="{{ url | replace: 'x.com', 'twitter.com' }}">View post on X →</a></blockquote></div>
  {% endfor %}
  </div>
</section>

</div>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&text=%E9%82%9D%E5%8D%93%E6%9D%B0&display=swap">
<script>
  (function () {
    var t = document.documentElement.getAttribute('data-theme');
    var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.querySelectorAll('.twitter-tweet').forEach(function (b) { b.setAttribute('data-theme', dark ? 'dark' : 'light'); });
    var posts = document.querySelectorAll('.x-post');
    window.twttr = window.twttr || { _e: [], ready: function (f) { this._e.push(f); } };
    twttr.ready(function (t) {
      t.events.bind('rendered', function (e) {
        var post = e.target.closest && e.target.closest('.x-post');
        if (!post) return;
        var frame = post.querySelector('iframe');
        var css = getComputedStyle(post);
        var top = parseFloat(css.getPropertyValue('--x-crop-top')) || 0;
        var bottom = parseFloat(css.getPropertyValue('--x-crop-bottom')) || 0;
        // Crop X's header (avatar, name, follow) and footer (date, actions, "Read more").
        var fit = function () { post.style.height = Math.max(0, frame.offsetHeight - top - bottom) + 'px'; };
        fit();
        if (window.ResizeObserver) new ResizeObserver(fit).observe(frame);
        post.classList.add('is-ready');
      });
    });
    setTimeout(function () {
      posts.forEach(function (p) { if (!p.classList.contains('is-ready')) p.classList.add('is-failed'); });
    }, 10000);
    var s = document.createElement('script');
    s.src = 'https://platform.twitter.com/widgets.js'; s.async = true; s.charset = 'utf-8';
    document.body.appendChild(s);
  })();
</script>
<script src="/js/hero.js?v={{ site.time | date: '%s' }}" defer></script>
