---
featured: true
card_fit: contain
title: "Facial keypoints: regression vs. transfer learning vs. heatmaps"
description: "Three ways to predict 68 facial landmarks: a CNN regressing coordinates, pretrained ResNet-18 and DINOv2 backbones, and a U-Net predicting Gaussian heatmaps. Plus an honest look at why my best validation model wasn't my best test model."
date: 2026-02-24
permalink: /posts/facial-keypoint-detection
image: /images/facialkeypoint.png
context: "CS 280 · Project"
tags:
  - Computer Vision
---

The task: given a 224×224 grayscale face, predict 68 landmarks (jaw, brows, eyes, nose, mouth) as $$(x, y)$$ pairs. It's a nice testbed because the same supervision can be posed three different ways, and the output parameterization turns out to matter more than the backbone.

<figure>
  <img src="/images/posts/facial-keypoints/sample.png" alt="A training face with its 68 ground-truth keypoints in red." style="max-width:320px">
</figure>

| Approach | Test MSE ↓ |
|---|---|
| CNN, direct coordinate regression | 0.0459 |
| ResNet-18 (ImageNet), frozen then fine-tuned | **0.0076** |
| DINOv2 ViT-S/14, frozen then fine-tuned | 0.0099 |
| U-Net heatmaps + argmax | 0.0147 (val 0.0007) |

## 1. Regressing coordinates directly

A 4-block CNN (32→256 channels, BatchNorm, max-pool, increasing dropout) followed by an MLP head that outputs 136 numbers, trained with SmoothL1. A small sweep over learning rate, loss, and activation favored lr 1e-3, SmoothL1 over MSE (less sensitive to the occasional badly placed label), and ELU over ReLU.

<figure class="wide">
  <img src="/images/posts/facial-keypoints/cnn-preds.png" alt="Test predictions (red) vs ground truth (green) for the direct regression CNN; several faces have landmarks shifted or shrunk toward the center.">
  <figcaption>Ground truth in green, predictions in red. When the regressor is unsure it falls back to something like the average face shape.</figcaption>
</figure>

This fails in the same way as [MSE action regression](/posts/push-t-imitation). A regressor that is unsure about the pose hedges toward the mean face, so predictions look like a generic face template pasted roughly in the right place. Note also that 51M of the network's parameters are in the first fully connected layer, which has to learn spatial reasoning from a flattened feature map.

## 2. Transfer learning

**ResNet-18.** I replaced the first conv with a 1-channel version, initialized by averaging the pretrained RGB filters so the edge detectors survive. I put a small MLP head on top and trained in two phases: 15 epochs with only the input conv and head trainable, then 20 epochs end to end with a 4× smaller learning rate on the backbone than on the head.

<figure class="wide">
  <img src="/images/posts/facial-keypoints/resnet-loss.png" alt="ResNet-18 training curve with the backbone unfreezing at epoch 15.">
  <figcaption>Train and validation loss. The dashed line marks where the backbone unfreezes.</figcaption>
</figure>

That took test MSE from 0.046 to 0.0076, a 6× improvement, and catastrophic failures mostly went away. ImageNet features already encode where the edges and parts are. The head only has to read them out.

**DINOv2** (ViT-S/14, CLS token → linear head) should have been better on paper. It ended up at 0.0099 and was by far the hardest to train. Phase 1 (frozen backbone) barely moved, and phase 2 needed a backbone learning rate of 2e-6 to avoid wrecking the features. In hindsight, I think regressing from the **CLS token** was the mistake. It's a global summary trained to be invariant to exactly the spatial details I was asking for. The patch tokens are where the localization information lives.

## 3. Heatmaps

Instead of 136 numbers, predict 68 images: a U-Net outputs a 64×64 heatmap per keypoint, trained with MSE against a Gaussian (σ = 2) placed at the true location. Coordinates come from the argmax.

<figure class="wide">
  <img src="/images/posts/facial-keypoints/heatmaps.png" alt="Predicted vs ground-truth heatmaps for several keypoints of one test face.">
  <figcaption>Predicted and target heatmaps for a few keypoints. Each one is a single sharp blob.</figcaption>
</figure>

This is the right parameterization for a conv net. The output lives in the same spatial frame as the input, so translation equivariance does the work that the regression MLP had to learn from scratch. A heatmap also *can* be bimodal when the model is unsure, and taking the argmax picks one mode instead of averaging two. It's the same lesson as flow vs. MSE policies, at a smaller scale. Training was the most stable of the four by far.

<figure class="wide">
  <img src="/images/posts/facial-keypoints/unet-preds.png" alt="Heatmap model predictions closely matching ground truth on test faces.">
</figure>

## The number I don't trust

The heatmap model's validation MSE sat around 0.0007, about 10× better than anything else, but its test MSE was 0.0147, worse than ResNet. Validation and test should come from the same distribution, so a 20× gap is a red flag. Possible causes:

- **Quantization.** An argmax on a 64×64 grid mapped back to 224 px has about 3.5 px of resolution. Keypoints are normalized by 50 px, so uniform rounding error contributes roughly $$(3.5/50)^2/12 \approx 0.0004$$ of MSE. That is consistent with the 0.0007 validation number and nowhere near enough to explain 0.0147. A soft-argmax would remove it anyway.
- **A mismatch between my validation and test evaluation**, such as different normalization or coordinate mapping. The direction of the gap fits this better than overfitting does.
- **Overfitting** after 30 epochs with no early stopping. This is possible, but the validation curve doesn't show it.

I didn't get to the bottom of it, so the honest summary is: heatmaps trained the most stably and looked the best qualitatively, and ResNet regression had the best test number I can stand behind.
