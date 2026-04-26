
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve('serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function checkUser() {
  const email = 'siddharthexam21@gmail.com';
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('User found:');
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
    console.log('Email Verified:', userRecord.emailVerified);
    console.log('Disabled:', userRecord.disabled);
    console.log('Metadata:', userRecord.metadata);
    
    // Also check if they have a role in Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      console.log('Firestore data:', userDoc.data());
    } else {
      console.log('No Firestore document found for this user.');
    }

  } catch (error) {
    console.error('Error fetching user:', error.message);
  } finally {
    process.exit();
  }
}

checkUser();
