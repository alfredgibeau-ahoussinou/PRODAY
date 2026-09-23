import {
  MAX_GROUP_PARTICIPANTS,
  buildGroupThreadId,
  buildGroupThreadPayload,
  evaluateGroupCandidates,
  evaluateGroupMembershipAction,
  humanizeGroupError,
  isGroupDraftValid,
  validateGroupDraft,
} from '../features/messaging/groupDraft';
import type { GroupCandidate, GroupDraft } from '../features/messaging/groupDraft';

const player = (uid: string, name: string, minor = false): GroupCandidate => ({
  uid,
  displayName: name,
  role: 'player',
  isMinor: minor,
});
const parent = (uid: string, name: string): GroupCandidate => ({
  uid,
  displayName: name,
  role: 'parent',
});

const baseDraft = (over: Partial<GroupDraft> = {}): GroupDraft => ({
  name: 'Parents U15',
  creatorUid: 'coach1',
  creatorName: 'Coach Marc',
  creatorRole: 'coach',
  selected: [parent('p1', 'Alice'), parent('p2', 'Bruno')],
  ...over,
});

describe('brouillon de groupe — validation', () => {
  it('accepte un brouillon complet', () => {
    expect(isGroupDraftValid(baseDraft())).toBe(true);
  });

  it('exige un nom exploitable', () => {
    expect(validateGroupDraft(baseDraft({ name: '   ' })).name).toMatch(/nom/i);
    expect(validateGroupDraft(baseDraft({ name: 'A' })).name).toMatch(/2 caractères/);
    expect(validateGroupDraft(baseDraft({ name: 'x'.repeat(80) })).name).toMatch(/dépasser/);
  });

  it('exige au moins un participant', () => {
    expect(validateGroupDraft(baseDraft({ selected: [] })).participants).toMatch(/au moins un/i);
  });

  it('refuse un doublon', () => {
    const dup = parent('p1', 'Alice');
    expect(
      validateGroupDraft(baseDraft({ selected: [dup, dup] })).participants,
    ).toMatch(/deux fois/i);
  });

  it('refuse le créateur parmi les invités', () => {
    expect(
      validateGroupDraft(baseDraft({ selected: [parent('coach1', 'Moi')] })).participants,
    ).toMatch(/déjà partie/i);
  });

  it('refuse un groupe dépassant la limite', () => {
    const many = Array.from({ length: MAX_GROUP_PARTICIPANTS }, (_, i) => parent(`p${i}`, `P${i}`));
    expect(validateGroupDraft(baseDraft({ selected: many })).participants).toMatch(/limité/i);
  });
});

describe('brouillon de groupe — éligibilité des participants', () => {
  const candidates = [parent('p1', 'Alice'), player('p2', 'Bruno'), player('p3', 'Zoé', true)];

  it('n autorise que les contacts réellement joignables', () => {
    const states = evaluateGroupCandidates(candidates, [], (c) =>
      c.uid === 'p1' ? { allowed: true } : { allowed: false, reason: 'Règle de contact club.' },
    );
    expect(states.map((s) => s.selectable)).toEqual([true, false, false]);
  });

  it('expose le motif de refus au lieu de masquer le contact', () => {
    const states = evaluateGroupCandidates(candidates, [], () => ({
      allowed: false,
      reason: 'Ce compte mineur est supervisé : ajoutez le parent responsable.',
    }));
    expect(states).toHaveLength(3);
    expect(states[0]!.blockedReason).toMatch(/supervisé/);
  });

  it('marque les participants déjà choisis', () => {
    const states = evaluateGroupCandidates(candidates, ['p2'], () => ({ allowed: true }));
    expect(states.find((s) => s.candidate.uid === 'p2')!.alreadySelected).toBe(true);
    expect(states.find((s) => s.candidate.uid === 'p1')!.alreadySelected).toBe(false);
  });
});

describe('brouillon de groupe — document écrit', () => {
  it('inclut toujours le créateur et déduplique', () => {
    const payload = buildGroupThreadPayload(
      baseDraft({ selected: [parent('p1', 'Alice'), parent('p1', 'Alice'), parent('coach1', 'Moi')] }),
      'grp_abc',
    );
    expect(payload.participant_ids).toEqual(['coach1', 'p1']);
  });

  it('n envoie le non-lu qu aux autres membres', () => {
    const payload = buildGroupThreadPayload(baseDraft(), 'grp_abc');
    expect(payload.unread_by).toEqual(['p1', 'p2']);
    expect(payload.unread_by).not.toContain('coach1');
  });

  it('enregistre les rôles réels pour que la catégorisation ne devine pas', () => {
    const payload = buildGroupThreadPayload(baseDraft(), 'grp_abc');
    expect(payload.participant_roles).toEqual({ coach1: 'coach', p1: 'parent', p2: 'parent' });
  });

  it('ne met pas d image quand aucune n est fournie', () => {
    expect(buildGroupThreadPayload(baseDraft(), 'grp_abc').group_avatar_url).toBeNull();
    expect(
      buildGroupThreadPayload(baseDraft({ avatarUrl: ' https://x/y.png ' }), 'grp_abc')
        .group_avatar_url,
    ).toBe('https://x/y.png');
  });

  it('signale la présence d un mineur dans le groupe', () => {
    expect(buildGroupThreadPayload(baseDraft(), 'grp_abc').contains_minor).toBe(false);
    expect(
      buildGroupThreadPayload(baseDraft({ selected: [player('p9', 'Zoé', true)] }), 'grp_abc')
        .contains_minor,
    ).toBe(true);
  });

  it('démarre sans message et avec le créateur comme administrateur', () => {
    const payload = buildGroupThreadPayload(baseDraft(), 'grp_abc');
    expect(payload.last_message).toBe('');
    expect(payload.admin_uids).toEqual(['coach1']);
    expect(payload.created_by).toBe('coach1');
  });

  it('génère un identifiant de groupe préfixé et sans caractère douteux', () => {
    const id = buildGroupThreadId(() => 'aB-12_34!!xyz');
    expect(id.startsWith('grp_')).toBe(true);
    expect(id).toMatch(/^grp_[a-z0-9]+$/);
  });
});

