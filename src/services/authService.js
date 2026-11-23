import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config.js';
import { handleFirestoreError, OperationType } from '../firebase/errors.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';

export async function syncUserDocuments(user, extra = {}) {
  if (!user?.uid) return null;

  const displayName = (extra.displayName || user.displayName || user.email?.split('@')[0] || 'Tutor')
    .trim()
    .slice(0, VALIDATION_LIMITS.DISPLAY_NAME_MAX);
  const photoURL = (extra.photoURL ?? user.photoURL ?? '').slice(0, 500);
  const city = (extra.city || '').trim().slice(0, VALIDATION_LIMITS.CITY_MAX);
  const neighborhood = (extra.neighborhood || city || '').trim().slice(0, VALIDATION_LIMITS.NEIGHBORHOOD_MAX);

  const userRef = doc(db, 'users', user.uid);
  const publicRef = doc(db, 'publicProfiles', user.uid);

  try {
    const existingSnap = await getDoc(userRef);
    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        email: (user.email || '').slice(0, 160),
        photoURL,
        city,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (extra.forceUpdate) {
      await updateDoc(userRef, {
        displayName,
        photoURL,
        city,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  try {
    const existingPublic = await getDoc(publicRef);
    if (!existingPublic.exists()) {
      await setDoc(publicRef, {
        uid: user.uid,
        displayName,
        photoURL,
        neighborhood,
        updatedAt: serverTimestamp(),
      });
    } else if (extra.forceUpdate) {
      await updateDoc(publicRef, {
        displayName,
        photoURL,
        neighborhood,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `publicProfiles/${user.uid}`);
  }

  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

export async function getPrivateUserProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function getPublicUserProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'publicProfiles', uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function registerWithEmail({ name, email, password, city }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const cleanName = name.trim().slice(0, VALIDATION_LIMITS.DISPLAY_NAME_MAX);
  await updateProfile(credential.user, { displayName: cleanName });
  await syncUserDocuments(credential.user, {
    displayName: cleanName,
    city: city || '',
    forceUpdate: false,
  });
  try {
    await sendEmailVerification(credential.user);
  } catch (err) {
    console.warn('Não foi possível enviar o e-mail de verificação automaticamente:', err);
  }
  return credential.user;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncUserDocuments(credential.user);
  return credential.user;
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  await syncUserDocuments(credential.user);
  return credential.user;
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error('Usuário não autenticado.');
  await sendEmailVerification(auth.currentUser);
}

export async function refreshCurrentUser() {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}

export async function updateUserProfileData({ displayName, city, photoURL }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Você precisa estar conectado para editar o perfil.');

  const cleanName = displayName.trim().slice(0, VALIDATION_LIMITS.DISPLAY_NAME_MAX);
  const cleanPhoto = (photoURL ?? user.photoURL ?? '').slice(0, 500);

  await updateProfile(user, {
    displayName: cleanName,
    photoURL: cleanPhoto || null,
  });

  await syncUserDocuments(user, {
    displayName: cleanName,
    photoURL: cleanPhoto,
    city: (city || '').trim(),
    neighborhood: (city || '').trim(),
    forceUpdate: true,
  });

  return user;
}

export async function logoutUser() {
  await signOut(auth);
}
