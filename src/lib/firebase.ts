import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  enableIndexedDbPersistence,
  Timestamp,
  query,
  orderBy,
  limit,
  where 
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser,
  Auth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  AuthError
} from 'firebase/auth';
import { CalendarEvent, Trophy } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBgtHdFR3nmEExepN09QGXjMNkJMO0dEJ0",
  authDomain: "websimbudet.firebaseapp.com",
  projectId: "websimbudet",
  storageBucket: "websimbudet.appspot.com",
  messagingSenderId: "606669062953",
  appId: "1:606669062953:web:21b1fd1fd69a295f1f2d38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth with persistence
const auth: Auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, browserSessionPersistence]
});

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser doesn\'t support offline persistence.');
  }
});

// Custom error messages for authentication
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in or use a different email.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled. Please try again.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
};

// Event management functions
export const addEvent = async (event: CalendarEvent) => {
  if (!auth.currentUser) throw new Error('User must be logged in');

  try {
    const eventData = {
      ...event,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await addDoc(collection(db, 'events'), eventData);
  } catch (error: any) {
    console.error('Error adding event:', error);
    throw new Error(error.message || 'Failed to add event');
  }
};

export const updateEvent = async (event: CalendarEvent) => {
  if (!auth.currentUser) throw new Error('User must be logged in');

  try {
    const eventRef = doc(db, 'events', event.id);
    await updateDoc(eventRef, {
      ...event,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    throw new Error(error.message || 'Failed to update event');
  }
};

// Auth functions
export const createUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const resetUserPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const deleteUserAccount = async (userId: string) => {
  if (!auth.currentUser) throw new Error('User must be logged in');

  try {
    // Delete all user's events
    const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
    const eventSnapshot = await getDocs(eventsQuery);
    const deletePromises = eventSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the user's authentication account
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
    }
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

// Trophy management functions
export const createTrophy = async (trophy: Omit<Trophy, 'id'>) => {
  if (!auth.currentUser) throw new Error('User must be logged in');

  try {
    const trophyData = {
      ...trophy,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await addDoc(collection(db, 'trophies'), trophyData);
  } catch (error: any) {
    console.error('Error creating trophy:', error);
    throw new Error(error.message || 'Failed to create trophy');
  }
};

export const updateTrophy = async (trophyId: string, updates: Partial<Trophy>) => {
  if (!auth.currentUser) throw new Error('User must be logged in');

  try {
    const trophyRef = doc(db, 'trophies', trophyId);
    await updateDoc(trophyRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error updating trophy:', error);
    throw new Error(error.message || 'Failed to update trophy');
  }
};

export { db, auth };