---
interactive: false
card_fit: contain
title: "Ideal flow machines: where does a diffusion model's creativity come from?"
description: "A flow matching UNet trained on MNIST, compared against Kamb & Ganguli's analytic score machines (IS, LS, ELS, bbELS), reimplemented as velocity fields and run from the same noise."
date: 2026-03-17
permalink: /posts/flow-matching-creativity
featured: true
image: /images/posts/ideal-flow/card.png
context: ""
tags:
  - Generative models
  - Computer Vision
---

A diffusion or flow model trained perfectly on a finite dataset can only reproduce the training set: the optimal velocity field for an empirical distribution transports every noise sample onto one of the training points. Trained models do generate new samples, so their ability to generalize has to come from the ways they differ from the optimal field.

[Kamb & Ganguli (2024)](https://arxiv.org/abs/2412.20292) make this precise. They build analytic, training-free "score machines" with the inductive biases of a CNN (locality and translation equivariance) and show that they predict what a trained convolutional diffusion model generates from a given noise sample. In CS 280 we reimplemented these machines for flow matching and compared them against a UNet we trained ourselves, from identical noise.

## Part 1: one-step denoising

Before the flow model I trained a plain denoiser $$D(z) \approx x$$ on MNIST digits with noise $$\sigma = 0.5$$ added. It's a small attention UNet, trained with an L2 loss.

<figure>
  <img src="/images/posts/ideal-flow/ood-denoise.png" alt="Denoiser outputs on test digits for sigma from 0 to 1. Clean at low sigma, degrading at 0.8 and 1.0." style="max-width:420px">
  <figcaption>The \(\sigma = 0.5\) denoiser tested at \(\sigma \in \{0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0\}\), one row each. It handles less noise fine. With more noise than it was trained on, strokes break up and it starts to hallucinate texture.</figcaption>
</figure>

To make it generative in one step, I trained the same network to map pure noise $$\varepsilon \sim \mathcal{N}(0, I)$$ directly to a digit.

<figure class="wide">
  <img src="/images/posts/ideal-flow/pure-noise-e5.png" alt="Leftmost: the average MNIST training image. Right: ten one-step outputs from pure noise, all nearly identical blurry blobs matching the average.">
  <figcaption>Left: the average training image. Right: ten one-step "generations" from different noise after 5 epochs. All of them are close to the average image.</figcaption>
</figure>

The L2-optimal predictor is $$\mathbb{E}[x \mid z]$$. When $$z$$ is pure noise it carries no information about $$x$$, so $$\mathbb{E}[x \mid z] = \mathbb{E}[x]$$ and the network outputs the dataset mean, which looks like every digit superimposed. This is the same problem as the [MSE policy on Push-T](/posts/push-t-imitation). Iterative denoising avoids it by conditioning on a partially denoised $$x_t$$ and taking small steps, so each step predicts the mean of a narrower distribution.

## Part 2: flow matching

With $$x_t = (1-t)\,\varepsilon + t\,x_1$$ (noise at $$t=0$$, data at $$t=1$$), the UNet takes the time as a sinusoidal embedding and regresses the velocity $$x_1 - \varepsilon$$. Sampling is Euler integration from $$t=0$$ to 1.<span class="sidenote">I use the Lipman et al. convention throughout this post. The CS 280 starter code used the reverse, with data at $$t = 0$$, which is why the noise image in Figure 5 is titled $$x_1$$. The two differ only by $$t \mapsto 1 - t$$.</span>

<figure class="wide">
  <img src="/images/posts/ideal-flow/fm-final.png" alt="Sixteen unconditional MNIST samples after 10 epochs of flow matching training.">
  <figcaption>Unconditional samples after 10 epochs.</figcaption>
</figure>

Adding a class embedding with 10% label dropout gives classifier-free guidance, $$v = v_\varnothing + \gamma\,(v_c - v_\varnothing)$$:

<figure>
  <img src="/images/posts/ideal-flow/cfg.png" alt="Grid of class-conditional samples, four per digit 0 through 9." style="max-width:260px">
  <figcaption>Class-conditional samples with guidance scale \(\gamma = 5\), one row per digit.</figcaption>
</figure>

## Part 3: the ideal flow

For a finite training set $$\{p^{(i)}\}$$, the optimal velocity has a closed form. Given $$x_t = a_t x_1 + b_t \varepsilon$$ with $$a_t = t$$ and $$b_t = 1 - t$$, the posterior over which training point we came from is a softmax over distances:

$$w_i(x, t) \propto \exp\!\left(-\frac{\lVert x - a_t\, p^{(i)}\rVert^2}{2 b_t^2}\right), \qquad \hat x_1 = \sum_i w_i\, p^{(i)},$$

and the velocity is $$v = \mathbb{E}[x_1 - \varepsilon \mid x_t] = \frac{\hat x_1 - x}{1 - t}$$, which points toward the posterior mean with speed increasing as $$t \to 1$$. As $$t \to 1$$ the softmax also sharpens onto a single $$p^{(i)}$$, and the sample lands exactly on it. In the demo below you can click to add training points.

<div class="demo narrow" data-demo="memorize">
  <div class="demo-head"><span class="demo-title">The optimal flow on a finite dataset can only copy it</span><span class="demo-tag">Interactive</span></div>
  <p class="legend"><span class="key"><i style="background:var(--s2)"></i>training points</span><span class="key"><i style="background:var(--s1)"></i>samples</span></p>
  <div class="demo-panel"><span class="label">Ideal flow on a finite dataset (click to add points)</span><canvas aria-label="Training points as rings; particles flow from noise onto them"></canvas></div>
  <div class="demo-controls">
    <button type="button" data-act="play">Replay</button>
    <button type="button" class="secondary" data-act="clear">Clear points</button>
    <label>t <input type="range" name="t" min="0" max="70" step="1" value="0"></label>
    <label>data blur σ = <span data-out="sigma">0.00</span> <input type="range" name="sigma" min="0" max="0.4" step="0.01" value="0"></label>
  </div>
  <p class="readout" data-out="readout"></p>
  <p class="demo-note">This is the closed-form optimum, integrated with 70 Euler steps. Increasing σ replaces each point with a Gaussian, which produces new samples, but only blurred copies of training points.</p>
</div>
<script src="/js/flow-demo.js?v={{ site.time | date: '%s' }}" defer></script>

This is the **IS (ideal score)** machine. On MNIST, from our noise sample, it produces a 2 that is an exact copy of a training image. The UNet produces a different image from the same noise.

## Part 4: the machines

Kamb & Ganguli make the posterior local. Each pixel only gets to look at a $$k \times k$$ patch around itself, and the softmax runs over training **patches** instead of whole images. For pixel $$u$$, with $$x_{\Omega_u}$$ the patch around it:

$$\ell(p) = -\frac{\lVert x_{\Omega_u} - a_t\, p \rVert^2}{2 b_t^2}, \qquad \hat x_1(u) = \frac{\sum_p e^{\ell(p)}\, p_{\text{center}}}{\sum_p e^{\ell(p)}}.$$

Every pixel independently picks the training patches that best explain its neighborhood and copies their center pixel. Different pixels can copy from different images. This allows new combinations that are locally consistent with the training data but aren't copies of any one image. The four machines differ only in which patches each pixel is allowed to compare against.

| Machine | Patches | Compared against | Inductive bias |
|---|---|---|---|
| IS | the whole image | whole training images | none (memorizes) |
| LS | $$k \times k$$ | training patches **at the same location** | locality |
| ELS | $$k \times k$$ | training patches **at any location** | locality + translation equivariance |
| bbELS | $$k \times k$$ | any location, but border patches only match border patches with the same overlap | + the boundary breaks equivariance |

The patch size $$k$$ follows a schedule over time: small at low noise and large at high noise, ranging from 3 to 27 here. The reason is that a UNet's effective receptive field grows with the noise level. In the implementation, everything is a softmax-weighted average over millions of patches (10k images × 1024 positions).<span class="sidenote">For ELS, every pixel compares against all ~10M training patches at every one of the 20 steps.</span> I computed it with a streaming log-sum-exp accumulator so the full weight tensor never exists in memory. ELS is one `unfold` and a big matmul per batch of training images.

<figure class="row" style="--cols: 6">
  <div class="cell"><img src="/images/posts/ideal-flow/x1.png" alt="The shared noise sample">noise \(\varepsilon\)</div>
  <div class="cell"><img src="/images/posts/ideal-flow/unet.png" alt="UNet sample">UNet</div>
  <div class="cell"><img src="/images/posts/ideal-flow/is.png" alt="IS sample: a clean 2">IS</div>
  <div class="cell"><img src="/images/posts/ideal-flow/ls.png" alt="LS sample">LS</div>
  <div class="cell"><img src="/images/posts/ideal-flow/els.png" alt="ELS sample: disconnected stroke fragments">ELS</div>
  <div class="cell"><img src="/images/posts/ideal-flow/bbels.png" alt="bbELS sample: stroke fragments, fewer at borders">bbELS</div>
  <figcaption>Same noise sample \(\varepsilon\), 20 Euler steps, four analytic machines and the trained UNet.</figcaption>
</figure>

## Results

The results only partly matched the paper.

- **IS** copied a training image, as expected.
- **LS** gave the closest match to the UNet: a single connected stroke in roughly the right place, with the same loop at the bottom. MNIST digits are centered, so comparing only against patches at the same location is a good prior for this dataset.
- **ELS and bbELS** produced collages of plausible stroke fragments that don't form a digit. Each patch is locally reasonable, but nothing coordinates them globally. The boundary-broken version clears up the borders as intended, but the interior stays fragmented.

The paper reports strong agreement between ELS and purely convolutional UNets. My two best guesses for why mine didn't:

1. **My UNet has self-attention**, at 16×16 in the encoder and 8×8 in the bottleneck. Attention is non-local, which ELS doesn't model. A network that sees the whole image at every step doesn't need to behave like a patch-wise posterior, and LS matching best is consistent with the UNet using the global position of strokes.
2. **The scale schedule wasn't calibrated.** The paper fits $$k(t)$$ per timestep to the trained network. I used a fixed hand-written ramp. If $$k$$ is too small at high noise, each pixel commits to a local patch before there is any global structure to agree with, which would produce the fragmented samples.

The next experiment would be to retrain without attention and fit the schedule by maximizing per-step agreement with the UNet's velocity. Even with the mismatch, the main point holds: a network that perfectly fit the training objective would only reproduce training images, so generalization comes from the network's inductive biases.
