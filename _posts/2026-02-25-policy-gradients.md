---
interactive: true
card_fit: contain
title: "Policy gradients, one variance reduction trick at a time"
description: "REINFORCE on CartPole, HalfCheetah, LunarLander, and InvertedPendulum, adding reward-to-go, advantage normalization, a learned baseline, and GAE one at a time, and watching what each one does to the learning curve."
date: 2026-02-25
permalink: /posts/policy-gradients
featured: true
image: /images/posts/policy-gradients/lunar-gae.png
context: "CS 285 · HW 2"
tags:
  - Reinforcement Learning
---

The policy gradient is one line:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\Big[\sum_{t} \nabla_\theta \log \pi_\theta(a_t \mid s_t)\; \hat A_t\Big].$$

Almost everything else in on-policy RL is a choice of $$\hat A_t$$ that trades bias for variance. The vanilla estimator is unbiased and has enormous variance. Every trick below lowers the variance, and the later ones buy that with a little bias. I implemented them one at a time and kept the plots.

## Reward-to-go: drop the rewards your action couldn't have caused

Vanilla REINFORCE weights every $$\log\pi(a_t \mid s_t)$$ by the return of the *whole* trajectory, $$\sum_{t'} r_{t'}$$. But rewards before time $$t$$ can't depend on $$a_t$$, so in expectation they contribute zero gradient. They only add noise. Dropping them gives reward-to-go, $$\hat Q_t = \sum_{t' \ge t} \gamma^{t'-t} r_{t'}$$. It is still unbiased, and each term is now a sum over fewer random rewards.

<figure class="half">
  <img src="/images/posts/policy-gradients/cartpole-small.png" alt="CartPole learning curves with batch size 1000 for vanilla, reward-to-go, normalized advantages, and both.">
  <img src="/images/posts/policy-gradients/cartpole-large.png" alt="CartPole learning curves with batch size 4000 for the same four variants.">
  <figcaption>CartPole with batch size 1000 (left) and 4000 (right). "rtg" is reward-to-go and "na" is normalized advantages.</figcaption>
</figure>

On CartPole, reward-to-go beat the trajectory-centric estimator. Normalizing advantages (subtracting the batch mean and dividing by the std) helped both: it is basically a free per-batch learning-rate adaptation and keeps the gradient scale sane. A bigger batch smoothed everything out. With 4000 steps per update, everything except vanilla REINFORCE sits at 200 almost the whole time. Note that vanilla REINFORCE with the big batch still collapses twice, at about 170k and 265k steps, and never fully recovers from the second one. A large batch doesn't fix a bad estimator, it just makes it less likely to bite.

## A learned baseline

Subtracting any function of the state leaves the gradient unbiased, since $$\mathbb{E}_{a}[\nabla \log \pi(a \mid s)\, b(s)] = 0$$.<span class="sidenote">Because $$\mathbb{E}_{a \sim \pi}[\nabla_\theta \log \pi_\theta(a \mid s)] = \nabla_\theta \sum_a \pi_\theta(a \mid s) = \nabla_\theta 1 = 0$$, and $$b(s)$$ factors out of the expectation over $$a$$.</span> The best simple choice is $$b(s) \approx V^\pi(s)$$, which turns $$\hat Q_t$$ into an advantage. I fit $$V_\phi$$ by regression on the reward-to-go and compared the default baseline (lr 0.01, 5 gradient steps per iteration) to a deliberately weak one (lr 0.001, 1 step).

<figure class="half">
  <img src="/images/posts/policy-gradients/cheetah-baseline-loss.png" alt="Value function MSE over training for default and weak baselines; the weak baseline has a large early spike.">
  <img src="/images/posts/policy-gradients/cheetah-return.png" alt="HalfCheetah eval return: default baseline highest, weak baseline in between, no baseline lowest.">
  <figcaption>HalfCheetah. Left: the weak baseline's value loss spikes to almost 500 early and takes about 150k steps to catch up. Right: no baseline < weak baseline < default baseline, in that order, for essentially the whole run.</figcaption>
</figure>

