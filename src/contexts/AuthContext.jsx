import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import { getPrivateUserProfile, refreshCurrentUser, syncUserDocuments } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const loadProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setProfile(null);
      return null;
    }
    try {
      let data = await getPrivateUserProfile(firebaseUser.uid);
      if (!data) {
        data = await syncUserDocuments(firebaseUser);
      }
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Erro ao carregar perfil do usuário:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const refreshAuth = useCallback(async () => {
    const updated = await refreshCurrentUser();
    if (updated) {
      setUser({ ...updated });
      await loadProfile(updated);
    }
    return updated;
  }, [loadProfile]);

  const reloadProfile = useCallback(async () => {
    if (auth.currentUser) {
      setUser({ ...auth.currentUser });
      return loadProfile(auth.currentUser);
    }
    return null;
  }, [loadProfile]);

  const value = {
    user,
    profile,
    authReady,
    isAuthenticated: Boolean(user),
    isVerified: Boolean(user?.emailVerified),
    refreshAuth,
    reloadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }
  return ctx;
}
