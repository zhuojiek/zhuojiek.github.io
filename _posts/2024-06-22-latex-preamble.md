---
section: notes
title: "LaTeX preamble"
date: 2024-06-22
permalink: /posts/06/22/latex-preamble
tags:
  - LaTeX
  - Math
---

Attached is a simple $$\LaTeX$$ preamble for my course notes, inspired by the Berkeley EECS 127 Reader.

```latex
\usepackage{times}
\usepackage{setspace}
\usepackage[left=1in,right=1in,top=0.8in,bottom=1in]{geometry}
\usepackage{tcolorbox}
\usepackage{graphicx}
\usepackage{amsmath,amssymb}

\onehalfspacing

\newtcolorbox{Definition}[1]{
  colback=red!7!white,
  colframe=red!7!white,
  coltitle=red!60!black,
  fonttitle=\bfseries,
  top=0mm,
  arc=0mm,
  title=\vspace{2mm}Definition ({#1}),
}

\newtcolorbox{Theorem}[1]{
  colback=blue!7!white,
  colframe=blue!7!white,
  coltitle=blue!100!white,
  fonttitle=\bfseries,
  top=0mm,
  arc=0mm,
  title=\vspace{2mm}Theorem ({#1}),
}

\newtcolorbox{Example}[1]{
  colback=green!7!white,
  colframe=green!7!white,
  coltitle=green!50!black,
  fonttitle=\bfseries,
  top=0mm,
  arc=0mm,
  title=\vspace{2mm}Example ({#1}),
}

\newtcolorbox{Exercise}[1]{
  colback=black!7!white,
  colframe=black!7!white,
  coltitle=black!50!black,
  fonttitle=\bfseries,
  top=0mm,
  arc=0mm,
  title=\vspace{2mm}Exercise ({#1}),
}

\newenvironment{Solution}
{\vspace{1mm}\par\noindent\textit{Solution.}~}
{\vspace{1mm}}

\newenvironment{Proof}
{\vspace{1mm}\par\noindent\textit{Proof.}~}
{\vspace{1mm}\hfill$\Box$}

\newenvironment{Exposition}
{\vspace{1mm}\par}
{\vspace{1mm}}

\newenvironment{Figure}[1]
{
  \begin{center}
    \includegraphics[\textwidth]{#1}
\end{center}}
{\vspace{1mm}}
```
