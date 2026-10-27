---
title: "CV"
permalink: /cv/
wide: true
noindex: true
sitemap: false
unlock: "1"
redirect_from:
  - /resume/
---

{% comment %} Only shown with the share link /cv/?k=<unlock>. Hidden from nav, search engines and the sitemap. {% endcomment %}
<div id="cv-gate"></div>
<p id="cv-locked">Nothing here. Try the <a href="/research/">research</a>, <a href="/blog/">blog</a>, or <a href="/projects/">projects</a> pages, or go back <a href="/">home</a>.</p>

<script>
  (function () {
    if (new URLSearchParams(location.search).get("k") !== "{{ page.unlock }}") return;
    document.getElementById("cv-locked").remove();
    document.getElementById("cv-gate").innerHTML =
      '<object class="resume-embed" data="/files/resume.pdf#view=FitH" type="application/pdf" aria-label="CV PDF">' +
      '<p>Your browser can\'t display the PDF inline. <a href="/files/resume.pdf">Download it here</a>.</p></object>';
  })();
</script>
