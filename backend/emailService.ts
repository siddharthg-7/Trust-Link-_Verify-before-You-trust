import { BrevoClient } from '@getbrevo/brevo';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// ── CONFIGURATION ──────────────────────────────────────────────
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'trust-link-secret-2024';
const APP_URL = process.env.VITE_APP_URL || "https://trust-link-4151a.web.app";
const ADMIN_EMAIL = "siddharthexam21@gmail.com";
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "siddharthexam21@gmail.com";

// Initialize Brevo v5 Client
const brevo = new BrevoClient({
  apiKey: BREVO_API_KEY
});

// ── TYPES ──────────────────────────────────────────────────────
export interface EmailLog {
  id: string;
  complaintId: string;
  type: 'confirmation' | 'notification' | 'resolution';
  recipient: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: Date;
}

// ── LOGGING (MOCK DATABASE) ───────────────────────────────────
export const emailLogs: EmailLog[] = [];

async function logEmail(log: Omit<EmailLog, 'id' | 'sentAt'>) {
  const newLog: EmailLog = {
    ...log,
    id: Math.random().toString(36).substr(2, 9),
    sentAt: new Date()
  };
  emailLogs.push(newLog);
  console.log(`[Email Log] ${newLog.type} to ${newLog.recipient}: ${newLog.status}`);
}

// ── RETRY LOGIC HELPER ────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`Retrying email send... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return withRetry(fn, retries - 1);
  }
}

// ── EMAIL SERVICE MODULE ──────────────────────────────────────
export class EmailService {
  
  // 1. Send Confirmation to User
  static async sendComplaintConfirmation(userEmail: string, userName: string, complaintId: string) {
    const payload = {
      subject: `🛡️ Complaint Received: ${complaintId}`,
      sender: { name: 'TrustLink Security', email: SENDER_EMAIL },
      to: [{ email: userEmail, name: userName }],
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 16px;">
          <h2 style="color: #3b82f6;">Submission Confirmed</h2>
          <p>Hi ${userName},</p>
          <p>We have received your report and it has been assigned ID: <strong>${complaintId}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/track?id=${complaintId}" style="display:inline-block; padding: 16px 32px; background: #3b82f6; color: white; text-decoration: none; border-radius: 12px; font-weight: bold;">Track Status</a>
          </div>
        </div>
      `
    };

    try {
      await withRetry(() => brevo.transactionalEmails.sendTransacEmail(payload));
      await logEmail({ complaintId, type: 'confirmation', recipient: userEmail, status: 'sent' });
      return { success: true };
    } catch (error: any) {
      await logEmail({ complaintId, type: 'confirmation', recipient: userEmail, status: 'failed', error: error.message });
      console.error("Email error:", error);
      return { success: false, error: error.message };
    }
  }

  // 2. Send Notification to Admin (with JWT)
  static async sendAdminNotification(complaintId: string, riskScore: number, content: string) {
    const token = jwt.sign({ complaintId, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    const adminLink = `${APP_URL}/admin/auth?token=${token}`;

    const payload = {
      subject: `🚨 New Complaint: ${complaintId} [Risk: ${riskScore}%]`,
      sender: { name: 'TrustLink Intelligence', email: SENDER_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: 'Admin' }],
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; padding: 30px; border-radius: 16px; color: white;">
          <h2 style="color: #ef4444;">New Intelligence Alert</h2>
          <p>Report ID: ${complaintId}</p>
          <p>AI Risk Score: ${riskScore}%</p>
          <hr style="border-color: #334155;">
          <p style="font-style: italic;">"${content.substring(0, 200)}..."</p>
          <div style="text-align: center; margin-top: 35px;">
            <a href="${adminLink}" style="display:inline-block; padding: 18px 36px; background: #ef4444; color: white; text-decoration: none; border-radius: 12px; font-weight: bold;">Verify & Resolve</a>
          </div>
        </div>
      `
    };

    try {
      await withRetry(() => brevo.transactionalEmails.sendTransacEmail(payload));
      await logEmail({ complaintId, type: 'notification', recipient: ADMIN_EMAIL, status: 'sent' });
      return { success: true };
    } catch (error: any) {
      await logEmail({ complaintId, type: 'notification', recipient: ADMIN_EMAIL, status: 'failed', error: error.message });
      console.error("Email error:", error);
      return { success: false, error: error.message };
    }
  }

  // 3. Send Resolution to User
  static async sendResolutionEmail(userEmail: string, userName: string, complaintId: string, feedback: string, score: number) {
    const payload = {
      subject: `✅ Resolution Reached: ${complaintId}`,
      sender: { name: 'TrustLink Verification', email: SENDER_EMAIL },
      to: [{ email: userEmail, name: userName }],
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #22c55e;">
          <h2 style="color: #16a34a;">Case Resolved</h2>
          <p>Hi ${userName},</p>
          <p>Our review is complete for report ${complaintId}.</p>
          <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <p><strong>Findings:</strong> ${feedback}</p>
            <p><strong>Trust Score:</strong> ${score}%</p>
          </div>
          <div style="text-align: center;">
            <a href="${APP_URL}/track?id=${complaintId}" style="display:inline-block; padding: 16px 32px; background: #16a34a; color: white; text-decoration: none; border-radius: 12px; font-weight: bold;">View Official Report</a>
          </div>
        </div>
      `
    };

    try {
      await withRetry(() => brevo.transactionalEmails.sendTransacEmail(payload));
      await logEmail({ complaintId, type: 'resolution', recipient: userEmail, status: 'sent' });
      return { success: true };
    } catch (error: any) {
      await logEmail({ complaintId, type: 'resolution', recipient: userEmail, status: 'failed', error: error.message });
      console.error("Email error:", error);
      return { success: false, error: error.message };
    }
  }
}

