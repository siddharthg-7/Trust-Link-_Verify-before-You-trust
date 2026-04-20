import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use remote CDN and browser cache
// This prevents the "JSON parse error" caused by fetching local HTML 404 pages
env.allowLocalModels = false;
env.useBrowserCache = true;
env.remoteHost = 'https://huggingface.co/';
env.remotePathTemplate = '{model}/resolve/{revision}/';

export class BertEmbeddings {
  private extractor: any = null;
  private isReady = false;

  async init() {
    if (this.isReady) return;
    
    console.log('⏳ Initializing BERT Embedding model...');
    // Using a multilingual model for global scam detection support
    this.extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
    this.isReady = true;
    console.log('✅ BERT Embedding model loaded');
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
