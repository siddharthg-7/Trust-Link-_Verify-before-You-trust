import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import natural from "natural";
import axios from "axios";
import 'dotenv/config';
import admin from 'firebase-admin';
import { EmailService } from './backend/emailService.js';
import rateLimit from 'express-rate-limit';


const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'trust-link-secret-2024';

// ── FIREBASE ADMIN INITIALIZATION ──────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'trust-link-4151a',
  });
}
const db = admin.firestore();

app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(cors());
app.use(express.json());

// ── SECURITY & RATE LIMITING ────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all /api routes
app.use('/api', apiLimiter);

// ── AUTH MIDDLEWARE (Basic example) ─────────────────────────
const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // You can add logic here to check if the user has an 'admin' claim
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Serve favicon
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(process.cwd(), 'public/favicon.svg')));


// ═══════════════════════════════════════════════════════════════
//  UNIFIED NLP SERVICE LAYER
//  Supports: Scam Detection, Content Analysis, User Behavior
// ═══════════════════════════════════════════════════════════════

// ── 1. Advanced Preprocessing Pipeline ───────────────────────
class NLPPipeline {
  private tokenizer = new natural.WordTokenizer();
  private stemmer = natural.PorterStemmer;
  private stopwords = new Set(natural.stopwords);
  
  // Extended stopwords for scam detection
  private scamStopwords = new Set([
    'http', 'https', 'www', 'com', 'net', 'org', 'co',
    'click', 'here', 'link', 'visit', 'go', 'now', 'just',
    'get', 'can', 'will', 'would', 'could', 'should'
  ]);

  preprocess(text: string, options: {
    removeUrls?: boolean;
    removeEmails?: boolean;
    removePhoneNumbers?: boolean;
    stem?: boolean;
    removeStopwords?: boolean;
    lowercase?: boolean;
  } = {}): string[] {
    const {
      removeUrls = true,
      removeEmails = true,
      removePhoneNumbers = true,
      stem = true,
      removeStopwords = true,
      lowercase = true
    } = options;

    let processed = text;
    
    // Remove URLs
    if (removeUrls) {
      processed = processed.replace(/https?:\/\/[^\s]+/gi, '');
      processed = processed.replace(/www\.[^\s]+/gi, '');
      processed = processed.replace(/\b\w+\.(com|net|org|io|tk|ga|cf|gq|ml)\b/gi, '');
    }
    
    // Remove email addresses
    if (removeEmails) {
      processed = processed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
    }
    
    // Remove phone numbers
    if (removePhoneNumbers) {
      processed = processed.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4,}\b/g, '');
      processed = processed.replace(/\b\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, '');
    }
    
    // Tokenize
    let tokens = this.tokenizer.tokenize(lowercase ? processed.toLowerCase() : processed);
    
    if (!tokens) return [];
    
    // Remove short tokens
    tokens = tokens.filter(t => t.length > 2);
    
    // Remove standard stopwords
    if (removeStopwords) {
      const allStopwords = new Set([...this.stopwords, ...this.scamStopwords]);
      tokens = tokens.filter(t => !allStopwords.has(t));
    }
    
    // Apply stemming
    if (stem) {
      tokens = tokens.map(t => this.stemmer.stem(t));
    }
    
    return tokens;
  }

  getNGrams(text: string, n: number = 2): string[] {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    const ngrams: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  }
}

// ── 2. Advanced Feature Extraction ───────────────────────────
interface TextFeatures {
  tokenCount: number;
  uniqueTokenCount: number;
  avgTokenLength: number;
  urlCount: number;
  emailCount: number;
  phoneCount: number;
  currencyMentionCount: number;
  capsRatio: number;
  exclaimCount: number;
  questionCount: number;
  digitRatio: number;
  specialCharRatio: number;
  urgencyScore: number;
  financialRiskScore: number;
  impersonationScore: number;
}

