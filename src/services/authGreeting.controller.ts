export type AuthGreetingKind = 'welcome' | 'goodbye';

export interface AuthGreetingPayload {
  kind: AuthGreetingKind;
  displayName: string;
}

type Listener = (payload: AuthGreetingPayload) => void;

let listener: Listener | null = null;
let pendingResolve: (() => void) | null = null;

export function registerAuthGreetingListener(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Affiche l’animation et résout lorsque l’overlay se ferme. */
export function playAuthGreeting(kind: AuthGreetingKind, displayName: string): Promise<void> {
  if (!listener) return Promise.resolve();
  return new Promise((resolve) => {
    pendingResolve = resolve;
    listener?.({ kind, displayName });
  });
}

export function completeAuthGreeting(): void {
  pendingResolve?.();
  pendingResolve = null;
}
