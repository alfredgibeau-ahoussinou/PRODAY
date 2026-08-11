import { tr } from '../../i18n/translate';
import type { TranslateFn } from '../../i18n/types';
import type { IconName } from '../../components/ui/iconNames';
import type { MedicalSpecialtyId } from './signupRoleExperience';

export const MEDICAL_SPECIALTY_IDS: MedicalSpecialtyId[] = [
  'kine',
  'osteo',
  'medecin',
  'prepa',
  'mental',
  'nutrition',
  'podologue',
];

/** Libellés canoniques FR — stockés en base pour compatibilité annuaire santé. */
export const MEDICAL_CANONICAL_LABELS: Record<MedicalSpecialtyId, string> = {
  kine: 'Kinésithérapeute du sport',
  osteo: 'Ostéopathe',
  medecin: 'Médecin du sport',
  prepa: 'Préparateur physique',
  mental: 'Coach mental / préparateur mental',
  nutrition: 'Nutritionniste sportif',
  podologue: 'Podologue du sport',
};

export interface LocalizedMedicalSpecialtyConfig {
  id: MedicalSpecialtyId;
  label: string;
  shortLabel: string;
  icon: IconName;
  tagline: string;
  practiceTitle: string;
  practiceSubtitle: string;
  practiceFocusLabel: string;
  practiceFocusOptions: string[];
  practiceHint: string;
}

const BASE: Record<
  MedicalSpecialtyId,
  Omit<LocalizedMedicalSpecialtyConfig, 'id'>
> = {
  kine: {
    icon: 'walk',
    tagline: 'Rééducation, prévention et retour au jeu.',
    practiceTitle: 'Votre zone d’intervention',
    practiceSubtitle: 'Où accompagnez-vous les sportifs ?',
    practiceFocusLabel: 'Type d’activité principal *',
    practiceFocusOptions: ['Cabinet', 'Club / centre', 'Domicile sportif', 'Mixte'],
    practiceHint: 'Les joueurs et clubs verront votre spécialité kiné sur le fil ProDay.',
    shortLabel: 'Kiné sport',
    label: 'Kinésithérapeute du sport',
  },
  osteo: {
    icon: 'person',
    tagline: 'Mobilité, posture et récupération des athlètes.',
    practiceTitle: 'Votre cabinet',
    practiceSubtitle: 'Présentez votre approche ostéo sport.',
    practiceFocusLabel: 'Public principal *',
    practiceFocusOptions: ['Amateurs', 'Semi-pro / Régional', 'Élite jeunes', 'Tous niveaux'],
    practiceHint: 'Profil visible auprès des staffs et joueurs de votre secteur.',
    shortLabel: 'Ostéo',
    label: 'Ostéopathe',
  },
  medecin: {
    icon: 'shield',
    tagline: 'Suivi médical, aptitudes et prévention des blessures.',
    practiceTitle: 'Secteur médical',
    practiceSubtitle: 'Clubs et catégories que vous suivez.',
    practiceFocusLabel: 'Spécialisation *',
    practiceFocusOptions: ['Médecine du sport club', 'Urgentiste sport', 'Bilan & aptitudes', 'Recherche'],
    practiceHint: 'Vérification du diplôme après confirmation email.',
    shortLabel: 'Médecin',
    label: 'Médecin du sport',
  },
  prepa: {
    icon: 'football',
    tagline: 'Charge, perf et prévention. Du terrain au labo.',
    practiceTitle: 'Vos équipes',
    practiceSubtitle: 'Qui formez-vous au quotidien ?',
    practiceFocusLabel: 'Profil accompagné *',
    practiceFocusOptions: ['Individuel', 'Groupe / équipe', 'Centre de formation', 'Réathlétisation'],
    practiceHint: 'Votre vitrine prépa sera mise en avant sur les profils clubs.',
    shortLabel: 'Prépa',
    label: 'Préparateur physique',
  },
  mental: {
    icon: 'shield',
    tagline: 'Confiance, concentration et gestion de la pression match.',
    practiceTitle: 'Votre accompagnement',
    practiceSubtitle: 'Publics et formats de suivi mental.',
    practiceFocusLabel: 'Format principal *',
    practiceFocusOptions: ['Individuel', 'Groupe / équipe', 'Avant match', 'Retour de blessure'],
    practiceHint: 'Les joueurs pourront vous trouver dans l’annuaire Coach mental.',
    shortLabel: 'Mental',
    label: 'Coach mental / préparateur mental',
  },
  nutrition: {
    icon: 'heart',
    tagline: 'Plans alimentaires et hydratation compétition.',
    practiceTitle: 'Votre pratique',
    practiceSubtitle: 'Accompagnement nutritionnel ciblé.',
    practiceFocusLabel: 'Cible principale *',
    practiceFocusOptions: ['Performance match', 'Prise de masse', 'Récupération', 'Jeunes athlètes'],
    practiceHint: 'Conseils et visibilité auprès des joueurs ProDay de votre zone.',
    shortLabel: 'Nutrition',
    label: 'Nutritionniste sportif',
  },
  podologue: {
    icon: 'walk',
    tagline: 'Appuis, semelles et prévention des pathologies du pied.',
    practiceTitle: 'Cabinet podo',
    practiceSubtitle: 'Sports et publics que vous suivez.',
    practiceFocusLabel: 'Spécialité terrain *',
    practiceFocusOptions: ['Foot à 11', 'Futsal', 'Running', 'Multi-sports'],
    practiceHint: 'Les clubs pourront vous identifier comme référent podo local.',
    shortLabel: 'Podologue',
    label: 'Podologue du sport',
  },
};

