---
title: "Projects"
permalink: /projects/
description: "A list of some things I've built. Code for course projects is private for academic integrity purposes, but can be provided upon request."
---

<div class="projects" markdown="1">

## Robot learning & RL

<div class="project" id="lace-and-place" markdown="1">
### Lace & Place: autonomous shoe sorting <span class="plinks">[site](https://ziwon-z1.github.io/106A_website/) · [code](https://github.com/shimamooo/106a-final-project)</span>
- A UR7e arm that takes a pile of shoes and sorts them on a rack, built with ROS 2
- GroundingDINO + SAM to detect and segment the shoes, overlap depth using projective geometry, then compute class-specific grippable points from point clouds
</div>

<div class="project" markdown="1">
### Push-T imitation learning <span class="plinks">[write-up](/posts/push-t-imitation)</span>
- MSE and flow-matching action-chunking policies trained on expert demos
<img src="/images/featured4.gif" alt="Flow matching policy pushing the T block" width="240" loading="lazy">
</div>

<div class="project" markdown="1">
### Offline RL with flow policies <span class="plinks">[write-up](/posts/offline-rl)</span>
- SAC+BC, IQL, and flow Q-learning on OGBench manipulation and navigation
<img src="/images/featured.gif" alt="OGBench cube task" width="200" loading="lazy">
</div>

<div class="project" markdown="1">
### DQN and soft actor-critic <span class="plinks">[write-up](/posts/dqn-sac)</span>
- DQN on CartPole, LunarLander, and MsPacman from pixels, SAC with auto-tuned temperature and clipped double-Q on HalfCheetah and Hopper
<img src="/images/featured2.gif" alt="DQN playing MsPacman" width="200" loading="lazy">
</div>

<div class="project" markdown="1">
### Policy gradients <span class="plinks">[write-up](/posts/policy-gradients)</span>
- REINFORCE with reward-to-go, learned baseline, and GAE on CartPole, HalfCheetah, and LunarLander
<img src="/images/featured3.gif" alt="HalfCheetah policy" width="340" loading="lazy">
</div>

<div class="project" markdown="1">
### LLM RL with GRPO
- GRPO and REINFORCE for LLM post-training on MATH with verifiable rewards; ablations over PPO epochs, KL coefficient, and clipping
</div>

## Generative models & vision

