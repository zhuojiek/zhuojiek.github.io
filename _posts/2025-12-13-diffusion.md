---
description: "Sampling, CFG, SDEdit, inpainting, and visual anagrams with DeepFloyd IF, then training a flow-matching UNet on MNIST."
section: cs180
title: Diffusion and Flow Matching
date: 2025-12-13
permalink: /posts/diffusion-flow-matching
tags:
  - Computer Vision
---

# Project 5A: Diffusion

## Part 0

For this part, I chose the following 3 prompts:

1. 'an oil painting of a snowy mountain village'
2. 'a man wearing a hat'
3. 'a pencil'

Here are the generated images using `num_inference_steps = 20` for stage 1:

![](/images/cs180-archive/diffusion/1.png)
'an oil painting of a snowy mountain village'

![](/images/cs180-archive/diffusion/2.png)
'a man wearing a hat'

![](/images/cs180-archive/diffusion/3.png)
'a pencil'

Here are the generated images using `num_inference_steps = 4` for stage 1:

![](/images/cs180-archive/diffusion/4.png)
'an oil painting of a snowy mountain village'

![](/images/cs180-archive/diffusion/5.png)
'a man wearing a hat'

![](/images/cs180-archive/diffusion/6.png)
'a pencil'

As expected, the images have not fully denoised, but all images have definitely stepped well into the direction of their captions.

I used a random seed of `100`.

## Part 1

### 1.1

The forward process is the process of generating the noisy image at timestep t by adding the appropriate amount of noise to the clean image. The coefficient of the amount of noise to add follows a cosine scheduler as t increases.

In this model, t is discrete, from 0 to 999.

Here is the Campanile at noise levels 250, 500, and 750.

![](/images/cs180-archive/diffusion/7.png)
![](/images/cs180-archive/diffusion/8.png)
![](/images/cs180-archive/diffusion/9.png)

### 1.2

Given a noisy image, we want to find a way to denoise it. A classical approach is Gaussian denoising. To remove more noise, i.e. perform more smoothing, we should increase the kernel size and sigma. I increased `kernel_size` and `sigma` for high timesteps.

**250:**
![](/images/cs180-archive/diffusion/7.png)
![](/images/cs180-archive/diffusion/10.png)

**500:**
![](/images/cs180-archive/diffusion/8.png)
![](/images/cs180-archive/diffusion/11.png)

**750:**
![](/images/cs180-archive/diffusion/9.png)
![](/images/cs180-archive/diffusion/12.png)

The results aren't great, motivating the use of a neural diffusion model to do the denoising instead.

### 1.3

Now we use the pre-trained U-Net to do the denoising process. The U-Net in stage 1 takes in the noisy image, t, and prompt embeds and returns an estimate of the noise that was added with respect to the clean image.

Thus we can try to reconstruct the original image by subtracting the noise estimate (scaled by the coefficient).

Here are the triples (original image, noisy image at timestep t, estimate of original image) at t=250,500,750.

![](/images/cs180-archive/diffusion/13.png)

![](/images/cs180-archive/diffusion/14.png)

![](/images/cs180-archive/diffusion/15.png)

### 1.4

As we see, the diffusion model is much better at denoising than Gaussian denoising, but still struggles to denoise the very noisy image at t=750.

In practice, the problem is solved by denoising iteratively; denoising in small manageable steps instead of taking large unstable leaps.

I created a strided_timesteps variable to model these manageable steps.

Here is the Campanile at every 5th loop of denoising:

![](/images/cs180-archive/diffusion/40.png)

As we see the image gets less and less noisy.

Here are the results for iterative denoise, one step denoise, and gaussian noise, respectively:

![](/images/cs180-archive/diffusion/37.png)
![](/images/cs180-archive/diffusion/38.png)
![](/images/cs180-archive/diffusion/39.png)

As we see, iterative denoise maintains the most detail and looks the best.

### 1.5

Now, we can generate images by starting with pure Gaussian noise, and applying iterative denoising. We use the arbitrary prompt "a high quality photo":

![](/images/cs180-archive/diffusion/41.png)

These don't look bad, but still have noticeable inconsistencies.

### 1.6

Classifier Free Guidance (CFG) is a technique to improve image quality by combining both the conditional and unconditional noise estimates. The parameter gamma controls the strength of CFG.

Here are 5 examples with CFG applied:

![](/images/cs180-archive/diffusion/42.png)

These results look much more realistic and high quality compared to the previous result.

### 1.7

We do image-to-image translation by taking a clean image, adding noise to it, and then denoise it.

The core idea is that by adding a specific amount of noise to a real image, we effectively "nudge" it off the manifold of natural images into a state where the model can creatively reconstruct its details. As the denoising process forces the image back onto that manifold, lower initial noise levels preserve the original structure while higher noise levels allow the model to make up entirely new features.

Here is the Campanile and 2 other pictures:

Original images:

![](/images/cs180-archive/diffusion/campanile.jpg)

![](/images/cs180-archive/diffusion/2.png)

![](/images/cs180-archive/diffusion/3.png)

Recovery:

![](/images/cs180-archive/diffusion/43.png)

![](/images/cs180-archive/diffusion/44.png)

![](/images/cs180-archive/diffusion/45.png)

### 1.7.1

We can perform this process on hand-drawn and unrealistic images as well, which don't lie in the manifold of natural images:

Original images:

![](/images/cs180-archive/diffusion/49.png)

![](/images/cs180-archive/diffusion/50.png)

![](/images/cs180-archive/diffusion/51.png)

Recovery:

