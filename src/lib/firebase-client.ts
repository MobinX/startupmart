import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyDuGFR6DqZeCa6H8YYdS8Uj931moiM9jyo",
  authDomain: "startupmart-5c760.firebaseapp.com",
  projectId: "startupmart-5c760",
  storageBucket: "startupmart-5c760.firebasestorage.app",
  messagingSenderId: "55634184492",
  appId: "1:55634184492:web:85e154fb343b7fdbb0c489",
  measurementId: "G-Q72QNE707P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Add scopes for additional data
googleProvider.addScope('email');
googleProvider.addScope('profile');
facebookProvider.addScope('email');
githubProvider.addScope('user:email');

// Helper functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
export const signInWithGithub = () => signInWithPopup(auth, githubProvider);
export const signInWithApple = () => signInWithPopup(auth, appleProvider);

export const signOut = () => firebaseSignOut(auth);

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get ID token
export const getIdToken = async (user: User): Promise<string> => {
  return await user.getIdToken();
};

// Helper to get user profile data
export const getUserProfile = (user: User) => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  emailVerified: user.emailVerified,
  provider: user.providerData[0]?.providerId?.replace('.com', '') || 'unknown'
});

export default app;