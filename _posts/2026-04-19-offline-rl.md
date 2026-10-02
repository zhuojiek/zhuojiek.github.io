---
card_fit: contain
title: "Offline RL: SAC+BC, IQL, and flow Q-learning on OGBench"
description: "Three ways to stay close to the data while maximizing return, compared on a manipulation task and a navigation task. Most of the interesting differences are in how sensitive each one is to its one knob."
date: 2026-04-19
permalink: /posts/offline-rl
featured: true
image: /images/featured.gif
context: "CS 285 · HW 5"
tags:
  - Reinforcement Learning
  - Robotics
---

[Online actor-critic](/posts/dqn-sac) already has a critic that overestimates. In offline RL that problem gets much worse. The critic is trained on a fixed dataset, so it never sees what happens after an action outside the data. If the actor maximizes Q, it goes looking for exactly those actions, because those are the ones whose values nobody has ever corrected. Nearly every offline method is some way of maximizing return *while staying close to the data*. The three I implemented differ in where they put that constraint.

| Method | How it stays close to the data | Its knob |
|---|---|---|
| **SAC+BC** | adds a behavior cloning term to the actor loss: $$-Q(s, \pi(s)) + \alpha\,\text{BC}$$ | BC weight |
| **IQL** | never queries Q at actions outside the data. $$V$$ is an expectile ($$\tau = 0.9$$) of in-data Q values, and the policy is extracted by advantage-weighted regression with weights $$e^{\alpha A(s,a)}$$ on dataset actions | AWR inverse temperature |
| **FQL** | trains a flow-matching BC policy, then distills it into a one-step policy that maximizes Q while staying close to the flow policy's outputs | distillation weight |

Tasks are from OGBench: `cube-single-play` (pick up a cube and place it at a goal; manipulation) and `antsoccer-arena-navigate` (a quadruped dribbles a ball to a goal; long-horizon locomotion). Both are single-task, 1M gradient steps.

<figure>
  <img src="/images/featured.gif" alt="Simulated arm picking and placing a cube in OGBench cube-single." style="max-width:260px">
  <figcaption>cube-single.</figcaption>
</figure>

## Results

Peak eval success read off each run's curve. These are single seeds, so treat differences of 0.1 as noise.

| | cube-single | antsoccer-navigate |
|---|---|---|
| SAC+BC | ≈1.00 ($$\alpha = 300$$) | ≈0.32 ($$\alpha = 3$$) |
| IQL | ≈0.92 ($$\alpha = 30$$) | ≈0.20 ($$\alpha = 10$$) |
| FQL | ≈1.00 ($$\alpha = 100$$) | ≈0.48 ($$\alpha = 10$$) |

Cube is close to solved by everything. Antsoccer is where they separate, and FQL is the only method that gets close to half.

<figure class="half">
  <img src="/images/posts/offline-rl/fql-cube.png" alt="FQL on cube-single: success reaches 0.84 at 100k and stays between 0.84 and 1.0.">
  <img src="/images/posts/offline-rl/fql-antsoccer.png" alt="FQL on antsoccer: success rises to about 0.44 by 300k, dips to 0.16 at 500k, peaks at 0.48 at 800k.">
  <figcaption>FQL on cube (left) and antsoccer (right).</figcaption>
</figure>

## Sensitivity is the real difference

The sweeps on cube-single were more interesting than the peak numbers.

<figure class="half">
  <img src="/images/posts/offline-rl/sacbc-cube-sweep.png" alt="SAC+BC sweep: alpha 100 and 300 reach about 1.0; alpha 1000 peaks at 0.92 then degrades to 0.6.">
  <img src="/images/posts/offline-rl/iql-cube-sweep.png" alt="IQL sweep over alpha 1, 3, 10: all three track each other between 0.6 and 1.0.">
  <figcaption>Left: SAC+BC with \(\alpha \in \{100, 300, 1000\}\). Right: IQL with \(\alpha \in \{1, 3, 10\}\).</figcaption>
</figure>

SAC+BC is sensitive. $$\alpha = 100$$ and 300 both reach about 1.0, but $$\alpha = 1000$$ peaks once at 0.92 and then sags to 0.6. Too much BC weight and the actor just imitates the play data, which wasn't collected to solve this task. Too little and the actor exploits the critic's errors. The good window is narrow, and it moved by 100× between tasks (300 on cube, 3 on antsoccer).

IQL barely cares. Across a 10× range of $$\alpha$$ the three curves stay in the same 0.6–1.0 band and cross each other repeatedly. That follows from the design. IQL only ever evaluates Q at actions that are in the dataset, so $$\alpha$$ only changes *how much it prefers* the better dataset actions. It can't push the policy anywhere the data hasn't been. The downside is the same fact viewed from the other side: IQL can't do better than reweighting the data, and on antsoccer it had the lowest ceiling.

One caveat on the left plot: the three SAC+BC runs used different seeds. With single seeds, the $$\alpha = 1000$$ collapse could be partly a seed effect. I'd want three seeds per setting before making a strong claim.

## Why FQL is the interesting one

FQL is built for a problem I ran into in [Push-T](/posts/push-t-imitation): the best BC policies are expressive generative models, like flow and diffusion heads, and those are awkward to do RL with. The likelihood is intractable, so you can't do AWR. Maximizing Q directly means backpropagating through the whole ODE solve, which is slow and unstable.

FQL<span class="sidenote">Park, Li & Levine, <em>Flow Q-Learning</em>, ICML 2025.</span> avoids both:

1. Train a flow-matching BC policy $$\mu_\beta(s, z)$$ on the dataset. It captures all the modes, and it is never trained on Q.
2. Train a separate *one-step* policy $$\mu_\omega(s, z)$$, mapping noise directly to an action, with
$$\mathcal{L}(\omega) = -Q\big(s, \mu_\omega(s, z)\big) + \alpha\,\big\lVert \mu_\omega(s, z) - \mu_\beta(s, z)\big\rVert^2 .$$

The distillation term keeps the one-step policy near the multimodal BC policy *for the same noise* $$z$$. Different noise still lands in different modes, but Q can nudge each sample toward better actions within its mode. No gradient goes through the ODE, and the RL step is as cheap as SAC+BC.

That pattern — keep a strong generative BC policy frozen, and put a small, RL-trainable thing next to it — is the same one Seohong described for VLAs in [Sergey's seminar](/posts/2026/09/26): steer the frozen VLA's noise, or learn residual edits to its actions with a small Gaussian policy and SAC. FQL is the clean offline version of that idea, and it's the reason I'm most interested in it.
