import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateScamBatch(count: number = 20): Promise<string[]> {
  const prompt = `Generate ${count} diverse and realistic examples of fraudulent/scam messages (SMS, Email, Discord, etc.). 
  Include various types: Phishing, Crypto Airdrops, Romance Scams, Tech Support, Government Impersonation.
  Return only the text of the messages, one per line. No numbering, no labels.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text.split('\n').filter(line => line.trim().length > 10);
}

export async function generateSafeBatch(count: number = 20): Promise<string[]> {
  const prompt = `Generate ${count} diverse and realistic examples of legitimate/safe messages (SMS, Email, Work chats).
  Include various types: Meeting invites, Order confirmations, Friendly chats, System notifications.
  Return only the text of the messages, one per line. No numbering, no labels.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text.split('\n').filter(line => line.trim().length > 10);
}

async function expandDataset() {
  console.log('🚀 Starting dataset expansion...');
  const scams = await generateScamBatch(50);
  const safe = await generateSafeBatch(50);

  const datasetContent = `LABEL: scam\n${scams.join('\n')}\n\nLABEL: safe\n${safe.join('\n')}`;
  
  fs.appendFileSync('scam_dataset_extended.txt', datasetContent);
  console.log(`✅ Added 100 new examples to scam_dataset_extended.txt`);
}

// export { expandDataset };
