---
section: notes
title: "Non-negativity and iff condition of KL Divergence"
date: 2024-06-20
permalink: /posts/kl-divergence-properties
tags:
  - Machine Learning
  - Statistics
---

2 interesting properties of the KL Divergence:

## 1. Non-negativity: $$KL(p \parallel q) \ge 0$$

This property isn't immediately obvious, as the $$\log$$ terms can be negative if $$q(x) \leq p(x)$$. Intuitively, each $$\log$$ term is weighted by the probability, so the overall quantity will always be positive. But a rigorous proof involves Jensen's Inequality (and is called the Gibbs' Inequality).

Note: from now on, we use $$\ln$$ which is fine because all logarithms are related by a constant factor.

**Proof:**

The definition of KL divergence is $$KL(p \parallel q) = \sum_x p(x) \ln \frac{p(x)}{q(x)}$$. We can rewrite this as:

$$KL(p \parallel q) = - \sum_x p(x) \ln \frac{q(x)}{p(x)}$$

To prove that $$-\sum_x p(x) \ln \frac{q(x)}{p(x)} \ge 0$$, it suffices to show that $$\sum_x p(x) \ln \frac{q(x)}{p(x)} \le 0$$.

Since $$\ln$$ is concave, we can apply **Jensen's Inequality**. For a concave function $$f$$, Jensen's Inequality states that $$E[f(X)] \le f(E[X])$$. In our case, $$f$$ is $$\ln$$ and the expectation is over the distribution $$p(x)$$.

$$
\begin{align*}
\sum_x p(x) \ln \frac{q(x)}{p(x)} &\le \ln \left( \sum_x p(x) \frac{q(x)}{p(x)} \right) \\
&= \ln \left( \sum_x q(x) \right)
\end{align*}
$$

Since $$q(x)$$ is a probability distribution, $$\sum_x q(x) = 1$$. Therefore:

$$\ln \left( \sum_x q(x) \right) = \ln(1) = 0$$

This shows that $$\sum_x p(x) \ln \frac{q(x)}{p(x)} \le 0$$, which completes the proof that $$KL(p \parallel q) = - \sum_x p(x) \ln \frac{q(x)}{p(x)} \ge 0$$.

## 2. $$KL(p \parallel q) = 0 \iff p=q$$

**Proof:**

When does equality hold? It turns out there's an equality condition for Jensen's Inequality. For a strictly concave function like $$\ln$$, equality holds if and only if the random variable is a constant. In our case, this means $$\frac{q(x)}{p(x)}$$ must be a constant, $$c$$, for all $$x$$.

$$\frac{q(x)}{p(x)} = c$$

So, $$q(x) = c \cdot p(x)$$. We can solve for $$c$$ by summing over all $$x$$:

$$\sum_x q(x) = c \sum_x p(x)$$

Since both $$p$$ and $$q$$ are probability distributions, their sums are equal to 1.

$$1 = c \cdot 1 \implies c = 1$$

Therefore, for the KL divergence to be zero, it must be that $$q(x) = 1 \cdot p(x)$$ for all $$x$$, which means the distributions must be identical.
