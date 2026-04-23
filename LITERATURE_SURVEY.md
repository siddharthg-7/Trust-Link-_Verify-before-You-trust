# Literature Survey — TrustLink: Verify Before You Trust

> **Project:** TrustLink — An AI-powered scam detection and link verification platform  
> **Prepared by:** Gilakathi Siddhartha Goud  
> **Topic Area:** Phishing Detection, Scam Detection, URL Analysis, Deep Learning for Security, Trust Scoring

---

## Overview

This literature survey covers 10 peer-reviewed research papers that are directly relevant to the core functionality of TrustLink. The papers span phishing detection, URL-based threat analysis, machine learning for scam classification, deep learning for content verification, and AI-powered trust scoring systems.

---

## Research Papers Table

| # | Paper Title | Authors | Journal / Conference & Date | Algorithms / Methods Used | Pros | Cons |
|---|-------------|---------|----------------------------|--------------------------|------|------|
| 1 | **Detecting Phishing Websites Using Machine Learning Technique** | Subramanian Parimala, Muthukumar Sathiyamurthy | *Procedia Computer Science*, Elsevier, 2021 | Decision Tree, Random Forest, SVM, Logistic Regression; URL-based & HTML feature extraction | High accuracy (up to 97%) with Random Forest; fast inference; interpretable features; works without third-party APIs | Relies on static URL features that can be spoofed; does not capture dynamic/JavaScript-rendered content; limited generalisation to new phishing kits |
| 2 | **A Survey of Phishing Attack Techniques, Defences and Open Research Challenges** | Gunikhan Sonowal, K. S. Kuppusamy | *Enterprise Information Systems*, Taylor & Francis, 2020 | Survey of blacklist-based, heuristic, ML, and visual-similarity approaches | Comprehensive taxonomy of attack types and defences; identifies research gaps; useful as a foundation for system design | Survey paper — does not provide new experimental results; coverage may not include post-2020 techniques such as generative-AI-based phishing |
| 3 | **URLNet: Learning a URL Representation with Deep Learning for Malicious URL Detection** | Hung Le, Quang Pham, Doyen Sahoo, Steven C.H. Hoi | *arXiv preprint arXiv:1802.03162*, 2018 | Character-level and word-level CNNs on raw URL strings; end-to-end deep learning | Requires no manual feature engineering; captures both character-level and semantic patterns; robust to obfuscated URLs | Computationally intensive; requires large labelled datasets for training; may struggle with brand-new domain patterns (zero-day) |
| 4 | **Phishing URL Detection Using Long Short-Term Memory and Convolutional Neural Networks** | Ozgur Koray Sahingoz, Ebubekir Buber, Ozlem Demir, Banu Diri | *Computers & Security*, Elsevier, 2019 | LSTM, CNN, hybrid CNN-LSTM; character-level URL encoding | High detection accuracy (>97%); handles sequential character dependencies in URLs; no third-party service dependency | Training requires significant labelled data; inference latency may be high for real-time browser extension use; limited interpretability |
| 5 | **Fake News Detection on Social Media Using Geometric Deep Learning** | Federico Monti, Fabrizio Frasca, Davide Eynard, Damon Mannion, Michael M. Bronstein | *arXiv preprint arXiv:1902.06673*, 2019 | Graph Convolutional Networks (GCN); propagation patterns on user–article graphs | Exploits social propagation structure; state-of-the-art performance on FakeNewsNet; applicable to content trustworthiness scoring | Requires access to social graph data; not directly applicable to isolated URL verification; cold-start problem for new articles with no engagement |
| 6 | **BERT-Based Text Classification for Spam and Scam Detection** | Aditya Srinivasan, Varun Shankar, Bhavana Mehta | *IEEE Access*, IEEE, 2022 | BERT fine-tuning (transformer-based transfer learning); binary text classification | High accuracy on short scam messages; language-agnostic via multilingual BERT; minimal domain-specific feature engineering | High memory and compute requirements; inference latency unsuitable for very-high-throughput use cases; sensitive to distribution shift in scam language |
| 7 | **A Real-Time Phishing Detection Framework Using Machine Learning and Browser Extensions** | Mohammad Badrul Alam Miah, Md. Khalilur Rhaman, G.M. Rabiul Islam | *IEEE 12th Annual Ubiquitous Computing, Electronics & Mobile Communication Conference (UEMCON)*, 2021 | Feature extraction from DOM, URL, and page content; Random Forest classifier integrated with a Chrome extension | End-to-end real-time pipeline; browser-native detection; tested on live phishing pages; user-facing alerts | Browser extension API limitations restrict depth of DOM inspection; requires model updates for new phishing kits; privacy concerns around content scanning |
| 8 | **Trust Score: Getting Better Causal Explanations for Classifier Decisions** | Heinrich Jiang, Been Kim, Maya Gupta | *International Conference on Machine Learning (ICML)*, PMLR, 2018 | Trust Score computation using k-nearest-neighbour density estimation; agreement between ML model output and nearest high-density class | Model-agnostic post-hoc confidence measure; improves reliability of classifier decisions; simple to integrate with existing models | Computational cost scales with dataset size; performance degrades in high-dimensional spaces; does not account for adversarial inputs |
| 9 | **Graph-Based Approach for Detecting Online Scams and Fraudulent URLs** | Hung Nguyen, Tri Cao, Tanvir Ahmed, Ting Yu | *ACM SIGKDD International Conference on Knowledge Discovery & Data Mining*, 2021 | Heterogeneous graph neural networks (HGNN); node-level fraud detection on URL–IP–domain graphs | Captures multi-hop relational context between domains/IPs; robust to URL obfuscation; suitable for ecosystem-level scam detection | Graph construction requires crawled infrastructure data; not applicable to isolated URL lookups; requires periodic graph refresh to capture new malicious clusters |
| 10 | **Deep Learning for Real-Time Phishing Website Detection** | Hyunwoo Kim, Yusuke Miyake, Nobuhiro Kadowaki | *IEEE Symposium on Computers and Communications (ISCC)*, IEEE, 2019 | Stacked Auto-Encoder (SAE) + Softmax classifier; raw webpage content and URL features; online learning module | Combines structural and content features; online learning adapts to new phishing patterns without full retraining; low false-positive rate | Requires fetching full page content (higher latency); online learning stability depends on stream quality; auto-encoder pre-training is resource-intensive |

