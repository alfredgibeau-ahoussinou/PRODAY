import React, { useCallback, useEffect, useState } from 'react';
import {
  completeAuthGreeting,
  registerAuthGreetingListener,
  type AuthGreetingPayload,
} from '../services/authGreeting.controller';
import { AuthGreetingOverlay } from '../components/auth/AuthGreetingOverlay';

interface AuthGreetingProviderProps {
  children: React.ReactNode;
}

/**
 * Hoste le reveal session (Bienvenue / Au revoir) déclenché via playAuthGreeting.
 * Plus de lazy vidéo — overlay brand léger.
 */
export const AuthGreetingProvider: React.FC<AuthGreetingProviderProps> = ({ children }) => {
  const [greeting, setGreeting] = useState<AuthGreetingPayload | null>(null);

  useEffect(() => {
    return registerAuthGreetingListener((payload) => {
      setGreeting(payload);
    });
  }, []);

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
