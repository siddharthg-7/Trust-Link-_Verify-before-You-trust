
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve('serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password
    });
    console.log('Successfully created test user:', userRecord.uid);
    // Cleanup
    await admin.auth().deleteUser(userRecord.uid);
    console.log('Test user deleted.');
  } catch (error) {
    console.error('Error during test signup:', error.message);
  } finally {
    process.exit();
  }
}

testSignup();
