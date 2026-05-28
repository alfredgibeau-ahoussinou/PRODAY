import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions';
import { getFirebaseApp } from './firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { getErrorCode } from '../utils/errors';

let functions: Functions | undefined;

const FUNCTIONS_REGION = process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION;

export function getFirebaseFunctions(): Functions | null {
  if (!isFirebaseConfigured()) return null;
  if (!functions) {
    const app = getFirebaseApp();
    if (!app) return null;
    functions = FUNCTIONS_REGION
      ? getFunctions(app, FUNCTIONS_REGION)
      : getFunctions(app);
    if (__DEV__ && process.env.EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR === '1') {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
  }
  return functions;
}

/** Erreur callable : functions/not-found, unavailable, etc. */
export function isFunctionsUnavailable(error: unknown): boolean {
  const code = getErrorCode(error);
  return (
    code === 'functions/not-found' ||
    code === 'functions/unavailable' ||
    code === 'functions/deadline-exceeded' ||
    code === 'functions/internal' ||
    code === 'functions/unknown' ||
    code === 'functions/failed-precondition'
  );
}

export function getCallableErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: string }).message);
    if (msg && msg !== 'internal') return msg;
  }
  const code = getErrorCode(error);
  if (code === 'functions/permission-denied') {
    return 'Droits admin requis. Déconnectez-vous, reconnectez-vous après npm run admin:setup.';
  }
  if (code === 'functions/unauthenticated') {
    return 'Session expirée — reconnectez-vous.';
  }
  if (isFunctionsUnavailable(error)) {
    return 'Cloud Functions indisponibles (plan Blaze + firebase deploy --only functions).';
  }
  return 'Action impossible. Réessayez.';
}

export async function callFunction<TData, TResult>(
  name: string,
  data: TData
): Promise<TResult> {
  const fns = getFirebaseFunctions();
  if (!fns) throw new Error('Firebase Functions non configurées');
  try {
    const fn = httpsCallable<TData, TResult>(fns, name);
    const res = await fn(data);
    return res.data;
  } catch (e) {
    throw new Error(getCallableErrorMessage(e));
  }
}
