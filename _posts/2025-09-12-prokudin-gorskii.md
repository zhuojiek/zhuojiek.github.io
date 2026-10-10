---
description: "Aligning the 3 glass-plate exposures with NCC and an image pyramid."
section: cs180
title: Coloring the Prokudin-Gorskii photo collection
date: 2025-09-12
permalink: /posts/prokudin-gorskii
tags:
  - Computer Vision
---

Sergei Mikhailovich Prokudin-Gorskii, a Russian chemist and photographer, pioneered color photography in the early 20th century by capturing 3 exposures of each scene on glass plates through red, green, and blue filters, with the vision of combining them into full-color images. After leaving Russia in 1918, his collection was acquired by the Library of Congress and later digitized. Our goal is to transform these stitched negatives - images containing the 3 stacked exposures - into aligned, artifact-free color photographs.

![image](/images/cs180-archive/cs180/cathedral.jpg)

- An example of a stitched negative, with the blue, green, and red exposures stacked on top of each other.

What should our approch be? Well, the basic idea is to partition the stitched negative into 3 images, one for each channel. Then, we choose one channel as the reference (in this case, the blue channel) and align the other 2 channels to the reference. The algorithm should return the optimal shift for the red and green channels. Finally, we will apply these shifts and then stack the aligned red and green channels on top of the blue channel to form a full-color image.

## Small images

My first idea was to minimize the Euclidean distance between the pixels of the 2 channels. However, some initial testing seemed to indicate that maximizing the Normalized Cross-Correlation (NCC) score led to slightly better alignments.

Thus, I implemented NCC. Both approaches involved flattening the images into one dimensional arrays. In the case of NCC, I also normalized the arrays and then took the dot product.

### Preprocessing

Next, I worried that the inconsistent borders of the images would affect the results, so I cropped the images by 10% on each side. 10% seemed like a good number because it fully cropped out the borders of all the images tested.

### Algorithm

The basic algorithm is as follows:

The inputs to the `align` function are 2 images, `img1` and `img2`. The output is the optimal shift (dx, dy) that maximizes the NCC score.

img2 is the reference channel, while img1 is the channel we are aligning to the reference. Following the approach described above, we will need to call align(red, blue) and align(green, blue).

I implemented a brute-force search over a 30x30 grid (x, y values between -15 and 15) and keep track of the current best shift. We return the displacement that resulted in the highest NCC score.

The following ordering will be used for the optimal shifts outputted by my algorithm:

- green: (dx, dy), red: (dx, dy)

### Cathedral

![image](/images/cs180-archive/cs180/proj1/cathedral.jpg)

- (2,5), (3,12)

### Monastery

![image](/images/cs180-archive/cs180/proj1/monastery.jpg)

- (2,-3), (2,3)

### Tobolsk

![image](/images/cs180-archive/cs180/proj1/tobolsk.jpg)

- (3,3), (3,6)

## Large images

The naive `align` implementation fails for the large .tif images, which have 4-digit dimensions. The reason is because the displacements are often much larger than the 30x30 grid. Increasing the size of the grid search is not a viable solution because the runtime of the naive implementation is quadratic in the size of the image and takes too long to run.

Instead, we implement an image pyramid to speed up and improve the search. This approach repeatedly downsamples the image by a factor of 2 until we reach a base case of a sufficiently small image; I chose 300 pixels for one dimension, which seemed reasonable to brute force with the existing `align` function.

Notice that a displacement of 30 pixels is actually quite expressive at the coarsest level. This is important because we can use the `align` function on the smallest image first, providing an initial estimate of the displacement. Then, we can use this estimate to align the next largest image (being sure to apply the displacement we just found), and so on. Each estimate gets more and more fine-grained, leading to not only a much more efficient search, but also a more accurate one.

It is important to correctly calculate the displacement for each image before calling `align` on the next largest image. Because we downscaled by factors of 2, we also need to multiply the displacement by 2 for each level of the pyramid.

Surprisingly, this approach was able to find the correct displacements for most of the large images.

### Church

![image](/images/cs180-archive/cs180/proj1/church.jpg)

- (3,24), (-5,57)

### Emir

![image](/images/cs180-archive/cs180/proj1/emir_naive.jpg)

- (25,48), (-296,92)
- Red alignment is messed up, hmmm...

### Harvesters

![image](/images/cs180-archive/cs180/proj1/harvesters.jpg)

- (16,60), (14,124)

### Icon

![image](/images/cs180-archive/cs180/proj1/icon.jpg)

- (16,41), (22,90)

### Italil

![image](/images/cs180-archive/cs180/proj1/italil.jpg)

- (20,37), (35,76)

### Lastochikino

![image](/images/cs180-archive/cs180/proj1/lastochikino.jpg)

- (-1,-2), (-7,73)

### Lugano

![image](/images/cs180-archive/cs180/proj1/lugano.jpg)

- (-16,39), (-29,92)

### Melons

![image](/images/cs180-archive/cs180/proj1/melons.jpg)

- (8,81), (12,178)

### Self Portrait

![image](/images/cs180-archive/cs180/proj1/self_portrait.jpg)

- (29,79), (36,176)

### Siren

![image](/images/cs180-archive/cs180/proj1/siren.jpg)

- (-6,48), (-23,96)

### Three Generations

![image](/images/cs180-archive/cs180/proj1/three_generations.jpg)

- (14,53), (11,112)

## Emir

Everyone but Emir was successfully aligned. This image is particularly difficult because of his outfit:

![image](/images/cs180-archive/cs180/proj1/emir_channels.jpg)

As we see, the blue, green, and red channels have significant differences in the dress region. The blue channel is very intense in this region, while the red channel is the opposite (indeed, the dress appears to be a vivid turquoise color). The green channel lies in between.

Naively using the blue channel as the reference channel leads to very poor alignment with the red channel due to low correlation in the dress region, as demonstrated from the previous results:

![image](/images/cs180-archive/cs180/proj1/emir_naive.jpg)

- green shift: (25,48), red shift: (-296,92)

Instead, we should use the moderate green channel as the reference channel. This way, we are more likely to align the extreme channels with it.

Indeed, when we use the green channel as the reference channel, we get a much better alignment:

![image](/images/cs180-archive/cs180/proj1/emir.jpg)

- blue shift: (-25,-48), red shift: (16,55)

And as a sanity check, the optimal blue shift here is the negative of the optimal green shift from when we used the blue channel as the reference channel. This is expected because NCC is symmetric.

## Miscellaneous

All large images were able to be aligned in under 40 seconds.

This blog is made using a special flavor of Markdown called MDX. Theoretically, I should be able to embed React components in this blog, but I was unable to get it working due to crippling frontend skill issue. Hopefully by the next project I will be able to figure it out!

## My own images

I chose a few interesting images from the Prokudin-Gorskii collection to test on!

### Kurmy

![image](/images/cs180-archive/cs180/proj1/kurmy.jpg)

- (-18,25), (-38,115)

### Stone Gate

![image](/images/cs180-archive/cs180/proj1/stone_gate.jpg)

- (3,34), (5,96)

### Brick

![image](/images/cs180-archive/cs180/proj1/brick.jpg)

- (9,72), (-30,168)

