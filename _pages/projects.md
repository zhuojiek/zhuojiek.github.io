---
layout: archive
title: "Projects"
permalink: /projects/
author_profile: true
---

**Ideal flow machines** \| [Website](../posts/flow-matching-creativity) \| [Code](https://thinfi.com/0lbj3)
- Built attention UNet from scratch and trained one-step denoisers, time-conditioned flow matching, and class-conditioned flow matching with classifier-free guidance on MNIST
- Reimplemented IS, LS, ELS, and bbELS analytic score machines from [Kamb & Ganguli](https://arxiv.org/abs/2412.20292) and compared their outputs against the trained UNet from identical starting noise

**Llama 3 from scratch** \| [Code](https://thinfi.com/0lbj3)
- Implemented BPE tokenizer trained on TinyStories and a transformer from scratch in PyTorch: RMSNorm, SwiGLU, RoPE, masked MHA, plus FLOPs and memory accounting
- Wrote training utilities (stable cross entropy, gradient clipping, warmup + LR schedule), pretrained on TinyStories, then finetuned a classification head for QA and compared against few-shot prompting

**Offline RL with flow policies** \| [Website](../posts/offline-rl) \| [Code](https://thinfi.com/0lbj3)
- Implemented SAC+BC, IQL, and flow Q-learning on OGBench manipulation and navigation tasks
- Tuned BC coefficients, found SAC+BC much more sensitive to them than IQL

**LLM RL with GRPO** \| [Code](https://thinfi.com/0lbj3)
- Implemented GRPO and REINFORCE for LLM post-training on MATH with verifiable rewards
- Ablated PPO epochs, KL coefficient, and clipping

**Berkeley EECS RAG** \| [Website](../posts/berkeley-eecs-rag) \| [Code](https://thinfi.com/0lbj3)
- Crawled ~15K eecs.berkeley.edu pages into a retrieval corpus with ResiliParse, sourced and annotated a 138-question QA validation set with 91% IAA
- 3 stage pipeline: dense retrieval over FAISS, `bge-reranker-base` reranking, full-document context to Llama-3.1-8B, under CPU-only, 4GB RAM constraints
- Best config reached 0.58 F1 and 0.46 EM on final test set

**Lace & Place: autonomous shoe sorting** \| [Website](https://ziwon-z1.github.io/106A_website/) \| [Repo](https://github.com/shimamooo/106a-final-project)
- UR7e arm that sorts a pile of shoes onto a rack with ROS 2 and MoveIt 2
- GroundingDINO + SAM to detect and segment shoes, class-specific grasps from RealSense point clouds

**DQN and soft actor-critic** \| [Website](../posts/dqn-sac) \| [Code](https://thinfi.com/0lbj3)
- Implemented double DQN on CartPole, LunarLander, and MsPacman from pixels
- Implemented SAC with auto-tuned temperature and clipped double-Q on HalfCheetah and Hopper

**Policy gradients** \| [Website](../posts/policy-gradients) \| [Code](https://thinfi.com/0lbj3)
- Implemented REINFORCE with reward-to-go, value baseline, and GAE on CartPole, HalfCheetah, and LunarLander
- Tuned InvertedPendulum to reach max return within 100K env steps

**Facial keypoint detection** \| [Website](../posts/facial-keypoint-detection) \| [Code](https://thinfi.com/0lbj3)
- Detected 68 facial landmarks with three approaches: CNN direct coordinate regression, pretrained ResNet backbone with frozen-then-full finetuning, and U-Net heatmap prediction
- Generated Gaussian heatmaps per keypoint

**Push-T imitation learning** \| [Website](../posts/push-t-imitation) \| [Code](https://thinfi.com/0lbj3)
- Trained MSE and flow matching action chunking policies on Push-T expert demos

**Diffusion and flow matching** \| [Website](../posts/diffusion-flow-matching) \| [Code](https://thinfi.com/0lbj3)
- Implemented sampling loops, classifier-free guidance, SDEdit algorithm, visual anagrams, hybrid images for the Stability AI DeepFloyd IF model
- Trained flow matching model to do class-conditioned MNIST digit generation with UNet architecture, iterative denoising
<img src="/images/projects/diffusion-flow-matching.png" alt="desc" style="width:550px; display:block; margin-left: auto; margin-right: auto; margin-top: 20px;">

**Chatbot arena** \| [Code](https://thinfi.com/0lbj3)
- Using the LMArena dataset, visualized battle distributions with `plotly` and `gradio`, explored confounding stylistic variables
- Built model ELO leaderboard like LMArena following Bradley-Terry model
<img src="/images/projects/chatbot-arena.png" alt="desc" style="width:450px; display:block; margin-left: auto; margin-right: auto; margin-top: 10px; margin-bottom: -10px;">

**NeRF** \| [Website](../posts/nerf) \| [Code](https://thinfi.com/0lbj3)
- Using 40 images from a camera, trained a NeRF model to render a 3D scene of an object with novel views
- NeRF pipeline from scratch, e.g. volume rendering, sinusoidal positional encoding, ray sampling, PSNR, visualizations with `viser`
<video src="/images/projects/nerf.mp4" style="width:300px; display:block; margin-left: auto; margin-right: auto; margin-top; 30px; margin-bottom: 30px;" autoplay loop muted playsinline></video>

**DNABERT** \| [Code](https://thinfi.com/0lbj3)
- Trained a classification head on top of pretrained DNABERT-6 representations to perform species identification across human, dog, and chimpanzee genomes
- Implemented preprocessing pipeline using k-mer tokenization (k=6) to convert raw nucleotide sequences into compatible input tokens
<img src="/images/projects/dnabert.jpeg" alt="desc" style="width:600px; display:block; margin-left: auto; margin-right: auto; margin-top: 30px; margin-bottom: 30px;">

**CLIP retrieval and captioning** \| [Code](https://thinfi.com/0lbj3)
- Performed retrieval and caption generation on Concadia dataset with CLIP embeddings
- Implemented Rational Speech Acts (RSA) e.g. literal listener, pragmatic speaker, pragmatic listener to select the most unambiguous utterance given a set of possible referents

**ConvNeXt sound classification** \| [Code](https://thinfi.com/0lbj3)
- Used Torchaudio to transform .wav files from UrbanSound8K dataset to 2D spectrograms, then finetuned a ConvNeXt model for sound classification, achieving 90% accuracy
- Compared different 3 training paradigms: no pretraining, pretraining with frozen backbone, and pretraining with full finetuning
<img src="/images/projects/urbansound8k.png" alt="desc" style="width:350px; display:block; margin-left: auto; margin-right: auto; margin-top: 30px; margin-bottom: 20px;">

**Text2SQL finetuning** \| [Code](https://thinfi.com/0lbj3)
- Finetuned GPT-2 to generate SQL queries executed against a database and compared performance with few-shot prompting using Hugging Face `transformers` library

**LLM MCQ finetuning** \| [Code](https://thinfi.com/0lbj3)
- Finetuned Qwen2.5-0.5B-Instruct using Hugging Face `transformers` and `trl` libraries to solve CS189 MCQs with 45% accuracy

**LLM tokenization and embeddings** \| [Code](https://thinfi.com/0lbj3)
- Implemented BPE tokenization, analyze Zipfian distributions, then trained a Skip-Gram model to compute embeddings using negative sampling
- Used `spaCy` to learn a linear transformation $W$ that maps two embedding spaces in different languages to perform machine translation, lemmatize and generate dependency trees of text corpus

**ResNet-18** \| [Code](https://thinfi.com/0lbj3)
- Full ResNet-18 architecture in PyTorch reaching 70% validation accuracy on a sample of the Imagenet dataset
<img src="/images/projects/resnet-18.png" alt="desc" style="width:500px; display:block; margin-left: auto; margin-right: auto; margin-top: 20px; margin-bottom: 40px;">

**Autostitching photo mosaics** \| [Website](../posts/autostitching-photo-mosaics) \| [Code](https://thinfi.com/0lbj3)
- Stitching images together to panoramas by estimating homographies, applying projective warping, and blending images with Laplacian pyramid
- Automated mosaic process using Harris corners, ANMS, and RANSAC homography estimation

**Language model eval** \| [Code](https://thinfi.com/0lbj3)
- Evaluated text/audio classification, machine translation, and open-ended text generation, implemented PRC curves, Levenstein distance, BLEU score, LLM-as-a-judge

**Fashion MNIST classifier** \| [Code](https://thinfi.com/0lbj3)
- Trained a Fashion MNIST classifier invariant to shifts, rotations, and blurs with `scikit-learn`

**Image filtering** \| [Website](../posts/filters-and-frequencies) \| [Code](https://thinfi.com/0lbj3)
- Core image processing techniques such as convolution, image sharpening, hybrid images, and multi-resolution blending using Gaussian and Laplacian pyramids
<img src="/images/projects/oraple.jpg" alt="desc" style="width:350px; display:block; margin-left: auto; margin-right: auto; margin-top: 20px; margin-bottom: 20px;">

**Autodifferentiation** \| [Code](https://thinfi.com/0lbj3)
- Constructed computation graph of loss functions, implemented downstream gradient propagation using topological sort with Kahn's algorithm
- Implemented SGD, Momentum, and Adam optimizers

**Coloring the Prokudin-Gorskii photo collection** \| [Website](../posts/prokudin-gorskii) \| [Code](https://thinfi.com/0lbj3)
- Aligned three color channels quickly with pyramid search
<img src="/images/projects/prokudin-gorskii.jpg" alt="desc" style="width:350px; display:block; margin-left: auto; margin-right: auto; margin-top: 20px; margin-bottom: 20px;">

**RISC-V MNIST classifier** \| [Code](https://thinfi.com/0lbj3)
- Fully connected neural network with RISC-V Assembly

**Viso** \| [Website](https://viso.study) \| [Repo](https://github.com/orgs/viso-study/repositories)
- Learning platform that transforms math questions into rich animated explanations
- Multi-agent pipeline with `smolagents` RAG research agent, tool calling, Manim rendering agent, and planning agents
- Won most technical project in AdventureX, Top 20 in amber.ac Hackathon
- Published `manim-voiceover-plus`, a custom PyPi package for multilingual, parallelizable voiceover generation

**RISV-C CPU** \| [Code](https://thinfi.com/0lbj3)
- 2-stage pipelined CPU in Logisim implementing a subset of the RISC-V ISA

**AI Entrepreneurs at Berkeley** \| [Website](https://aientrepreneurs.org) \| [Repo](https://github.com/AIEntrepreneursBerkeley/aientrepreneurs.org)
- Founding member of $100M student-run AI incubator, built and maintain the website

**Amateur keyboard player** \| [Recordings](https://www.youtube.com/watch?v=hnmUMC_tGN8)
- Demoted from concert grand pianist to digital keyboardist
- Currently sporting a pirated setup with Garritan Yamaha CFX and various transcription tools
