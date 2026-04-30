# EmailJS Templates for TrustLink

Copy and paste the HTML code blocks below directly into the **Message** section of your EmailJS templates. 
Make sure you switch your EmailJS editor to **Source Code (HTML)** mode if you want to use the styled versions, or just copy the text versions if you prefer plain text.

---

## Template 1: Complaint Alert & Confirmation
**Template ID:** `template_m3mvh48`
**To Email:** `{{to_email}}`
**Subject:** `Update regarding Complaint: {{complaint_id}}`

### Option A: Plain Text Version
```text
Hello,

This is an update regarding a complaint submitted to TrustLink.

COMPLAINT DETAILS:
- Complaint ID: {{complaint_id}}
- Submitted By: {{user_email}}
- Message:
"{{message}}"

You can track the status of this complaint by visiting our portal:
{{app_url}}/track

Thank you,
The TrustLink Security Team
```

### Option B: Styled HTML Version (Recommended)
*In EmailJS, click the `<>` button in the editor toolbar to paste HTML.*

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0;">TrustLink Notification</h2>
        <p style="color: #64748b; font-size: 14px;">Complaint Status Update</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0;"><strong>Complaint ID:</strong> <span style="font-family: monospace;">{{complaint_id}}</span></p>
        <p style="margin: 0 0 10px 0;"><strong>Submitted By:</strong> {{user_email}}</p>
        <p style="margin: 0; color: #334155;"><strong>Message:</strong></p>
        <blockquote style="margin: 5px 0 0 0; font-style: italic; color: #475569;">"{{message}}"</blockquote>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="{{app_url}}/track" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Complaint Status</a>
    </div>
    
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;" />
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This is an automated message from the TrustLink Security System.</p>
</div>
```

---

## Template 2: Resolution Email
**Template ID:** `template_4070x1x`
**To Email:** `{{to_email}}`
**Subject:** `Resolved: Complaint {{complaint_id}}`

### Option A: Plain Text Version
```text
Hello,

Your TrustLink complaint has been reviewed and resolved by our security team.

RESOLUTION DETAILS:
- Complaint ID: {{complaint_id}}
- Assigned Trust Score: {{score}}% Risk
- Admin Feedback / Resolution:
"{{resolution}}"

Thank you for helping us keep our community safe.

Visit TrustLink:
{{app_url}}
```

### Option B: Styled HTML Version (Recommended)
*In EmailJS, click the `<>` button in the editor toolbar to paste HTML.*

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #16a34a; margin: 0;">Complaint Resolved</h2>
        <p style="color: #64748b; font-size: 14px;">TrustLink Investigation Complete</p>
    </div>
    
    <p style="color: #334155; line-height: 1.5;">Hello,</p>
    <p style="color: #334155; line-height: 1.5;">Your recent complaint has been thoroughly reviewed and officially resolved by the TrustLink administrative team.</p>
    
    <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Complaint ID:</strong> <span style="font-family: monospace;">{{complaint_id}}</span></p>
        <p style="margin: 0 0 10px 0;"><strong>Risk Score Assigned:</strong> <span style="font-weight: bold; color: #b91c1c;">{{score}}% Risk</span></p>
        <p style="margin: 0; color: #334155;"><strong>Admin Feedback / Resolution:</strong></p>
        <blockquote style="margin: 5px 0 0 0; font-style: italic; color: #475569;">"{{resolution}}"</blockquote>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="{{app_url}}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Return to TrustLink</a>
    </div>
    
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;" />
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Thank you for helping maintain a secure community.</p>
</div>
```
