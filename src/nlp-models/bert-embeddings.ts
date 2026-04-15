import { pipeline } from '@xenova/transformers';

export class BertEmbeddings {
  private extractor: any = null;
  private isReady = false;

  async init() {
    if (this.isReady) return;
    
    // Using a multilingual model for global scam detection support
    // 'Xenova/paraphrase-multilingual-MiniLM-L12-v2' supports 50+ languages
    this.extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
    this.isReady = true;
    console.log('✅ BERT Embedding model (MiniLM-L6-v2) loaded');
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.isReady) await this.init();
    
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async calculateMatch(text: string, referenceEmbeddings: number[][]): Promise<number> {
    const queryEmbedding = await this.getEmbedding(text);
    let maxSimilarity = 0;
    
    for (const ref of referenceEmbeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, ref);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }
    
    return maxSimilarity;
  }
}