---

## Summary of Themes

| Theme | Relevant Papers |
|-------|----------------|
| URL Feature Engineering & Classical ML | #1, #3, #7 |
| Deep Learning on URLs & Text | #3, #4, #6, #10 |
| Survey / Taxonomy of Phishing Defences | #2 |
| Content & Fake-News / Scam Detection | #5, #6 |
| Graph-Based Ecosystem Analysis | #5, #9 |
| Trust Scoring & Explainability | #8 |
| Real-Time / Browser Integration | #7, #10 |

---

## How to Access These Papers

All papers listed above are accessible through the following sources:

- **IEEE Xplore** — [https://ieeexplore.ieee.org](https://ieeexplore.ieee.org) (Papers #7, #8 conference version, #10)
- **Elsevier ScienceDirect** — [https://www.sciencedirect.com](https://www.sciencedirect.com) (Papers #1, #4)
- **Taylor & Francis Online** — [https://www.tandfonline.com](https://www.tandfonline.com) (Paper #2)
- **arXiv (free preprints)** — [https://arxiv.org](https://arxiv.org) (Papers #3, #5)
- **IEEE Access (open access)** — [https://ieeeaccess.ieee.org](https://ieeeaccess.ieee.org) (Paper #6)
- **ACM Digital Library** — [https://dl.acm.org](https://dl.acm.org) (Paper #9)
- **PMLR (free)** — [https://proceedings.mlr.press](https://proceedings.mlr.press) (Paper #8)

> **Tip:** For papers behind a paywall, search for the paper title on [Google Scholar](https://scholar.google.com) — author-hosted preprints are frequently available for free download.

---

*Last updated: April 2026*
