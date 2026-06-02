// Nutrift Authentication Module
import { firebaseConfig } from './firebase-config.js';

let auth, db;

// Initialize Firebase on demand
export async function initializeFirebase() {
  if (auth && db) return { auth, db };

  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js');
  const { getAuth } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js');
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  return { auth, db };
}

// Sign Up
export async function signUp(email, password) {
  try {
    await initializeFirebase();
    const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up:', userCredential.user.uid);
    return { success: true, uid: userCredential.user.uid };
  } catch (error) {
    console.error('Sign up error:', error.message);
    return { success: false, error: error.message };
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    await initializeFirebase();
    const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.uid);
    return { success: true, uid: userCredential.user.uid };
  } catch (error) {
    console.error('Sign in error:', error.message);
    return { success: false, error: error.message };
  }
}

// Sign Out
export async function signOut() {
  try {
    await initializeFirebase();
    const { signOut: firebaseSignOut } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js');
    
    await firebaseSignOut(auth);
    console.log('User signed out');
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error.message);
    return { success: false, error: error.message };
  }
}

// Reset Password
export async function resetPassword(email) {
  try {
    await initializeFirebase();
    const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js');
    
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent');
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error.message);
    return { success: false, error: error.message };
  }
}

// Save User Profile to Firestore
export async function saveUserProfile(userId, profileData) {
  try {
    await initializeFirebase();
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      createdAt: new Date(),
      subscriptionTier: 'free'
    });
    console.log('User profile saved');
    return { success: true };
  } catch (error) {
    console.error('Save profile error:', error.message);
    return { success: false, error: error.message };
  }
}

// Get Current User
export async function getCurrentUser() {
  return new Promise((resolve) => {
    const checkUser = async () => {
      try {
        await initializeFirebase();
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js');
        onAuthStateChanged(auth, (user) => {
          resolve(user);
        });
      } catch (error) {
        console.error('Error checking auth status:', error);
        resolve(null);
      }
    };
    checkUser();
  });
}

// Get User Profile from Firestore
export async function getUserProfile(userId) {
  try {
    await initializeFirebase();
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Get profile error:', error.message);
    return { success: false, error: error.message };
  }
}
