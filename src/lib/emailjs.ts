import emailjs from '@emailjs/browser';

// These should be configured in your .env or hosting environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

// Template IDs
const TEMPLATE_USER_CONFIRMATION = import.meta.env.VITE_EMAILJS_TEMPLATE_USER_CONFIRMATION || 'YOUR_TEMPLATE_ID_1';
const TEMPLATE_RESOLUTION = import.meta.env.VITE_EMAILJS_TEMPLATE_RESOLUTION || 'YOUR_TEMPLATE_ID_3';

// Helper to send emails
export const sendEmailJS = async (type: 'user_confirmation' | 'admin_alert' | 'resolution', params: Record<string, any>) => {
  let templateId = '';
  
  if (type === 'user_confirmation' || type === 'admin_alert') {
    templateId = TEMPLATE_USER_CONFIRMATION;
  } else if (type === 'resolution') {
    templateId = TEMPLATE_RESOLUTION;
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      params,
      EMAILJS_PUBLIC_KEY
    );
    console.log(`✅ Email sent successfully (${type}):`, response.status, response.text);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email (${type}):`, error);
    return false;
  }
};