class FeatureExtractor {
  extract(text: string, keywords: Map<string, number>): TextFeatures {
    const tokens = text.split(/\s+/);
    const uniqueTokens = new Set(tokens.map(t => t.toLowerCase()));
    
    // Basic counts
    const urlCount = (text.match(/https?:\/\/[^\s]+/gi) || []).length;
    const emailCount = (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).length;
    const phoneCount = (text.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4,}\b/g) || []).length;
    const currencyMentionCount = (text.match(/\$[\d,]+/gi) || []).length;
    const exclaimCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    const digits = (text.match(/\d/g) || []).length;
    const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    
    // Calculate ratios
    const capsWords = tokens.filter(w => w.length > 3 && w === w.toUpperCase());
    const avgTokenLength = tokens.reduce((sum, t) => sum + t.length, 0) / Math.max(tokens.length, 1);
    
    return {
      tokenCount: tokens.length,
      uniqueTokenCount: uniqueTokens.size,
      avgTokenLength,
      urlCount,
      emailCount,
      phoneCount,
      currencyMentionCount,
      capsRatio: capsWords.length / Math.max(tokens.length, 1),
      exclaimCount,
      questionCount,
      digitRatio: digits / Math.max(text.length, 1),
      specialCharRatio: specialChars / Math.max(text.length, 1),
      urgencyScore: this.calculateUrgencyScore(text),
      financialRiskScore: this.calculateFinancialRisk(text, keywords),
      impersonationScore: this.calculateImpersonation(text)
    };
  }

  private calculateUrgencyScore(text: string): number {
    const urgencyPatterns = [
      /\b(urgent|immediately|asap|now| today| tonight| expires?| deadline| last chance| limited time| 24 hours?| 48 hours?)\b/gi,
      /!+/,
      /\b(FINAL|NOW|IMMEDIATE|URGENT)\b/g
    ];
    
    let score = 0;
    urgencyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 2;
    });
    
    return Math.min(score, 20);
  }

  private calculateFinancialRisk(text: string, keywords: Map<string, number>): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    keywords.forEach((weight, keyword) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += weight;
      }
    });
    
    return Math.min(score / 10, 20);
  }

  private calculateImpersonation(text: string): number {
    const impersonationBrands = [
      'irs', 'fbi', 'microsoft', 'apple', 'amazon', 'netflix', 'paypal',
      'google', 'facebook', 'twitter', 'instagram', 'bank of america', 'chase',
      'wells fargo', 'citi', 'support', 'ceo', 'director', 'agent'
    ];
    
    let score = 0;
    const lowerText = text.toLowerCase();
    
    impersonationBrands.forEach(brand => {
      if (lowerText.includes(brand)) {
        score += 3;
      }
    });
    
    return Math.min(score, 15);
  }
}

// ── 3. Multi-Model Ensemble ─────────────────────────────────
type ClassificationResult = {
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
};

class EnsembleClassifier {
  private bayesClassifier = new natural.BayesClassifier();
  private isTrained = false;
  