![](/images/cs180-archive/diffusion/47.png)

![](/images/cs180-archive/diffusion/46.png)

![](/images/cs180-archive/diffusion/48.png)

### 1.7.2

Impainting refers to the process of generating in a masked region. The image outside the mask remains unchanged. Here are a few examples:

**Campanile:**

![](/images/cs180-archive/diffusion/campanile.jpg)
Original image

![](/images/cs180-archive/diffusion/c-mask.png)
mask

![](/images/cs180-archive/diffusion/replace-c.png)
replace

![](/images/cs180-archive/diffusion/impainted-c.png)
impainted

**Man mixed with a high quality photo:**

![](/images/cs180-archive/diffusion/53.png)
impainted

**Lodge cabin mixed with amalfi coast with upper mask**

![](/images/cs180-archive/diffusion/52.png)
impainted

### 1.7.3

We can use custom text prompts to condition on for image generation. This allows us to specify the direction that we want an image to go to:

![](/images/cs180-archive/diffusion/54.png)
Translating Campanile to: a rocket ship

![](/images/cs180-archive/diffusion/55.png)
an oil painting of a snowy mountain village + man

![](/images/cs180-archive/diffusion/56.png)
a lithograph of a skull + pencil

### 1.8

We can create visual anagrams by applying the research paper. For example we can generate a picture of a dog and a hipster, or a house and the amalfi coast:

![](/images/cs180-archive/diffusion/57.png)

![](/images/cs180-archive/diffusion/58.png)

# Project 5B: Diffusion

## Part 1

### 1.1

Here, we train a single-step denoising U-Net. Given a noisy image z, we want the decoder to output a clean image x.

Our training objective is a single L2 loss over the true image and the model's attempt at denoising the image.

The architecture is a U-Net composing many Convolution, Pooling, and Upsampling/Downsampling layers.

### 1.2

To train the denoiser, we need to collect a large sample of (z, x) pairs. The noising process is simply adding some Gaussian noise to the original image with noise coefficient sigma between 0.0 and 1.0.

Here is the noising process over various values between 0.0 and 1.0. As sigma increases, the images get noisier:

![](/images/cs180-archive/diffusion/16.png)

### 1.2.1

Now we train the model. We create a dataset with the noisy clean image pairs, UNet architecture, Adam optimizer, and train for 5 epochs.

Here is thee training loss curve:

![](/images/cs180-archive/diffusion/17.png)

Here are 3 sample results on the test set with noise level 0.5 at the 1st and 5th epoch:

![](/images/cs180-archive/diffusion/18.png)
![](/images/cs180-archive/diffusion/19.png)

### 1.2.2

We examine what occurs when we feed data to the model that the model wasn't initially trained for. Recall from above that we only trained on images with noise coefficient 0.5. We test the model's performance on varying levels of noise, not just 0.5:

![](/images/cs180-archive/diffusion/20.png)

As expected, the model performs quite poorly on extremely noisy images it wasn't trained to handle.

### 1.2.3

To be able to generate new images, we need to be able to denoise pure noise. Instead of a perturbed image, we now input pure noise into the training process and create a new model.

Immediately, the training loss curve doesn't look too promising:

![](/images/cs180-archive/diffusion/21.png)

Here are some sample model outputs at epoch 0 and epoch 5:

![](/images/cs180-archive/diffusion/22.png)
![](/images/cs180-archive/diffusion/23.png)

The model isn't learning. To minimize expected loss, it just predicts the average of all of the digits.

## Part 2

Motivated to try another approach after our previous failure, we decide to train a Flow Matching model to iteratively denoise the image. As we saw from Part A, iterative denoising is more manageable to learn. Flow Matching provides a different objective by modeling the flow, intuitively the velocity of the vector field of the position of the image at time t.

### 2.1

I implemented a modified U-Net architecture that does time-conditioning using special FCBlocks. This is necessary to use the timestep in the iterative denoising process.

### 2.2

We will create a new MNIST dataset to train the model. Below is the loss curve for 

![](/images/cs180-archive/diffusion/24.png)

### 2.3

Now, we will sample from the time-conditioned U-Net at various epochs of training. Starting from noise, the flow matching model iteratively predicts the flow. Then, the image is updated and the process is repeated. Below are a few samples at Epoch 1, 5, and 10:

![](/images/cs180-archive/diffusion/25.png)
![](/images/cs180-archive/diffusion/26.png)
![](/images/cs180-archive/diffusion/27.png)

### 2.4

We want to guide the model in the direction of image generation. For example, we want to specify that we want to generate a 1 versus generating a 9. To do this, we add class conditioning to the U-Net. We add a few more FCBlocks that take in the class information and also add dropout to help regularization.

### 2.5

Now we train the class-conditioned U-Net using standard hyperparamenters. Below is the training loss curve:

![](/images/cs180-archive/diffusion/32.png)

### 2.6

Like 2.3, we sample from the class-conditioned U-Net with CFG. Below are the results after 1, 5, and 10 epochs:

![](/images/cs180-archive/diffusion/29.png)

![](/images/cs180-archive/diffusion/30.png)

![](/images/cs180-archive/diffusion/31.png)

I experimented with removing the learning rate scheduler altogether. To compensate, I lowered the learning rate from 1e-2 to 1e-4 and obtain satisfactory results:

![](/images/cs180-archive/diffusion/33.png)
![](/images/cs180-archive/diffusion/34.png)
![](/images/cs180-archive/diffusion/35.png)

Along with the loss for this model:

![](/images/cs180-archive/diffusion/36.png)