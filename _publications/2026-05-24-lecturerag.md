---
title: "Visual–Temporal Retrieval-Augmented Generation for Lecture Question Answering"
short: Lecture RAG
permalink: /publication/2026-05-24-lecturerag
date: 2026-05-24
group: course
order: 3
kind: Research project
authors: "Meenakshi Mittal, Micah Mok, Zhuojie Kuang"
venue: "CS 288 (Advanced NLP) final project"
thumb: /images/research/lecture-rag-pipeline.png
blurb: "Answers to lecture questions live in speech, slides, charts, and gestures. We bundle OCR, ASR, and VLM frame descriptions into time-aligned chunks and add a carry-forward rule for slides shown just before a window. On a new 156-question benchmark, lecture-filtered retrieval reaches 82% accuracy on DATA 100, up from 20% with no context, in about 3 s per question."
links:
  - { name: Paper (PDF), url: "/files/CS_288_Final_Report__Copy_.pdf" }
---

<figure class="wide">
  <img src="/images/research/lecture-rag-pipeline.png" alt="Pipeline: OCR, ASR, and VLM frame descriptions are aligned into overlapping chunks with a visual carry-forward rule, embedded into an HNSW index, retrieved, and passed with frames to a VLM generator; an optional stage renders a Manim explanation video.">
  <figcaption><strong>Pipeline.</strong> Three timestamped streams are tiled into overlapping 45 s windows.</figcaption>
</figure>

## Problem statement

Transcript-only RAG fails on lectures in a predictable way. The professor says "as you can see here", and the answer is on the slide. Slide-text-only RAG fails the other way, because the slide says "Figure 3" and the explanation is spoken. We wanted one retrieval method that combines all 3 modalities.

## Method

- **Extract** 3 natively timestamped streams: OCR on frames sampled every 2 s, ASR, and VLM descriptions of each frame. A pHash change detector re-runs OCR and the VLM only when the frame changes materially. This removes most of the redundancy in slide-driven lectures.
- **Chunk by time.** Tile each lecture into $$45$$ s windows with $$15$$ s overlap, and concatenate the three modality-tagged blocks.
- **Visual carry-forward.** A slide that appeared just before the window started is still on screen, but it contributes no OCR row to the window. So each chunk also gets the latest OCR row and frame description from before the timestep, deduplicated against the in-window content.
- **Retrieve** with one dense vector per chunk (`text-embedding-3-large`), either across the whole course or filtered to the lecture the student is watching. Then generate with a VLM given the chunks and their frames.
- **Render** the answer as a narrated `manim` video, with an agent harness to catch visual, programmatic, and semantic errors.

## Results

We hand-annotated 156 questions across COGSCI C127, DATA 100, and CS 288 in seven categories: text, images, tables, charts, complex layouts, motion, and audio. Each question has a time window marking where in the lecture the answer appears.

| Course | No context (GPT-5.4) | Global retrieval | Lecture-filtered |
|---|---|---|---|
| DATA 100 | 20.4% | — | **82.0%** |
| COGSCI C127 | 32.7% | — | **58.8%** |
| CS 288 | 63.0% | 79.6% | **83.3%** |

<p class="group-note" style="margin-top:-6px">LLM-judged accuracy, best setting per course. The full table is in the paper.</p>
