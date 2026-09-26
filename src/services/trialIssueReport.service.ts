/**
 * Service de signalement d'anomalies d'essai club (Trial Issue Reporting Service)
 *
 * Recueille les retours des participants réels en attachant strictement le contexte technique utile :
 * - Version du build (1.0.10)
 * - Écran / Route active
 * - Rôle actif
 * - Plateforme et heure
 *
 * INTERDICTION FORMELLE : Aucun mot de passe, jeton d'authentification, document médical,
 * message privé ou enregistrement de session n'est capturé.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { UserRole } from '../models/User';

export const APP_TRIAL_VERSION = '1.0.10-rc.trial.1';
const STORAGE_DRAFT_KEY = '@proday:trial_issue_report_draft';
const COL_NAME = 'trial_issue_reports';

export interface TrialIssueReportInput {
  title: string;
  expectedBehavior: string;
  observedBehavior: string;
  screenshotUrl?: string;
  currentRoute?: string;
  userRole?: UserRole;
  userEmail?: string;
}

export interface SubmittedTrialIssueReport {
  reportId: string;
  title: string;
  expectedBehavior: string;
  observedBehavior: string;
  screenshotUrl?: string;
  appVersion: string;
  route: string;
  role: string;
  platform: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
}

function generateReportId(): string {
  const chars = '0123456789ABCDEF';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TR-${rand}`;
}

export const trialIssueReportService = {
  /**
   * Sauvegarde locale du brouillon en cas de fermeture accidentelle ou de panne réseau
   */
  async saveDraft(draft: Partial<TrialIssueReportInput>): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('[trialIssueReportService] Erreur sauvegarde brouillon:', e);
    }
  },

  /**
   * Récupération du dernier brouillon non soumis
   */
  async getDraft(): Promise<Partial<TrialIssueReportInput> | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Partial<TrialIssueReportInput>;
    } catch {
      return null;
    }
  },

  /**
   * Efface le brouillon après soumission réussie
   */
  async clearDraft(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_DRAFT_KEY);
    } catch (e) {
      console.warn('[trialIssueReportService] Erreur effacement brouillon:', e);
    }
  },

  /**
   * Envoi du rapport d'anomalie
   */
  async submitReport(
    input: TrialIssueReportInput,
  ): Promise<{ success: boolean; reportId: string; error?: string }> {
    const reportId = generateReportId();
    const timestamp = new Date().toISOString();

    const payload: SubmittedTrialIssueReport = {
      reportId,
      title: input.title.trim(),
      expectedBehavior: input.expectedBehavior.trim(),
      observedBehavior: input.observedBehavior.trim(),
      screenshotUrl: input.screenshotUrl ? input.screenshotUrl.trim() : undefined,
      appVersion: APP_TRIAL_VERSION,
      route: input.currentRoute || 'unknown',
      role: input.userRole || 'anonymous',
      platform: `${Platform.OS} (${Platform.Version})`,
      timestamp,
      status: 'new',
    };

    // Validation minimale
    if (!payload.title || !payload.observedBehavior) {
      return {
        success: false,
        reportId,
        error: 'Veuillez remplir au moins la description courte et ce qui s’est passé.',
      };
    }

    try {
      if (isFirebaseConfigured()) {
        const db = getDb();
        if (db) {
          await addDoc(collection(db, COL_NAME), {
            ...payload,
            server_created_at: serverTimestamp(),
          });
        }
      }

      // Conserver une trace locale dans l'historique de la session
      await this.clearDraft();

      return {
        success: true,
        reportId,
      };
    } catch (err) {
      console.warn('[trialIssueReportService] Erreur soumission rapport:', err);
      // Préserver les données en brouillon pour permettre à l'utilisateur de réessayer
      await this.saveDraft(input);

      return {
        success: false,
        reportId,
        error: 'Échec de transmission au serveur. Ton texte a été sauvegardé, tu peux réessayer.',
      };
    }
  },
};
