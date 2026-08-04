import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import {
  completeAuthGreeting,
  registerAuthGreetingListener,
  type AuthGreetingPayload,
} from '../services/authGreeting.controller';

/** Lazy : expo-video chargé uniquement quand un greeting est joué. */
const AuthGreetingOverlay = lazy(() =>
  import('../components/auth/AuthGreetingOverlay').then((module) => ({
    default: module.AuthGreetingOverlay,
  })),
);

interface AuthGreetingProviderProps {
  children: React.ReactNode;
}

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
      {greeting ? (
        <Suspense fallback={null}>
          <AuthGreetingOverlay greeting={greeting} onDone={handleDone} />
        </Suspense>
      ) : null}
    </>
  );
};
