import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // In production, use environment variables for service account
  // For now, we'll use a placeholder - you'll need to add your Firebase service account key
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();

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
    const provider = decodedToken.firebase?.sign_in_provider as 'google' | 'facebook' | 'github' | 'apple' || 'google';

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