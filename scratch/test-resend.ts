import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend('re_SQSrWewf_NCfkgRubb75ukaSuav1gBwgV');

async function test() {
  console.log("Sending test email...");
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'siddharthgoudgilakathi@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong> from TrustLink code!</p>'
    });

    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Success! ID:", data?.id);
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

test();
