import {
  validateSignupEmail,
  validateSignupPassword,
  validateDisplayName,
  validateFrenchDepartment,
  validateCity,
  validateGuardianName,
  validateEmailsDistinct,
  validateStaffStepFields,
  validatePlayerStepFields,
  validateAccountStepFields,
  validateSignupIntegrity,
} from '../utils/signupValidation';
import { PLAYER_POSITIONS, PLAYER_LEVELS } from '../constants/playerProfile';

describe('signupValidation', () => {
  it('refuse les emails jetables', () => {
    expect(validateSignupEmail('test@yopmail.com')).toMatch(/jetables/i);
    expect(validateSignupEmail('ok@club.fr')).toBeUndefined();
  });

  it('impose un mot de passe robuste', () => {
    expect(validateSignupPassword('court')).toMatch(/10 caractères/i);
    expect(validateSignupPassword('alllowercase1!')).toMatch(/majuscule/i);
    expect(validateSignupPassword('ALLUPPERCASE1!')).toMatch(/minuscule/i);
    expect(validateSignupPassword('NoDigitsHere!')).toMatch(/chiffre/i);
    expect(validateSignupPassword('NoSpecialChar1')).toMatch(/spécial/i);
    expect(validateSignupPassword('MonClub2026!')).toBeUndefined();
  });

  it('valide le nom affiché', () => {
    expect(validateDisplayName('A')).toMatch(/Minimum/i);
    expect(validateDisplayName('Jean123')).toMatch(/Lettres/i);
    expect(validateDisplayName('Jean Dupont')).toBeUndefined();
  });

  it('valide les départements français', () => {
    expect(validateFrenchDepartment('75')).toBeUndefined();
    expect(validateFrenchDepartment('2A')).toBeUndefined();
    expect(validateFrenchDepartment('971')).toBeUndefined();
    expect(validateFrenchDepartment('999')).toMatch(/invalide/i);
  });

  it('exige prénom et nom du responsable', () => {
    expect(validateGuardianName('Martin')).toMatch(/prénom et le nom/i);
    expect(validateGuardianName('Marie Martin')).toBeUndefined();
  });

  it('interdit le même email joueur / responsable', () => {
    expect(
      validateEmailsDistinct('enfant@club.fr', 'enfant@club.fr')
    ).toMatch(/différentes/i);
  });

  it('renforce le staff agent et club', () => {
    const agentErrs = validateStaffStepFields({
      role: 'agent',
      city: 'Lyon',
      department: '',
    });
    expect(agentErrs.department).toMatch(/requis/i);

    const clubErrs = validateStaffStepFields({
      role: 'club',
      city: 'FC',
      department: '69',
    });
    expect(clubErrs.city).toMatch(/Minimum/i);
  });

  it('valide le profil joueur et les stats', () => {
    const errs = validatePlayerStepFields({
      position: PLAYER_POSITIONS[0],
      category: 'U17',
      level: PLAYER_LEVELS[0],
      city: 'Paris',
      department: '75',
      parsedAge: 17,
      appSpace: 'boys',
      allowedCategories: ['U17', 'U19'],
      statMatches: '0',
      statGoals: '999',
      statAssists: '',
    });
    expect(errs.statGoals).toMatch(/maximum/i);
  });

  it('exige l’acceptation des conditions', () => {
    const errs = validateAccountStepFields({
      displayName: 'Jean Dupont',
      email: 'jean@club.fr',
      password: 'MonClub2026!',
      confirmPassword: 'MonClub2026!',
      isOAuth: false,
      role: 'coach',
      city: '',
      acceptedTerms: false,
    });
    expect(errs.acceptedTerms).toBeDefined();
  });

  it('contrôle l’intégrité globale avant création', () => {
    const errs = validateSignupIntegrity({
      role: 'player',
      flowKind: 'player',
      spaceTouched: false,
      parentalRequired: false,
      staff: { role: 'player', city: '', department: '' },
      player: {
        position: '',
        category: '',
        level: '',
        city: '',
        department: '',
        parsedAge: null,
        appSpace: 'boys',
        allowedCategories: ['U17'],
        statMatches: '',
        statGoals: '',
        statAssists: '',
      },
      account: {
        displayName: '',
        email: 'bad',
        password: 'weak',
        confirmPassword: 'weak',
        isOAuth: false,
        role: 'player',
        city: '',
        acceptedTerms: false,
      },
    });
    expect(Object.keys(errs).length).toBeGreaterThan(3);
  });
});