  // Scam training data
  private scamExamples = [
    "Congratulations! You have won a $1000 Walmart gift card. Click here to claim your prize now before it expires.",
    "URGENT: Your bank account has been suspended. Verify your details immediately at http://secure-bank-update.com",
    "Your PayPal account is limited. Please confirm your identity by logging in here: http://paypal-security.tk",
    "You've been selected for a FREE iPhone 14! Just pay shipping of $4.99. Limited offer expires today!",
    "FINAL NOTICE: Your Netflix subscription will be cancelled. Update your payment info now to continue streaming.",
    "IRS Notice: You owe $2,400 in back taxes. Call 1-800-555-FAKE within 24 hours or face arrest.",
    "Hi, I am the CEO of Microsoft and I need your help transferring $500,000 out of the country secretly.",
    "BITCOIN INVESTMENT OPPORTUNITY: Turn $100 into $10,000 in 7 days! Guaranteed returns! Act now!",
    "Your Amazon package could not be delivered. Update your address here: amaz0n-delivery-confirm.com",
    "You are a winner! Send your bank details and social security number to claim your $50,000 lottery prize.",
    "CRYPTO AIRDROP: Connect your MetaMask wallet to claim 500 ETH. Limited time! Visit: claimairdrop.io",
    "Dear customer, your account has been hacked. Reset your password via this secure link immediately.",
    "You have been pre-approved for a $50,000 loan with NO credit check! Call us now to get your money.",
    "ALERT: Suspicious login detected on your account. Verify identity at: accountverify-secure.net/login",
    "Hi, this is Apple Support. Your iCloud account is about to be deleted. Call us now: 1-888-555-0199",
    "Send $500 in Google Play gift cards to reinstate your account. Our agents are waiting for your call.",
    "DEAR BENEFICIARY: You have been selected to receive a $4.5 million inheritance. Send processing fee now.",
    "FBI CYBER DIVISION: Your IP address has been flagged for illegal activity. Pay $300 fine immediately.",
    "Donate your seed phrase to verify your wallet and receive 2x the crypto back. Limited time promotion.",
    "Your Venmo payment of $847 has failed. Update your billing info here or your account will be closed.",
    "Nigerian Prince: I need to transfer 10 million dollars and need your bank account details to do so.",
    "You won the UK lottery! Ref: UKL/2024/WIN. Contact our agent to process your prize of 800,000 GBP.",
    "Work from home and earn $5000 weekly! No experience needed. Join our exclusive program today!",
    "URGENT WARNING: Your computer has been infected with a virus. Call Microsoft support immediately.",
    "Your Zelle transfer of $1200 has been declined. Verify your account to complete the transaction.",
    "Hot singles in your area want to meet you tonight! Click here to see their photos and messages.",
    "You qualify for a government stimulus check of $2,000. Claim your money at: stimulus-relief-2024.com",
    "Limited time: Get 90% off luxury watches from Switzerland. Authentic Rolex for only $199!",
    "ACCOUNT SUSPENDED: Your PayPal account has been permanently limited due to suspicious activity.",
    "Homeland Security Department: You must pay $900 or face deportation. Call immediately.",
    "pharmacy rx meds online no prescription needed cheap pills buy now discount offer",
    "click here to verify your account credentials email password login expired update now urgent",
    "FREE money cash prize winner selected today claim your reward before midnight expires soon",
    "Refund $4000 overpayment from IRS contact agent now wire transfer required immediately sensitive",
    "Your invoice #4821 is overdue. Pay now to avoid service interruption. Wire to account 98732847.",
    "romance scam hi beautiful i am american soldier stationed overseas need money to fly home love",
    "investment fraud guaranteed 300 percent returns monthly passive income bitcoin crypto no risk",
    "phishing verify your credentials account suspended unauthorized access detected login immediately",
    "tech support your computer has virus remote access needed call 1800 fix now microsoft certified",
    "advance fee fraud release of funds require processing fee confidential transfer offshore account",
    "Urgent: Your social security number has been used in a crime. Call us to avoid immediate arrest.",
    "Free government grants for everyone! No payback required. Fill out the application at our web link.",
    "Your car insurance is expiring. Save 50% by renewing today at our exclusive partner site.",
    "Earn money by testing products at home! High pay, free products. Sign up at the link.",
    "Your Chase account has suspicious activity. Secure your funds here: chase-secure-access.com",
    "Netflix payment failed. We will close your account unless you update your info within 12 hours.",
    "Claim your $100 Shell gift card. Just answer this 30-second survey to qualify.",
    "Your FedEx delivery is on hold. Pay a $2 re-delivery fee at this link to receive your box.",
    "A relative in another country has left you millions. Contact the lawyer at this Gmail address.",
    "Get rich quick with our new AI trading bot! No experience needed, 100% success rate.",
    "Your student loan forgiveness has been approved! Call us to finalize the documents and clear your debt.",
    "Discord Nitro for free! Just click this link and sign in with your Discord account to claim.",
    "Get 10,000 TikTok followers in one hour! Best price and instant delivery at our site.",
    "Your Bank of America card has been blocked. Unblock it now by providing your PIN at the link.",
    "Urgent: Your Apple ID is being used in Russia. If this is not you, click here to lock your account.",
  ];

