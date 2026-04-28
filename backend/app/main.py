from flask import Flask, request, jsonify
from flask_cors import CORS
from emailing import EmailService, get_complaint_submitted_template, get_admin_notification_template, get_resolution_template
import os

app = Flask(__name__)
CORS(app)
email_service = EmailService()

APP_URL = os.getenv("VITE_APP_URL", "https://trust-link-4151a.web.app")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/send-email', methods=['POST'])
def send_email_api():
    data = request.json
    print(f"📥 Received request: {data.get('type')} for {data.get('email')}")
    
    email_type = data.get("type")
    target_email = data.get("email")
    details = data.get("details", {})
    
    complaint_id = details.get("complaintId")
    message = details.get("message", "")
    
    html_content = ""
    subject = ""

    if email_type == "user_confirmation":
        subject = f"Complaint Received: {complaint_id}"
        html_content = get_complaint_submitted_template(complaint_id, message, APP_URL)
    
    elif email_type == "admin_alert":
        subject = f"🚨 New Complaint: {complaint_id}"
        target_email = ADMIN_EMAIL
        html_content = get_admin_notification_template(complaint_id, details.get("userEmail"), message)
        
    elif email_type == "resolution":
        subject = f"Complaint Resolved: {complaint_id}"
        target_email = data.get("email") or details.get("userEmail")
        html_content = get_resolution_template(
            complaint_id, 
            details.get("resolution"), 
            details.get("score"), 
            APP_URL
        )
    
    if not html_content:
        return jsonify({"error": "Invalid email type"}), 400

    success, msg = email_service.send_email(target_email, subject, html_content)
    
    if success:
        return jsonify({"message": msg}), 200
    else:
        return jsonify({"error": msg}), 500

if __name__ == '__main__':
    # Running on port 5000 by default
    app.run(host='0.0.0.0', port=5000, debug=True)
