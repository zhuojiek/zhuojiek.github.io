---
title: "Visual–Temporal Retrieval-Augmented Generation for Lecture Question Answering"
collection: publications
category: conferences
permalink: /publication/2026-05-24-lecturerag
date: 2026-05-24
---

Lecture videos are deeply multimodal. An answer to a single student question may live in spoken explanation, on-screen text, slide images, tables, charts, or transient gestures. Transcript-only and slide-text-only retrieval pipelines collapse this richness into a single channel and consequently fail on questions that rely on visual interpretation or precise temporal grounding. We introduce a manually annotated benchmark of 156 question–answer pairs across three UC Berkeley courses (cognitive neuroscience, advanced NLP, and data science), spanning 7 example categories: text, images, tables, charts, complex layouts, motion-dependent content, and audio. We then propose a visual–temporal retrieval-augmented generation (RAG) pipeline that aligns OCR text, ASR transcripts, and vision–language model frame descriptions inside fixed-length time windows with a visual carry-forward rule, embeds each multimodal chunk into a single dense vector, and retrieves it at inference time conditioned on either the full corpus or a lecture-filtered subset. On our benchmark, lecture-filtered retrieval lifts LLM-judged accuracy from 20.4% to 82.0% on DATA 100, from 32.7% to 58.8% on COGSCI C127, and from 63.0% to 83.3% on CS 288, while keeping per-question latency on the order of three seconds and outperforming direct full-video conditioning of frontier multimodal models in our evaluated setting. The dataset, pipeline, and evaluation harness are released to support reproducible work on lecture QA.


<iframe src="/files/CS_288_Final_Report__Copy_.pdf" style="width:100%; height:90vh; border:none;"></iframe>
