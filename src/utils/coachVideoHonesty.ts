/**
 * Copy UX honnête — parcours vidéo Coach / soft-lock (pas de faux OAuth Veo).
 */

export function coachVideoLockReason(): string {
  return 'Mes vidéos est ouvert quand ProDay active le module (admin) ou que ton club a une formule vidéo. Pas de connexion Veo magique depuis l’app coach.';
}

export function coachVideoLockTitle(): string {
  return 'Module vidéo verrouillé';
}

export function coachVideoLockBody(lockReason?: string): string {
  return (
    lockReason ??
    'Demande l’ouverture à ton club (formule Tout inclus / Pro + Veo) ou à ProDay. En attendant, calendrier et effectif restent disponibles.'
  );
}

export function coachVideoEmptyLibraryBody(): string {
  return 'Aucune captation club pour l’instant. Le club enregistre les caméras / imports dans Centre Vidéo — pas de faux « Connecter Veo » ici.';
}

export function coachVideoLiveUnavailableBody(): string {
  return 'Live Center affiche l’état réel dès qu’une captation club est en cours. Aucune jauge inventée (batterie, chrono) sans flux.';
}

export function coachVideoAiHonestAlert(topic: string): string {
  return `${topic} : disponible quand une vidéo club est synchronisée et analysée. Aucun clip magique sans média.`;
}

export function cameraConnectHonestMessage(label: string, hasNativeApi: boolean): string {
  if (!hasNativeApi) {
    return `${label} : fiche enregistrée. Importez vos fichiers — OAuth fabricant non branché dans ProDay.`;
  }
  return `${label} : fiche caméra enregistrée au club. La connexion compte fabricant (OAuth) se fait hors app tant que le connecteur n’est pas livré.`;
}

export function smartTacticsVideoHonestAlert(): string {
  return 'Job cloud créé si le service répond. Sans fichier uploadé, aucun highlight inventé — ajoutez une URL ou une captation club.';
}
