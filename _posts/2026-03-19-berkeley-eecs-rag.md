---
title: "A RAG system for the Berkeley EECS website, on a CPU with 4 GB of RAM"
description: "Crawling ~15K eecs.berkeley.edu pages, writing a 138-question QA set, and building dense retrieval → cross-encoder reranking → Llama-3.1-8B. Most of the gains came from the corpus and retrieval, not the model."
date: 2026-03-19
permalink: /posts/berkeley-eecs-rag
context: "CS 288 · Assignment"
tags:
  - NLP
---

The assignment was to build a question-answering system for everything on eecs.berkeley.edu: faculty pages, awards, course listings, news, tech reports. You had to do every part yourself, from scraping onward, and the final system had to run under a CPU-only, 4 GB RAM limit. The questions are short and factual ("What award did Nelson Morgan receive in 2022?"), scored by exact match and F1 against a short reference answer. Teammates: Micah Mok and Meenakshi Mittal.

## The corpus

I wrote the crawler. It starts from the sitemaps, does a breadth-first crawl over `eecs.berkeley.edu` and `www2.eecs.berkeley.edu` while respecting the `robots.txt` delays, and ran for about 72 hours, ending with ~15K HTML pages. Two decisions mattered:

- **What to leave out.** To keep the corpus manageable, I kept only the 1,500 most recent (2020–2026). I also dropped listing and search-result pages, which mostly contain links to other pages and add near-duplicate noise to the index.
- **Keeping a little structure.** Extracting text with ResiliParse while preserving some structural HTML tags retrieved better than plain text. Headings and list structure tell the embedding model what a block of text is *about*.

## The data

We wrote 138 QA pairs by sampling random pages: 65% factoid, 26% multi-hop (e.g. "the email of the professor who teaches the AI course in Lewis 100 and has a BA in Physics from Oxford"), and the rest yes/no and counting. A quarter of them are time-sensitive. Two of us independently annotated 40 of them. Agreement was 69% under strict exact match but 91% under lenient string matching. That gap is a warning about the metric, and it came back later.

## The pipeline

1. **Dense retrieval.** Chunk with size 500 and overlap 50, embed, and search a FAISS index for the top 80 candidate chunks.
2. **Rerank** the candidates with a cross-encoder (`bge-reranker-base`), which reads the question and the chunk together.
3. **Expand** the top 5 chunks to their *full source documents* and pass those to Llama-3.1-8B-Instruct, prompted to output only a short answer.

Step 3 is the design choice I'd keep in any RAG system. Ranking happens on small chunks, which keeps retrieval precise, but generation sees the whole page, which keeps the context complete. A chunk saying "received the award in 2022" isn't much use if the name of the award is two paragraphs up.

## What moved the numbers

| Change | F1 | EM |
|---|---|---|
| Dense only, no rerank, $$k = 10$$ | 0.494 | 0.400 |
| + rewritten corpus, full-document context, rerank | **0.534** | **0.460** |
| Chunk size 2000 / overlap 200 | 0.425 | 0.350 |
| Chunk size 1000 / overlap 100, URL in the chunk header | 0.474 | 0.390 |

The best configuration scored **0.58 F1 / 0.46 EM** on the held-out test set. Every large gain came from the corpus or the retrieval stack. None came from the language model.

## Where it fails

Grouping the F1 = 0 errors from the best model:

- **Retrieval:** the right page never shows up ("media contact for the department").
- **Aggregation:** the right page is retrieved, but the model picks the wrong fact, e.g. naming the wrong professor for "earliest-born professor".
- **Temporal:** "January 2017" vs. "2016" for when RISELab was founded.
- **Span selection:** "510" instead of "1 (510) 642-3214".
- **The metric:** "Two." vs. "2", and "Two semesters." vs. "1 year". These are correct answers that score zero.

The last category is the one I'd fix first. It's the same 69%-vs-91% gap we saw in the annotations. A normalization layer for number words, dates, phone numbers, and simple unit equivalences would recover free points without touching the system. After that, I'd add hybrid sparse+dense retrieval, since names and course numbers are exactly where BM25 beats embeddings.

This assignment led into our [final project](/publication/2026-05-24-lecturerag), which does retrieval over lecture videos, where the "corpus" is speech, slides, and frames.
