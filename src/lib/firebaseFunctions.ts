import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions';
import { getFirebaseApp } from './firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { getErrorCode } from '../utils/errors';
import { humanizeAuthErrorText, AUTH_EMAIL_CONFIG_MESSAGE } from '../utils/authOAuthLink';

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

/** Message Firebase brut quand la callable n’existe pas / n’est pas déployée. */
function isBareFunctionsNotFoundMessage(msg: string): boolean {
  const n = msg.trim().toLowerCase();
  return (
    n === 'not-found' ||
    n === 'not_found' ||
    n === 'functions/not-found' ||
    n === 'not found'
  );
}

export function getCallableErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  const rawMsg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message).trim()
      : '';

  // Codes d’abord : le SDK renvoie souvent message === "not-found".
  if (code === 'functions/permission-denied') {
    return 'Droits admin requis. Déconnectez-vous, reconnectez-vous après npm run admin:setup.';
  }
  if (code === 'functions/unauthenticated') {
    return 'Session expirée. Reconnectez-vous.';
  }
  if (code === 'functions/resource-exhausted') {
    return 'Trop de tentatives. Attendez 15 à 60 minutes avant un nouvel envoi.';
  }
  if (code === 'functions/failed-precondition') {
    return humanizeAuthErrorText(rawMsg || AUTH_EMAIL_CONFIG_MESSAGE);
  }
  if (code === 'functions/not-found') {
    if (rawMsg && !isBareFunctionsNotFoundMessage(rawMsg)) {
      return humanizeAuthErrorText(rawMsg);
    }
    return 'Cloud Function introuvable (région europe-west1 ou non déployée). Déployez avec firebase deploy --only functions.';
  }
  if (isFunctionsUnavailable(error)) {
    return 'Cloud Functions indisponibles (plan Blaze + firebase deploy --only functions).';
  }
  if (rawMsg && rawMsg !== 'internal') {
    if (isBareFunctionsNotFoundMessage(rawMsg)) {
      return 'Cloud Function introuvable (région europe-west1 ou non déployée). Déployez avec firebase deploy --only functions.';
    }
    return humanizeAuthErrorText(rawMsg);
  }
  return 'Action impossible. Réessayez.';
}

export async function callFunction<TData, TResult>(
  name: string,
  data: TData,
  region?: string
): Promise<TResult> {
  const app = getFirebaseApp();
  if (!isFirebaseConfigured() || !app) throw new Error('Firebase Functions non configurées');
  const fns = region ? getFunctions(app, region) : getFirebaseFunctions();
  if (!fns) throw new Error('Firebase Functions non configurées');
  try {
    const fn = httpsCallable<TData, TResult>(fns, name);
    const res = await fn(data);
    return res.data;
  } catch (e) {
    const err = new Error(getCallableErrorMessage(e)) as Error & { code?: string };
    const code = getErrorCode(e);
    if (code) err.code = code;
    throw err;
  }
}
