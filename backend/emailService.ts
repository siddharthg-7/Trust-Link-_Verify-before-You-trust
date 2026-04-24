import axios from 'axios';
import 'dotenv/config';

// ── CONFIGURATION ──────────────────────────────────────────────
const PYTHON_SERVICE_URL = "http://localhost:5000/send-email";

export class EmailService {
  
  static async sendComplaintConfirmation(userEmail: string, userName: string, complaintId: string) {
    try {
      await axios.post(PYTHON_SERVICE_URL, {
        type: "user_confirmation",
        email: userEmail,
        details: {
          complaintId,
          userName
        }
      });
      console.log(`[Legacy EmailService] Redirected user_confirmation to Python Service`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Legacy EmailService] Failed to redirect: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  static async sendAdminNotification(complaintId: string, riskScore: number, content: string) {
    try {
      await axios.post(PYTHON_SERVICE_URL, {
        type: "admin_alert",
        details: {
          complaintId,
          message: content,
          riskScore
        }
      });
      console.log(`[Legacy EmailService] Redirected admin_alert to Python Service`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Legacy EmailService] Failed to redirect: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  static async sendResolutionEmail(userEmail: string, userName: string, complaintId: string, feedback: string, score: number) {
    try {
      await axios.post(PYTHON_SERVICE_URL, {
        type: "resolution",
        email: userEmail,
        details: {
          complaintId,
          resolution: feedback,
          score
        }
      });
      console.log(`[Legacy EmailService] Redirected resolution to Python Service`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Legacy EmailService] Failed to redirect: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

