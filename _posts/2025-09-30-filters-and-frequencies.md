---
description: "Convolution, unsharp masking, hybrid images, and Laplacian-pyramid blending (the oraple)."
section: cs180
title: Filters and Frequencies
date: 2025-09-30
permalink: /posts/filters-and-frequencies
tags:
  - Computer Vision
---

# Part 1: Fun with Filters

## 1.1 Convolutions from Scratch

The naive way to convolve an image is to use 4 for loops, iterating over height, width, and the kernel dimensions. More efficient is to use 2 for loops over the height and width, then flatten the kernel and image into 1D arrays to do a single dot product with Numpy. Lastly, there is the optimized convolve2d function from Scipy. All 3 methods work well as seen below:

The first column is 2 for loops, the second column is 4 for loops, the third column is the optimized convolve2d function. First row is box filter, second row is Dx, third row is Dy.

<ImageGrid
  images={[
    "/cs180/proj2/myself_box_filter_c2.jpg",
    "/cs180/proj2/myself_box_filter_c4.jpg",
    "/cs180/proj2/myself_box_filter_c2d.jpg",
    "/cs180/proj2/myself_dx_c2.jpg",
    "/cs180/proj2/myself_dx_c4.jpg",
    "/cs180/proj2/myself_dx_c2d.jpg",
    "/cs180/proj2/myself_dy_c2.jpg",
    "/cs180/proj2/myself_dy_c4.jpg",
    "/cs180/proj2/myself_dy_c2d.jpg",
  ]}
  columns={3}
/>

Whoa, creepy.

Here is my general loop for convolution with 4 for loops:

```python
for i in range(height):
  for j in range(width):
    acc = 0.0
    for u in range(kernel_height):
      for v in range(kernel_width):
        acc += (
          padded_image[i + u, j + v] *
          cc_kernel[u, v]
        )
    output[i, j] = acc
```

Here is my general loop for convolution with 2 for loops:

```python
for i in range(height):
  for j in range(width):
    region = padded_image[i : i + kernel_height, j : j + kernel_width]
    region_flat = region.flatten()
    kernel_flat = cc_kernel.flatten()
    output[i, j] = np.dot(region_flat, kernel_flat)
```

In general, the optimized convolve2d function is much faster than the 4 for loops and the 2 for loops. The runtime comparison is 4 for loops < 2 for loops < convolve2d.

All solutions implement zero padding (convolve2d has an option to do this using `mode='same'`). My 2 implementations do this by adding a border of zeros around the image. The width of the border is dependent on the kernel size.

## 1.2 Finite Difference Operator

Next, we convolve the cameraman image with Dx and Dy, then compute the gradient magnitude image. Then, to get rid of some noise, we pick an appropriate threshold (for me, 0.2 worked well in that it removed most of the noise from the grass without removing edges from the cameraman).

![cameraman_dx](/images/cs180-archive/cs180/proj2/cameraman_Dx.jpg)

![cameraman_dy](/images/cs180-archive/cs180/proj2/cameraman_Dy.jpg)

![cameraman_gradient_magnitude](/images/cs180-archive/cs180/proj2/cameraman_gradient_magnitude.png)

![cameraman_edge_image](/images/cs180-archive/cs180/proj2/cameraman_edge_image.jpg)

Above is cameraman_dx, cameraman_dy, cameraman_gradient_magnitude, and cameraman_edge_image after applying the 0.2 threshold.

## 1.3 Derivative of Gaussian Filter

As we can see from the previous section, the image contains a lot of noise. We can use a Gaussian filter to blur the image, which will help reduce the noise because it acts as a low pass filter.

We create a Gaussian filter with the following code:

```python
gaussian_filter = cv2.getGaussianKernel(5,1) @ cv2.getGaussianKernel(5,1).T # 5x5 kernel with sigma = 1
```

Here is the result after convolving with the Gaussian filter:

![blurred_cameraman_image](/images/cs180-archive/cs180/proj2/blurred_cameraman_image.jpg)

Now let's build the edge image. Look how much noise is gone! Here we used a much lower threshold of 0.1.

![blurred_cameraman_edge_image](/images/cs180-archive/cs180/proj2/blurred_cameraman_edge_image.jpg)

But wait, we can do this in a single convolution instead of 2! This is because convolution is associative, meaning we can combine the 2 convolutions into a single convolution. We can thus create a `DoG_Dx` and `DoG_Dy` filter and convolve with the cameraman image.

Here is what `DoG_Dx` and `DoG_Dy` look like:

<ImageGrid
  images={["/cs180/proj2/DoG_Dx.png", "/cs180/proj2/DoG_Dy.png"]}
  columns={2}
/>

Now let's convolve the cameraman image with the DoG filters and display the results. Same, as expected.

![blurred_cameraman_edge_image](/images/cs180-archive/cs180/proj2/blurred_cameraman_edge_image.jpg)

# Part 2: Fun with Frequencies

## 2.1 Image Sharpening

We add high frequencies to the original image. To get the high frequencies, we use the unsharp mask filter. In essence, an unsharp mask filter is a Gaussian filter applied to the image, then subtracting the result from the original image. Blurring an image with a Gaussian filter removes high frequencies, so subtracting the blurred image from the original image leaves us with the high frequencies that the filter had removed.