  private safeExamples = [
    "Hi John, just wanted to confirm our meeting tomorrow at 3pm. Let me know if that still works for you.",
    "The quarterly report has been attached for your review. Please provide your feedback by Friday.",
    "Your order #12345 has been shipped! Expected delivery: April 15. Track at amazon.com/orders",
    "Reminder: Your doctor's appointment is scheduled for tomorrow at 10:30 AM at City Medical Center.",
    "The team lunch is happening this Thursday at noon. We'll be going to the Italian place on Main St.",
    "Please find attached the invoice for the web design services provided in March 2024.",
    "Happy Birthday! Hope you have a wonderful day filled with joy and celebration.",
    "Your GitHub pull request has been approved and merged into the main branch successfully.",
    "Meeting notes from today's standup: sprint velocity is on track, no blockers reported.",
    "The new library update is available. Check the changelog at github.com/repo for details.",
    "Course material for Module 3 has been uploaded to the student portal. Please review before Monday.",
    "Your flight AA1234 departs at 6:45 AM from Terminal B. Check-in opens 24 hours before departure.",
    "Congratulations on completing the certification! Your certificate will be emailed within 48 hours.",
    "The package you ordered from Shop.com has been delivered to your front door.",
    "Monthly newsletter: Read about our latest product updates and community highlights.",
    "Your subscription renews on May 1st for $9.99. Manage your plan at netflix.com/account.",
    "Research results are in! The new algorithm reduces processing time by 40%.",
    "Please complete the employee satisfaction survey by end of week. Your feedback matters.",
    "The conference registration is confirmed. We look forward to seeing you in San Francisco.",
    "Thanks for reporting that bug. We've opened ticket #5521 and will address it in the next patch.",
    "Hey, can we reschedule our call to 4pm? Something came up at work this afternoon.",
    "The project deadline has been extended to April 30th based on stakeholder feedback.",
    "Your password was changed successfully. If you didn't make this change, contact support.",
    "Weekly digest: Here are the top stories in technology from the past week.",
    "Your tax documents are ready to download in your account dashboard.",
    "The new office policy on remote work has been posted to the company intranet.",
    "Please review and sign the employment contract attached before your start date.",
    "A new comment was posted on your article about machine learning algorithms.",
    "The library book you requested is now available for pickup at the main branch.",
    "Reminder: Your parking permit expires on June 30th. Renew at city.gov/parking.",
    "Your git commit has passed all CI/CD checks and is ready for code review.",
    "We have received your support ticket and will respond within 24 business hours.",
    "The annual performance review cycle begins next Monday. Your manager will reach out to schedule.",
    "Inventory alert: Item SKU-4892 is running low. Current stock: 12 units remaining.",
    "Your appointment with Dr. Smith has been rescheduled to April 22 at 2:30 PM.",
    "The new employee handbook has been updated. Please read the section on remote work policies.",
    "Hi, I forgot to ask if you're coming to the soccer game this weekend. Let me know!",
    "Meeting agenda for Monday: 1. Budget review 2. Team expansion 3. Marketing strategy.",
    "Can you please check the syntax in the attached Python script? I'm getting an error on line 42.",
    "The results of the focus group were positive overall, but we need to tweak the UI colors.",
    "Is the office open on Monday due to the public holiday? I need to know for my commute.",
    "Please RSVP for the company holiday party by December 1st so we can get an accurate head count.",
    "Your grocery delivery is outside. Thank you for shopping with us!",
    "Can we hop on a quick 5-minute call to discuss the logo options?",
    "Attached is the final version of the presentation for the client. I've incorporated all your edits.",
    "The server maintenance is scheduled for Sunday from 2 AM to 4 AM. Expect brief downtime.",
    "Please remember to submit your expense reports by the 15th of the month.",
    "Great job on the presentation! The client was very impressed with the data you provided.",
    "Check out this interesting article on the future of renewable energy in our industry.",
    "Hi, I noticed some broken links on the website. I've listed them in the attached doc for you to fix.",
  ];

  train() {
    this.scamExamples.forEach(ex => this.bayesClassifier.addDocument(ex, 'scam'));
    this.safeExamples.forEach(ex => this.bayesClassifier.addDocument(ex, 'safe'));
    this.bayesClassifier.train();
    this.isTrained = true;
    console.log('✅ Ensemble classifier trained with', this.scamExamples.length + this.safeExamples.length, 'examples');
  }

