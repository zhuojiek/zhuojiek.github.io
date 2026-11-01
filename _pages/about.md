---
permalink: /
title: "Zhuojie Kuang"
layout: base
hero: true
sidebar: true
redirect_from:
  - /about/
  - /about.html
---
<section class="hero">
  <h1>Zhuojie Kuang</h1>
  <canvas data-start-shape="arm" aria-label="Particles flowing from Gaussian noise into a robot arm"></canvas>
  <p class="hero-caption">
    <span>Can you match my flow? · t = <span data-hero="t">0.00</span></span>
    <span class="hero-controls">
      <button type="button" data-hero="replay">Resample \(\mathcal{N}(0, I)\) ↻</button>
    </span>
  </p>
</section>

<section class="intro">
  <p>Hi, I'm Zhuojie, a 3rd year CS undergrad at UC Berkeley. I'm currently a research intern at <a href="https://www.roboticscenbloter.ai">Robotics Center</a> and previously did research on <a href="https://darrellgroup.github.io">unified models</a> and engineering at <a href="https://stripe.com">Stripe</a>.</p>
  <p>I am interested in developing robots that continuously improve through real and simulated interactions, using both learned approaches (VLAs, WAMs, RL) and agentic reasoning (CaP, Agentic Robotics). I am studying to be a full-stack roboticist and to get familiar with the <a href="/coursework/">entire stack</a>, from actuators and control to distributed training and RL.</p>
  <p class="seeking"><strong>I'm looking for a research opportunity in robot learning.</strong> If you're a robotics researcher with an open project, please reach out at <a href="mailto:anthonykuang@berkeley.edu">anthonykuang@berkeley.edu</a>.</p>
</section>

<section>
  <h2 class="sec">Recent activity <a href="/archive/">Archives »</a></h2>
  {% assign writing = site.posts | where_exp: "p", "p.section != 'course'" | where_exp: "p", "p.section != 'stream'" %}
  {% assign activity = writing | concat: site.publications | sort: "date" | reverse %}
  <ul class="post-list">
  {% for a in activity limit: 6 %}
    <li>
      <time datetime="{{ a.date | date_to_xmlschema }}">{{ a.date | date: "%Y-%m-%d" }}</time>
      <div>{% if a.collection == "publications" %}Research:{% else %}Post:{% endif %} <a class="title" href="{{ a.url | relative_url }}">{{ a.title }}</a></div>
    </li>
  {% endfor %}
  </ul>
</section>

<section>
  <h2 class="sec">Research <a href="/research/">All »</a></h2>
  <ol class="research">
  {% assign groups = "current,ongoing,workshop,course" | split: "," %}
  {% for g in groups %}{% assign items = site.publications | where: "group", g | sort: "order" %}{% for p in items %}
    <li>
      <a class="r-title" href="{{ p.url | relative_url }}">{{ p.title }}</a>
      <div class="r-authors">{{ p.authors | replace: "Zhuojie Kuang", "<strong>Zhuojie Kuang</strong>" }}</div>
      <div class="r-meta"><em>{{ p.venue | default: p.kind }}</em>{% for l in p.links %} · <a href="{{ l.url | relative_url }}">{{ l.name }}</a>{% endfor %}</div>
    </li>
  {% endfor %}{% endfor %}
  </ol>
</section>

<section>
  <h2 class="sec">Posts <a href="/blog/">All »</a></h2>
  {% assign labels = "writing:Technical posts:/blog/|notes:Notes:/blog/#notes|cs180:CS 180 projects:/blog/#cs180" | split: "|" %}
  {% assign shown = 0 %}
  {% for p in site.posts %}
    {% if p.section == "course" or p.section == "stream" %}{% continue %}{% endif %}
    {% assign shown = shown | plus: 1 %}{% if shown > 10 %}{% break %}{% endif %}
    <article class="post-item">
      <h3><a href="{{ p.url | relative_url }}">{{ p.title }}</a></h3>
      <div class="meta"><time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y-%m-%d" }}</time>{% for l in labels %}{% assign parts = l | split: ":" %}{% if parts[0] == p.section %} · <a href="{{ parts[2] | relative_url }}">{{ parts[1] }}</a>{% endif %}{% endfor %}</div>
      <p class="excerpt">{{ p.content | strip_html | normalize_whitespace | truncate: 220 }}</p>
      <a class="more" href="{{ p.url | relative_url }}">Read more »</a>
    </article>
  {% endfor %}
</section>

<section>
  <h2 class="sec">Misc</h2>
  <p>I am a big fan of <a href="https://www.youtube.com/watch?v=heP3LWn8-KQ">Damian Lillard</a> and similarly grew up in East Oakland. I sometimes enjoy playing the <a href="https://www.youtube.com/watch?v=hnmUMC_tGN8">keyboard</a>. I attend and help host the <a href="https://x.com/saturdayrobotic">Saturday Robotics</a> reading groups.</p>
  {% include x-posts.html %}
</section>

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&text=%E9%82%9D%E5%8D%93%E6%9D%B0&display=swap">
<script src="/js/hero.js?v={{ site.time | date: '%s' }}" defer></script>
