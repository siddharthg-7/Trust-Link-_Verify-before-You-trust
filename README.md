
# TrustLink — Verify Before You Trust

<p align="center">
  <b>An AI-powered platform to detect scams, verify links, and validate digital content before you take action.</b>
  <hr/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/State-Redux-764ABC?style=flat-square&logo=redux" />
  <img src="https://img.shields.io/badge/Routing-React%20Router-CA4245?style=flat-square&logo=react-router" />
  <img src="https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/UI-shadcn/ui-black?style=flat-square" />
  <img src="https://img.shields.io/badge/Backend-Express-000000?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/Database-Firebase-FFCA28?style=flat-square&logo=firebase" />
  <img src="https://img.shields.io/badge/AI-Gemini_API-4285F4?style=flat-square&logo=google" />
  <img src="https://img.shields.io/badge/ML-TensorFlow.js-FF6F00?style=flat-square&logo=tensorflow" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square" />
</p>

---

##  Overview

**TrustLink** is designed to act as a **trust layer for the internet**, helping users identify scams, phishing links, fake internships, and misleading promotions.

The platform combines:
- **Intelligent UI design** - **Scalable frontend architecture** - **Future-ready AI integration** ---

##  Literature Survey Analysis

The development of **TrustLink** is backed by extensive research into phishing detection, URL analysis, and deep learning techniques.