  classify(text: string): ClassificationResult {
    if (!this.isTrained) {
      this.train();
    }
    
    const classifications = this.bayesClassifier.getClassifications(text);
    const scamClass = classifications.find((c: any) => c.label === 'scam');
    const safeClass = classifications.find((c: any) => c.label === 'safe');
    
    const scamProb = Math.max(0, Math.min(1, scamClass?.value || 0));
    const safeProb = Math.max(0, Math.min(1, safeClass?.value || 0));
    
    // Normalize probabilities
    const total = scamProb + safeProb || 1;
    const normalizedScam = scamProb / total;
    const normalizedSafe = safeProb / total;
    
    return {
      label: normalizedScam > normalizedSafe ? 'scam' : 'safe',
      confidence: Math.abs(normalizedScam - normalizedSafe),
      probabilities: {
        scam: normalizedScam,
        safe: normalizedSafe
      }
    };
  }

  getSentiment(text: string): number {
    // Simple sentiment based on positive/negative word ratios
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'best', 'thank', 'congratulations', 'prize', 'won', 'winner', 'free', 'gift', 'bonus'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'scam', 'fraud', 'warning', 'alert', 'suspended', 'limited', 'expired', 'urgent', 'immediately', 'arrest', 'fine'];
    
    const tokens = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    tokens.forEach(token => {
      if (positiveWords.some(w => token.includes(w))) score += 0.1;
      if (negativeWords.some(w => token.includes(w))) score -= 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }
}

// ── 4. Weighted Keyword Database ─────────────────────────────
class KeywordDatabase {
  private keywords = new Map<string, number>();
  
  constructor() {
    this.loadDefaultKeywords();
  }
  
  private loadDefaultKeywords() {
    const defaults: [string, number][] = [
      // High-risk financial fraud
      ['urgent', 18], ['winner', 22], ['congratulations', 20], ['prize', 20], ['won', 16],
      ['claim', 18], ['reward', 14], ['gift', 14], ['free', 12], ['bonus', 12],
      ['crypto', 16], ['bitcoin', 16], ['ethereum', 16], ['wallet', 14], ['seedphrase', 30],
      ['airdrop', 22], ['metamask', 20], ['phantom', 20], ['ledger', 16],
      ['account', 10], ['suspended', 18], ['limited', 14], ['expired', 14], ['verify', 12],
      ['login', 12], ['password', 16], ['credential', 16], ['update', 10],
      ['bank', 12], ['transfer', 14], ['wire', 18], ['zelle', 22], ['venmo', 18],
      ['paypal', 14], ['refund', 14], ['overpayment', 18], ['invoice', 12],
      ['payment', 10], ['billing', 10], ['overdue', 16], ['outstanding', 10],
      // Impersonation
      ['irs', 28], ['fbi', 28], ['police', 22], ['authority', 14], ['government', 14],
      ['deportation', 24], ['arrest', 22], ['fine', 14], ['penalty', 14],
      ['microsoft', 16], ['apple', 14], ['amazon', 12], ['netflix', 12],
      ['ceo', 22], ['director', 12], ['agent', 14], ['officer', 12],
      // Urgency signals
      ['immediately', 20], ['asap', 16], ['now', 8], ['today', 8], ['tonight', 10],
      ['deadline', 18], ['expires', 16], ['24hours', 22], ['hours', 12], ['warning', 20],
      ['alert', 16], ['final', 14], ['last', 8], ['chance', 12],
      // Social engineering
      ['secret', 14], ['confidential', 14], ['exclusive', 10], ['hidden', 12],
      ['offshore', 20], ['inheritance', 22], ['beneficiary', 22], ['prince', 22],
      ['soldier', 14], ['stranded', 14], ['fee', 12], ['processing', 12],
      // Tech scams
      ['virus', 18], ['infected', 18], ['hacked', 18], ['remote', 14], ['access', 10],
      ['support', 8], ['helpdesk', 10], ['technician', 12],
      // Pharma / illegal
      ['pharmacy', 20], ['prescription', 16], ['meds', 16], ['pills', 16], ['drugs', 16],
    ];
    
    defaults.forEach(([kw, weight]) => this.keywords.set(kw, weight));
  }
  
  getWeight(token: string): number {
    return this.keywords.get(token.toLowerCase()) || 0;
  }
  
