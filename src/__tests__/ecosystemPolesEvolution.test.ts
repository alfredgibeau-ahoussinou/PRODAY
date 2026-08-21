import { PLAYER_LEVEL_BADGES } from '../models/PlayerLevel';
import {
  playerLevelBadgeFor,
  playerLevelMatchesFilter,
  promotePlayerToProfessional,
  resolvePlayerLevel,
} from '../utils/playerLevelBadge';
import {
  AGENT_LAUNCH_OFFER,
  agentPriceForSubscriber,
  isAgentLaunchOfferAvailable,
  resolveAgentMonthlyPrice,
} from '../utils/agentLaunchPricing';
import {
  canViewContactField,
  filterContactFieldsForViewer,
  normalizeContactPrivacy,
  resolveContactViewerRelation,
} from '../utils/contactPrivacyVisibility';
import {
  canSendInConversation,
  conversationAccessFromRequest,
  requiresMessageRequest,
  resolveMessageRequest,
} from '../utils/messageRequestState';
import {
  applicationPipelineLabel,
  canTransitionClubApplication,
  legacyStatusToPipelineStage,
  pipelineStageToLegacyStatus,
  transitionClubApplication,
} from '../utils/clubApplicationPipeline';
import {
  hasJoueurVerifieBadge,
  resolveProPlayerVerificationSource,
} from '../utils/proPlayerVerification';
import {
  canEditStructureCalendar,
  canManageConvocations,
  clubFreeTierIncludesConvocations,
  userCanManageConvocations,
} from '../utils/clubFeatureAccess';
import {
  CAROUSEL_POLE_ORDER,
  carouselPoleSignupPresetRole,
  carouselPoleToProductLine,
  normalizeCarouselPole,
  productLineToCarouselPole,
} from '../models/CarouselPole';
import type { User } from '../models/User';

const basePlayer = {
  uid: 'u1',
  display_name: 'Test',
  email: 't@test.com',
  role: 'player' as const,
  is_verified: false,
  verification_status: 'NOT_REQUIRED' as const,
  profile: {},
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
} as User;

describe('ecosystem — Pôle Joueur badges', () => {
  it('expose Amateur / Formation / Haut niveau en bleu ProDay', () => {
    expect(PLAYER_LEVEL_BADGES.amateur.shortLabel).toBe('Amateur');
    expect(PLAYER_LEVEL_BADGES.academy.shortLabel).toBe('Formation');
    expect(PLAYER_LEVEL_BADGES.professional.shortLabel).toBe('Haut niveau');
    expect(PLAYER_LEVEL_BADGES.amateur.colorHex).toBe('#0054F0');
    expect(PLAYER_LEVEL_BADGES.academy.colorHex).toBe('#1A68FF');
    expect(PLAYER_LEVEL_BADGES.professional.colorHex).toBe('#001F6B');
  });

  it('promotes to professional without changing other fields', () => {
    expect(promotePlayerToProfessional('amateur')).toBe('professional');
    expect(promotePlayerToProfessional('academy')).toBe('professional');
  });

  it('résout le niveau et les filtres recruteur', () => {
    const amateur = { ...basePlayer, player_level: 'amateur' as const };
    const academy = { ...basePlayer, player_level: 'academy' as const };
    expect(resolvePlayerLevel(amateur)).toBe('amateur');
    expect(playerLevelBadgeFor(academy).tone).toBe('blue');
    expect(playerLevelMatchesFilter('amateur', 'amateurs')).toBe(true);
    expect(playerLevelMatchesFilter('professional', 'amateurs')).toBe(false);
    expect(playerLevelMatchesFilter('academy', 'centres_de_formation')).toBe(true);
    expect(playerLevelMatchesFilter('professional', 'all')).toBe(true);
  });
});

describe('ecosystem — agent launch pricing', () => {
  it('offre 19,99 € pour les 20 premiers puis 29,99 €', () => {
    expect(resolveAgentMonthlyPrice(0).monthlyEur).toBe(19.99);
    expect(resolveAgentMonthlyPrice(19).tier).toBe('launch');
    expect(resolveAgentMonthlyPrice(20).monthlyEur).toBe(
      AGENT_LAUNCH_OFFER.standardMonthlyEur,
    );
    expect(isAgentLaunchOfferAvailable(20)).toBe(false);
    expect(agentPriceForSubscriber({ activeLaunchSubscribers: 25, hasLaunchGrandfather: true }).monthlyEur).toBe(
      19.99,
    );
  });
});

describe('ecosystem — contact privacy', () => {
  it('masque téléphone / email selon l’audience', () => {
    const settings = normalizeContactPrivacy({
      phone: ['club_staff'],
      email: ['agents'],
      other: ['nobody'],
    });
    expect(
      canViewContactField({ field: 'phone', settings, viewerRelation: 'self' }),
    ).toBe(true);
    expect(
      canViewContactField({ field: 'phone', settings, viewerRelation: 'agent' }),
    ).toBe(false);
    expect(
      canViewContactField({ field: 'email', settings, viewerRelation: 'agent' }),
    ).toBe(true);
    const filtered = filterContactFieldsForViewer(
      { phone: '06', email: 'a@b.c', other_contact: 'ig' },
      settings,
      'stranger',
    );
    expect(filtered.phone).toBeUndefined();
    expect(filtered.email).toBeUndefined();
  });

  it('résout la relation viewer pour le profil public', () => {
    expect(
      resolveContactViewerRelation({ targetUid: 'a', viewerUid: 'a', viewerRole: 'player' }),
    ).toBe('self');
    expect(
      resolveContactViewerRelation({ targetUid: 'a', viewerUid: 'b', viewerRole: 'agent' }),
    ).toBe('agent');
    expect(
      resolveContactViewerRelation({
        targetUid: 'a',
        viewerUid: 'b',
        viewerRole: 'player',
        isConnection: true,
      }),
    ).toBe('connection');
    expect(
      resolveContactViewerRelation({ targetUid: 'a', viewerUid: null, viewerRole: null }),
    ).toBe('stranger');
  });
});

