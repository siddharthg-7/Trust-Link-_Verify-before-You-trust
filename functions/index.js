const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const axios = require("axios");
const natural = require("natural");

// ── FIREBASE ADMIN ──────────────────────────────────────────────
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

const app = express();

// ── MIDDLEWARE ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json());

// ── NLP SERVICE (Sync with server.ts) ──────────────────────────
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
            { regex: /(bit\.ly|tinyurl\.com|goo\.gl|rb\.gy)/i, score: 2.2, label: 'Suspicious Shortlink' },
            { regex: /(?:\d{4}[-\s]?){3}\d{4}/, score: 2.8, label: 'Possible Credit Card Number' },
            { regex: /\b\d{3}-\d{2}-\d{4}\b/, score: 3.0, label: 'Social Security Number Pattern' },
            { regex: /\b(?:seed|recovery|mnemonic)\s+phrase\b/i, score: 3.5, label: 'Crypto Seed Phrase Request' },
            { regex: /\bgift\s+card\b/i, score: 2.5, label: 'Gift Card Payment Request' },
            { regex: /\bwire\s+transfer\b/i, score: 2.2, label: 'Wire Transfer Request' },
            { regex: /\$[\d,]+(?:\.\d{2})?\s*(?:million|billion)/i, score: 2.5, label: 'Large Sum Mention' },
            { regex: /(?:100|guaranteed?)\s*%\s*(?:return|profit)/i, score: 2.8, label: 'Guaranteed Profit Claim' },
            { regex: /(?:earn|make)\s+\$[\d,]+\s+(?:per|a)\s+(?:day|week)/i, score: 2.6, label: 'Get Rich Quick Pattern' },
        ];
    }
    detect(text) {
        return this.patterns
            .filter(p => p.regex.test(text))
            .map(p => ({ label: p.label, score: p.score }));
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
            "Congratulations! You have won a $1000 Walmart gift card.",
            "URGENT: Your bank account has been suspended. Verify now.",
            "FINAL NOTICE: Your Netflix subscription will be cancelled.",
            "IRS Notice: You owe $2,400 in back taxes. Call now.",
            "BITCOIN INVESTMENT OPPORTUNITY: Turn $100 into $10,000!",
            "You are a winner! Send bank details to claim prize.",
            "FBI CYBER DIVISION: Your IP has been flagged. Pay fine.",
        ];
        const safes = [
            "Hi, just wanted to confirm our meeting tomorrow at 3pm.",
            "Your order has been shipped! Track at amazon.com",
            "The quarterly report is attached for your review.",
            "Your GitHub pull request has been approved.",
        ];
        scams.forEach(s => this.bayesClassifier.addDocument(s, 'scam'));
        safes.forEach(s => this.bayesClassifier.addDocument(s, 'safe'));
        this.bayesClassifier.train();
    }
    analyze(content) {
        const classifications = this.bayesClassifier.getClassifications(content);
        const scamProb = classifications.find(c => c.label === 'scam')?.value || 0;
        
        const detectedPatterns = this.patterns.detect(content);
        const patternScore = detectedPatterns.reduce((sum, p) => sum + p.score, 0);
        const keywordScore = this.keywords.getScore(content);

        let rawScore = -1.5 + (scamProb - 0.5) * 8 * 0.4 + keywordScore * 0.35 + patternScore * 0.25;
        const riskScore = Math.round((1 / (1 + Math.exp(-rawScore))) * 100);

        return {
            riskScore,
            riskLevel: riskScore > 65 ? 'high' : riskScore > 35 ? 'medium' : 'low',
            complaintType: riskScore > 50 ? 'Fraud' : 'General',
            findings: detectedPatterns.map(p => p.label),
            confidence: Math.round(scamProb * 100)
        };
    }
}

const scamDetector = new NodeScamDetector();

// ── HELPERS ────────────────────────────────────────────────────
const triggerEmailService = async (data) => {
    try {
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'https://trust-link-email-service.onrender.com/send-email';
        await axios.post(pythonServiceUrl, data);
        console.log(`✅ Python Email Service triggered for: ${data.type}`);
    } catch (error) {
        console.error(`❌ Python Email Service failed: ${error.message}`);
    }
};

const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

// ── API ROUTES ─────────────────────────────────────────────────

// 1. Create Complaint
app.post('/complaint', async (req, res) => {
    try {
        const { name, email, message, title, category } = req.body;
        if (!email || !message) return res.status(400).json({ error: 'Missing fields' });

        const analysis = scamDetector.analyze(message);

        const complaintData = {
            name: name || email.split('@')[0],
            userName: name || email.split('@')[0],
            userEmail: email,
            email,
            content: message,
            message,
            title: title || 'New Complaint',
            category: category || analysis.complaintType,
            status: 'Pending Review',
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel,
            nlpFindings: analysis.findings,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('reports').add(complaintData);
        const id = docRef.id;

        // Trigger Emails via Render
        await triggerEmailService({
            type: "user_confirmation",
            email: email,
            details: { complaintId: id, message: message }
        });

        await triggerEmailService({
            type: "admin_alert",
            details: { complaintId: id, userEmail: email, message: message }
        });

        res.status(201).json({ success: true, complaintId: id, analysis });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get Complaints
app.get('/complaints', verifyAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('reports').orderBy('timestamp', 'desc').get();
        const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Resolve Complaint
app.post('/complaint/:id/resolve', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution, score } = req.body;

        const complaintRef = db.collection('reports').doc(id);
        const complaintDoc = await complaintRef.get();
        if (!complaintDoc.exists) return res.status(404).json({ error: 'Not found' });

        const complaintData = complaintDoc.data();
        await complaintRef.update({
            status: 'resolved',
            resolution,
            adminScore: score || 0,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await triggerEmailService({
            type: "resolution",
            email: complaintData.email,
            details: { complaintId: id, resolution, score }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── EXPORT ─────────────────────────────────────────────────────
exports.api = onRequest({
    memory: "1GiB",
    timeoutSeconds: 60,
    region: "us-central1"
}, app);
