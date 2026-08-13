import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * Callable legacy — pôle Santé retiré.
 * Conservé pour que d’anciens clients reçoivent une erreur claire plutôt qu’un 404 Functions.
 */
export const getVisioJoinUrl = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Connexion requise');
  }

  throw new HttpsError(
    'failed-precondition',
    'Le pôle Santé n’est plus disponible sur ProDay.',
  );
});
