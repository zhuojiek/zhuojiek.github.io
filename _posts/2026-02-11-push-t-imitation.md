---
interactive: false
card_fit: contain
title: "Behavioral Cloning with Flow Matching Policies"
description: "Behavior cloning on Push-T with an MSE action-chunking policy and a flow matching policy. The flow policy reaches 0.82 mean reward and the MSE policy 0.67."
date: 2026-02-11
permalink: /posts/push-t-imitation
featured: true
image: /images/featured4.gif
context: ""
tags:
  - Robotics
  - Imitation learning
---

Push-T is a standard benchmark for visuomotor imitation learning. A circular agent pushes a T-shaped block into a target pose, and the policy is trained on a set of expert demonstrations. The task is simple, but it requires a policy that can represent an action distribution with more than one mode.

I trained 2 policies on the same demos with the same budget. One regresses action chunks with MSE. The other samples action chunks with flow matching. The flow policy reached a mean reward of **0.82**, and the MSE policy plateaued around **0.67**. This post aims to explain the gap.

## Setup

- **State:** $$s \in \mathbb{R}^5$$ (agent position plus block pose).
- **Action:** a chunk of 8 future 2D agent targets, $$a \in \mathbb{R}^{8 \times 2}$$.<span class="sidenote">Action chunking was popularized by ACT (Zhao et al., 2023) for bimanual manipulation.</span> Predicting chunks instead of single actions gives temporally consistent motion and fewer chances to switch between strategies at every step.
- **Training:** 400 epochs (75,600 gradient steps) for both policies, with evaluation every 10k steps.

## The MSE policy

A 3-layer MLP (256 hidden units, ReLU) maps the state to a flattened $$8 \times 2$$ chunk, trained with MSE using Adam at 3e-4 and batch size 128.

<figure class="wide">
  <img src="/images/posts/push-t/mse-curves.png" alt="MSE policy training loss falls smoothly to about 0.015; evaluation reward rises to about 0.67 at 50k steps and then fluctuates.">
  <figcaption>The loss keeps going down. The reward stops improving after about 30k steps and bounces between 0.57 and 0.67. Its best was 0.669, at step 50k.</figcaption>
</figure>

The training loss keeps decreasing, but MSE doesn't measure what we want. The minimizer of the squared error is the conditional mean:

$$\pi_{\text{MSE}}^*(s) = \arg\min_{\hat a}\; \mathbb{E}_{a \sim \pi_E(\cdot \mid s)} \lVert a - \hat a \rVert^2 = \mathbb{E}[a \mid s].$$

In Push-T the expert's action distribution is often bimodal. From the same state, the demonstrator can go around the left side of the T or the right side to get behind it. Both work, but their average sends the agent into the middle of the block or leaves it between the 2 plans. The rollouts show this: hesitant pushes and contact that slides off.

The demo below shows this in a toy 2D action space. The gray points are expert actions for a single state, split between 2 modes. On the left is where an MSE regressor ends up. On the right, noise is transported to actions by the flow-matching velocity field for this distribution.

<div class="demo" data-demo="mse-vs-flow">
  <div class="demo-head"><span class="demo-title">MSE regression vs. flow matching on a bimodal distribution</span><span class="demo-tag">Interactive</span></div>
  <p class="legend"><span class="key"><i style="background:var(--muted)"></i>expert actions</span><span class="key"><i style="background:var(--s2)"></i>MSE prediction</span><span class="key"><i style="background:var(--s1)"></i>flow samples</span></p>
  <div class="demo-grid">
    <div class="demo-panel"><span class="label">MSE regression</span><canvas data-role="mse" aria-label="Expert actions in 2 clusters and the MSE-optimal prediction between them"></canvas></div>
    <div class="demo-panel"><span class="label">Flow matching · t = <span data-out="t">0</span></span><canvas data-role="flow" aria-label="Particles flowing from Gaussian noise to the 2 clusters"></canvas></div>
  </div>
  <div class="demo-controls">
    <button type="button" data-act="play">Replay</button>
    <button type="button" class="secondary" data-act="noise">New noise</button>
    <label>t <input type="range" name="t" min="0" max="70" step="1" value="0"></label>
    <label>mode separation <input type="range" name="sep" min="0.1" max="1.6" step="0.01" value="1.1"></label>
    <label>left / right split <input type="range" name="split" min="0.1" max="0.9" step="0.01" value="0.5"></label>
  </div>
  <p class="readout" data-out="readout"></p>
  <p class="demo-note">The velocity field here is the closed-form optimum for a Gaussian mixture, so this shows what flow matching converges to, not a trained network. When the modes are close together the 2 answers agree, so MSE works for unimodal tasks.</p>
