import natural from 'natural';

export class DataAugmentor {
  private tokenizer = new natural.WordTokenizer();

  // Simple synonym map for common scam terms
  private synonyms: Record<string, string[]> = {
    'urgent': ['immediate', 'emergency', 'asap', 'quick'],
    'won': ['selected', 'granted', 'rewarded', 'chosen'],
    'prize': ['reward', 'grant', 'gift', 'bonus'],
    'money': ['cash', 'funds', 'capital', 'wealth'],
    'claim': ['collect', 'receive', 'get', 'obtain'],
    'bank': ['financial institution', 'account', 'vault'],
    'password': ['credentials', 'access code', 'passcode'],
    'hacked': ['compromised', 'breached', 'invaded'],
    'verify': ['confirm', 'authenticate', 'validate'],
    'congratulations': ['congrats', 'great news', 'well done'],
    'free': ['no-cost', 'complimentary', 'zero-cost'],
    'limited': ['restricted', 'exclusive', 'short-term'],
    'expires': ['ends', 'terminates', 'runs out'],
    'immediately': ['now', 'instantly', 'swiftly'],
    'arrest': ['detained', 'legal action', 'prosecution']
  };

  augment(text: string, count: number = 5): string[] {
    const results: string[] = [];
    const tokens = this.tokenizer.tokenize(text) || [];

    for (let i = 0; i < count; i++) {
      let augmented = [...tokens];
      
      // Randomly replace some words with synonyms
      for (let j = 0; j < augmented.length; j++) {
        const word = augmented[j].toLowerCase();
        if (this.synonyms[word] && Math.random() > 0.6) {
          const synonymList = this.synonyms[word];
          augmented[j] = synonymList[Math.floor(Math.random() * synonymList.length)];
        }
      }
      
      // Randomly shuffle some sentences if multiple?
      // For now, just join tokens
      results.push(augmented.join(' '));
    }

    return Array.from(new Set(results));
  }

  // Create "adversarial" typos
  createTypos(text: string): string {
    const chars = text.split('');
    const typoCount = Math.floor(text.length / 20); // 5% typos
    
    for (let i = 0; i < typoCount; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      if (chars[idx] === ' ') continue;
      
      const type = Math.random();
      if (type < 0.3) {
        // Swap adjacent
        if (idx < chars.length - 1) {
          [chars[idx], chars[idx+1]] = [chars[idx+1], chars[idx]];
        }
      } else if (type < 0.6) {
        // Skip char
        chars.splice(idx, 1);
      } else {
        // Add random char
        chars.splice(idx, 0, String.fromCharCode(97 + Math.floor(Math.random() * 26)));
      }
    }
    
    return chars.join('');
  }
}
