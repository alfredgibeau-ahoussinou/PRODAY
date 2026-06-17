import type { TranslateFn } from '../../i18n/types';
import { tr } from '../../i18n/translate';

/** Libellés des étapes pro (coach, club, agent…) — source EN dans tertiary. */
export function getSignupRoleStepCopy(t: TranslateFn) {
  return {
    coach: {
      hint: tr(
        t,
        'signup.role.coach.hint',
        'BEF, UEFA or equivalent diploma — photographed after email confirmation.'
      ),
      diplomaLabel: tr(t, 'signup.role.diplomaLabel', 'Diploma or certification *'),
      diplomaPlaceholder: tr(t, 'signup.role.diplomaPlaceholder', 'E.g. BEF, UEFA B, DESJEPS…'),
      cityLabel: tr(t, 'signup.role.cityPracticeLabel', 'Practice city *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholder', 'E.g. Lyon, Marseille…'),
    },
    club: {
      hint: tr(
        t,
        'signup.role.club.hint',
        'Club mandate or statutes — AI verification after email.'
      ),
      nameLabel: tr(t, 'signup.role.clubNameLabel', 'Club / organization name *'),
      namePlaceholder: tr(t, 'signup.role.clubNamePlaceholder', 'E.g. FC Example, Local AS…'),
      cityLabel: tr(t, 'signup.form.cityRequired', 'City *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholderShort', 'E.g. Paris, Lille…'),
    },
    agent: {
      hint: tr(
        t,
        'signup.role.agent.hint',
        'Agent licence — automatic check after email validation.'
      ),
      licenseLabel: tr(t, 'signup.role.licenseLabel', 'Licence or approval no. *'),
      licensePlaceholder: tr(t, 'signup.role.licensePlaceholder', 'E.g. FIFA / FFF licence…'),
      cityLabel: tr(t, 'signup.role.cityMainLabel', 'Main city *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholder', 'E.g. Paris, Bordeaux…'),
    },
    recruiter: {
      hint: tr(
        t,
        'signup.role.recruiter.hint',
        'Recruiter mandate or club certificate — AI verification after email.'
      ),
      specialtyLabel: tr(t, 'signup.role.recruitSpecialtyLabel', 'Recruitment specialty *'),
      specialtyPlaceholder: tr(
        t,
        'signup.role.recruitSpecialtyPlaceholder',
        'E.g. independent scout, head of recruitment, scouting…'
      ),
      cityLabel: tr(t, 'signup.role.cityMainLabel', 'Main city *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholder', 'E.g. Lyon, Lille…'),
    },
    organizer: {
      hint: tr(
        t,
        'signup.role.organizer.hint',
        'Tournaments, trials — organization proof after email.'
      ),
      structureLabel: tr(t, 'signup.role.structureLabel', 'Organization / collective *'),
      structurePlaceholder: tr(t, 'signup.role.structurePlaceholder', 'E.g. local league, events assoc…'),
      cityLabel: tr(t, 'signup.form.cityRequired', 'City *'),
      cityPlaceholder: tr(t, 'signup.role.cityPlaceholderShort', 'E.g. Toulouse, Nantes…'),
    },
    sponsor: {
      hint: tr(
        t,
        'signup.role.sponsor.hint',
        'Your brand will be visible on the Sponsors tab for local clubs.'
      ),
      brandLabel: tr(t, 'signup.role.brandLabel', 'Brand or company *'),
      brandPlaceholder: tr(t, 'signup.role.brandPlaceholder', 'E.g. Sport Shop, local bank…'),
      territoryLabel: tr(t, 'signup.role.territoryLabel', 'City / territory *'),
      territoryPlaceholder: tr(t, 'signup.role.territoryPlaceholder', 'E.g. Île-de-France region, Lyon…'),
    },
    departmentPlaceholder: tr(t, 'signup.role.departmentPlaceholder', 'E.g. 69, 13…'),
    departmentPlaceholderWide: tr(t, 'signup.role.departmentPlaceholderWide', 'E.g. 75, 59, 971…'),
  };
}
