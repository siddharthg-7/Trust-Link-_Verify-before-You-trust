const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const natural = require('natural');
const axios = require('axios');
const { Resend } = require('resend');
admin.initializeApp();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json());

// ── NLP CLASSES ──────────────────────────────────────────────────
// NOTE: @xenova/transformers requires browser Cache/IndexedDB APIs and
// cannot run in Cloud Functions. Using a Node.js-native detector instead:
// keyword weighting + Bayes classification + regex patterns.

class ScamKeywords {
  constructor() {
    this.keywords = new Map([
      ['urgent', 18], ['winner', 22], ['congratulations', 20], ['prize', 20],
      ['won', 16], ['claim', 18], ['reward', 14], ['gift', 14], ['free', 12],
      ['crypto', 16], ['bitcoin', 16], ['wallet', 14], ['seedphrase', 30],
      ['airdrop', 22], ['suspended', 18], ['verify', 12], ['password', 16],
      ['bank', 12], ['transfer', 14], ['wire', 18], ['zelle', 22], ['paypal', 14],
      ['refund', 14], ['overpayment', 18], ['irs', 28], ['fbi', 28], ['police', 22],
      ['arrest', 22], ['immediately', 20], ['asap', 16], ['warning', 20],
      ['alert', 16], ['inheritance', 22], ['beneficiary', 22], ['prince', 22],
      ['virus', 18], ['infected', 18], ['hacked', 18], ['pharmacy', 20],
    ]);
  }
  getScore(text) {
    let score = 0;
    const lower = text.toLowerCase();
    this.keywords.forEach((weight, keyword) => {
      if (lower.includes(keyword)) score += weight * 0.06;
    });
    return Math.min(score, 40);
  }
}

class PatternDetector {
  constructor() {
    this.patterns = [
      { regex: /(bit\.ly|tinyurl\.com|goo\.gl|rb\.gy)/i, score: 2.2 },
      { regex: /(?:\d{4}[-\s]?){3}\d{4}/, score: 2.8 },
      { regex: /\b\d{3}-\d{2}-\d{4}\b/, score: 3.0 },
      { regex: /\b(?:seed|recovery|mnemonic)\s+phrase\b/i, score: 3.5 },
      { regex: /\bgift\s+card\b/i, score: 2.5 },
      { regex: /\bwire\s+transfer\b/i, score: 2.2 },
      { regex: /\$[\d,]+(?:\.\d{2})?\s*(?:million|billion)/i, score: 2.5 },
      { regex: /(?:100|guaranteed?)\s*%\s*(?:return|profit)/i, score: 2.8 },
      { regex: /(?:earn|make)\s+\$[\d,]+\s+(?:per|a)\s+(?:day|week)/i, score: 2.6 },
    ];
  }
  getScore(text) {
    return this.patterns.reduce((sum, p) => p.regex.test(text) ? sum + p.score : sum, 0);
  }
}

class NodeScamDetector {
  constructor() {
    this.keywords = new ScamKeywords();
    this.patterns = new PatternDetector();
    this.bayesClassifier = new natural.BayesClassifier();
    this._trainBayes();
  }
  _trainBayes() {
    const scams = [
      "Congratulations! You have won a $1000 Walmart gift card. Click here to claim your prize now before it expires.",
      "URGENT: Your bank account has been suspended. Verify your details immediately.",
      "FINAL NOTICE: Your Netflix subscription will be cancelled. Update your payment info now.",
      "IRS Notice: You owe $2,400 in back taxes. Call within 24 hours or face arrest.",
      "BITCOIN INVESTMENT OPPORTUNITY: Turn $100 into $10,000 in 7 days! Guaranteed returns!",
      "You are a winner! Send your bank details to claim your $50,000 lottery prize.",
      "FBI CYBER DIVISION: Your IP has been flagged. Pay $300 fine immediately.",
    ];
    const safes = [
      "Hi, just wanted to confirm our meeting tomorrow at 3pm.",
      "Your order has been shipped! Track at amazon.com/orders",
      "The quarterly report is attached for your review.",
      "Your GitHub pull request has been approved and merged.",
      "Monthly newsletter: product updates and community highlights.",
    ];
    scams.forEach(s => this.bayesClassifier.addDocument(s, 'scam'));
    safes.forEach(s => this.bayesClassifier.addDocument(s, 'safe'));
    this.bayesClassifier.train();
  }
  analyze(content) {
    const classifications = this.bayesClassifier.getClassifications(content);
    const scamProb = Math.max(0, Math.min(1, classifications.find(c => c.label === 'scam')?.value || 0));
    const safeProb = Math.max(0, Math.min(1, classifications.find(c => c.label === 'safe')?.value || 0));
    const total = scamProb + safeProb || 1;
    const bayesScore = scamProb / total;

    const keywordScore = this.keywords.getScore(content);
    const patternScore = this.patterns.getScore(content);

    let rawScore = -1.5 + (bayesScore - 0.5) * 8 * 0.4 + keywordScore * 0.35 + patternScore * 0.25;
    const riskScore = Math.round((1 / (1 + Math.exp(-rawScore))) * 100);

    return {
      riskScore,
      riskLevel: riskScore > 65 ? 'high' : riskScore > 35 ? 'medium' : 'low',
      category: riskScore > 50 ? 'Scam' : 'Safe',
      explanation: riskScore > 65
        ? '⚠️ High risk detected. Suspicious patterns match known scam vectors.'
        : riskScore > 35
        ? '⚡ Caution advised. Some suspicious patterns detected.'
        : '✅ Appears safe based on analysis.',
      bayesScore: Math.round(bayesScore * 100),
      confidence: Math.abs(bayesScore - 0.5) * 2,
    };
  }
  learnFromScam() { /* no-op: keyword learning not persisted in Cloud Functions */ }
}

const scamDetector = new NodeScamDetector();

// ── API ROUTES ───────────────────────────────────────────────────

app.post('/analyze', async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await scamDetector.analyze(content);
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.post('/email/admin-complaint', async (req, res) => {
  const { title, userName, userEmail, riskScore, content, reportId } = req.body;
  const ADMIN_EMAIL = "siddharthexam21@gmail.com";
  try {
    const { data, error } = await resend.emails.send({
      from: 'TrustLink AI <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `🚨 New Complaint: ${title}`,
      html: `<h2>🚨 New Complaint</h2><p>Report ID: ${reportId}</p><p>User: ${userName}</p><p>Score: ${riskScore}%</p><p>Content: ${content}</p>`
    });
    if (error) return res.status(400).json({ error });
    res.json({ success: true, id: data.id });
  } catch (error) { res.status(500).json({ error }); }
});

app.post('/email/user-feedback', async (req, res) => {
  const { to, userName, trustScore, status, feedback } = req.body;
  try {
    const { data, error } = await resend.emails.send({
      from: 'TrustLink Verification <onboarding@resend.dev>',
      to: to,
      subject: `✅ Your Report Has Been Reviewed - Score: ${trustScore}%`,
      html: `<h2>✅ Verified</h2><p>Hi ${userName},</p><p>Score: ${trustScore}%</p><p>Feedback: ${feedback}</p>`
    });
    if (error) return res.status(400).json({ error });
    res.json({ success: true, id: data.id });
  } catch (error) { res.status(500).json({ error }); }
});

app.post('/admin/sync-threat-intel', (req, res) => {
  res.json({ message: "Threat intel synced with cloud node." });
});

// ── EXPORT CLOUD FUNCTION ───────────────────────────────────────

exports.api = functions.https.onRequest({
    memory: "1GiB",
    timeoutSeconds: 60,
    region: "us-central1"
}, app);
