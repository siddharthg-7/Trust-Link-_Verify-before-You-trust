import { DataAugmentor } from '../data-pipeline/data-augmentation';

export class AdversarialTester {
  private augmentor = new DataAugmentor();

  async testRobustness(detector: any, baseScams: string[]): Promise<{ score: number; bypasses: string[] }> {
    let totals = 0;
    let detections = 0;
    const bypasses: string[] = [];

    for (const scam of baseScams) {
      // Generate adversarial variations
      const variations = [
        this.augmentor.createTypos(scam),
        scam.replace(/a/g, '@').replace(/s/g, '$').replace(/i/g, '1'),
        scam.split(' ').reverse().join(' '), // Extreme case
      ];

      for (const variant of variations) {
        totals++;
        const result = await detector.analyze(variant);
        if (result.riskScore > 50) {
          detections++;
        } else {
          bypasses.push(variant);
        }
      }
    }

    return {
      score: (detections / totals) * 100,
      bypasses
    };
  }
}
