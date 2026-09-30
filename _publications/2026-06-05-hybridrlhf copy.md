---
title: "Hybrid Algorithms Consistently Beat Offline RLHF Methods"
collection: publications
category: conferences
permalink: /publication/2026-06-05-hybridrlhf
date: 2026-06-05
---

We study RLHF for open-ended instruction following on a 5k-example WildChat benchmark with Qwen2.5-1.5B-Instruct as the base model, implementing six contemporary baselines (DPO, IPO, AOT, GRPO, DrGRPO, GSPO) and a Bradley-Terry reward model. Building on the observation that DPO, IPO, and AOT optimize complementary notions of improvement, our Part 2 investigation introduces three algorithmic changes. First, a confidence-aware pair-weighting scheme that scales the DPO loss per preference pair by an estimate of label confidence, softening reliance on noisy WildChat judgments. Second, a hybrid AOT-DPO loss with a cosine schedule on the mixing coefficient α that keeps α near zero during the early noise-robust AOT-dominant phase and ramps it sharply near the end. Third, reward-model reranking over a pool of four diverse policy checkpoints. Across three random seeds the combined pipeline reaches a GPT-5.4 head-to-head win rate of 0.865 ± 0.015 against the frozen base model, an absolute improvement of 0.102 over the strongest Part 1 baseline mean, with 60.2% of the reranker's winning candidates traced to the novel objectives.


<iframe src="/files/CS_185_Final_Report.pdf" style="width:100%; height:90vh; border:none;"></iframe>