describe('gestion des membres', () => {
  const ctx = { participantIds: ['coach1', 'p1', 'p2'], adminUids: ['coach1'], createdBy: 'coach1' };

  it('un non-administrateur ne gère pas les membres', () => {
    expect(
      evaluateGroupMembershipAction(ctx, { kind: 'add', actorUid: 'p1', targetUid: 'p3' }).allowed,
    ).toBe(false);
  });

  it('un administrateur peut ajouter un membre absent', () => {
    expect(
      evaluateGroupMembershipAction(ctx, { kind: 'add', actorUid: 'coach1', targetUid: 'p3' }).allowed,
    ).toBe(true);
  });

  it('refuse un ajout déjà présent ou au-delà de la limite', () => {
    expect(
      evaluateGroupMembershipAction(ctx, { kind: 'add', actorUid: 'coach1', targetUid: 'p1' }).allowed,
    ).toBe(false);
    const full = {
      participantIds: Array.from({ length: MAX_GROUP_PARTICIPANTS }, (_, i) => `u${i}`),
      adminUids: ['coach1'],
      createdBy: 'coach1',
    };
    expect(
      evaluateGroupMembershipAction(full, { kind: 'add', actorUid: 'coach1', targetUid: 'nouveau' })
        .allowed,
    ).toBe(false);
  });

  it('protège le créateur', () => {
    expect(
      evaluateGroupMembershipAction(ctx, { kind: 'remove', actorUid: 'coach1', targetUid: 'coach1' })
        .reason,
    ).toMatch(/Quitter le groupe/);
  });

  it('empêche le dernier administrateur de partir sans transmettre', () => {
    expect(
      evaluateGroupMembershipAction(ctx, { kind: 'leave', actorUid: 'coach1' }).allowed,
    ).toBe(false);
    const shared = { ...ctx, adminUids: ['coach1', 'p1'] };
    expect(evaluateGroupMembershipAction(shared, { kind: 'leave', actorUid: 'coach1' }).allowed).toBe(
      true,
    );
  });

  it('autorise un membre non administrateur à se retirer', () => {
    expect(
      evaluateGroupMembershipAction(ctx, { kind: 'leave', actorUid: 'p2' }).allowed,
    ).toBe(true);
  });

  it('refuse une action sur un non-membre', () => {
    expect(
      evaluateGroupMembershipAction(ctx, { kind: 'remove', actorUid: 'coach1', targetUid: 'inconnu' })
        .allowed,
    ).toBe(false);
    expect(evaluateGroupMembershipAction(ctx, { kind: 'leave', actorUid: 'inconnu' }).allowed).toBe(
      false,
    );
  });
});

describe('erreurs de groupe — message exploitable, jamais un faux succès', () => {
  it('traduit le refus des règles Firestore et dit qu aucun groupe n a été créé', () => {
    const msg = humanizeGroupError('Missing or insufficient permissions.');
    expect(msg).toMatch(/refusé/);
    expect(msg).toMatch(/Aucun groupe n’a été créé/);
    expect(msg).not.toMatch(/permissions\.?$/);
  });

  it('reconnaît le code d erreur Firebase', () => {
    expect(humanizeGroupError('permission-denied')).toMatch(/règles/);
  });

  it('nomme la session expirée et le service absent', () => {
    expect(humanizeGroupError('unauthenticated')).toMatch(/Connexion requise/);
    expect(humanizeGroupError('Firebase non configuré')).toMatch(/non configuré/);
  });

  it('retire le JSON brut du fournisseur', () => {
    const msg = humanizeGroupError('Error: {{"code":429,"status":"RESOURCE_EXHAUSTED"}} rate limit');
    expect(msg).not.toMatch(/RESOURCE_EXHAUSTED/);
    expect(msg).toMatch(/Aucun groupe n’a été créé/);
  });

  it('ne laisse jamais un message vide', () => {
    for (const raw of ['', '   ', '???']) {
      expect(humanizeGroupError(raw).length).toBeGreaterThan(10);
    }
  });
});
