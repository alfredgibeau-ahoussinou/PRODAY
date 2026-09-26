/**
 * ProDay Trial Diagnostics & Traceable Error References
 *
 * Fournit une référence traçable unique (ex: REF-REG-8A1F3C) pour chaque échec critique,
 * avec journalisation assainie (sans mots de passe, tokens, messages privés ni documents médicaux),
 * et un message clair orientant l'utilisateur vers une action concrète.
 */

export type DiagnosticDomain =
  | 'REG' // Inscription et adhésion club
  | 'SES' // Séances d'entraînement et compositions tactiques
  | 'MSG' // Messagerie
  | 'DOC' // Téléversement de documents
  | 'VID' // Vidéos et caméras Veo
  | 'XP'  // Attribution et ledger d'XP joueur
  | 'FFF'; // Synchronisation fédérale FFF

export type ExternalIntegrationFailureKind =
  | 'credentials_missing'
  | 'access_denied'
  | 'invalid_mapping'
  | 'provider_failure'
  | 'cached_outdated';

export interface TraceableError {
  referenceCode: string;
  domain: DiagnosticDomain;
  userTitle: string;
  userExplanation: string;
  nextAction: string;
  integrationFailureKind?: ExternalIntegrationFailureKind;
  sanitizedContext: Record<string, unknown>;
  timestamp: string;
}

function generateRandomHex(length = 6): string {
  let result = '';
  const chars = '0123456789ABCDEF';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const trialDiagnostics = {
  /**
   * Crée et consigne une erreur traçable sécurisée
   */
  createTraceableError(options: {
    domain: DiagnosticDomain;
    userTitle: string;
    userExplanation: string;
    nextAction: string;
    integrationFailureKind?: ExternalIntegrationFailureKind;
    sanitizedContext?: Record<string, unknown>;
    rawError?: unknown;
  }): TraceableError {
    const referenceCode = `REF-${options.domain}-${generateRandomHex(6)}`;
    const timestamp = new Date().toISOString();

    const sanitizedContext: Record<string, unknown> = {
      domain: options.domain,
      timestamp,
      ...(options.sanitizedContext ?? {}),
    };

    // Nettoyer toute clé sensible résiduelle
    for (const key of Object.keys(sanitizedContext)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('auth') ||
        lower.includes('medical') ||
        lower.includes('message_body')
      ) {
        sanitizedContext[key] = '[REDACTED_FOR_SECURITY]';
      }
    }

    if (options.integrationFailureKind) {
      sanitizedContext.integrationFailureKind = options.integrationFailureKind;
    }

    if (options.rawError instanceof Error) {
      sanitizedContext.error_name = options.rawError.name;
      sanitizedContext.error_message_summary = options.rawError.message.substring(0, 120);
    }

    // Journalisation assainie côté console / monitoring
    console.warn(
      `[TrialDiagnostics] [${referenceCode}] ${options.userTitle} | Action requise: ${options.nextAction}`,
      sanitizedContext,
    );

    return {
      referenceCode,
      domain: options.domain,
      userTitle: options.userTitle,
      userExplanation: options.userExplanation,
      nextAction: options.nextAction,
      integrationFailureKind: options.integrationFailureKind,
      sanitizedContext,
      timestamp,
    };
  },

  /**
   * Diagnostic spécialisé pour les intégrations externes (FFF, Veo, Fournisseurs météo/vidéo)
   */
  diagnoseExternalIntegration(options: {
    domain: 'FFF' | 'VID';
    serviceName: string;
    failureKind: ExternalIntegrationFailureKind;
    details?: string;
  }): TraceableError {
    let userTitle = `Service ${options.serviceName} indisponible`;
    let userExplanation = '';
    let nextAction = '';

    switch (options.failureKind) {
      case 'credentials_missing':
        userTitle = `Configuration ${options.serviceName} incomplète`;
        userExplanation = `Les identifiants d'API officiels de ce service n'ont pas encore été renseignés pour le club.`;
        nextAction = `Rapproche-toi du coordinateur technique pour enregistrer la clé d'API du club.`;
        break;
      case 'access_denied':
        userTitle = `Accès non autorisé à ${options.serviceName}`;
        userExplanation = `Le compte ou la clé utilisée ne dispose pas des droits de consultation pour cette compétition ou ce flux.`;
        nextAction = `Vérifie les permissions accordées sur l'espace fournisseur officiel.`;
        break;
      case 'invalid_mapping':
        userTitle = `Équipe non reconnue sur ${options.serviceName}`;
        userExplanation = `Le numéro d'affiliation ou le code compétition FFF ne correspond à aucune poule active de la saison courante.`;
        nextAction = `Vérifie le code affiliation du club dans les paramètres administratifs.`;
        break;
      case 'provider_failure':
        userTitle = `Serveur ${options.serviceName} en dérangement`;
        userExplanation = `Le service distant ne répond pas ou a renvoyé une erreur réseau momentanée.`;
        nextAction = `Attends quelques instants puis rafraîchis l'écran. Tes données locales restent intactes.`;
        break;
      case 'cached_outdated':
        userTitle = `Données ${options.serviceName} temporairement obsolètes`;
        userExplanation = `La dernière synchronisation réussie date d'il y a plus de 24h et la mise à jour en direct a échoué.`;
        nextAction = `Consulte les données en cache affichées avec le badge « Ancien » en attendant le rétablissement de la passerelle.`;
        break;
    }

    return this.createTraceableError({
      domain: options.domain,
      userTitle,
      userExplanation,
      nextAction,
      integrationFailureKind: options.failureKind,
      sanitizedContext: {
        serviceName: options.serviceName,
        failureKind: options.failureKind,
        details: options.details ?? '',
      },
    });
  },
};
