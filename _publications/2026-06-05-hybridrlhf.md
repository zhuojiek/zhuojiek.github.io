---
title: "Hybrid Algorithms Consistently Beat Offline RLHF Methods"
short: Hybrid RLHF
permalink: /publication/2026-06-05-hybridrlhf
date: 2026-06-05
group: course
order: 1
kind: Research project
authors: "Zhuojie Kuang, Richik Pal, Eddie Cui"
venue: "CS 185/285 (Deep RL) final project"
thumb: /images/research/rlhf-winrates.png
blurb: "6 RLHF baselines (DPO, IPO, AOT, GRPO, DrGRPO, GSPO) under one benchmark, then a hybrid built on the observation that AOT and DPO are useful at different stages of training: a scheduled AOT to DPO loss, confidence-weighted pairs, and reward-model reranking. 0.865 win rate vs. 0.763 for the best baseline."
links:
  - { name: Paper (PDF), url: "/files/CS_185_Final_Report.pdf" }
---

<figure>
  <img src="/images/research/rlhf-winrates.png" alt="Bar chart of GPT-5.4 win rate against the base model for DPO, IPO, AOT, GRPO, DrGRPO, GSPO and the Part 2 reranker.">
  <figcaption><strong>Win rate vs. the frozen base model</strong> (GPT-5.4 judge, 128 prompts, 3 seeds; dots are individual seeds). Qwen2.5-1.5B-Instruct with LoRA, on a 5k-example WildChat preference benchmark.</figcaption>
</figure>

## The setup

The 3 offline objectives (DPO, IPO, AOT) differ on 2 axes: the shape of the loss on the reference-corrected margin $$\Delta_\theta$$, and the granularity at which margins are compared.

- **DPO** is per-pair and unbounded. It pushes $$\Delta_\theta \to \infty$$ for every pair, so it fits individual labels hardest (including the wrong ones).
- **IPO** is per-pair and bounded. It regresses $$\Delta_\theta$$ to $$1/2\beta$$, so once a pair hits the target the gradient vanishes.
- **AOT** is distributional. It sorts chosen and rejected rewards within the batch and compares them at matched quantiles. This is robust to mislabeled pairs, but it stops being effective once the chosen distribution is determined.

<figure class="half">
  <img src="/images/research/rlhf-quantile-gap.png" alt="AOT quantile gap grows faster than DPO's over training.">
  <img src="/images/research/rlhf-offline-acc.png" alt="Evaluation accuracy over the first 200 steps for AOT, DPO, IPO, the hybrid, and pair-weighted DPO.">
  <figcaption>Left: AOT separates the chosen and rejected reward distributions much faster than DPO. Right: the hybrid tracks AOT early and keeps improving later.</figcaption>
</figure>

This suggests a hybrid schedule. AOT distribution-level signal is most useful early, while the policy is still far off. DPO per-pair signal is useful later, once only a few hard pairs remain. So we can anneal from one to the other:

$$\mathcal{L} = (1-\alpha_t)\,\mathcal{L}_{\text{AOT}} + \alpha_t\,\mathcal{L}_{\text{DPO}}, \qquad \alpha_t: 0 \to 1.$$

We combined it with 2 other changes. **Confidence-weighted DPO** scales each pair's loss by a weight in $$[0.7, 1.3]$$ derived from the dataset's judge confidence. **Reward-model reranking** picks the highest-scoring response from a pool of policies.

## Results

| Method | Win rate (mean ± std, 3 seeds) |
|---|---|
| DPO | 0.763 ± 0.044 |
| AOT | 0.754 ± 0.005 |
| GRPO | 0.732 ± 0.061 |
| GSPO | 0.723 ± 0.017 |
| IPO | 0.672 ± 0.029 |
| DrGRPO | 0.610 ± 0.005 |
| **Hybrid + reranking** | **0.865 ± 0.015** |

Every seed of the final pipeline beats every baseline's mean. Note that DPO and AOT have the same mean, but AOT's seed variance is almost 10× smaller. GRPO produced both the best single baseline run and one of the worst, the high variance is probably due to our 25-step online budget.