describe('ecosystem — message requests', () => {
  it('exige une demande joueur↔agent et bloque l’envoi tant que pending', () => {
    expect(requiresMessageRequest('player', 'agent')).toBe(true);
    expect(requiresMessageRequest('player', 'coach')).toBe(false);
    const access = conversationAccessFromRequest({ status: 'pending' }, 'player_agent');
    expect(access).toBe('request_pending');
    expect(canSendInConversation(access)).toBe(false);
    expect(resolveMessageRequest('pending', 'accept', 'recipient')).toBe('accepted');
    expect(resolveMessageRequest('pending', 'refuse', 'recipient')).toBe('refused');
    expect(resolveMessageRequest('accepted', 'refuse', 'recipient')).toBeNull();
  });
});

describe('ecosystem — club application pipeline', () => {
  it('mappe legacy ↔ kanban et valide les transitions', () => {
    expect(legacyStatusToPipelineStage('PENDING')).toBe('inbox');
    expect(pipelineStageToLegacyStatus('trial')).toBe('IN_PROGRESS');
    expect(canTransitionClubApplication('inbox', 'shortlist')).toBe(true);
    expect(transitionClubApplication('shortlist', 'trial')).toBe('trial');
    expect(() => transitionClubApplication('hired', 'inbox')).toThrow();
  });
});

describe('ecosystem — joueur vérifié & club features', () => {
  it('badge via licence ou certification club', () => {
    const byLicense = {
      ...basePlayer,
      player_verification: {
        identity: { status: 'not_submitted' as const },
        club_license: { status: 'verified' as const },
      },
    };
    expect(hasJoueurVerifieBadge(byLicense)).toBe(true);
    expect(resolveProPlayerVerificationSource(byLicense)).toBe('license');

    const byClub = {
      ...basePlayer,
      club_certification_verified: true,
    };
    expect(hasJoueurVerifieBadge(byClub)).toBe(true);
  });

  it('Club Essentiel gère convocations ; Coach Premium aussi', () => {
    expect(clubFreeTierIncludesConvocations()).toBe(false);
    expect(canManageConvocations({ role: 'club', tier: 'free' })).toBe(false);
    expect(
      canManageConvocations({ role: 'club', tier: 'pro', clubOfferId: 'club_essentiel' }),
    ).toBe(true);
    expect(canManageConvocations({ role: 'coach', tier: 'pro' })).toBe(true);
    expect(canEditStructureCalendar({ role: 'coach', tier: 'pro' })).toBe(true);
    expect(
      canEditStructureCalendar({ role: 'club', tier: 'pro', clubOfferId: 'club_essentiel' }),
    ).toBe(true);
    expect(
      userCanManageConvocations({
        role: 'club',
        subscription_tier: 'pro',
        subscription_plan_id: 'club_pro',
      } as User),
    ).toBe(true);
    expect(
      userCanManageConvocations({ role: 'coach', subscription_tier: 'pro' } as User),
    ).toBe(true);
  });

  it('expose les labels pipeline kanban pour les candidatures club', () => {
    expect(applicationPipelineLabel({ status: 'PENDING' })).toBe('Observé');
    expect(applicationPipelineLabel({ status: 'VIEWED', pipeline_stage: 'reviewing' })).toBe(
      'Contacté',
    );
    expect(applicationPipelineLabel({ status: 'IN_PROGRESS', pipeline_stage: 'shortlist' })).toBe(
      'Pré-sélection',
    );
    expect(applicationPipelineLabel({ status: 'ACCEPTED', pipeline_stage: 'hired' })).toBe(
      'Intégré',
    );
  });
});

describe('ecosystem — carousel poles', () => {
  it('expose les 7 pôles vitrine + Santé (Parent + Président + Coach)', () => {
    expect(CAROUSEL_POLE_ORDER).toEqual([
      'joueur',
      'pro_club',
      'president',
      'coach',
      'parent',
      'supporter',
      'sponsor',
      'sante',
    ]);
    expect(normalizeCarouselPole('amateur')).toBe('joueur');
    expect(normalizeCarouselPole('pro_player')).toBe('joueur');
    expect(normalizeCarouselPole('pro_staff')).toBe('coach');
    expect(normalizeCarouselPole('evenements')).toBe('pro_club');
    expect(carouselPoleToProductLine('joueur')).toBe('amateur');
    expect(carouselPoleToProductLine('coach')).toBe('pro_staff');
    expect(carouselPoleToProductLine('parent')).toBe('parent');
    expect(carouselPoleToProductLine('president')).toBe('pro_club');
    expect(carouselPoleSignupPresetRole('coach')).toBe('coach');
    expect(carouselPoleSignupPresetRole('parent')).toBe('parent');
    expect(carouselPoleSignupPresetRole('president')).toBe('club');
    expect(carouselPoleSignupPresetRole('evenements')).toBe('club');
    expect(productLineToCarouselPole('pro_player')).toBe('joueur');
    expect(productLineToCarouselPole('parent')).toBe('parent');
    expect(productLineToCarouselPole('pro_staff', 'organizer')).toBe('coach');
    expect(productLineToCarouselPole('pro_club', 'club')).toBe('pro_club');
    expect(productLineToCarouselPole('pro_club', 'club', 'president')).toBe('president');
  });
});