The ordering is the clean part. A value function that tracks $$V^\pi$$ poorly subtracts the wrong amount, so the advantage estimates keep more variance and the policy learns more slowly. A bad baseline is still much better than none, though.

## GAE: interpolating between Monte Carlo and TD

Once you have $$V_\phi$$ you can also bootstrap with it. Generalized advantage estimation takes an exponentially weighted average of $$n$$-step advantages:

$$\hat A_t^{\text{GAE}(\lambda)} = \sum_{l \ge 0} (\gamma\lambda)^l\, \delta_{t+l}, \qquad \delta_t = r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t).$$

At $$\lambda = 0$$ this is the one-step TD advantage $$\delta_t$$: low variance, but biased by whatever is wrong with $$V_\phi$$. At $$\lambda = 1$$ the $$V_\phi$$ terms telescope away and you get reward-to-go minus the baseline: unbiased, high variance.

<div class="demo narrow" data-demo="gae">
  <div class="demo-head"><span class="demo-title">How much GAE(λ) trusts each future TD error</span><span class="demo-tag">Interactive</span></div>
  <p class="legend"><span class="key"><i style="background:var(--s1)"></i>GAE(λ) weights</span><span class="key"><i style="background:var(--s2)"></i>λ = 1 (Monte Carlo)</span></p>
  <div class="chart-wrap"></div>
  <div class="demo-controls">
    <label>γ <input type="range" name="gamma" min="0.9" max="0.999" step="0.001" value="0.99"> <span class="val" data-out="gamma"></span></label>
    <label>λ <input type="range" name="lambda" min="0" max="1" step="0.01" value="0.95"> <span class="val" data-out="lambda"></span></label>
  </div>
  <p class="readout" data-out="readout"></p>
  <p class="demo-note">Every δ is computed from the learned critic. Shrinking λ cuts off the long, noisy tail of real rewards and leans on V instead. That trades variance for whatever bias V has. Hover a bar for its value.</p>
</div>
<script src="/js/rl-demos.js?v={{ site.time | date: '%s' }}" defer></script>

<figure class="wide">
  <img src="/images/posts/policy-gradients/lunar-gae.png" alt="LunarLander eval return for lambda in 0, 0.95, 0.98, 0.985, 0.99, 1.">
  <figcaption>LunarLander-v2 for six values of \(\lambda\).</figcaption>
</figure>

$$\lambda = 0$$ (blue) is the clear loser. It hovers around −100 to 0 for the whole run, because early on $$V_\phi$$ is garbage and $$\lambda = 0$$ trusts it completely. The intermediate values, 0.95 to 0.99, are the ones that reach +200, with $$\lambda = 0.98$$ the most stable. $$\lambda = 1$$ gets there too but is noisier. The best setting is in the middle, and it is close to 1 because LunarLander episodes are long.

## Putting it together: InvertedPendulum in 100k steps

The last task was to get InvertedPendulum to its maximum return of 1000 within 100k environment steps.

```
uv run src/scripts/run.py --env_name InvertedPendulum-v4 -n 100 \
    -b 1000 -eb 1000 -rtg -na -lr 0.02
```

<figure>
  <img src="/images/posts/policy-gradients/pendulum.png" alt="InvertedPendulum: default config stays under 300 for most of 500k steps; tuned config hits 1000 by around 40k steps but oscillates.">
  <figcaption>Default (blue) vs. tuned (orange). The tuned run first hits 1000 at about 35k steps.</figcaption>
</figure>

The biggest lever was the batch size, and the reason is just arithmetic. With the default 5000 steps per iteration, a 100k-step budget is 20 gradient updates. With 1000 it is 100 updates. Reward-to-go and advantage normalization made each of those noisier updates usable, and raising the learning rate from 0.005 to 0.02 made each one count for more.

It is not a stable policy, though. The orange curve keeps falling off 1000 and climbing back, because a large step size on a high-variance gradient eventually steps off a cliff. Nothing in vanilla policy gradient stops a single update from changing the policy too much. That is the motivation for trust regions and PPO's clipped ratio, which also show up in [GRPO](/publication/2026-06-05-hybridrlhf).