function medicalKey(id: MedicalSpecialtyId, field: string) {
  return `signup.medical.${id}.${field}`;
}

export function getMedicalSpecialtyConfigs(t?: TranslateFn): LocalizedMedicalSpecialtyConfig[] {
  return MEDICAL_SPECIALTY_IDS.map((id) => {
    const base = BASE[id];
    return {
      id,
      icon: base.icon,
      label: tr(t, medicalKey(id, 'label'), base.label),
      shortLabel: tr(t, medicalKey(id, 'shortLabel'), base.shortLabel),
      tagline: tr(t, medicalKey(id, 'tagline'), base.tagline),
      practiceTitle: tr(t, medicalKey(id, 'practiceTitle'), base.practiceTitle),
      practiceSubtitle: tr(t, medicalKey(id, 'practiceSubtitle'), base.practiceSubtitle),
      practiceFocusLabel: tr(t, medicalKey(id, 'practiceFocusLabel'), base.practiceFocusLabel),
      practiceFocusOptions: base.practiceFocusOptions.map((opt, index) =>
        tr(t, medicalKey(id, `focus.${index}`), opt)
      ),
      practiceHint: tr(t, medicalKey(id, 'practiceHint'), base.practiceHint),
    };
  });
}

export function getMedicalConfigById(
  id: MedicalSpecialtyId,
  t?: TranslateFn
): LocalizedMedicalSpecialtyConfig {
  return getMedicalSpecialtyConfigs(t).find((c) => c.id === id) ?? getMedicalSpecialtyConfigs(t)[0];
}

export function getMedicalPracticeMetaById(id: MedicalSpecialtyId, t?: TranslateFn) {
  const cfg = getMedicalConfigById(id, t);
  return {
    title: cfg.practiceTitle,
    subtitle: cfg.practiceSubtitle,
    heroIcon: cfg.icon,
    stepName: tr(t, 'signup.page.medical_practice', 'Cabinet'),
  };
}

export function medicalIdToCanonicalLabel(id: MedicalSpecialtyId): string {
  return MEDICAL_CANONICAL_LABELS[id];
}

export function resolveMedicalSpecialtyId(value: string): MedicalSpecialtyId | null {
  if ((MEDICAL_SPECIALTY_IDS as string[]).includes(value)) return value as MedicalSpecialtyId;
  const byLabel = MEDICAL_SPECIALTY_IDS.find((id) => MEDICAL_CANONICAL_LABELS[id] === value);
  if (byLabel) return byLabel;
  const lower = value.toLowerCase();
  if (lower.includes('mental')) return 'mental';
  if (lower.includes('kiné') || lower.includes('kine')) return 'kine';
  if (lower.includes('ostéo') || lower.includes('osteo')) return 'osteo';
  if (lower.includes('médecin') || lower.includes('medecin')) return 'medecin';
  if (lower.includes('préparateur physique') || lower.includes('prepa')) return 'prepa';
  if (lower.includes('nutrition')) return 'nutrition';
  if (lower.includes('podo')) return 'podologue';
  return null;
}