  addKeyword(keyword: string, weight: number) {
    this.keywords.set(keyword.toLowerCase(), weight);
  }
  
  removeKeyword(keyword: string) {
    this.keywords.delete(keyword.toLowerCase());
  }
  
  getAll(): Map<string, number> {
    return new Map(this.keywords);
  }
  
  getTopKeywords(limit: number = 20): Array<{ keyword: string; weight: number }> {
    return Array.from(this.keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword, weight]) => ({ keyword, weight }));
  }
}

// ── 5. Pattern Detection Engine ─────────────────────────────
interface Pattern {
  regex: RegExp;
  label: string;
  score: number;
  category: string;
}

class PatternEngine {
  private patterns: Pattern[] = [
    { regex: /(bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly|rb\.gy|cutt\.ly|shorturl\.at)/i, label: 'Shortened URL', score: 2.2, category: 'url' },
    { regex: /https?:\/\/(?!(?:www\.)?(google|amazon|microsoft|apple|paypal|netflix|github|linkedin|twitter|facebook|instagram)\.com)[^\s]+/i, label: 'Suspicious External Link', score: 1.0, category: 'url' },
    { regex: /(?:\d{4}[-\s]?){3}\d{4}/, label: 'Potential Credit Card', score: 2.8, category: 'financial' },
    { regex: /\b\d{3}-\d{2}-\d{4}\b/, label: 'Potential SSN', score: 3.0, category: 'financial' },
    { regex: /\b(?:seed|recovery|mnemonic)\s+phrase\b/i, label: 'Seed Phrase Request', score: 3.5, category: 'crypto' },
    { regex: /\bgift\s+card\b/i, label: 'Gift Card Request', score: 2.5, category: 'financial' },
    { regex: /\bwire\s+transfer\b/i, label: 'Wire Transfer', score: 2.2, category: 'financial' },
    { regex: /\b(?:whatsapp|telegram)\s+me\b/i, label: 'Off-platform Contact', score: 1.8, category: 'social' },
    { regex: /\$[\d,]+(?:\.\d{2})?\s*(?:million|billion)/i, label: 'Large Sum Claim', score: 2.5, category: 'financial' },
    { regex: /(?:100|1000|guaranteed?)\s*%\s*(?:return|profit|gain)/i, label: 'Guaranteed Returns', score: 2.8, category: 'financial' },
    { regex: /\b(?:google|amazon|itunes|steam)\s+play\s+gift\s+card\b/i, label: 'Gift Card Brand', score: 2.8, category: 'financial' },
    { regex: /\b(?:click|tap|visit|go\s+to)\s+(?:here|link|below|now)\b/i, label: 'Urgent CTA', score: 1.2, category: 'urgency' },
    { regex: /(?:earn|make)\s+\$[\d,]+\s+(?:per|a)\s+(?:day|week|month)/i, label: 'Income Claim', score: 2.6, category: 'financial' },
    { regex: /\bno\s+(?:credit\s+check|experience\s+needed|risk)\b/i, label: 'No-risk Claim', score: 2.0, category: 'financial' },
    { regex: /\blimit(?:ed)?\s+(?:time|offer|stock)\b/i, label: 'Scarcity Tactic', score: 1.4, category: 'urgency' },
    { regex: /\b1-?800-?555-?\d{4}\b/i, label: 'Toll-free Number', score: 0.5, category: 'neutral' },
    { regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, label: 'IP Address', score: 1.0, category: 'technical' },
  ];
  
  detect(text: string): Array<{ label: string; score: number; category: string }> {
    const findings: Array<{ label: string; score: number; category: string }> = [];
    
    this.patterns.forEach(pattern => {
      if (pattern.regex.test(text)) {
        findings.push({
          label: pattern.label,
          score: pattern.score,
          category: pattern.category
        });
      }
    });
    
    return findings;
  }
  
  addPattern(pattern: { regex: RegExp; label: string; score: number; category: string }) {
    this.patterns.push(pattern);
  }
}

