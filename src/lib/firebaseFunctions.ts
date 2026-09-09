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

/**
 * Infra / déploiement : CF absente, timeout, crash.
 * Ne pas y mettre `failed-precondition` (souvent config serveur, ex. MISTRAL_API_KEY) —
 * sinon l’UI masque le message actionnable derrière « indisponible ».
 */
export function isFunctionsUnavailable(error: unknown): boolean {
  const code = getErrorCode(error);
  return (
    code === 'functions/not-found' ||
    code === 'functions/unavailable' ||
    code === 'functions/deadline-exceeded' ||
    code === 'functions/internal' ||
    code === 'functions/unknown'
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

/** Codes SDK bruts sans détail métier (ex. message === "internal"). */
function isBareFunctionsCodeMessage(msg: string): boolean {
  const n = msg.trim().toLowerCase();
  return (
    !n ||
    isBareFunctionsNotFoundMessage(n) ||
    n === 'unavailable' ||
    n === 'functions/unavailable' ||
    n === 'internal' ||
    n === 'functions/internal' ||
    n === 'unknown' ||
    n === 'functions/unknown' ||
    n === 'deadline-exceeded' ||
    n === 'functions/deadline-exceeded' ||
    n === 'deadline_exceeded'
  );
}

/** Ancien fallback trop agressif (ba178ae7) — ne jamais le réafficher tel quel. */
function isLegacyBlazeDeployFalsePositive(msg: string): boolean {
  return /plan\s+blaze/i.test(msg) && /firebase deploy|cloud functions indisponibles/i.test(msg);
}

/** Déjà humanisé côté client — ne pas remapper vers Blaze / deploy. */
function isAlreadyHumanizedCallableMessage(msg: string): boolean {
  const n = msg.trim();
  if (!n || isBareFunctionsCodeMessage(n) || isLegacyBlazeDeployFalsePositive(n)) return false;
  // Phrases FR produites par getCallableErrorMessage / services.
  if (
    /cloud function introuvable|session expir|droits admin|trop de tentatives|délai dépassé|erreur serveur|temporairement indisponible|réessay/i.test(
      n,
    )
  ) {
    return true;
  }
  // Message métier serveur (HttpsError) : phrase libre.
  return n.length > 12 && !/^functions\//i.test(n) && !/cloud functions indisponibles/i.test(n);
}

export function getCallableErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  const rawMsg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message).trim()
      : '';

  // Déjà passé par callFunction / un service : garder le texte honnête.
  if (rawMsg && isAlreadyHumanizedCallableMessage(rawMsg)) {
    return humanizeAuthErrorText(rawMsg);
  }

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
  if (code === 'functions/invalid-argument') {
    return rawMsg && !isBareFunctionsCodeMessage(rawMsg)
      ? humanizeAuthErrorText(rawMsg)
      : 'Paramètres invalides. Vérifiez la saisie.';
  }
  if (code === 'functions/failed-precondition') {
    // IA / Mistral : garder le message serveur (clé manquante), pas le texte Auth e-mail.
    if (
      /mistral|ia\b|assistant|coach|copilote|clé|api.?key|non configur/i.test(rawMsg)
    ) {
      return rawMsg;
    }
    return humanizeAuthErrorText(rawMsg || AUTH_EMAIL_CONFIG_MESSAGE);
  }
  if (code === 'functions/not-found') {
    if (rawMsg && !isBareFunctionsNotFoundMessage(rawMsg)) {
      return humanizeAuthErrorText(rawMsg);
    }
    return 'Cloud Function introuvable (région europe-west1 ou non déployée). Déployez avec firebase deploy --only functions.';
  }
  // Indispo / timeout / crash : messages honnêtes — PAS « plan Blaze » (souvent faux positif).
  if (code === 'functions/unavailable') {
    return 'Service Cloud Functions temporairement indisponible. Réessayez dans un instant.';
  }
  if (code === 'functions/deadline-exceeded') {
    return 'Délai dépassé côté serveur. Réessayez.';
  }
  if (code === 'functions/internal' || code === 'functions/unknown') {
    if (rawMsg && !isBareFunctionsCodeMessage(rawMsg)) {
      return humanizeAuthErrorText(rawMsg);
    }
    return 'Erreur serveur Cloud Functions. Réessayez. Si ça continue, consultez les logs Firebase de la fonction.';
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
