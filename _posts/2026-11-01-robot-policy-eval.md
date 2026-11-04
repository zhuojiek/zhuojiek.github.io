---
title: "How should we evaluate generalist (and agentic) robot policies?"
description: ""
date: 2026-11-01
permalink: /posts/robot-policy-eval
interactive: true
tags:
  - Robotics
  - Agents
---

Last Friday, [Karl Pertsch](https://kpertsch.github.io) gave a lecture on generalist policy eval for the VLA seminar. Sergey's introduction summed up the problem: every paper we read this semester was the best at something, according to an eval. *But what makes an eval good?* Inspired by the lecture, this post walks through some questions: why evaluating robot policies is hard, the 3 standard approaches (**Approaches 1–3**) and their limitations, and 2 newer approaches (**Approaches 4–5**) that are better suited to generalist policies. I end with my own thoughts on what this means for evaluating agentic robot systems like [RAX](/publication/2026-10-25-rax-xarm), which I've been working on.


## Why robot evaluation is hard

Every research field runs the same loop: have an idea, implement it, measure whether it worked. The measurement step is what lets you hill-climb, since a policy rarely works on the first try and you need to detect small improvements. In robotics that step is especially painful, because the policy acts in the physical world and the physical world can't be reproduced exactly.

Consider everything that can differ between two evaluation runs of the same policy on the same task: the background, the camera angle (someone bumps the camera after a week of evals, forcing recalibration), the lighting, the initial placement of objects, the table height, the software running on the robot. Even network latency matters: if the policy is served from the cloud, a slower connection makes it less reactive and its success rate plummets.

What makes these factors dangerous is that they are *silent*. None of them throws an error. They just shift the score a little, which is the hardest kind of regression to catch. And the problem compounds as policies become more general: instead of one task in one scene, we now need to evaluate many tasks, in many environments, over longer horizons, in richer scenes, and each of those makes control harder.

Broadly, the community has tried 5 approaches, numbered here in the order this post covers them. Figure 1 places them on 2 axes: how reproducible and scalable an evaluation is, and how realistic and general it is.

<figure>
<svg viewBox="0 0 640 360" role="img" aria-label="Schematic map of robot evaluation approaches by reproducibility and realism" style="width:100%;max-width:640px;height:auto">
  <line x1="60" y1="320" x2="620" y2="320" style="stroke:var(--ink)" stroke-width="1.5"/>
  <line x1="60" y1="320" x2="60" y2="20" style="stroke:var(--ink)" stroke-width="1.5"/>
  <text x="340" y="350" text-anchor="middle" font-size="13" style="fill:var(--ink)">realism and generality of what is tested →</text>
  <text x="22" y="170" text-anchor="middle" font-size="13" transform="rotate(-90 22 170)" style="fill:var(--ink)">reproducibility and scale →</text>
  <circle cx="470" cy="270" r="9" style="fill:var(--muted)"/>
  <text x="484" y="266" font-size="13" style="fill:var(--ink)">1 · Bespoke lab evals</text>
  <text x="484" y="282" font-size="11" style="fill:var(--muted)">realistic, not reproducible</text>
  <circle cx="230" cy="200" r="9" style="fill:var(--muted)"/>
  <text x="244" y="196" font-size="13" style="fill:var(--ink)">2 · Standardized real benchmarks</text>
  <text x="244" y="212" font-size="11" style="fill:var(--muted)">control by removing variety</text>
  <circle cx="120" cy="50" r="9" style="fill:var(--muted)"/>
  <text x="134" y="46" font-size="13" style="fill:var(--ink)">3 · Sim benchmarks (LIBERO, …)</text>
  <text x="134" y="62" font-size="11" style="fill:var(--muted)">perfectly reproducible, narrow, saturated</text>
  <circle cx="380" cy="80" r="10" style="fill:var(--s1)"/>
  <text x="394" y="76" font-size="13" font-weight="700" style="fill:var(--ink)">4 · Real2Sim</text>
  <text x="394" y="92" font-size="11" style="fill:var(--muted)">train on real, test in sim</text>
  <circle cx="545" cy="170" r="10" style="fill:var(--s2)"/>
  <text x="530" y="150" font-size="13" font-weight="700" text-anchor="end" style="fill:var(--ink)">5 · Distributed real</text>
  <text x="530" y="134" font-size="11" text-anchor="end" style="fill:var(--muted)">pairwise, across many labs</text>
</svg>
<figcaption>A map of the approaches discussed below. The 3 older approaches (1–3) trade off reproducibility/scale and realism/generality; the 2 newer ones (4–5), in color, try to get both.</figcaption>
</figure>

## Approach 1: Bespoke lab evaluations

The default, then and now, is that each lab evaluates on its own setup. You choose tasks that highlight the behavior your method is good at, re-implement a baseline, run both, and tweak it a little until your method wins most of the time. Karl was upfront that his own papers do this too. The issue isn't bad faith; it's that nobody else can recreate your exact scene and lighting, and often you can't either a month later.

## Approach 2: Standardized real-world benchmarks

One response to Approach 1 is to standardize the real world. Benchmarks of this kind come with a manual: 3D-printable objects or a shopping list of exact items, a prescribed robot and software stack, fixed camera positions, sometimes even lights mounted around the robot. Each hard-to-control factor gets standardized one by one.

The cost is realism. To control the background, you put up a green screen or a cardboard box; to control objects, you use printed or manufactured ones; to control everything, you keep the number of tasks small. Doing well in such a clean, artificial setup says little about how a policy behaves next to a cluttered kitchen counter, even if you never trained on the benchmark's data.

## Approach 3: Simulation benchmarks

The other response is to give up on the real world and move to simulation: benchmarks like [LIBERO](https://libero-project.github.io) and [RoboCasa](https://robocasa.ai) ship a simulator, tasks, scoring criteria, and usually a training dataset. Simulation removes every problem from Approaches 1 and 2. You can reset the state exactly, freeze time while the policy computes its next action, and nothing about lighting or software ever drifts. The result is perfectly reproducible.

But 3 issues arise:

- **Fidelity and breadth.** Scenes tend to be visually crude and the task count is small, so these benchmarks barely test generalization.
- **The shipped data is artificial.** Datasets are often generated by scripts rather than collected by people, and they look nothing like real teleoperation data. Training on the data that these sim benchmarks give can lead to different conclusions than training on real data; Seohong Park's [blog post](https://seohong.me/blog/behavioral-cloning-mystery/) digs into this.
- **Saturation.** Every published LIBERO result from the past year sits above 95%, most above 98%, i.e. these benchmarks are easy to overfit.

Newer sim evals such as [RoboLab](https://arxiv.org/abs/2604.09860) and [MolmoSpaces](https://allenai.org/blog/molmospaces) look much better and not saturated yet, however.

Basically, these standard sim benchmarks are often a poor indicator of how good a model really is. A better recipe is to **train on real data**, as we want to anyway, and use a simulator only for **evaluation**, after checking that its signal is trustworthy, which brings us to Approach 4.

## Approach 4: Real2Sim evaluation

In Real2Sim evaluation, you train a generalist policy on a large real-robot dataset, exactly as you would for deployment, and only the evaluation runs in simulation. You keep the scalability and reproducibility of sim while still testing the policy you actually care about, rather than a proxy fine-tuned on a toy dataset. The question is whether the sim's verdict matches reality.

### What does "matches reality" mean?

Suppose we have a set of policies, and we have already have a good idea of their true success rates (gold rankings), either through exploration or some established real benchmarks. We then score the same policies in our simulator and compare. We care about how indicative a sim eval is to actual real performance, and thus we can measure these 2 stats:

- **Correlation** between real and sim scores. High correlation means the sim is a good quantitative proxy.
- **Ranking error.** Often we don't need the sim to predict the exact success rate. We need it to tell us *which policy is better*, because that's the decision research is made of. e.g. A sim where every policy scores 20 points lower than in real is perfectly usable if it orders them correctly.

Karl described a ranking-error metric from earlier sim-eval work, which the [SIMPLER](https://simpler-env.github.io) paper calls *mean maximum rank violation* (MMRV). Take every pair of policies the sim orders the wrong way round, and weight that mistake by how far apart the two policies really are. For each policy keep its worst mistake, then average over policies:

$$\text{MMRV} = \frac{1}{N}\sum_{i=1}^{N} \max_{j} \; |R_i - R_j| \cdot \mathbb{1}\big[(R_i - R_j)(S_i - S_j) < 0\big],$$

where $$R_i$$ and $$S_i$$ are policy $$i$$'s real and sim success rates.

### PolaRiS: Approach 4 in practice

[PolaRiS](https://polaris-evals.github.io) paper from earlier this year tested this idea end to end. Figure 2 shows the pipeline.

<figure>
<svg viewBox="0 0 680 250" role="img" aria-label="Real-to-sim evaluation pipeline used in PolaRiS" style="width:100%;max-width:680px;height:auto">
  <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/></marker></defs>
  <g font-size="12" style="fill:var(--ink)">
    <rect x="10" y="20" width="150" height="50" rx="4" style="fill:var(--paper-2);stroke:var(--rule-strong)"/>
    <text x="85" y="41" text-anchor="middle">phone video</text><text x="85" y="58" text-anchor="middle">of the real scene</text>
    <rect x="10" y="110" width="150" height="50" rx="4" style="fill:var(--paper-2);stroke:var(--rule-strong)"/>
    <text x="85" y="131" text-anchor="middle">multi-view photos</text><text x="85" y="148" text-anchor="middle">of each object</text>
    <rect x="200" y="20" width="150" height="50" rx="4" style="fill:var(--paper-2);stroke:var(--rule-strong)"/>
    <text x="275" y="41" text-anchor="middle">NeRF / Gaussian</text><text x="275" y="58" text-anchor="middle">splat background</text>
    <rect x="200" y="110" width="150" height="50" rx="4" style="fill:var(--paper-2);stroke:var(--rule-strong)"/>
    <text x="275" y="131" text-anchor="middle">image-to-3D model:</text><text x="275" y="148" text-anchor="middle">textured meshes</text>
    <rect x="390" y="65" width="120" height="50" rx="4" style="fill:var(--paper-2);stroke:var(--s1)" stroke-width="2"/>
    <text x="450" y="86" text-anchor="middle">assemble in</text><text x="450" y="103" text-anchor="middle">simulator</text>
    <rect x="550" y="65" width="120" height="50" rx="4" style="fill:var(--paper-2);stroke:var(--s1)" stroke-width="2"/>
    <text x="610" y="86" text-anchor="middle">roll out policy</text><text x="610" y="103" text-anchor="middle">trained on DROID</text>
    <rect x="390" y="185" width="280" height="50" rx="4" style="fill:none;stroke:var(--s2)" stroke-dasharray="5 4" stroke-width="1.5"/>
    <text x="530" y="206" text-anchor="middle">compare with real-world scores:</text><text x="530" y="223" text-anchor="middle">correlation and ranking error</text>
  </g>
  <g style="stroke:var(--muted)" stroke-width="1.5" fill="none" marker-end="url(#arr)">
    <path d="M160 45 H196"/><path d="M160 135 H196"/>
    <path d="M350 45 C 370 45, 370 80, 386 85"/><path d="M350 135 C 370 135, 370 100, 386 95"/>
    <path d="M510 90 H546"/><path d="M610 115 V181"/>
  </g>
</svg>
<figcaption>The PolaRiS pipeline. A real evaluation scene is scanned in two parts, background and objects, rebuilt in a simulator, and the sim scores of real-trained policies are checked against their real-world scores. This works well for scenes of rigid objects.</figcaption>
</figure>

**Building the environments.** At the time, the best tools were neural scene reconstruction. You film the space with a phone and reconstruct the background with an off-the-shelf NeRF or Gaussian-splatting pipeline. You photograph each object you want to interact with from several views, and an image-to-3D model turns those photos into a textured mesh. Then you put the pieces back together in the simulator.

**The policies.** They evaluated several VLA variants (different backbones, pretraining data, discrete versus continuous action prediction), all trained on the [DROID](https://droid-dataset.github.io) dataset. DROID was collected by volunteers over two years, including in their own homes, so it has a lot of variety in viewpoints and backgrounds. That variety is what lets a DROID policy run zero-shot in an unseen environment on an unseen task, and it's the opposite of a LIBERO-style dataset, which has essentially none.

### Where this is heading

2 trends should make Approach 4 easier. First, building sim environments is getting much cheaper: agents like Astra can now go from a photo or video of a real scene to a simulated version by generating assets and composing them, without neural reconstruction, see RoboSimStudio or Moonlake. Second, policies trained on more data have more robust visual features. I expect both of these factors to contribute to better performance: simulators with fewer artifacts and models less bothered by them, until real-trained models can be evaluated off the shelf in sim with no co-training step.

### Is Real2Sim enough?

Probably not, at least for now. The tasks we can simulate with acceptable accuracy today are mostly rigid-object and articulated-object tasks. Deformables, cloth, liquids, and contact-rich physics remain hard, and those are exactly the tasks where generalist policies are supposed to shine; laundry folding is the obvious example. Better generative models may close this gap, but today sim alone won't give us a general evaluation of the policies we want to train. Real-world evaluation is still necessary, so the question becomes how to make it reliable without falling back on Approaches 1 or 2.

## Approach 5: Distributed real-world evaluation

The idea behind [RoboArena](https://robo-arena.github.io) is to stop trying to make every environment identical over time, as Approach 2 does, and instead make each comparison fair.

**Standardize pairwise, not globally.** Arena style means 2 policies run back to back on the same task (roughly within, say 5 minutes), in the same scene, and the human evaluator doesn't know which is which. If both rollouts happen within roughly 5 minutes under nearly identical conditions, that single comparison is probably fair. All the silent regressions from the beginning of this post (lighting, camera bumps, latency) affect both policies relatively equally within a pair.

**Aggregate pairs into a ranking.** Many local comparisons are combined into one global ranking, as [LMArena](https://lmarena.ai) does for language models. Under the Bradley–Terry model, each policy $$i$$ has a latent strength $$\theta_i$$, and

$$P(i \text{ beats } j) = \frac{e^{\theta_i}}{e^{\theta_i} + e^{\theta_j}}.$$

Fitting the $$\theta$$'s to the observed outcomes gives the leaderboard (Elo ratings are an online approximation of the same model). Because matches can be chosen, you can preferentially pair policies of similar strength, which are the most informative comparisons. The simulation below shows a ranking emerging from noisy matches.

<div class="demo narrow" data-demo="arena">
  <div class="demo-head"><span class="demo-title">Recovering a ranking from noisy pairwise preferences</span></div>
  <p class="legend"><span class="key"><i style="background:transparent;box-shadow:inset 0 0 0 2px var(--s2)"></i>true strength (hidden)</span><span class="key"><i style="background:var(--s1)"></i>Bradley–Terry estimate</span></p>
  <div class="chart-wrap"></div>
  <div class="demo-controls">
    <button type="button" data-run="10">Run 10 matches</button>
    <button type="button" data-run="100">Run 100 matches</button>
    <button type="button" data-reset>Reset</button>
    <label><input type="checkbox" name="similar" checked> pair policies of similar estimated strength</label>
  </div>
  <p class="readout" data-out="readout"></p>
  <p class="demo-note">Simulated, not RoboArena data. Each match samples a winner from the Bradley–Terry probability above, using the hidden strengths.</p>
</div>

A few more advantages of the Arena approach:

- **Richer signal than success/failure.** Evaluators can leave free-text notes ("slow", "struggles with deformables", "great recovery"), which build up into a qualitative profile of each policy that a success rate from binary labels can't give you.
- **Evaluators steer toward the frontier.** When you ask people to tell two policies apart, they get creative and design tasks that tease out the differences. The evaluation distribution then drifts toward wherever the models actually differ, instead of staying on tasks every model already solves.
- **Variety is embraced, not removed.** Different labs, scenes, embodiments, and tasks are all welcome; the pairwise design absorbs the variation instead of fighting it.

**Incentives are the hard part.** Who runs all these evaluations? Maybe if you want your policy to be evaluated, you must evaluate 20 others. For a group building generalist policies this is actually the rational choice, because evaluating only in your own environment can't tell you whether your policy generalizes. On the LLM side, LMArena has the incentive of early access to frontier models, so maybe that's something that can also be replicated.

## Thoughts: evaluation for agentic robotics

Most of this lecture assumed the thing being evaluated is an end-to-end policy, like VLAs and WAMs. A growing share of robotics work, including ENPIRE and RAX, looks different: code-as-policy and agentic systems where a model writes, runs, and revises programs that call perception and control tools. I've been thinking about what a rigorous, real-world, cross-embodiment evaluation for those systems would look like. My current view is that the most rigorous version eventually resembles the arena mentioned above: a leaderboard built from pairwise human preferences, for the three reasons above. As explained above, it sidesteps most reproducibility problems, supports variety across scenes, embodiments, and tasks, and captures qualitative information.

The open problems I see for an agentic arena:

- **Integration.** An arena for end-to-end policies needs one interface: observations in, actions out. Agentic frameworks each have their own tools, prompts, and control loops, so the platform has to integrate each one natively, and a poor integration silently degrades the system being evaluated. It's the same silent-regression problem as before, moved into software.
- **Remote inference and latency.** Distributed evaluation means policies are served remotely, and latency is one of the silent factors that started this post. Agentic systems that call large models in the loop are even more latency-sensitive.
- **Throughput.** Real-world evaluations need to run fast enough to be practical.
- **Incentives.** The trading model seems right: if you want your system evaluated, you contribute evaluations back.

Axes such an evaluation could deliberately vary, rather than control, include latency, lighting, background, camera placement, and the number of camera views.

<script src="/js/eval-demos.js?v={{ site.time | date: '%s' }}" defer></script>
