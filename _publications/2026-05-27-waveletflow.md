---
title: "WaveletFlow: Spatially-Localized Frequency Mixing for Flow Matching in PDE Turbulence Modeling"
collection: publications
category: conferences
permalink: /publication/2026-05-27-waveletflow
date: 2026-05-27
---

Current generative models for turbulent flows underrepresent fine-scale structures (vortices, shear layers) due to spectral bias. The current best approach, FourierFlow, boosts high frequencies using Fourier analysis, but this process is globally defined - it cannot tell where fine structures are. We propose **WaveletFlow**, replacing Fourier processing with wavelet-based processing that is both frequency-aware and spatially localized. This process selectively enhances details near vortices without amplifying noise elsewhere. On PDEBench compressible Navier-Stokes, WaveletFlow with the db4 wavelet reduces RMSE from 0.3225 to 0.2955 relative to FourierFlow (8.4% improvement), and the Haar variant achieves 0.2974 (7.8% improvement), with both variants also improving nRMSE over the baseline (0.3924 and 0.3865 vs. 0.4201). These gains arise from a drop-in replacement of a single component while keeping the architecture and training regiment of FourierFlow fixed.


<iframe src="/files/WaveletFlow__Copy_.pdf" style="width:100%; height:90vh; border:none;"></iframe>
