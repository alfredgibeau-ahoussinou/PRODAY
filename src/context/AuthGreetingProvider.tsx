import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGreetingOverlay } from '../components/auth/AuthGreetingOverlay';
import {
  completeAuthGreeting,
  playAuthGreeting,
  registerAuthGreetingListener,
  type AuthGreetingPayload,
} from '../services/authGreeting.controller';
import { useAuth } from './AuthContext';

interface AuthGreetingProviderProps {
  children: React.ReactNode;
}

export const AuthGreetingProvider: React.FC<AuthGreetingProviderProps> = ({ children }) => {
  const { profile, loading } = useAuth();
  const [greeting, setGreeting] = useState<AuthGreetingPayload | null>(null);
  const bootstrappedRef = useRef(false);
  const wasLoggedInRef = useRef(false);

  useEffect(() => {
    return registerAuthGreetingListener((payload) => {
      setGreeting(payload);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      wasLoggedInRef.current = Boolean(profile);
      return;
    }

    const loggedIn = Boolean(profile);
    if (loggedIn && !wasLoggedInRef.current && profile?.display_name) {
      void playAuthGreeting('welcome', profile.display_name);
    }
    wasLoggedInRef.current = loggedIn;
  }, [profile, loading]);

  const handleDone = useCallback(() => {
    setGreeting(null);
    completeAuthGreeting();
  }, []);

  return (
    <>
      {children}
      {greeting ? <AuthGreetingOverlay greeting={greeting} onDone={handleDone} /> : null}
    </>
  );
};
