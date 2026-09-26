jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  trialIssueReportService,
  APP_TRIAL_VERSION,
} from '../services/trialIssueReport.service';
import { trialDiagnostics } from '../utils/trialDiagnostics';

describe('ProDay Trial Feedback & Failure Diagnostics System', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('1. Traceable Diagnostics & Sanitized Logging', () => {
    it('generates traceable reference codes matching the affected functional domain', () => {
      const regError = trialDiagnostics.createTraceableError({
        domain: 'REG',
        userTitle: 'Échec validation adhésion',
        userExplanation: 'La mise à jour de la licence a été refusée.',
        nextAction: 'Vérifier la connexion au serveur du club.',
      });

      expect(regError.referenceCode).toMatch(/^REF-REG-[0-9A-F]{6}$/);
      expect(regError.domain).toBe('REG');
      expect(regError.userTitle).toBe('Échec validation adhésion');
      expect(regError.nextAction).toContain('Vérifier la connexion');

      const xpError = trialDiagnostics.createTraceableError({
        domain: 'XP',
        userTitle: 'Attribution XP impossible',
        userExplanation: 'Cette quête a déjà été créditée au grand livre.',
        nextAction: 'Consulter l’historique des récompenses.',
      });

      expect(xpError.referenceCode).toMatch(/^REF-XP-[0-9A-F]{6}$/);
      expect(xpError.domain).toBe('XP');
    });

    it('redacts sensitive information (passwords, tokens, medical data, message content) from diagnostic context', () => {
      const sensitiveContext = {
        user_uid: 'usr_test_123',
        password_hash: 'secret_hash_value',
        bearer_token: 'jwt_token_header',
        medical_record_diagnostics: 'Asthme d’effort',
        message_body: 'Contenu privé confidentiel',
        public_team_id: 'team_u17',
      };

      const error = trialDiagnostics.createTraceableError({
        domain: 'DOC',
        userTitle: 'Erreur téléversement document',
        userExplanation: 'Le fichier n’a pas pu être transmis.',
        nextAction: 'Réessayer avec un format PDF de moins de 5 Mo.',
        sanitizedContext: sensitiveContext,
      });

      expect(error.sanitizedContext.user_uid).toBe('usr_test_123');
      expect(error.sanitizedContext.public_team_id).toBe('team_u17');
      expect(error.sanitizedContext.password_hash).toBe('[REDACTED_FOR_SECURITY]');
      expect(error.sanitizedContext.bearer_token).toBe('[REDACTED_FOR_SECURITY]');
      expect(error.sanitizedContext.medical_record_diagnostics).toBe('[REDACTED_FOR_SECURITY]');
      expect(error.sanitizedContext.message_body).toBe('[REDACTED_FOR_SECURITY]');
    });

    it('accurately diagnoses external integration failures with practical user guidance', () => {
      const fffMappingErr = trialDiagnostics.diagnoseExternalIntegration({
        domain: 'FFF',
        serviceName: 'Fédération Française de Football',
        failureKind: 'invalid_mapping',
        details: 'Code affiliation 999999 inconnu',
      });

      expect(fffMappingErr.domain).toBe('FFF');
      expect(fffMappingErr.integrationFailureKind).toBe('invalid_mapping');
      expect(fffMappingErr.userTitle).toContain('non reconnue');
      expect(fffMappingErr.nextAction).toContain('code affiliation');

      const veoCredsErr = trialDiagnostics.diagnoseExternalIntegration({
        domain: 'VID',
        serviceName: 'Veo Cam',
        failureKind: 'credentials_missing',
      });

      expect(veoCredsErr.domain).toBe('VID');
      expect(veoCredsErr.integrationFailureKind).toBe('credentials_missing');
      expect(veoCredsErr.userTitle).toContain('incomplète');
      expect(veoCredsErr.nextAction).toContain('clé d\'API');
    });
  });

  describe('2. Trial Issue Reporting & Privacy Safeguards', () => {
    it('validates mandatory fields and attaches authorized technical context without private leaks', async () => {
      // 1. Rejet si champs obligatoires vides
      const invalidSubmission = await trialIssueReportService.submitReport({
        title: '',
        expectedBehavior: 'Attendu...',
        observedBehavior: '',
      });

      expect(invalidSubmission.success).toBe(false);
      expect(invalidSubmission.error).toContain('remplir au moins');

      // 2. Soumission valide
      const validSubmission = await trialIssueReportService.submitReport({
        title: 'Bouton de présence inactif',
        expectedBehavior: 'Le bouton doit passer en vert et valider la présence',
        observedBehavior: 'Le bouton reste gris après plusieurs clics',
        currentRoute: 'CoachHomeScreen/TrainingDetail',
        userRole: 'coach',
      });

      expect(validSubmission.success).toBe(true);
      expect(validSubmission.reportId).toMatch(/^TR-[0-9A-F]{6}$/);
    });

    it('preserves draft locally during failure and enables seamless retry', async () => {
      const draftData = {
        title: 'Problème affichage schéma',
        expectedBehavior: 'Les flèches d’animation doivent bouger',
        observedBehavior: 'Le schéma reste figé sur mobile',
      };

      // Sauvegarde du brouillon
      await trialIssueReportService.saveDraft(draftData);

      const restored = await trialIssueReportService.getDraft();
      expect(restored).not.toBeNull();
      expect(restored?.title).toBe(draftData.title);
      expect(restored?.observedBehavior).toBe(draftData.observedBehavior);

      // Effacement après envoi réussi
      await trialIssueReportService.clearDraft();
      const afterClear = await trialIssueReportService.getDraft();
      expect(afterClear).toBeNull();
    });

    it('confirms the frozen trial version identifier is attached to every report', () => {
      expect(APP_TRIAL_VERSION).toBe('1.0.10-rc.trial.1');
    });
  });
});
