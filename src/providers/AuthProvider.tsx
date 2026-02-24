"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { User } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import AuthPrompt from "@/components/auth/AuthPrompt";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  promptSignIn: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  promptSignIn: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const promptSignIn = useCallback(() => setShowAuthPrompt(true), []);
  const dismissPrompt = useCallback(() => setShowAuthPrompt(false), []);
  const handleSignIn = useCallback(() => {
    setShowAuthPrompt(false);
    auth.signIn();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ ...auth, promptSignIn }}>
      {children}
      <AuthPrompt open={showAuthPrompt} onSignIn={handleSignIn} onDismiss={dismissPrompt} />
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
