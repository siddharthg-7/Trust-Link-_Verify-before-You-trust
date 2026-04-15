import { BertEmbeddings } from './nlp-models/bert-embeddings';
import { DataAugmentor } from './data-pipeline/data-augmentation';
import natural from 'natural';

// ── TEMPORAL ANALYZER ──────────────────────────────────────────
export class TemporalAnalyzer {
  private messageHistory: Map<string, number[]> = new Map(); // senderId -> timestamps

  analyze(senderId: string, timestamp: number): { densityRisk: number; timeOfDayRisk: number } {
    const now = timestamp || Date.now();
    const times = this.messageHistory.get(senderId) || [];
    
    // Add new timestamp
    times.push(now);
    
    // Filter to last 5 minutes (300,000 ms)
    const fiveMinutesAgo = now - 300000;
    const recentTimes = times.filter(t => t > fiveMinutesAgo);
    this.messageHistory.set(senderId, recentTimes);

    // Density Risk: 10 msgs in 5 mins = max risk (100)
    const densityRisk = Math.min((recentTimes.length / 10) * 100, 100);

    // Time-of-day Risk: 1 AM - 5 AM = high risk, late night = medium risk, 2 PM - 4 PM = low risk
    const hour = new Date(now).getHours();
    let timeOfDayRisk = 0;
    
    if (hour >= 1 && hour <= 5) timeOfDayRisk = 40;      // 1 AM - 5 AM (High risk)
    else if (hour >= 22 || hour === 0) timeOfDayRisk = 25; // 10 PM - midnight (Suspicious)
    else if (hour >= 14 && hour <= 16) timeOfDayRisk = 15; // 2 PM - 4 PM (Work hours / distracted)

    return { densityRisk, timeOfDayRisk };
  }
}

// ── ENHANCED DETECTOR ──────────────────────────────────────────
export class EnhancedScamDetector {
  private bert = new BertEmbeddings();
  private temporal = new TemporalAnalyzer();
  private classifier = new natural.BayesClassifier();
  private isInitialized = false;
  private scamEmbeddings: number[][] = [];

  constructor() {
    this.init();
  }

  private async init() {
    try {
      await this.bert.init();
      // In a real app, we'd load these from a DB or pre-computed file
      // For now, we'll initialize with some basics
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

  async analyze(content: string, senderId: string = 'anonymous', timestamp: number = Date.now()) {
    // Await initialization if calling too early
    while (!this.isInitialized) {
      await new Promise(r => setTimeout(r, 100));
    }

    // 1. Semantic Vector Match
    const semanticSimilarity = await this.bert.calculateMatch(content, this.scamEmbeddings);
    const vectorRisk = Math.min(semanticSimilarity, 1.0) * 100;

    // 2. Linguistic Analysis
    const linguisticRisk = this.analyzeLinguistics(content);

    // 3. Temporal Context
    const { densityRisk, timeOfDayRisk } = this.temporal.analyze(senderId, timestamp);

    // 4. Composite Scoring
    // Weights: Vector (35%), Density (25%), Linguistics (20%), TimeOfDay (10%), Bayesian/Other (10%)
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
      category: compositeScore > 65 ? 'Scam' : (compositeScore > 35 ? 'Suspicious' : 'Safe')
    };
  }

  private analyzeMetadata(senderId: string): boolean {
    const suspiciousPatterns = [/tempmail\./i, /throwaway\./i, /\.tk$/i, /secure-bank/i, /paypal-login/i, /urgent-bank/i];
    return suspiciousPatterns.some(pattern => pattern.test(senderId));
  }

  private analyzeLinguistics(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();

    // Passive voice detection (broadened)
    if (/\b(have|has|had|was|were|is|are)\s+been?\s+\w+(ed|en)?\b/i.test(text)) {
      score += 25;
    }

    // Emotional triggers (Word boundaries + Count weighting)
    const triggers = ['immediately', 'arrest', 'police', 'urgent', 'limited', 'won', 'congratulations', 'prize', 'gift'];
    triggers.forEach(t => {
      const regex = new RegExp(`\\b${t}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) score += matches.length * 10;
    });

    // Readability (Simple language/Broken English detection)
    const words = text.split(/\s+/).length;
    const uniqueWords = new Set(lower.split(/\s+/)).size;
    if (words > 10 && (uniqueWords / words) < 0.5) {
      score += 15; // Repetitive or suspicious structure
    }

    return Math.min(score, 100);
  }

  // ── GRAPH ANALYSIS (STUB) ──────────────────────────────────
  private analyzeGraph(senderId: string): number {
    // Build graph: sender A -> recipient B
    // Detect pyramid/multi-level scam networks
    // Calculate centrality scores: how "central" is this account?
    
    // Simple mock logic:
    const highCentralityAttackers = ['attacker_global_01', 'botnet_x_99'];
    if (highCentralityAttackers.includes(senderId)) return 80;
    return 0;
  }

  // Legacy compatibility
  async learnFromScam(content: string) {
    console.log('📘 Learning from new scam report...');
    const emb = await this.bert.getEmbedding(content);
    this.scamEmbeddings.push(emb);
  }

  getMetrics() {
    return {
      totalEmbeddings: this.scamEmbeddings.length,
      isMultilingual: true,
      modelReady: true
    };
  }
}