// ── 6. Main Analysis Engine ─────────────────────────────────
interface AnalysisResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: 'Scam' | 'Safe' | 'Fraud' | 'Service Issue' | 'Dispute';
  complaintType?: 'Fraud' | 'Service Issue' | 'Dispute' | 'General';
  findings: string[];
  bayesScore: number;
  featureScores: {
    urgency: number;
    financial: number;
    impersonation: number;
    patternScore: number;
    keywordScore: number;
  };
  explanation: string;
  confidence: number;
  language?: string;
  sentiment?: number;
}

class ScamDetector {
  private pipeline = new NLPPipeline();
  private featureExtractor = new FeatureExtractor();
  private classifier = new EnsembleClassifier();
  private keywords = new KeywordDatabase();
  private patterns = new PatternEngine();
  
  constructor() {
    this.classifier.train();
  }
  
  analyze(content: string): AnalysisResult {
    const tokens = this.pipeline.preprocess(content);
    
    // 1. ML Classification
    const classification = this.classifier.classify(content);
    const bayesScore = classification.probabilities.scam;
    
    // 2. Feature Extraction
    const features = this.featureExtractor.extract(content, this.keywords.getAll());
    
    // 3. Pattern Detection
    const detectedPatterns = this.patterns.detect(content);
    const patternScore = detectedPatterns.reduce((sum, p) => sum + p.score, 0);
    
    // 4. Keyword Scoring
    let keywordScore = 0;
    const lowerContent = content.toLowerCase();
    this.keywords.getAll().forEach((weight, keyword) => {
      if (lowerContent.includes(keyword)) {
        keywordScore += weight * 0.06;
      }
    });
    
    // 5. Calculate Composite Score
    let rawScore = -1.5;
    
    // Bayes contribution (40%)
    if (classification.confidence > 0) {
      rawScore += (bayesScore - 0.5) * 8 * 0.4;
    }
    
    // Feature contributions
    rawScore += features.urgencyScore * 0.15;
    rawScore += features.financialRiskScore * 0.1;
    rawScore += features.impersonationScore * 0.1;
    rawScore += patternScore * 0.15;
    rawScore += keywordScore * 0.1;
    
    // Apply sigmoid
    const probability = 1 / (1 + Math.exp(-rawScore));
    const riskScore = Math.round(probability * 100);
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore > 65) riskLevel = 'high';
    else if (riskScore > 35) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Compile findings
    const findings: string[] = [];
    
    if (classification.confidence > 0.3) {
      findings.push(`AI Classifier: ${(classification.confidence * 100).toFixed(0)}% ${classification.label}`);
    }
    
    detectedPatterns.forEach(p => {
      findings.push(`${p.label} (+${p.score})`);
    });
    
    if (features.urgencyScore > 5) {
      findings.push(`Urgency signals detected (+${features.urgencyScore})`);
    }
    
    if (features.impersonationScore > 3) {
      findings.push(`Brand impersonation detected (+${features.impersonationScore})`);
    }
    
    // Determine complaint type
    const complaintType = this.classifyComplaintType(content, riskScore);

    // Generate explanation
    const explanation = this.generateExplanation(riskScore, classification, complaintType);
    
    // Sentiment (basic)
    const sentiment = this.classifier.getSentiment(content);
    
