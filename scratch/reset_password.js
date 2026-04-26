
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve('serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function resetPassword() {
  const email = 'siddharthexam21@gmail.com';
  const newPassword = '123456789';
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });
    console.log(`Successfully reset password for ${email} to ${newPassword}`);
  } catch (error) {
    console.error('Error resetting password:', error.message);
  } finally {
    process.exit();
  }
}

resetPassword();