We derive the unsharp mask filter using the following code:

```python
unit_impulse = np.zeros((5, 5))
unit_impulse[2, 2] = 1
unsharp_mask_filter = (1 + alpha) * unit_impulse - alpha * gaussian_filter
```

Here is the Taj Mahal, and Taj Mahal with 2 \* Laplacian of Gaussian filters applied to it.

<ImageGrid
  images={["/cs180/proj2/taj.jpg", "/cs180/proj2/taj_sharpened.png"]}
  columns={2}
/>

We do the same to MrBeast, who is sharpened by an alpha value of 10.

<ImageGrid
  images={["/cs180/proj2/mrbeast.jpg", "/cs180/proj2/mrbeast_sharpened.png"]}
  columns={2}
/>

As we see, sharpening the image with too high of an alpha value results in a lot of noise and distortion. After all, we are just adding a lot of high frequencies to the original image.

## 2.2 Hybrid images

To create a hybrid image, we add high frequencies of one image to the low frequencies of another image. Because human eyes are sensitive to different frequencies at different distances, this creates a hybrid image that looks like both subjects at different distances.

Here is the hybrid image of a man and his cat:

![DerekPicture](/images/cs180-archive/cs180/proj2/DerekPicture.jpg)

![nutmeg](/images/cs180-archive/cs180/proj2/nutmeg.jpg)

![hybrid](/images/cs180-archive/cs180/proj2/hybrid.jpg)

Here is the hybrid image of me and Ayanokoji. We will step through the entire process of creating this image:

We start with the original 2 images:

![myself](/images/cs180-archive/cs180/proj2/myself.jpg)

![ayanokoji](/images/cs180-archive/cs180/proj2/ayanokoji.jpg)

Then, we align the 2 images together by selecting the eyes as reference points.

Here are the relevant images from the alignment process and filtering:

<ImageGrid
  images={[
    "/cs180/proj2/im1_aligned_g1.jpg",
    "/cs180/proj2/im1_gray_g1.jpg",
    "/cs180/proj2/im2_aligned_g2.jpg",
    "/cs180/proj2/low_sf_im2_g2.jpg",
  ]}
  columns={3}
/>

Finally, we obtain the hybrid image:

![hybrid](/images/cs180-archive/cs180/proj2/hybrid-ayanokoji-myself.jpg)

(lil bro is not ayanokoji)

along with the Fourier transform of this image:

![fourier](/images/cs180-archive/cs180/proj2/fourier.png)

Here is another, of Tomoya and Sunohara from Clannad:

![tomoya](/images/cs180-archive/cs180/proj2/tomoya.jpg)

![sunohara](/images/cs180-archive/cs180/proj2/sunohara.jpg)

![hybrid](/images/cs180-archive/cs180/proj2/hybrid-tomoya-sunohara.jpg)

## 2.3 Gaussian and Laplacian Stacks

The general approach is to blend together the frequency bands of the 2 images using a Laplacian Stack and Gaussian filter.

Here, we see the Oraple:

![oraple](/images/cs180-archive/cs180/proj2/oraple.jpg)

Here are the Gaussian Stacks, Laplacian Stacks, and Blended images:

<ImageGrid
  images={[
    "/cs180/proj2/apple_orange_g0.jpg",
    "/cs180/proj2/apple_orange_g1.jpg",
    "/cs180/proj2/apple_orange_g2.jpg",
    "/cs180/proj2/apple_orange_g3.jpg",
    "/cs180/proj2/apple_orange_g4.jpg",
  ]}
  columns={5}
/>

<ImageGrid
  images={[
    "/cs180/proj2/apple_orange_1_l0.jpg",
    "/cs180/proj2/apple_orange_1_l1.jpg",
    "/cs180/proj2/apple_orange_1_l2.jpg",
    "/cs180/proj2/apple_orange_1_l3.jpg",
    "/cs180/proj2/apple_orange_1_l4.jpg",
  ]}
  columns={5}
/>

<ImageGrid
  images={[
    "/cs180/proj2/apple_orange_2_l0.jpg",
    "/cs180/proj2/apple_orange_2_l1.jpg",
    "/cs180/proj2/apple_orange_2_l2.jpg",
    "/cs180/proj2/apple_orange_2_l3.jpg",
    "/cs180/proj2/apple_orange_2_l4.jpg",
  ]}
  columns={5}
/>

<ImageGrid
  images={[
    "/cs180/proj2/apple_orange_blended_0.jpg",
    "/cs180/proj2/apple_orange_blended_1.jpg",
    "/cs180/proj2/apple_orange_blended_2.jpg",
    "/cs180/proj2/apple_orange_blended_3.jpg",
    "/cs180/proj2/apple_orange_blended_4.jpg",
  ]}
  columns={5}
/>

## 2.4 Multiresolution Blending

Here are my custom blended images:

![blend_venice_neo_venezia](/images/cs180-archive/cs180/proj2/blend_venice_neo_venezia.jpg)

![blend_triangle](/images/cs180-archive/cs180/proj2/blend_triangle.jpg)

The latter uses a triangle as the filter.