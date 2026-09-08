/** Libellés des étapes pro (coach, club, agent…) — fallbacks FR. */
import type { TranslateFn } from '../../i18n/types';
import { tr } from '../../i18n/translate';

export function getSignupRoleStepCopy(t: TranslateFn) {
  return {
    coach: {
      hint: tr(
        t,
        'signup.role.coach.hint',
        'Diplôme BEF, UEFA ou équivalent. Club FFF via recherche DOFA — aucune liste inventée.'
      ),
      diplomaLabel: tr(t, 'signup.role.diplomaLabel', 'Diplôme ou certification *'),
      diplomaPlaceholder: tr(t, 'signup.role.diplomaPlaceholder', 'Ex. BEF, UEFA B, DESJEPS…'),
      cityLabel: tr(t, 'signup.role.cityPracticeLabel', 'Ville de pratique *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholder', 'Ex. Lyon, Marseille…'),
    },
    club: {
      hint: tr(
        t,
        'signup.role.club.hint',
        'Cherchez votre club FFF : la fiche structure se remplit automatiquement.'
      ),
      nameLabel: tr(t, 'signup.role.clubNameLabel', 'Nom du club / structure *'),
      namePlaceholder: tr(t, 'signup.role.clubNamePlaceholder', 'Ex. FC Melun, AS Le Mée…'),
      cityLabel: tr(t, 'signup.form.cityRequired', 'Ville *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholderShort', 'Ex. Paris, Lille…'),
    },
    agent: {
      hint: tr(
        t,
        'signup.role.agent.hint',
        'Licence d’agent. Contrôle automatique après validation de l’email.'
      ),
      licenseLabel: tr(t, 'signup.role.licenseLabel', 'N° de licence ou agrément *'),
      licensePlaceholder: tr(t, 'signup.role.licensePlaceholder', 'Ex. licence FIFA / FFF…'),
      cityLabel: tr(t, 'signup.role.cityMainLabel', 'Ville principale *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholder', 'Ex. Paris, Bordeaux…'),
    },
    recruiter: {
      hint: tr(
        t,
        'signup.role.recruiter.hint',
        'Mandat recruteur ou attestation club. Vérification IA après l’email.'
      ),
      specialtyLabel: tr(t, 'signup.role.recruitSpecialtyLabel', 'Spécialité recrutement *'),
      specialtyPlaceholder: tr(
        t,
        'signup.role.recruitSpecialtyPlaceholder',
        'Ex. scout indépendant, responsable recrutement…'
      ),
      cityLabel: tr(t, 'signup.role.cityMainLabel', 'Ville principale *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholder', 'Ex. Lyon, Lille…'),
    },
    organizer: {
      hint: tr(
        t,
        'signup.role.organizer.hint',
        'Tournois, détections. Justificatif d’organisation après l’email.'
      ),
      structureLabel: tr(t, 'signup.role.structureLabel', 'Organisation / collectif *'),
      structurePlaceholder: tr(
        t,
        'signup.role.structurePlaceholder',
        'Ex. ligue locale, association événements…'
      ),
      cityLabel: tr(t, 'signup.form.cityRequired', 'Ville *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholderShort', 'Ex. Toulouse, Nantes…'),
    },
    sponsor: {
      hint: tr(
        t,
        'signup.role.sponsor.hint',
        'Votre marque sera visible dans l’onglet Sponsors pour les clubs locaux.'
      ),
      brandLabel: tr(t, 'signup.role.brandLabel', 'Marque ou entreprise *'),
      brandPlaceholder: tr(t, 'signup.role.brandPlaceholder', 'Ex. Magasin sport, banque locale…'),
      territoryLabel: tr(t, 'signup.role.territoryLabel', 'Ville / territoire *'),
      territoryPlaceholder: tr(
        t,
        'signup.role.territoryPlaceholder',
        'Ex. Île-de-France, Lyon…'
      ),
    },
    departmentPlaceholder: tr(t, 'signup.role.departmentPlaceholder', 'Ex. 69, 13…'),
    departmentPlaceholderWide: tr(t, 'signup.role.departmentPlaceholderWide', 'Ex. 75, 59, 971…'),
  };
}
