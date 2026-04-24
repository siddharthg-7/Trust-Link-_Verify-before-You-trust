import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class EmailService:
    def __init__(self):
        self.server = "smtp.gmail.com"
        self.port = 587
        self.sender_email = "siddharthexam21@gmail.com"
        self.app_password = "vbww bwzq lcyk orfg"

    def send_email(self, to_email, subject, html_content, text_content=""):
        try:
            print(f"🔄 Attempting to send email to {to_email} via {self.server}...")
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"TrustLink Verification <{self.sender_email}>"
            message["To"] = to_email

            # Add body
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            message.attach(part1)
            message.attach(part2)

            # Connect and send
            with smtplib.SMTP(self.server, self.port, timeout=15) as server:
                print("📡 Connecting to SMTP server...")
                server.set_debuglevel(1) # Detailed SMTP logs
                server.starttls()
                print("🔐 Logging in...")
                server.login(self.sender_email, self.app_password)
                print("📧 Sending message...")
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            print("✨ Email sent successfully!")
            return True, "Email sent successfully"
        except Exception as e:
            print(f"❌ SMTP Error: {str(e)}")
            return False, str(e)

# Template Generators
def get_complaint_submitted_template(complaint_id, message_preview, app_url):
    return f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">📩 Complaint Received</h2>
        <p>Thank you for reaching out. Your complaint has been successfully logged and is currently under review.</p>
        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p><strong>Complaint ID:</strong> {complaint_id}</p>
            <p><strong>Status:</strong> <span style="color: #f59e0b;">Pending</span></p>
            <p><strong>Message Preview:</strong> {message_preview[:100]}...</p>
        </div>
        <a href="{app_url}/complaint/{complaint_id}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View My Complaint</a>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated message from TrustLink.</p>
    </div>
    """

def get_admin_notification_template(complaint_id, user_email, message):
    return f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #d32f2f;">🚨 New Complaint Alert</h2>
        <p>A new complaint has been submitted for review.</p>
        <div style="background: #fff5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <p><strong>Complaint ID:</strong> {complaint_id}</p>
            <p><strong>User Email:</strong> {user_email}</p>
            <p><strong>Content:</strong> {message}</p>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">TrustLink Admin System</p>
    </div>
    """

def get_resolution_template(complaint_id, resolution, score, app_url):
    color = "#10b981" if score < 40 else "#f59e0b" if score < 70 else "#ef4444"
    return f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">✅ Complaint Resolved</h2>
        <p>Our team has completed the review of your complaint.</p>
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p><strong>Complaint ID:</strong> {complaint_id}</p>
            <p><strong>Trust Score:</strong> <span style="color: {color}; font-weight: bold;">{score}% Risk</span></p>
            <p><strong>Resolution Details:</strong></p>
            <p style="font-style: italic;">"{resolution}"</p>
        </div>
        <a href="{app_url}/complaint/{complaint_id}" style="display: inline-block; background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Details</a>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">Thank you for helping keep TrustLink safe.</p>
    </div>
    """
