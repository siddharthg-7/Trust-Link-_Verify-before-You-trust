import * as ort from 'onnxruntime-web';

export class XGBoostClassifier {
  private session: ort.InferenceSession | null = null;
  private isLoaded = false;

  async loadModel(modelPath: string) {
    try {
      // Configure WASM paths for onnxruntime-web
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      this.session = await ort.InferenceSession.create(modelPath);
      this.isLoaded = true;
      console.log('✅ XGBoost model (ONNX) loaded successfully');
    } catch (e) {
      console.error('Failed to load XGBoost ONNX model:', e);
    }
  }

  async predict(features: number[]): Promise<number> {
    if (!this.isLoaded || !this.session) {
      throw new Error('Model not loaded');
    }

    // Prepare input tensor (expecting 13 features as requested)
    const inputName = this.session.inputNames[0];
    const inputTensor = new ort.Tensor('float32', Float32Array.from(features), [1, features.length]);
    
    const feeds: Record<string, ort.Tensor> = {};
    feeds[inputName] = inputTensor;

    const results = await this.session.run(feeds);
    const outputName = this.session.outputNames[0];
    const output = results[outputName].data as Float32Array;

    return output[0]; // Returns probability of scam
  }
}
