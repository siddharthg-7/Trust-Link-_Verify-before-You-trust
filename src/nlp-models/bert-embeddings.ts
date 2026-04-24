import { pipeline, env } from '@xenova/transformers';



// ── CRITICAL: Force CDN loading, never local filesystem ──────────
// Without these, the browser may try to fetch /tokenizer.json from your 
// own hosting server, which returns the SPA index.html → JSON parse error.
env.allowLocalModels = false;
env.useBrowserCache = true;

// Use default Xenova/HuggingFace paths which are more reliable
// env.remoteHost = 'https://huggingface.co/';
// env.remotePathTemplate = '{model}/resolve/{revision}/';



export class BertEmbeddings {
  private extractor: any = null;
  private isReady = false;

  async init() {
    if (this.isReady) return;
    
    console.log('⏳ Initializing BERT Embedding model (loading from HuggingFace CDN)...');
    try {
      // Multilingual MiniLM: fast, accurate, and CDN-cached after first load
      this.extractor = await pipeline(
        'feature-extraction',
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        { quantized: true } // Use quantized model for ~4x faster load
      );
      this.isReady = true;
      console.log('✅ BERT Embedding model loaded');
    } catch (err) {
      console.error('❌ BERT model failed to load. Verify your network can reach huggingface.co.', err);
      throw err;
    }
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
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
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
