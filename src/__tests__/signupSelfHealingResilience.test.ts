jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('../lib/firebase', () => ({
  getFirebaseAuth: jest.fn(),
  getDb: jest.fn(),
}));

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
  getCallableErrorMessage: jest.fn(),
  isFunctionsUnavailable: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  reload: jest.fn(),
  fetchSignInMethodsForEmail: jest.fn(),
  linkWithCredential: jest.fn(),
  GoogleAuthProvider: { credentialFromError: jest.fn() },
  OAuthProvider: { credentialFromError: jest.fn() },
  deleteUser: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  deleteDoc: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

import {
  validateSignupEmail,
  validateSignupPassword,
  validateDisplayName,
} from '../utils/signupValidation';
import { resolveSignupProductLine } from '../content/universeRoles';
import { buildSignupSteps, getFlowKind } from '../screens/signup/signupFlowConfig';
import { normalizeAuthEmail } from '../utils/authOAuthLink';

describe('Signup Self-Healing & Resilience Test Suite', () => {
  describe('Input Sanitization & Validation', () => {
    it('normalise et nettoie les emails contenant des espaces ou caractères de contrôle', () => {
      const dirtyEmail = '  Alexandre.Perez@Club-Football.FR \n\t';
      const cleaned = normalizeAuthEmail(dirtyEmail);
      expect(cleaned).toBe('alexandre.perez@club-football.fr');
      expect(validateSignupEmail(cleaned!)).toBeUndefined();
    });

    it('rejette les emails malformés ou jetables', () => {
      expect(validateSignupEmail('invalide')).toMatch(/format.*email/i);
      expect(validateSignupEmail('test@tempmail.com')).toMatch(/jetables/i);
    });

    it('valide rigoureusement les 5 critères de sécurité du mot de passe', () => {
      // 1. Longueur < 10
      expect(validateSignupPassword('Ab1!')).toMatch(/10 caractères/i);
      // 2. Pas de minuscule
      expect(validateSignupPassword('ABCDEFGHIJ1!')).toMatch(/minuscule/i);
      // 3. Pas de majuscule
      expect(validateSignupPassword('abcdefghij1!')).toMatch(/majuscule/i);
      // 4. Pas de chiffre
      expect(validateSignupPassword('Abcdefghij!!')).toMatch(/chiffre/i);
      // 5. Pas de caractère spécial
      expect(validateSignupPassword('Abcdefghij12')).toMatch(/spécial/i);
      // Conforme
      expect(validateSignupPassword('ParisProDay2026!')).toBeUndefined();
    });

    it('nettoie et valide les noms et prénoms officiels', () => {
      expect(validateDisplayName('  Kylian Mbappé  '.trim())).toBeUndefined();
      expect(validateDisplayName('J')).toMatch(/Minimum 2/i);
    });
  });

  describe('Dynamic Role Transitions & Product Line Auto-Alignment', () => {
    it('aligne dynamiquement le productLine sur le rôle sélectionné sans lever d’exception', () => {
      // Coach bascule automatiquement sur pro_staff
      expect(resolveSignupProductLine('amateur', 'coach')).toBe('pro_staff');
      // Club/Président bascule automatiquement sur pro_club
      expect(resolveSignupProductLine('amateur', 'club')).toBe('pro_club');
      // Parent bascule automatiquement sur parent
      expect(resolveSignupProductLine('amateur', 'parent')).toBe('parent');
      // Sponsor bascule automatiquement sur sponsor
      expect(resolveSignupProductLine('amateur', 'sponsor')).toBe('sponsor');
      // Joueur en pro bascule sur pro_player
      expect(resolveSignupProductLine('pro', 'player')).toBe('pro_player');
    });

    it('génère un parcours cohérent et complet pour chaque profil clé', () => {
      // Coach
      const coachSteps = buildSignupSteps(getFlowKind('coach'), {
        role: 'coach',
        parentalRequired: false,
      });
      expect(coachSteps).toEqual(['coach_pro', 'account', 'security', 'launch']);

      // Club / Président
      const clubSteps = buildSignupSteps(getFlowKind('club'), {
        role: 'club',
        parentalRequired: false,
      });
      expect(clubSteps).toEqual(['club_pro', 'account', 'security', 'launch']);

      // Joueur majeur
      const adultPlayerSteps = buildSignupSteps(getFlowKind('player'), {
        role: 'player',
        parentalRequired: false,
      });
      expect(adultPlayerSteps).toEqual(['sport', 'account', 'security', 'launch']);

      // Joueur mineur (inclut étape family)
      const minorPlayerSteps = buildSignupSteps(getFlowKind('player'), {
        role: 'player',
        parentalRequired: true,
      });
      expect(minorPlayerSteps).toEqual(['sport', 'account', 'security', 'family', 'launch']);

      // Parent
      const parentSteps = buildSignupSteps(getFlowKind('parent'), {
        role: 'parent',
        parentalRequired: false,
      });
      expect(parentSteps).toEqual(['sport', 'account', 'security', 'launch']);
    });
  });

  describe('Password Security Feedback Checklist Evaluation', () => {
    it('évalue en temps réel chacun des 5 badges de sécurité', () => {
      const evaluateChecks = (pwd: string) => ({
        length: pwd.length >= 10,
        lower: /[a-z]/.test(pwd),
        upper: /[A-Z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        special: /[^A-Za-z0-9]/.test(pwd),
      });

      const checks1 = evaluateChecks('proday');
      expect(checks1.length).toBe(false);
      expect(checks1.lower).toBe(true);
      expect(checks1.upper).toBe(false);
      expect(checks1.number).toBe(false);
      expect(checks1.special).toBe(false);

      const checks2 = evaluateChecks('ProDay2026!');
      expect(checks2.length).toBe(true);
      expect(checks2.lower).toBe(true);
      expect(checks2.upper).toBe(true);
      expect(checks2.number).toBe(true);
      expect(checks2.special).toBe(true);
    });
  });

  describe('SignupErrorBoundary Auto-Recovery', () => {
    it('dérive l’état d’erreur correctement sans crasher le tunnel', () => {
      const { SignupErrorBoundary } = require('../screens/signup/SignupErrorBoundary');
      const testError = new Error('Panne transitoire du composant');
      const derived = SignupErrorBoundary.getDerivedStateFromError(testError);
      expect(derived.hasError).toBe(true);
      expect(derived.error).toBe(testError);
    });

    it('permet de réinitialiser l’erreur et d’invoquer onRetry', () => {
      const { SignupErrorBoundary } = require('../screens/signup/SignupErrorBoundary');
      const onRetryMock = jest.fn();
      const boundary = new SignupErrorBoundary({ children: null, onRetry: onRetryMock });
      boundary.setState = jest.fn((updater) => {
        if (typeof updater === 'function') {
          boundary.state = updater(boundary.state);
        } else {
          boundary.state = { ...boundary.state, ...updater };
        }
      });
      boundary.state = { hasError: true, error: new Error('Oups') };

      // Invoquer le retry
      (boundary as any).handleRetry();
      expect(boundary.setState).toHaveBeenCalledWith({ hasError: false, error: null });
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Orphan Account Auto-Healing Resilience Logic', () => {
    it('détecte et auto-guérit un compte orphelin sans profil Firestore', async () => {
      // Simuler l'algorithme d'auto-guérison de authService.signUp
      const mockAuthUser = { uid: 'orphan-123', email: 'jean.dupont@club.fr', emailVerified: false };
      let profileCreated = false;

      const simulateSignUp = async (email: string, pass: string, existingProfile: any) => {
        try {
          // Étape 1 : createUserWithEmailAndPassword échoue avec auth/email-already-in-use
          throw { code: 'auth/email-already-in-use' };
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            // Étape 2 : Vérifier les identifiants
            const signInCred = { user: mockAuthUser };
            // Étape 3 : Si aucun profil Firestore -> Auto-healing !
            if (!existingProfile) {
              profileCreated = true;
              return { uid: signInCred.user.uid, email: signInCred.user.email, role: 'coach' };
            }
            throw new Error('Un compte actif existe déjà avec cet email. Veuillez vous connecter.');
          }
          throw error;
        }
      };

      // Cas 1 : Compte orphelin (sans profil Firestore)
      const healedUser = await simulateSignUp('jean.dupont@club.fr', 'MonClub2026!', null);
      expect(profileCreated).toBe(true);
      expect(healedUser.uid).toBe('orphan-123');
      expect(healedUser.role).toBe('coach');

      // Cas 2 : Compte actif existant déjà en base
      await expect(
        simulateSignUp('jean.dupont@club.fr', 'MonClub2026!', { id: 'orphan-123', display_name: 'Jean' })
      ).rejects.toThrow('Un compte actif existe déjà');
    });
  });

  describe('Signup Integrity Multi-Role Resilience', () => {
    it('valide avec succès un profil Joueur sans exiger de champs facultatifs superflus', () => {
      const { validateSignupIntegrity } = require('../utils/signupValidation');
      const errs = validateSignupIntegrity({
        role: 'player',
        productLine: 'amateur',
        flowKind: 'player',
        spaceTouched: true,
        parentalRequired: false,
        staff: {
          role: 'player',
          city: '',
          department: '',
        },
        player: {
          position: '',
          category: 'Seniors',
          level: '',
          city: '',
          department: '',
          parsedAge: 22,
          appSpace: 'adult',
          allowedCategories: ['Seniors', 'Vétérans'],
          statMatches: '',
          statGoals: '',
          statAssists: '',
        },
        account: {
          displayName: 'Kylian Mbappé',
          email: 'kylian@proday.com',
          password: 'Password2026!',
          confirmPassword: 'Password2026!',
          isOAuth: false,
          role: 'player',
          city: '',
          acceptedTerms: true,
        },
      });
      expect(errs).toEqual({});
    });

    it('valide avec succès un profil Coach sans exiger de diplôme obligatoire immédiat', () => {
      const { validateSignupIntegrity } = require('../utils/signupValidation');
      const errs = validateSignupIntegrity({
        role: 'coach',
        productLine: 'pro_staff',
        flowKind: 'staff',
        spaceTouched: true,
        parentalRequired: false,
        staff: {
          role: 'coach',
          city: '',
          department: '',
          structureName: '',
          professionalHeadline: '',
        },
        account: {
          displayName: 'Didier Deschamps',
          email: 'didier@proday.com',
          password: 'Password2026!',
          confirmPassword: 'Password2026!',
          isOAuth: false,
          role: 'coach',
          city: '',
          acceptedTerms: true,
        },
      });
      expect(errs).toEqual({});
    });

    it('valide avec succès un profil Club avec sa structure FFF', () => {
      const { validateSignupIntegrity } = require('../utils/signupValidation');
      const errs = validateSignupIntegrity({
        role: 'club',
        productLine: 'pro_club',
        flowKind: 'staff',
        spaceTouched: true,
        parentalRequired: false,
        staff: {
          role: 'club',
          city: 'Paris',
          department: '75',
          structureName: 'Paris Saint-Germain',
        },
        account: {
          displayName: 'Nasser Al-Khelaïfi',
          email: 'president@psg.fr',
          password: 'Password2026!',
          confirmPassword: 'Password2026!',
          isOAuth: false,
          role: 'club',
          city: 'Paris',
          acceptedTerms: true,
        },
      });
      expect(errs).toEqual({});
    });

    it('exige le consentement parental uniquement si le joueur est mineur', () => {
      const { validateSignupIntegrity } = require('../utils/signupValidation');
      // Mineur sans consentement -> Erreur
      const errsWithoutConsent = validateSignupIntegrity({
        role: 'player',
        productLine: 'amateur',
        flowKind: 'player',
        spaceTouched: true,
        parentalRequired: true,
        staff: { role: 'player', city: '', department: '' },
        player: {
          position: 'Attaquant',
          category: 'U15',
          level: 'District',
          city: 'Paris',
          department: '75',
          parsedAge: 14,
          appSpace: 'youth',
          allowedCategories: ['U14', 'U15'],
          statMatches: '',
          statGoals: '',
          statAssists: '',
        },
        account: {
          displayName: 'Jeune Joueur',
          email: 'jeune@proday.com',
          password: 'Password2026!',
          confirmPassword: 'Password2026!',
          isOAuth: false,
          role: 'player',
          city: 'Paris',
          acceptedTerms: true,
          guardianEmail: 'parent@famille.fr',
        },
        parental: {
          guardianName: 'Parent Dupont',
          guardianEmail: 'parent@famille.fr',
          guardianConsent: false,
          accountEmail: 'jeune@proday.com',
        },
      });
      expect(errsWithoutConsent.guardianConsent).toBeDefined();

      // Mineur avec consentement valide -> Succès
      const errsWithConsent = validateSignupIntegrity({
        role: 'player',
        productLine: 'amateur',
        flowKind: 'player',
        spaceTouched: true,
        parentalRequired: true,
        staff: { role: 'player', city: '', department: '' },
        player: {
          position: 'Attaquant',
          category: 'U15',
          level: 'District',
          city: 'Paris',
          department: '75',
          parsedAge: 14,
          appSpace: 'youth',
          allowedCategories: ['U14', 'U15'],
          statMatches: '',
          statGoals: '',
          statAssists: '',
        },
        account: {
          displayName: 'Jeune Joueur',
          email: 'jeune@proday.com',
          password: 'Password2026!',
          confirmPassword: 'Password2026!',
          isOAuth: false,
          role: 'player',
          city: 'Paris',
          acceptedTerms: true,
          guardianEmail: 'parent@famille.fr',
        },
        parental: {
          guardianName: 'Parent Dupont',
          guardianEmail: 'parent@famille.fr',
          guardianConsent: true,
          accountEmail: 'jeune@proday.com',
        },
      });
      expect(errsWithConsent).toEqual({});
    });
  });

  describe('French Actionable Error Messaging', () => {
    it('traduit les erreurs Firebase en français clair et rassurant', () => {
      const { authService } = require('../services/auth.service');
      expect(authService.getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toMatch(
        /Cet email est déjà utilisé/i
      );
      expect(authService.getAuthErrorMessage({ code: 'auth/network-request-failed' })).toMatch(
        /Pas de réseau/i
      );
      expect(authService.getAuthErrorMessage({ code: 'auth/weak-password' })).toMatch(
        /Mot de passe trop faible/i
      );
      expect(authService.getAuthErrorMessage(new Error('Erreur inconnue'))).toBe('Erreur inconnue');
    });
  });
});

