
# TrustLink — Verify Before You Trust

<p align="center">
  <b>An AI-powered platform to detect scams, verify links, and validate digital content before you take action.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/State-Redux-764ABC?style=flat-square&logo=redux" />
  <img src="https://img.shields.io/badge/Routing-React%20Router-CA4245?style=flat-square&logo=react-router" />
  <img src="https://img.shields.io/badge/Testing-Jest-C21325?style=flat-square&logo=jest" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square" />
</p>

---

##  Overview

**TrustLink** is designed to act as a **trust layer for the internet**, helping users identify scams, phishing links, fake internships, and misleading promotions.

The platform combines:
- **Intelligent UI design** - **Scalable frontend architecture** - **Future-ready AI integration** ---

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

**Gilakathi Siddhartha Goud** *Building systems that solve real-world problems.*
```
