---
title: "WaveletFlow: Spatially-Localized Frequency Mixing for Flow Matching in PDE Turbulence Modeling"
short: WaveletFlow
permalink: /publication/2026-05-27-waveletflow
date: 2026-05-27
group: course
order: 2
kind: Research project
authors: "Shuai Meng, Zhuojie Kuang"
venue: "CS 280 (Graduate Computer Vision) final project"
thumb: /images/research/waveletflow-sample.png
blurb: "FourierFlow fights spectral bias by boosting high frequencies, but a Fourier mode lives everywhere in the domain. Replacing its Fourier mixing branch with a wavelet branch lets the model sharpen detail where the vortices are, cutting RMSE by 8.4% on PDEBench compressible Navier–Stokes."
links:
  - { name: Paper (PDF), url: "/files/WaveletFlow__Copy_.pdf" }
---

<figure class="wide">
  <img src="/images/research/waveletflow-motivation.png" alt="Fourier basis functions span the entire domain; wavelet basis functions are spatially localized. WaveletFlow fills the wavelet + flow matching cell of the method landscape.">
  <figcaption><strong>Motivation.</strong> A Fourier basis function \(e^{i\omega x}\) covers the whole domain, so boosting a frequency boosts it everywhere. A wavelet \(\psi_{j,k}\) is localized in both scale and position.</figcaption>
</figure>

## The problem of spectral bias

Diffusion and flow models recover coarse, low frequency structure first and fine, high frequency structure last.  High frequencies therefore drop below the noise floor earliest in the forward process, and the reverse process has the least signal to recover them from. For turbulence that is bad news, because the vortices and shear layers carrying the interesting physics live at high wavenumbers.

FourierFlow (Wang et al.) addressed this with a learnable spectral filter weighted by $$\lVert\xi\rVert^\eta$$, which pushes the model toward high frequencies. However this filter is global. Turbulent fields are mostly smooth with a few localized vortex cores, so amplifying a certain frequency band amplifies the quiet regions too.

## WaveletFlow Architecture

We swapped FourierFlow's Fourier Mixing branch for a Wavelet Mixing branch and also modified the salient-flow attention branch, the conditioning, the gated fusion, and the MAE alignment loss.

1. Take a 2-level 2D DWT of the feature map.
2. At each level, run the 3 detail subbands (LH, HL, HH) through a per-level MLP.
3. Rescale each level by $$\beta_j + \alpha_j 2^{j\eta_j}$$. This plays the role of $$\lVert\xi\rVert^\eta$$, but acts on spatially indexed coefficients.
4. Run the inverse DWT with the approximation coefficients untouched, and add residual.

<figure class="wide">
  <img src="/images/research/waveletflow-arch.png" alt="WaveletFlow architecture: initial condition and noisy target go through patch embedding and cross-attention, then a salient flow attention branch and the new wavelet mixing branch, fused adaptively into a velocity prediction.">
  <figcaption><strong>Architecture</strong> of WaveletFlow.</figcaption>
</figure>

## Results

On PDEBench compressible Navier–Stokes, we tested both models trained under the same reduced budget:

| Method | RMSE ↓ | nRMSE ↓ | vs. FourierFlow |
|---|---|---|---|
| FourierFlow | 0.3225 | 0.4201 | |
| WaveletFlow (db4) | **0.2955** | 0.3924 | −8.4% RMSE |
| WaveletFlow (Haar) | 0.2974 | **0.3865** | −7.8% RMSE |

db4 has smoother, longer filters and better frequency selectivity, which suits absolute error. Haar has the most compact support, and gets the best normalized error, which fits a field whose hard parts are sharp and spatially concentrated.

<figure class="half">
  <img src="/images/research/waveletflow-sample-fourier.png" alt="FourierFlow predictions vs ground truth for one test trajectory.">
  <img src="/images/research/waveletflow-sample-haar.png" alt="WaveletFlow-Haar predictions vs ground truth for one test trajectory.">
  <figcaption>Predicted (orange border) vs. ground-truth (green border) frames for one test sample. Left: FourierFlow. Right: WaveletFlow-Haar. The wavelet model tracks the extrema in the velocity field more closely.</figcaption>
</figure>

## Caveats

The original FourierFlow was trained on 8×H800s for a long time. We trained both models with fewer epochs and smaller batches on 3×RTX 6000 Ada. The comparison is fair under that budget, but it isn't a reproduction of the published numbers.
