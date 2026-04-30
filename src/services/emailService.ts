import { API_BASE_URL } from "../lib/api";

export interface AdminEmailData {
  title: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  content: string;
  reportId: string;
}

export interface UserEmailData {
  to: string;
  userName: string;
  trustScore: number;
  status: string;
  feedback: string;
  reportId: string;
}

export async function verifyToken(token: string, type: 'admin' | 'user') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-token?token=${token}&type=${type}`);
    return await response.json();
  } catch (e) {
    console.error('Token verification failed:', e);
    return { success: false, error: 'Connection failed' };
  }
}
