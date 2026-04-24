
// ── BERT EMBEDDINGS SERVICE ──────────────────────────────────────
// This service uses @xenova/transformers for browser-side NLP.
// It is now refactored to use DYNAMIC IMPORTS to:
// 1. Reduce initial bundle size (from 3MB+ to ~100KB for main bundle)
// 2. Isolate libraries that use eval() until they are specifically needed
// 3. Improve UX by only loading heavy ML modules on first analysis

export class BertEmbeddings {
  private extractor: any = null;
  private isReady = false;

  async init() {
    if (this.isReady) return;
    
    console.log('⏳ Initializing BERT Embedding model (loading from HuggingFace CDN)...');
    try {
      // 1. Dynamic Import for heavy transformers library
      const { pipeline, env } = await import('@xenova/transformers');

      // 2. Configure environment (CDN only)
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      // 3. Load Multilingual MiniLM model
      this.extractor = await pipeline(
        'feature-extraction',
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        { quantized: true } // Quantized for speed and smaller download size
      );
      
      this.isReady = true;
      console.log('✅ BERT Embedding model loaded and ready');
    } catch (err) {
      console.error('❌ BERT model failed to load. Verify your network can reach huggingface.co.', err);
      throw err;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.isReady) await this.init();
    
    // Mean pooling and normalization are handled by the extractor parameters
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