</div>
<script src="/js/flow-demo.js?v={{ site.time | date: '%s' }}" defer></script>

With a 70/30 split, the MSE prediction moves toward the larger mode but still falls between the 2. Unless the modes overlap, no single point is a good action.

The same problem came up a month later in CS 280, where I trained a one-step denoiser to map pure Gaussian noise to MNIST digits. It output the average digit, a gray blob of every class superimposed, because pure noise carries no information about which digit to produce, so $$\mathbb{E}[x \mid z] = \mathbb{E}[x]$$. [More on that in the ideal flow machines post.](/posts/flow-matching-creativity)

## The flow matching policy

Flow matching learns a velocity field $$v_\theta(a_t, t \mid s)$$ that transports Gaussian noise into the action distribution. To train it, take an expert chunk $$a_1$$ and noise $$\varepsilon$$, set $$a_t = (1-t)\,\varepsilon + t\,a_1$$ (noise at $$t = 0$$, data at $$t = 1$$), and regress

$$\mathcal{L}(\theta) = \mathbb{E}_{t,\,a_1,\,\varepsilon}\,\big\lVert v_\theta(a_t, t \mid s) - (a_1 - \varepsilon)\big\rVert^2 .$$

This is still an MSE loss, so it still learns a conditional mean. The difference is what it conditions on. The flow model regresses the mean velocity given a partially denoised $$a_t$$. Near $$t = 0$$ that mean averages over both modes, but as $$a_t$$ drifts toward one of them the conditional collapses onto that mode. The averaging happens in velocity space at each point along the path, not in action space at the end. At test time I integrate the ODE forward from $$t = 0$$ to 1 starting from fresh noise, so different noise draws commit to different modes.

<figure class="wide">
  <img src="/images/posts/push-t/flow-curves.png" alt="Flow matching policy training loss falls from about 0.87 to 0.19; evaluation reward rises steadily from 0.33 to 0.82.">
  <figcaption>The flow policy's reward keeps climbing for the whole run and ends at 0.82. Its loss floors around 0.19. That is expected: the target \(a_1 - \varepsilon\) is random given \(a_t\), so the minimum of this loss is its conditional variance, not zero, so the 2 loss curves aren't comparable.</figcaption>
</figure>

<figure>
  <img src="/images/featured4.gif" alt="Rollout of the flow matching policy pushing the T block into the green target." style="max-width:360px">
  <figcaption>A flow policy rollout. It commits to one side of the block.</figcaption>
</figure>

The rollouts match the numbers. The flow policy commits to one strategy and its pushes make clean contact. The MSE policy's pushes look tentative, consistent with averaging between strategies.

## Summary

- A decreasing training loss doesn't show whether the policy class can represent the expert. The MSE policy fit the conditional mean well, but the conditional mean is a bad action.
- Multimodal action distributions are common in manipulation (grasping from either side, going around either way, using either hand), which is a large part of why Diffusion Policy and flow-matching action heads like $$\pi_0$$'s are widely used.
- The flow head has a downside. Its likelihood is intractable, and maximizing a Q-function through it means backpropagating through an ODE solve. That is the main obstacle to doing RL on top of these policies, which I come back to in [the offline RL post](/posts/offline-rl).
