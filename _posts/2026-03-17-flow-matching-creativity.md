---
interactive: true
card_fit: contain
title: "Ideal flow machines: where does a flow model's creativity come from?"
description: "I trained a flow matching UNet on MNIST, then reimplemented Kamb & Ganguli's analytic score machines (IS, LS, ELS, bbELS) as velocity fields and ran them from the same noise. The ideal flow memorizes. Locality is what lets the trained model do anything else."
date: 2026-03-17
permalink: /posts/flow-matching-creativity
featured: true
image: /images/posts/ideal-flow/card.png
context: "CS 280 · Project"
tags:
  - Generative models
  - Computer Vision
---

Here is an uncomfortable fact about diffusion and flow models. If you train one perfectly on a finite dataset, it can only reproduce the training set. The optimal velocity field for an empirical distribution transports every noise sample onto one of the training points. Real models don't do that. They make new digits, faces, and bedrooms. So the creativity must come from the ways the network *fails* to learn the optimal field.

[Kamb & Ganguli (2024)](https://arxiv.org/abs/2412.20292) make this precise. They build analytic, training-free "score machines" with exactly the inductive biases of a CNN, locality and translation equivariance, and show that they predict what a trained convolutional diffusion model generates from a given noise sample. In CS 280 we reimplemented these machines for flow matching and compared them against a UNet we trained ourselves, from identical noise.

## Part 1: what one step of denoising can and can't do

Before the flow model I trained a plain denoiser $$D(z) \approx x$$ on MNIST digits with noise $$\sigma = 0.5$$ added. It's a small attention UNet, trained with an L2 loss.

<figure>
  <img src="/images/posts/ideal-flow/ood-denoise.png" alt="Denoiser outputs on test digits for sigma from 0 to 1. Clean at low sigma, degrading at 0.8 and 1.0." style="max-width:420px">
  <figcaption>The \(\sigma = 0.5\) denoiser tested at \(\sigma \in \{0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0\}\), one row each. It handles less noise fine. With more noise than it was trained on, strokes break up and it starts to hallucinate texture.</figcaption>
</figure>

Then the naive way to make it generative: train the same network to map *pure* noise $$\varepsilon \sim \mathcal{N}(0, I)$$ straight to a digit.

<figure class="wide">
  <img src="/images/posts/ideal-flow/pure-noise-e5.png" alt="Leftmost: the average MNIST training image. Right: ten one-step outputs from pure noise, all nearly identical blurry blobs matching the average.">
  <figcaption>Left: the average training image. Right: ten one-step "generations" from different noise after 5 epochs. They are all the average.</figcaption>
</figure>

The L2-optimal predictor is $$\mathbb{E}[x \mid z]$$. When $$z$$ is pure noise it carries no information about $$x$$, so $$\mathbb{E}[x \mid z] = \mathbb{E}[x]$$ and the network outputs the dataset mean, which is every digit superimposed. This is the same failure that makes [an MSE policy fail on Push-T](/posts/push-t-imitation). The fix is the same too: never ask for the mean of a multimodal distribution in one shot. Condition on a partially denoised $$x_t$$ that has already committed to something, and take small steps.

## Part 2: flow matching

With $$x_t = (1-t)\,x_0 + t\,\varepsilon$$ (data at $$t=0$$, noise at $$t=1$$), the UNet takes the time as a sinusoidal embedding and regresses the velocity $$\varepsilon - x_0$$. Sampling is Euler integration from $$t=1$$ to 0.

<figure class="wide">
  <img src="/images/posts/ideal-flow/fm-final.png" alt="Sixteen unconditional MNIST samples after 10 epochs of flow matching training.">
  <figcaption>Unconditional samples after 10 epochs.</figcaption>
</figure>

Adding a class embedding with 10% label dropout gives classifier-free guidance, $$v = v_\varnothing + \gamma\,(v_c - v_\varnothing)$$:

<figure>
  <img src="/images/posts/ideal-flow/cfg.png" alt="Grid of class-conditional samples, four per digit 0 through 9." style="max-width:260px">
  <figcaption>Class-conditional samples with guidance scale \(\gamma = 5\), one row per digit.</figcaption>
</figure>

## Part 3: the ideal flow, and why it memorizes

For a finite training set $$\{p^{(i)}\}$$, the optimal velocity has a closed form. Given $$x_t = a_t x_0 + b_t \varepsilon$$ with $$a_t = 1-t$$ and $$b_t = t$$, the posterior over which training point we came from is a softmax over distances:

$$w_i(x, t) \propto \exp\!\left(-\frac{\lVert x - a_t\, p^{(i)}\rVert^2}{2 b_t^2}\right), \qquad \hat x_0 = \sum_i w_i\, p^{(i)},$$

and the velocity is $$v = \frac{x - a_t \hat x_0}{b_t} - \hat x_0$$, which is $$\mathbb{E}[\varepsilon \mid x_t] - \mathbb{E}[x_0 \mid x_t]$$. As $$t \to 0$$ the softmax sharpens onto a single $$p^{(i)}$$, and the sample lands exactly on it. Click to place training points below and watch.

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
  <p class="demo-note">This is exact: the closed-form optimum, integrated with 70 Euler steps. Turning up σ replaces each point with a Gaussian. That creates new samples, but only blurred copies of training points. Real generalization has to come from somewhere else.</p>
</div>
<script src="/js/flow-demo.js" defer></script>

That is the **IS (ideal score)** machine. On MNIST, starting from our noise sample $$x_1$$, it produces a crisp 2 that is literally a training image. Our UNet, from the same noise, produces something else.

## Part 4: the machines

Kamb & Ganguli's idea is to make the posterior *local*. Each pixel only gets to look at a $$k \times k$$ patch around itself, and the softmax runs over training **patches** instead of whole images. For pixel $$u$$, with $$x_{\Omega_u}$$ the patch around it:

$$\ell(p) = -\frac{\lVert x_{\Omega_u} - a_t\, p \rVert^2}{2 b_t^2}, \qquad \hat x_0(u) = \frac{\sum_p e^{\ell(p)}\, p_{\text{center}}}{\sum_p e^{\ell(p)}}.$$

Every pixel independently picks the training patches that best explain its neighborhood and copies their center pixel. Different pixels can copy from different images. That is how you get novel combinations: locally consistent, globally new. The four machines differ only in which patches each pixel is allowed to compare against.

| Machine | Patches | Compared against | Inductive bias |
|---|---|---|---|
| IS | the whole image | whole training images | none (memorizes) |
| LS | $$k \times k$$ | training patches **at the same location** | locality |
| ELS | $$k \times k$$ | training patches **at any location** | locality + translation equivariance |
| bbELS | $$k \times k$$ | any location, but border patches only match border patches with the same overlap | + the boundary breaks equivariance |

The patch size $$k$$ follows a schedule over time: small at low noise and large at high noise, ranging from 3 to 27 here. The reason is that a UNet's effective receptive field grows with the noise level. Implementation-wise, everything is a softmax-weighted average over millions of patches (10k images × 1024 positions).<span class="sidenote">For ELS, every pixel compares against all ~10M training patches at every one of the 20 steps. Hence the streaming accumulator.</span> I computed it with a streaming log-sum-exp accumulator so the full weight tensor never exists in memory. ELS is one `unfold` and a big matmul per batch of training images.

<figure class="row" style="--cols: 6">
  <div class="cell"><img src="/images/posts/ideal-flow/x1.png" alt="The shared noise sample">noise \(x_1\)</div>
  <div class="cell"><img src="/images/posts/ideal-flow/unet.png" alt="UNet sample">UNet</div>
  <div class="cell"><img src="/images/posts/ideal-flow/is.png" alt="IS sample: a clean 2">IS</div>
  <div class="cell"><img src="/images/posts/ideal-flow/ls.png" alt="LS sample">LS</div>
  <div class="cell"><img src="/images/posts/ideal-flow/els.png" alt="ELS sample: disconnected stroke fragments">ELS</div>
  <div class="cell"><img src="/images/posts/ideal-flow/bbels.png" alt="bbELS sample: stroke fragments, fewer at borders">bbELS</div>
  <figcaption>Same noise \(x_1\), 20 Euler steps, four analytic machines and the trained UNet.</figcaption>
</figure>

## What I actually got

The results were mixed, and I think the mismatch is more informative than a clean match would have been.

- **IS** copied a training image, as it must.
- **LS** gave the closest match to the UNet: a single connected stroke in roughly the right place, with the same loop at the bottom. MNIST digits are centered, so "only compare to patches at the same location" is a very strong and correct prior here.
- **ELS and bbELS** produced collages of plausible stroke fragments that don't form a digit. Each patch is locally reasonable, but nothing coordinates them globally. The boundary-broken version clears up the borders as intended, but the interior stays fragmented.

The paper reports strong agreement between ELS and purely convolutional UNets. My two best guesses for why mine didn't:

1. **My UNet has self-attention**, at 16×16 in the encoder and 8×8 in the bottleneck. Attention is exactly the non-local mechanism ELS leaves out. A model that can see the whole image at every step has no reason to behave like a patch-wise posterior, and LS winning is consistent with that. The UNet appears to be using the global position of strokes.
2. **The scale schedule wasn't calibrated.** The paper fits $$k(t)$$ per timestep to the trained network. I used a fixed hand-written ramp. If $$k$$ is too small at high noise, each pixel commits to a local patch before there is any global structure to agree with, which gives exactly the fragmented look.

The clean experiment would be to retrain without attention and fit the schedule by maximizing per-step agreement with the UNet's velocity. That's next on the list. Still, the picture is clear enough to change how I think about these models: **the inductive biases are the generalization**. A network that perfectly fit the training objective would be a lookup table. What we call creativity is a structured way of failing to fit it.