<div class="project" markdown="1">
### Ideal flow machines <span class="plinks">[write-up](/posts/flow-matching-creativity)</span>
- Built a UNet backbone, then trained one-step denoisers, time-conditioned flow matching, and class-conditioned flow matching with CFG on MNIST
- Reimplemented the IS, LS, ELS, and bbELS analytic score machines from [Kamb & Ganguli](https://arxiv.org/abs/2412.20292) and ran them against the trained UNet
<img src="/images/ideal_flow_machine.png" alt="Analytic machine outputs vs UNet" width="520" loading="lazy">
</div>

<div class="project" markdown="1">
### Diffusion and flow matching <span class="plinks">[write-up](/posts/diffusion-flow-matching)</span>
- Sampling loops, classifier-free guidance, SDEdit, visual anagrams, and hybrid images with DeepFloyd IF. Trained a class-conditional flow-matching UNet on MNIST
<img src="/images/projects/diffusion-flow-matching.png" alt="Diffusion results" width="520" loading="lazy">
</div>

<div class="project" markdown="1">
### NeRF from scratch <span class="plinks">[write-up](/posts/nerf)</span>
- Calibrated my camera with ArUco markers, solved for poses, and trained a NeRF on 40 photos of an object: ray sampling, positional encoding, volume rendering, and novel views visualized in `viser`
<video src="/images/projects/nerf.mp4" width="280" autoplay loop muted playsinline></video>
</div>

<div class="project" markdown="1">
### Facial keypoint detection <span class="plinks">[write-up](/posts/facial-keypoint-detection)</span>
- 68 landmarks predicted three ways: CNN coordinate regression, ResNet-18 / DINOv2 transfer, and U-Net Gaussian heatmaps
<img src="/images/facialkeypoint.png" alt="Facial keypoint predictions" width="520" loading="lazy">
</div>

<div class="project" markdown="1">
### Classical vision: mosaics, filters, Prokudin-Gorskii <span class="plinks">[mosaics](/posts/autostitching-photo-mosaics) · [filters](/posts/filters-and-frequencies) · [colorizing](/posts/prokudin-gorskii)</span>
- Automatic panorama stitching (Harris corners, ANMS, RANSAC homographies, Laplacian blending), hybrid images and multiresolution blending, and pyramid alignment of glass-plate color exposures
<img src="/images/projects/oraple.jpg" alt="Apple-orange blend" width="260" loading="lazy">
</div>

## Language models

<div class="project" markdown="1">
### Llama 3 from scratch
- BPE tokenizer trained on TinyStories and transformer architecture: RMSNorm, SwiGLU, RoPE, masked MHA, with FLOPs and memory accounting
- Training utilities (stable cross-entropy, gradient clipping, warmup + LR schedule), pretraining on TinyStories, then a classification head for QA compared against few-shot prompting
</div>

<div class="project" markdown="1">
### Berkeley EECS RAG <span class="plinks">[write-up](/posts/berkeley-eecs-rag)</span>
- Crawled ~15K eecs.berkeley.edu pages and wrote a 138-question QA set (91% IAA), implemented dense retrieval, cross-encoder rerank, full-document context to Llama-3.1-8B on CPU with 4 GB RAM constraint
</div>

<div class="project" markdown="1">
### Chatbot Arena
- Explored the LMArena battle data with `plotly` and `gradio`, identified stylistic confounders, and rebuilt the leaderboard with a Bradley–Terry model
<img src="/images/projects/chatbot-arena.png" alt="Arena analysis" width="420" loading="lazy">
</div>

<div class="project" markdown="1">
### Smaller NLP projects
- **CLIP retrieval and captioning** on Concadia, with Rational Speech Acts (literal listener, pragmatic speaker and listener) to choose the least ambiguous caption
- **Text2SQL:** fine-tuned GPT-2 to write executable SQL and compared it with few-shot prompting
- **MCQ fine-tuning:** Qwen2.5-0.5B-Instruct with `trl` on CS 189 multiple-choice questions (45%)
- **Tokenization and embeddings:** BPE, Zipf's law, skip-gram with negative sampling, and a learned linear map between two languages' embedding spaces for translation
- **Evaluation:** PR curves, Levenshtein distance, BLEU, and LLM-as-a-judge on classification, translation, and open-ended generation
</div>

## Building things

<div class="project" id="viso" markdown="1">
### Viso <span class="plinks">[code](https://github.com/orgs/viso-study/repositories) · [manim-voiceover-plus](https://github.com/shimamooo/manim-voiceover-plus)</span>
- Turns math questions into animated explanations with multi-agent pipeline: `smolagents` RAG research agent, planning agents, and a Manim rendering agent with tool calling
- Won Most Technical Project at AdventureX and placed in the top 20 at the amber.ac hackathon
- Published `manim-voiceover-plus` on PyPI for multilingual, parallelized voiceover generation
</div>

<div class="project" markdown="1">
### AI Entrepreneurs at Berkeley <span class="plinks">[site](https://aientrepreneurs.org) · [code](https://github.com/AIEntrepreneursBerkeley/aientrepreneurs.org)</span>
- Founding member of a $40M student-run AI incubator; also built and maintain the website
</div>

## Smaller course projects

<ul class="compact">
  <li>DNABERT-6 species classification (human / dog / chimp) with k-mer tokenization</li>
  <li>ConvNeXt on UrbanSound8K spectrograms</li>
  <li>ResNet-18 from scratch</li>
  <li>Autodiff engine: computation graph, topo sort, SGD / momentum / Adam</li>
  <li>Fashion-MNIST classifier robust to shifts, rotations, and blur</li>
  <li>Fully connected MNIST classifier in RISC-V assembly</li>
  <li>2-stage pipelined RISC-V CPU in Logisim</li>
</ul>

</div>
