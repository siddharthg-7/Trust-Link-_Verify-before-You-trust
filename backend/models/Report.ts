/**
 * Mongoose Schema for TrustLink Reports
 * Note: In this AI Studio environment, we use Firestore for persistence,
 * but this model represents the requested database structure.
 */

/*
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  link: { type: String, required: false },
  content: { type: String, required: true },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  category: { type: String, enum: ['Scam', 'Safe'], required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Scam'], 
    default: 'Pending' 
  },
  findings: [{ type: String }],
  aiAnalysis: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const Report = mongoose.model('Report', reportSchema);
*/

export interface IReport {
  id?: string;
  userId: string;
  link?: string;
  content: string;
  riskScore: number;
  category: 'Scam' | 'Safe';
  status: 'Pending' | 'Verified' | 'Scam';
  findings: string[];
  aiAnalysis?: string;
  timestamp: Date;
}
