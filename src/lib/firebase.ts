import * as admin from 'firebase-admin';
import { env } from "cloudflare:workers"
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
  "type": "service_account",
  "project_id": "startupmart-5c760",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key":process.env.FIREBASE_PRIVATE_KEY,
  "client_email": "firebase-adminsdk-fbsvc@startupmart-5c760.iam.gserviceaccount.com",
  "client_id": "107726128436226990468",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40startupmart-5c760.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),

  });
}



export const auth = admin.auth();


export interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  provider?: 'google' | 'facebook' | 'github' | 'apple';
  customClaims?: {
    role?: 'startup_owner' | 'investor';
  };
}

// Verify Firebase ID token
export async function verifyIdToken(token: string): Promise<FirebaseUser> {
  try {
    const decodedToken = await auth.verifyIdToken(token);

    // Extract provider from firebase.sign_in_provider claim
    let provider: 'google' | 'facebook' | 'github' | 'apple' = 'google';
    if (decodedToken.firebase?.sign_in_provider) {
      const signInProvider = decodedToken.firebase.sign_in_provider;
      if (signInProvider === 'google.com') provider = 'google';
      else if (signInProvider === 'facebook.com') provider = 'facebook';
      else if (signInProvider === 'github.com') provider = 'github';
      else if (signInProvider === 'apple.com') provider = 'apple';
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      phoneNumber: decodedToken.phone_number,
      provider,
      customClaims: decodedToken.role ? { role: decodedToken.role } : undefined
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Set custom claims for user role
export async function setUserRole(uid: string, role: 'startup_owner' | 'investor') {
  await auth.setCustomUserClaims(uid, { role });
}