| #  | Paper Title | Authors | Journal / Year | Algorithms Used | Pros | Cons | Link |
| -- | ------------------------------------------------------------------------ | ------------------- | ----------------------- | --------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| 1  | Phishing Detection Using Machine Learning Techniques | V. Shahrivari | arXiv, 2020 | Random Forest, SVM, XGBoost, ANN | Multiple ML comparison; High accuracy | Feature engineering needed | [Link](https://arxiv.org/abs/2009.11116) |
| 2  | URLNet: Learning a URL Representation with Deep Learning | H. Le et al. | arXiv, 2018 | CNN (char + word embeddings) | No manual features; Scalable | High compute cost | [Link](https://arxiv.org/pdf/1802.03162) |
| 3  | Phishing URL Detection: A Network-Based Approach Robust to Evasion | Taeri Kim et al. | arXiv, 2022 | Graph-based inference | Handles evasion attacks; High F1 | Complex graph modeling | [Link](https://arxiv.org/pdf/2209.01454) |
| 4  | Precise URL Phishing Detection Using Neural Networks | A. Rangapur et al. | arXiv, 2021 | LSTM, GRU, RNN models | High accuracy; Works on sequence | Training complexity | [Link](https://arxiv.org/pdf/2110.13424) |
| 5  | Detecting Phishing Web Pages Using Raw URL and HTML Features (WebPhish) | C. Opara et al. | arXiv, 2020 | CNN, Deep Neural Networks | Uses both HTML + URL | Higher computation | [Link](https://arxiv.org/pdf/2011.04412) |
| 6  | A Transformer-Based Model to Detect Phishing URLs | Pingfan Xu | arXiv, 2021 | Transformer model | High accuracy (~97%); Context-aware | Heavy computation | [Link](https://arxiv.org/abs/2109.02138) |
| 7  | VisualPhishNet: Zero-Day Phishing Website Detection by Visual Similarity | Abdelnabi et al. | arXiv, 2019 | CNN, Visual similarity | Detects unseen attacks | Requires image data | [Link](https://arxiv.org/abs/1909.00300) |
| 8  | Detecting Phishing Sites — An Overview | Kalaharsha & Mehtre | arXiv, 2021 | Survey of ML, blacklist, heuristic | Covers 18 models; Strong base | No implementation; Survey only | [Link](https://arxiv.org/abs/2103.12739) |
| 9  | Web Phishing Net (WPN): Scalable ML-Based Detection | M.F. Zia et al. | arXiv, 2025 | Hash-based clustering, ML | Scalable; Handles modern phishing | Limited real-world deployment | [Link](https://arxiv.org/pdf/2502.13171) |
| 10 | Least-to-Most Prompting for Phishing URL Detection (LLM-Based) | H. Trikilis et al.  | arXiv, 2026 | LLM reasoning, Prompt engineering | Low data requirement; Explainable AI | New approach; Limited validation | [Link](https://arxiv.org/pdf/2601.20270) |

For a more detailed analysis, see [Literature_Survey.md](./Literature-Survey-Analysis/Literature%20Survey/Literature_Survey.md).

---

##  Project Structure

```text
Trust-Link-
├── src/                # Source files
│   ├── components/     # Reusable UI components (Atomic Design)
│   ├── pages/          # Application pages (routes)
│   ├── utils/          # Utility functions
│   ├── store/          # Redux store & slices
│   └── services/       # API calls & integrations
├── public/             # Static assets
├── tests/              # Unit & integration tests
├── README.md           # Documentation
└── package.json        # Project metadata
```

---

##  Architecture

This project follows a **modular and scalable architecture**, ensuring clean separation of concerns.

### 🔹 Key Principles

* **Atomic Design Pattern**
    * **Atoms** → Buttons, Inputs  
    * **Molecules** → Forms, Cards  
    * **Organisms** → Sections, Layouts  

* **Component-Based Structure**
    * Each component has a single responsibility to promote reusability.  

* **State Management (Redux)**
    * Centralized state handling and predictable data flow.  

* **Routing Layer**
    * Managed using **React Router** for clean navigation.  

---

## 🔧 Tech Stack (Detailed)

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Technology</th>
      <th>Version / Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Frontend Framework</b></td>
      <td>React.js</td>
      <td>^19.0.0 — UI library with hooks & components</td>
    </tr>
    <tr>
      <td><b>Routing</b></td>
      <td>React Router DOM</td>
      <td>^7.14.0 — Client-side routing</td>
    </tr>
    <tr>
      <td><b>State Management</b></td>
      <td>Redux</td>
      <td>Centralized state management</td>
    </tr>
    <tr>
      <td><b>Styling</b></td>
      <td>Tailwind CSS + CSS Modules</td>
      <td>Utility-first + scoped styling</td>
    </tr>
    <tr>
      <td><b>UI Components</b></td>
      <td>shadcn/ui, Radix UI</td>
      <td>Accessible & headless components</td>
    </tr>
    <tr>
      <td><b>Icons</b></td>
      <td>Lucide React, React Icons</td>
      <td>SVG-based icon libraries</td>
    </tr>
    <tr>
      <td><b>Animations</b></td>
      <td>Framer Motion</td>
      <td>Advanced UI animations</td>
    </tr>
    <tr>
      <td><b>Charts</b></td>
      <td>Recharts, Chart.js</td>
      <td>Data visualization</td>
    </tr>
    <tr>
      <td><b>Backend</b></td>
      <td>Express.js</td>
      <td>Node.js server framework</td>
    </tr>
    <tr>
      <td><b>Security</b></td>
      <td>Helmet, CORS</td>
      <td>HTTP security & cross-origin control</td>
    </tr>
    <tr>
      <td><b>AI / ML</b></td>
      <td>TensorFlow.js, Transformers, Gemini API</td>
      <td>Client & server-side ML</td>
    </tr>
    <tr>
      <td><b>Database / BaaS</b></td>
      <td>Firebase</td>
      <td>Auth + Realtime DB</td>
    </tr>
    <tr>
      <td><b>HTTP Client</b></td>
      <td>Axios</td>
      <td>API requests</td>
    </tr>
    <tr>
      <td><b>Build Tool</b></td>
      <td>Vite</td>
      <td>Fast bundler</td>
    </tr>
    <tr>
      <td><b>Language</b></td>
      <td>TypeScript</td>
      <td>Type-safe development</td>
    </tr>
  </tbody>
</table>

---

## 📊 Project Stats

<table>
  <tr>
    <td><b>Language</b></td>
    <td>TypeScript — 281,652 bytes</td>
  </tr>
  <tr>
    <td><b>Markup</b></td>
    <td>HTML — 418 bytes</td>
  </tr>
  <tr>
    <td><b>Styling</b></td>
    <td>CSS — 1,768 bytes</td>
  </tr>
  <tr>
    <td><b>Architecture</b></td>
    <td>React + Express + Firebase</td>
  </tr>
</table>

---

##  Features

*  **Link Verification Interface** *  **Content Validation UI** (messages/files)  
*  **Trust Score Visualization** (planned)  
*  **Scam Reporting System** (planned)  
*  **Responsive Design** * 
* **Modular & Scalable Codebase**

---

##  Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/siddharthg-7/Trust-Link-_Verify-before-You-trust.git
```

### 2. Navigate to Project Directory
```bash
cd Trust-Link-_Verify-before-You-trust
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Application
```bash
npm start
```

---

##  Testing

Run tests using:
```bash
npm test
```
* Uses **Jest** and **React Testing Library**.
* Focuses on component-level and integration testing.

---

##  Contribution Guidelines

We welcome contributions from everyone! 

1.  **Fork** the repository.
2.  **Create** a new branch: `git checkout -b feature/your-feature-name`.
3.  **Commit** your changes: `git commit -m "Add: your feature description"`.
4.  **Push** to your branch: `git push origin feature/your-feature-name`.
5.  **Open** a Pull Request.

---

##  Future Roadmap

- [ ]  AI-based scam detection integration
- [ ]  Backend + database integration
- [ ]  Advanced trust scoring system
- [ ]  WhatsApp bot integration
- [ ]  Browser extension

---

##  License

This project is licensed under the **MIT License**.

> ** Vision:** To build a system where users don’t just access information — they verify it before trusting it.

---

##  Author

**Gilakathi Siddhartha Goud** 
<br>
*Building systems that solve real-world problems.*

## 📧 Python Email Service Setup

The platform uses a Python-based microservice for high-reliability Gmail SMTP notifications.

### 1. Prerequisites
- Python 3.8+
- Gmail App Password (see [Google App Passwords](https://myaccount.google.com/apppasswords))

### 2. Installation
```bash
cd backend/app
pip install -r requirements.txt
```

### 3. Running the Service
```bash
python main.py
```
The service will start on `http://localhost:5000`. The Express server automatically communicates with this service.

---

## 🚀 Unified Deployment on Railway.app (Free Tier)

Railway.app hosts the **backend (Node.js + Express)**, **frontend (React/Vite)**, and **Python email service** all in a single service — no Firebase Blaze tier required.

### Prerequisites
- [Railway.app](https://railway.app) account (free, no credit card)
- Firebase project for Auth + Firestore (free Spark tier)
- Gmail App Password for SMTP emails

### Step 1 — Fork & connect
1. Fork this repository to your GitHub account.
2. Go to [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo**.
3. Select your forked repository.

### Step 2 — Set environment variables
In the Railway dashboard **Variables** tab, add all variables from [`railway.env.example`](./railway.env.example):

| Variable | Description |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (Railway sets this automatically) |
| `JWT_SECRET` | Random 32-byte hex string |
| `SMTP_EMAIL` | Your Gmail address |
| `SMTP_PASSWORD` | 16-char Gmail App Password |
| `ADMIN_EMAIL` | Email that receives complaint alerts |
| `PYTHON_SERVICE_URL` | `http://127.0.0.1:5000/send-email` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (single-line) |
| `VITE_FIREBASE_*` | Firebase client config values |
| `GEMINI_API_KEY` | Google Gemini API key |
| `VITE_APP_URL` | Your Railway deployment URL (after first deploy) |

### Step 3 — Deploy
Click **Deploy** in Railway. The build process will:
1. `npm install && npm run build` — install Node deps and build the React app
2. `pip install -r backend/app/requirements.txt` — install Python deps
3. `bash start.sh` — start the Python email service (port 5000) then the Node.js server

### Step 4 — Update APP_URL
After the first successful deploy, copy the Railway-provided URL and update the `VITE_APP_URL` / `APP_URL` environment variables.

### Architecture
```
Railway (single service)
├── Node.js Express server  (PORT 3000)
│   ├── /api/*              — REST API
│   └── /*                  — React SPA (static files)
└── Python Flask server     (port 5000, internal only)
    └── /send-email         — Gmail SMTP microservice

Firebase (external, free Spark tier)
├── Authentication
└── Firestore Database
```

> **No Firebase Cloud Functions needed** — all compute runs on Railway. Firebase is used only for Auth and Firestore.

