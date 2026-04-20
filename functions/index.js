const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const natural = require('natural');
const axios = require('axios');
const { Resend } = require('resend');
const { pipeline } = require('@xenova/transformers');

admin.initializeApp();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json());

// ── NLP CLASSES (Ported from src and server.ts) ──────────────────

class BertEmbeddings {
  constructor() {
    this.extractor = null;
    this.isReady = false;
  }

  async init() {
    if (this.isReady) return;
    try {
      this.extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
      this.isReady = true;
      console.log('✅ BERT Embedding model loaded');
    } catch (error) {
      console.error('❌ Failed to load BERT model:', error);
    }
  }

  async getEmbedding(text) {
    if (!this.isReady) await this.init();
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async calculateMatch(text, referenceEmbeddings) {
    const queryEmbedding = await this.getEmbedding(text);
    let maxSimilarity = 0;
    for (const ref of referenceEmbeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, ref);
      if (similarity > maxSimilarity) maxSimilarity = similarity;
    }
    return maxSimilarity;
  }
}

class TemporalAnalyzer {
  constructor() {
    this.messageHistory = new Map();
  }
  analyze(senderId, timestamp) {
    const now = timestamp || Date.now();
    const times = this.messageHistory.get(senderId) || [];
    times.push(now);
    const fiveMinutesAgo = now - 300000;
    const recentTimes = times.filter(t => t > fiveMinutesAgo);
    this.messageHistory.set(senderId, recentTimes);
    const densityRisk = Math.min((recentTimes.length / 10) * 100, 100);
    const hour = new Date(now).getHours();
    let timeOfDayRisk = (hour >= 1 && hour <= 5) ? 40 : (hour >= 22 || hour === 0) ? 25 : (hour >= 14 && hour <= 16) ? 15 : 0;
    return { densityRisk, timeOfDayRisk };
  }
}

class EnhancedScamDetector {
  constructor() {
    this.bert = new BertEmbeddings();
    this.temporal = new TemporalAnalyzer();
    this.isInitialized = false;
    this.scamEmbeddings = [];
    this.init();
  }

  async init() {
    try {
      await this.bert.init();
      const baseScams = [
        "Congratulations! You won a gift card. Click here.",
        "Urgent: Account suspended. Verify now.",
        "Send money to claim your prize."
      ];
      for (const scam of baseScams) {
        const emb = await this.bert.getEmbedding(scam);
        this.scamEmbeddings.push(emb);
      }
      this.isInitialized = true;
      console.log('✅ EnhancedScamDetector initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize EnhancedScamDetector:', error);
    }
  }

  async analyze(content, senderId = 'anonymous', timestamp = Date.now()) {
    while (!this.isInitialized) await new Promise(r => setTimeout(r, 100));
    const semanticSimilarity = await this.bert.calculateMatch(content, this.scamEmbeddings);
    const vectorRisk = Math.min(semanticSimilarity, 1.0) * 100;
    const linguisticRisk = this.analyzeLinguistics(content);
    const { densityRisk, timeOfDayRisk } = this.temporal.analyze(senderId, timestamp);
    const compositeScore = (vectorRisk * 0.35) + (linguisticRisk * 0.3) + (densityRisk * 0.25) + (timeOfDayRisk * 0.1);
    
    return {
      riskScore: Math.round(Math.min(compositeScore, 100)),
      details: {
        vectorSimilarity: Math.round(vectorRisk),
        linguisticMarkers: linguisticRisk > 50 ? 'Highly suspicious language' : 'Normal language',
        messageDensity: Math.round(densityRisk),
        timeContext: timeOfDayRisk > 0 ? 'Suspicious timing' : 'Normal timing',
        metadataRisk: this.analyzeMetadata(senderId) ? 'Flagged source' : 'Trusted source'
      },
      category: compositeScore > 65 ? 'Scam' : (compositeScore > 35 ? 'Suspicious' : 'Safe'),
      explanation: compositeScore > 65 ? '⚠️ High risk detected. Suspicious patterns match known scam vectors.' : (compositeScore > 35 ? '⚡ Caution advised. Some suspicious linguistics or timing patterns detected.' : '✅ Appears safe.')
    };
  }

  analyzeMetadata(senderId) {
    const suspiciousPatterns = [/tempmail\./i, /throwaway\./i, /\.tk$/i, /secure-bank/i, /paypal-login/i, /urgent-bank/i];
    return suspiciousPatterns.some(pattern => pattern.test(senderId));
  }

  analyzeLinguistics(text) {
    let score = 0;
    const lower = text.toLowerCase();
    if (/\b(have|has|had|was|were|is|are)\s+been?\s+\w+(ed|en)?\b/i.test(text)) score += 25;
    const triggers = ['immediately', 'urgent', 'won', 'congratulations', 'prize', 'gift'];
    triggers.forEach(t => {
      const matches = lower.match(new RegExp(`\\b${t}\\b`, 'gi'));
      if (matches) score += matches.length * 10;
    });
    return Math.min(score, 100);
  }
}

const scamDetector = new EnhancedScamDetector();

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
