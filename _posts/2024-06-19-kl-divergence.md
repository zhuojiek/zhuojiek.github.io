---
section: notes
title: "Minimizing KL Divergence is Minimizing Cross Entropy is Maximizing Likelihood"
date: 2024-06-19
permalink: /posts/kl-divergence
tags:
  - Machine Learning
  - Statistics
---

In the derivation of statistical models, we often encounter 3 statistical quantities: the **Kullback-Leibler (KL) Divergence**, **Cross-Entropy**, and **Maximum Likelihood Estimation (MLE)**. While they might seem different at first glance, they are in fact deeply intertwined. This post will walk through the proof that demonstrates their equivalence.

### From KL Divergence to Cross-Entropy

Let's start with the definition of KL Divergence. It measures how one probability distribution, $$Q$$, diverges from a second, expected probability distribution, $$P$$. The formula is as follows:

$$D_{KL}(P \parallel Q) = \sum_{x} P(x) \log \frac{P(x)}{Q(x)}$$

We can expand this expression:

$$
\begin{align*}
D_{KL}(P \parallel Q) &= E_{x \sim P(x)}[\log P(x) - \log Q(x)] \\
&= E_{x \sim P(x)}[\log P(x)] - E_{x \sim P(x)}[\log Q(x)] \\
&= E_{x \sim P(x)}[-\log Q(x)] - E_{x \sim P(x)}[-\log P(x)] \\
&= E_{x \sim P(x)}\left[\log \frac{1}{Q(x)}\right] - E_{x \sim P(x)}\left[\log \frac{1}{P(x)}\right] \\
&= H(P, Q) - H(P)
\end{align*}
$$

Here, $$H(P)$$ is the entropy of the distribution $$P$$, and $$H(P, Q)$$ is the cross-entropy between $$P$$ and $$Q$$.

This gives us our first key relationship:

$$D_{KL}(P \parallel Q) = H(P, Q) - H(P)$$

### Minimizing KL Divergence is Equivalent to Minimizing Cross-Entropy

In many statistical modeling scenarios, we want to train a model distribution, $$P(x \vert \theta)$$, to be as close as possible to the true underlying data distribution, $$P_\text{data}$$. In other words we want to minimize $$D_{KL}(P_\text{data} \parallel P(x \vert \theta))$$. In practice, however, we don't know the true underlying data distribution: for one, it may not follow our model distribution, and we can only estimate it with a finite sample. Thus, we write $$\hat{P}_\text{data}$$ instead of $$P_\text{data}$$ to denote that it is an estimate of the data distribution. We can use something like the Empirical Distribution as the estimator.

If we consider the expression for KL Divergence, we can see that the entropy of the true data distribution, $$H(P)$$, is a constant that doesn't depend on. We can't change the entropy of the data itself. Therefore, minimizing the KL Divergence between our model and the data is equivalent to minimizing the cross-entropy between them.

$$\arg\min_{\theta} D_{KL}(P \parallel Q) = \arg\min_{\theta} [H(P, Q) - H(P)] = \arg\min_{\theta} H(P, Q)$$

### Minimizing Cross-Entropy is Equivalent to Maximizing Likelihood

Now, let's connect this to Maximum Likelihood Estimation. In a typical machine learning problem, we have a dataset $$D = \{x_i\}_{i=1}^n$$ sampled from the true data distribution, which we'll call $$P_{\text{data}}$$. Our model is a parameterized distribution, $$P(x \vert \theta)$$. We want to find the parameters $$\theta$$ that make our model best fit the data.

We can frame this as minimizing the KL Divergence between the empirical distribution of our data, $$\hat{P}_{\text{data}}$$, and our model, $$P(x \vert \theta)$$.

$$\arg\min_{\theta} D_{KL}(\hat{P}_{\text{data}} \parallel P(x \vert \theta))$$

From our previous derivation, this is equivalent to minimizing the cross-entropy:

$$\arg\min_{\theta} H(\hat{P}_{\text{data}}, P(x \vert \theta))$$

Let's write out the definition of cross-entropy:

$$H(\hat{P}_{\text{data}}, P(x \vert \theta)) = - \sum_{i=1}^{n} \hat{P}_{\text{data}}(x_i) \log P(x_i \vert \theta)$$

For an empirical distribution from a dataset, $$\hat{P}_{\text{data}}(x_i)$$ is simply $$\frac{1}{n}$$ for each observed data point $$x_i$$. So, we can rewrite the expression as:

$$
\begin{align*}
\arg\min_{\theta} H(\hat{P}_{\text{data}}, P(x \vert \theta)) &= \arg\min_{\theta} - \frac{1}{n} \sum_{i=1}^{n} \log P(x_i \vert \theta) \\
&= \arg\max_{\theta} \frac{1}{n} \sum_{i=1}^{n} \log P(x_i \vert \theta)
\end{align*}
$$

Using the properties of logarithms, we can bring the sum inside the log as a product:

$$\arg\max_{\theta} \frac{1}{n} \log \prod_{i=1}^{n} P(x_i \vert \theta)$$

Since the logarithm is a monotonic function, maximizing the log of a function is the same as maximizing the function itself. The $$\frac{1}{n}$$ term is a constant, so we can also drop it. This leaves us with:

$$\arg\max_{\theta} \prod_{i=1}^{n} P(x_i \vert \theta)$$

This final expression is the **Maximum Likelihood Estimate** of the parameters $$\theta$$. The MLE finds the parameters that maximize the probability of observing our given data.

Therefore, we have shown that minimizing the KL Divergence between our model and the data distribution is equivalent to minimizing the cross-entropy, which in turn is equivalent to maximizing the likelihood of the data.
