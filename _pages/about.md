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
        <button type="button" data-shape="name" aria-pressed="true">me</button>
        <button type="button" data-shape="arm" aria-pressed="false">clanker</button>
      </span>
      <button type="button" data-hero="replay">Resample \(\mathcal{N}(0, I)\) ↻</button>
    </span>
  </p>
</section>

<section class="intro">
  <div>
    <p class="lead">Hi! I'm a CS undergrad at UC Berkeley. I'm interested in general-purpose robots for open-world manipulation, especially through unified architectures, video diffusion, 3D representations, and VLAs. I'm also interested in agentic approaches and autoresearch.</p>
    <p>I'm currently interning at <a href="https://www.roboticscenter.ai">Robotics Center</a> and work part time at <a href="https://www.codeninjas.com">Code Ninjas</a>. I previously interned at <a href="https://stripe.com">Stripe</a> and did research on unified multimodal models in <a href="https://darrellgroup.github.io">Trevor Darrell's group</a>.</p>
    <p>Lately I've been rebuilding the robot learning stack from scratch: <a href="/posts/push-t-imitation">flow-matching policies</a>, <a href="/posts/policy-gradients">policy gradients</a>, <a href="/posts/dqn-sac">actor-critic</a>, and <a href="/posts/offline-rl">offline RL with flow Q-learning</a>. I also possess an SO-101 arm named <a href="/posts/2026/09/21">clanker</a>.</p>
    <p class="seeking"><strong>I'm actively looking for research positions.</strong> If you're a robot learning researcher at Berkeley with capacity for mentorship, please don't hesitate to reach out: <a href="mailto:anthonykuang@berkeley.edu">anthonykuang@berkeley.edu</a></p>
  </div>
  <aside class="spec">
    <img src="/images/portrait.jpg" alt="Zhuojie Kuang">
    <dl>
      <div><dt>Contact</dt><dd><a href="https://github.com/shimamooo">GitHub</a> · <a href="mailto:anthonykuang@berkeley.edu">Email</a> · <a href="/feed.xml">RSS</a></dd></div>
    </dl>
  </aside>
</section>

<section class="section">
  <div class="section-head"><h2>Research</h2><a href="/research/">All research →</a></div>
  <p class="group-label">Ongoing</p>
  {% include research-list.html group="ongoing" %}
  <p class="group-label">Workshop papers</p>
  {% include research-list.html group="workshop" %}
  <p class="group-label">Course research projects</p>
  {% include research-list.html group="course" compact=true %}
</section>

<section class="section">
  <div class="section-head"><h2>Writing <em>with figures you can play with</em></h2><a href="/writing/">All writing →</a></div>
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
    I am a fan of Damian Lillard and was originally from East Oakland myself; I attended school virtually through California Connections Academy and graduated as valedictorian. I'm a big fan of Idolm@ster and Animenz. I have a <a href="https://akasha.cv/profile/650357224">top 1% Ayaka</a>. I sometimes enjoy playing the 
    <a href="https://www.youtube.com/watch?v=hnmUMC_tGN8">keyboard</a>. I'm blessed with the opportunity to chase my dreams.
  </p>
</section>

</div>
<script src="/js/hero.js?v={{ site.time | date: '%s' }}" defer></script>
