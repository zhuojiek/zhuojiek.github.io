---
title: "A RAG system for the Berkeley EECS website, on a CPU with 4 GB of RAM"
description: "Crawling ~15K eecs.berkeley.edu pages, writing a 138-question QA set, and building a pipeline of dense retrieval, cross-encoder reranking, and Llama-3.1-8B."
date: 2026-03-19
permalink: /posts/berkeley-eecs-rag
context: "CS 288 · Assignment"
tags:
  - NLP
---

The assignment was to build a question-answering system for everything on eecs.berkeley.edu: faculty pages, awards, course listings, news, tech reports. We had to build every part ourselves, starting from scraping, and the final system had to run on a CPU with 4 GB of RAM. The questions are short and factual ("What award did Nelson Morgan receive in 2022?"), scored by exact match and F1 against a short reference answer. Teammates: Micah Mok and Meenakshi Mittal.

## The corpus

I wrote the crawler. It starts from the sitemaps, does a breadth-first crawl over `eecs.berkeley.edu` and `www2.eecs.berkeley.edu` while respecting the `robots.txt` delays, and ran for about 72 hours, ending with ~15K HTML pages. 2 choices affected retrieval quality:

- **Filtering.** To keep the corpus manageable, I kept only the 1,500 most recent (2020–2026). I also dropped listing and search-result pages, which mostly contain links to other pages and add near-duplicate noise to the index.
- **Structure.** Extracting text with ResiliParse while preserving some structural HTML tags retrieved better than plain text. Headings and lists give the embedding model context about what a block of text describes.

## The data

We wrote 138 QA pairs by sampling random pages: 65% factoid, 26% multi-hop (e.g. "the email of the professor who teaches the AI course in Lewis 100 and has a BA in Physics from Oxford"), and the rest yes/no and counting. A quarter of them are time-sensitive. 2 of us independently annotated 40 of them. Agreement was 69% under strict exact match but 91% under lenient string matching. The gap suggests exact match is too strict for this task, which also shows up in the error analysis below.

## The pipeline

1. **Dense retrieval.** Chunk with size 500 and overlap 50, embed, and search a FAISS index for the top 80 candidate chunks.
2. **Rerank** the candidates with a cross-encoder (`bge-reranker-base`), which reads the question and the chunk together.
3. **Expand** the top 5 chunks to their *full source documents* and pass those to Llama-3.1-8B-Instruct, prompted to output only a short answer.

In step 3, ranking happens on small chunks, which keeps retrieval precise, while the model sees the whole page, so it doesn't miss context outside the chunk. A chunk saying "received the award in 2022" isn't much use if the name of the award is 2 paragraphs up.

## Ablations

| Change | F1 | EM |
|---|---|---|
| Dense only, no rerank, $$k = 10$$ | 0.494 | 0.400 |
| + rewritten corpus, full-document context, rerank | **0.534** | **0.460** |
| Chunk size 2000 / overlap 200 | 0.425 | 0.350 |
| Chunk size 1000 / overlap 100, URL in the chunk header | 0.474 | 0.390 |

The best configuration scored **0.58 F1 / 0.46 EM** on the held-out test set. All of the improvements in the table came from changes to the corpus and retrieval, not the language model.

## Error analysis

Grouping the F1 = 0 errors from the best model:

- **Retrieval:** the right page never shows up ("media contact for the department").
- **Aggregation:** the right page is retrieved, but the model picks the wrong fact, e.g. naming the wrong professor for "earliest-born professor".
- **Temporal:** "January 2017" vs. "2016" for when RISELab was founded.
- **Span selection:** "510" instead of "1 (510) 642-3214".
- **Metric:** "Two." vs. "2", and "Two semesters." vs. "1 year". These are correct answers that score zero.

The last category is the easiest to fix and matches the 69% vs. 91% gap in the annotations. Normalizing number words, dates, phone numbers, and simple unit equivalences before scoring would recover these points without changing the system. After that, I'd add hybrid sparse+dense retrieval, since BM25 tends to do better than embeddings on names and course numbers.

This assignment led into our [final project](/publication/2026-05-24-lecturerag), which does retrieval over lecture videos, where the "corpus" is speech, slides, and frames.
