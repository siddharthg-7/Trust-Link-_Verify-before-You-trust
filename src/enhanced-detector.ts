import { BertEmbeddings } from './nlp-models/bert-embeddings';

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
  private isInitialized = false;
  private scamEmbeddings: number[][] = [];

  constructor() {
    this.init();
  }

  private async init() {
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
    const compositeScore = (vectorRisk * 0.40) + (linguisticRisk * 0.35) + (densityRisk * 0.15) + (timeOfDayRisk * 0.1);
    const finalRiskScore = Math.round(Math.min(compositeScore, 100));

    // 5. Complaint Classification
    const complaintType = this.classifyComplaintType(content, finalRiskScore);
    
    return {
      riskScore: finalRiskScore,
      details: {
        vectorSimilarity: Math.round(vectorRisk),
        linguisticMarkers: linguisticRisk > 50 ? 'Highly suspicious language' : 'Normal language',
        messageDensity: Math.round(densityRisk),
        timeContext: timeOfDayRisk > 0 ? 'Suspicious timing' : 'Normal timing',
        metadataRisk: this.analyzeMetadata(senderId) ? 'Flagged source' : 'Trusted source'
      },
      category: finalRiskScore > 65 ? 'Scam' : (finalRiskScore > 35 ? 'Suspicious' : 'Safe'),
      complaintType,
      confidence: Math.round(Math.max(vectorRisk, linguisticRisk)), // Simple confidence metric
      explanation: this.generateExplanation(finalRiskScore, complaintType)
    };
  }

  private classifyComplaintType(content: string, riskScore: number): 'Fraud' | 'Service Issue' | 'Dispute' | 'General' {
    const lower = content.toLowerCase();
    if (riskScore > 60 || /\b(scam|fraud|fake|impersonat|stole|lost|money|bank|login|password|verify)\b/i.test(lower)) {
      return 'Fraud';
    }
    if (/\b(slow|broken|not working|failed|error|connection|service|support|help|issue|bug)\b/i.test(lower)) {
      return 'Service Issue';
    }
    if (/\b(refund|dispute|chargeback|money back|wrong|incorrect|disagree|claim|order)\b/i.test(lower)) {
      return 'Dispute';
    }
    return 'General';
  }

  private generateExplanation(riskScore: number, complaintType: string): string {
    if (riskScore > 65) {
      return `⚠️ Detected ${complaintType}-related language with high-risk markers. Our multi-layer AI analysis flagged significant scam patterns.`;
    } else if (riskScore > 35) {
      return `⚡ Possible ${complaintType} detected. Content contains suspicious patterns that warrant caution.`;
    } else {
      return `✅ Content appears to be a legitimate ${complaintType} report or inquiry. No significant scam patterns detected.`;
    }
  }

  private analyzeMetadata(senderId: string): boolean {
    const suspiciousPatterns = [/tempmail\./i, /throwaway\./i, /\.tk$/i, /secure-bank/i, /paypal-login/i, /urgent-bank/i];
    return suspiciousPatterns.some(pattern => pattern.test(senderId));
  }

  private analyzeLinguistics(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();

    if (/\b(have|has|had|was|were|is|are)\s+been?\s+\w+(ed|en)?\b/i.test(text)) {
      score += 25;
    }

    const triggers = ['immediately', 'arrest', 'police', 'urgent', 'limited', 'won', 'congratulations', 'prize', 'gift'];
    triggers.forEach(t => {
      const regex = new RegExp(`\\b${t}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) score += matches.length * 10;
    });

    const words = text.split(/\s+/).length;
    const uniqueWords = new Set(lower.split(/\s+/)).size;
    if (words > 10 && (uniqueWords / words) < 0.5) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  async learnFromScam(content: string) {
    const emb = await this.bert.getEmbedding(content);
    this.scamEmbeddings.push(emb);
  }

  getMetrics() {
    return {
      totalEmbeddings: this.scamEmbeddings.length,
      modelReady: this.isInitialized
    };
  }
}