    return {
      riskScore,
      riskLevel,
      category: riskScore > 50 ? 'Scam' : 'Safe',
      complaintType,
      findings: Array.from(new Set(findings)).slice(0, 12),
      bayesScore: Math.round(bayesScore * 100),
      featureScores: {
        urgency: features.urgencyScore,
        financial: features.financialRiskScore,
        impersonation: features.impersonationScore,
        patternScore: Math.round(patternScore * 10) / 10,
        keywordScore: Math.round(keywordScore * 10) / 10,
      },
      explanation,
      confidence: Math.round(classification.confidence * 100),
      sentiment: Math.round(sentiment * 100) / 100
    };
  }

  private classifyComplaintType(content: string, riskScore: number): 'Fraud' | 'Service Issue' | 'Dispute' | 'General' {
    const lower = content.toLowerCase();
    
    // Fraud markers
    if (riskScore > 60 || /\b(scam|fraud|fake|impersonat|stole|lost|money|bank|login|password|verify)\b/i.test(lower)) {
      return 'Fraud';
    }
    
    // Service Issue markers
    if (/\b(slow|broken|not working|failed|error|connection|service|support|help|issue|bug)\b/i.test(lower)) {
      return 'Service Issue';
    }
    
    // Dispute markers
    if (/\b(refund|dispute|chargeback|money back|wrong|incorrect|disagree|claim|order)\b/i.test(lower)) {
      return 'Dispute';
    }
    
    return 'General';
  }
  
  private generateExplanation(riskScore: number, classification: ClassificationResult, complaintType: string): string {
    if (riskScore > 65) {
      return `⚠️ Detected ${complaintType}-related language with high-risk markers. Our multi-layer AI analysis flagged significant scam patterns.`;
    } else if (riskScore > 35) {
      return `⚡ Possible ${complaintType} detected. Content contains suspicious patterns that warrant caution.`;
    } else {
      return `✅ Content appears to be a legitimate ${complaintType} report or inquiry. No significant scam patterns detected.`;
    }
  }
  
  // Dynamic learning
  learnFromScam(content: string) {
    const tokens = this.pipeline.preprocess(content);
    tokens.forEach(token => {
      if (token.length < 3) return;
      if (this.keywords.getWeight(token) > 0) return;
      
      const currentWeight = this.keywords.getWeight(token);
      this.keywords.addKeyword(token, Math.min(currentWeight + 5, 25));
    });
  }
  
  // Get metrics for monitoring
  getMetrics() {
    return {
      totalKeywords: this.keywords.getAll().size,
      topKeywords: this.keywords.getTopKeywords(10),
      totalPatterns: this.patterns['patterns']?.length || 0,
      trainingData: {
        scamExamples: this.classifier['scamExamples']?.length || 0,
        safeExamples: this.classifier['safeExamples']?.length || 0
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════
//  Initialize NLP Services
// ═══════════════════════════════════════════════════════════════
// NOTE: EnhancedScamDetector (BERT/transformers) is browser-only.
const scamDetector = new ScamDetector();

// ═══════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════

// ── Analysis Fallback Endpoint ──────────────────────────────
app.post('/api/analyze', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  
  const result = scamDetector.analyze(content);
  res.json(result);
});


// ── 7. Complaint Lifecycle Management ──────────────────────

// 1. Create Complaint (Submission)
app.post('/api/complaint', async (req, res) => {
  try {
    const { name, email, message, title, category } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }

    // AI Analysis
    const analysis = scamDetector.analyze(message);

    const complaintData = {
      name: name || email.split('@')[0],
      email,
      message,
      title: title || 'New Complaint',
      category: category || analysis.complaintType || 'General',
      status: 'pending',
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      nlpFindings: analysis.findings,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('complaints').add(complaintData);
    const id = docRef.id;

    // Send Emails asynchronously
    EmailService.sendComplaintConfirmation(email, complaintData.name, id);
    EmailService.sendAdminNotification(id, analysis.riskScore, message);

    res.status(201).json({
      success: true,
      complaintId: id,
      analysis: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        category: analysis.complaintType
      }
    });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get All Complaints (Admin)
app.get('/api/complaints', verifyAdmin, async (req, res) => {
  try {
    // In a real app, verify admin JWT here
    const snapshot = await db.collection('complaints').orderBy('createdAt', 'desc').get();
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Resolve Complaint
app.post('/api/complaint/:id/resolve', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, score } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: 'Resolution text is required' });
    }

    const complaintRef = db.collection('complaints').doc(id);
    const complaintDoc = await complaintRef.get();

    if (!complaintDoc.exists) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaintData = complaintDoc.data();

    await complaintRef.update({
      status: 'resolved',
      resolution,
      adminScore: score || 0,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send resolution email to user
    EmailService.sendResolutionEmail(
      complaintData?.email,
      complaintData?.name,
      id,
      resolution,
      score || 0
    );

    res.json({ success: true, message: 'Complaint resolved' });
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ── Server Start ─────────────────────────────────────────────
//  START SERVER
// ═══════════════════════════════════════════════════════

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🛡️  TrustLink server running on http://localhost:${PORT}`);
      console.log(`📊 NLP metrics available at /api/nlp/metrics`);
      console.log(`❤️  NLP health check at /api/nlp/health`);
    });
  }
}

startServer();
export default app;
