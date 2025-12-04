import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
 
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