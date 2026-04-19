import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

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

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

// Send email to admin when complaint is created
export async function sendAdminEmail(data: AdminEmailData) {
  const ADMIN_EMAIL = "siddharthexam21@gmail.com";
  
  if (!validateEmail(ADMIN_EMAIL)) {
    return { success: false, error: "Invalid Admin Email configuration" };
  }

  try {
    const result = await resend.emails.send({
      from: 'TrustLink System <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      replyTo: ADMIN_EMAIL,
      subject: `🚨 New Complaint: ${data.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc2626;">🚨 New Complaint Reported</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
            <p><strong>Report ID:</strong> ${data.reportId}</p>
            <p><strong>User:</strong> ${data.userName} (${data.userEmail})</p>
            <p><strong>Risk Score:</strong> <span style="color: ${data.riskScore > 65 ? '#dc2626' : '#10b981'}; font-weight: bold;">${data.riskScore}%</span></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Content Overview:</strong></p>
            <p style="color: #555; background: #f0f0f0; padding: 15px; border-left: 4px solid #dc2626;">${data.content}</p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://trust-link-4151a.web.app/admin" style="display:inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">View in Dashboard</a>
          </div>
        </div>
      `
    });
    return { success: !result.error, error: result.error ? (result.error as any).message : null, id: result.data?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Send email to user after admin review
export async function sendUserEmail(data: UserEmailData) {
  const ADMIN_EMAIL = "siddharthexam21@gmail.com";

  if (!data.to || !validateEmail(data.to)) {
    return { success: false, error: "Invalid recipient email" };
  }

  try {
    const result = await resend.emails.send({
      from: 'TrustLink Admin <onboarding@resend.dev>',
      to: data.to,
      replyTo: ADMIN_EMAIL,
      subject: `✅ Your Report Has Been Reviewed - Score: ${data.trustScore}%`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3b82f6;">✅ Report Verified</h2>
          <p>Hi ${data.userName},</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #eee; text-align: center;">
            <p>Official Trust Score Assigned:</p>
            <div style="background: linear-gradient(to right, #ef4444, #f59e0b, #22c55e); padding: 20px; border-radius: 8px; color: white; font-size: 32px; font-weight: bold; margin: 10px 0;">
              ${data.trustScore}%
            </div>
            <p>Final Status: <strong>${data.status}</strong></p>
          </div>
          <div style="background: #f0f7ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p><strong>Moderator Comments:</strong></p>
            <p style="font-style: italic;">"${data.feedback}"</p>
          </div>
          <p style="font-size: 11px; color: #999; text-align: center;">This is an automated intelligence update from TrustLink.</p>
        </div>
      `
    });
    return { success: !result.error, error: result.error ? (result.error as any).message : null, id: result.data?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
