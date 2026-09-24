import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLUB_MEMBER_SEARCH_MAX,
  callerClubScope,
  normalizeSearchText,
  selectClubMembers,
} from '../lib/clubMemberSearch.js';

const doc = (id, clubId, extra = {}) => ({
  id,
  data: {
    display_name: `Joueur ${id}`,
    role: 'player',
    is_active: true,
    profile: { club_id: clubId, position: 'Milieu' },
    ...extra,
  },
});

test('callerClubScope — refuse sans document de demandeur', () => {
  const decision = callerClubScope(undefined);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'no-caller-doc');
  assert.equal(decision.clubId, null);
});

test('callerClubScope — refuse un demandeur sans club (aucun repli global)', () => {
  const decision = callerClubScope({ profile: { club_id: null } });
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'no-club');
});

test('callerClubScope — reprend le club du document serveur', () => {
  const decision = callerClubScope({ profile: { club_id: 'club-1' } });
  assert.equal(decision.allowed, true);
  assert.equal(decision.clubId, 'club-1');
});

test('selectClubMembers — ne laisse jamais passer un document d’un autre club', () => {
  const members = selectClubMembers(
    [doc('a', 'club-1'), doc('b', 'club-2'), doc('c', 'club-1')],
    '',
    'club-1',
    20,
  );
  assert.deepEqual(
    members.map((m) => m.uid),
    ['a', 'c'],
  );
  assert.ok(members.every((m) => m.club_id === 'club-1'));
});

test('selectClubMembers — ignore les profils inactifs et respecte la limite', () => {
  const members = selectClubMembers(
    [doc('x', 'club-1', { is_active: false }), doc('y', 'club-1'), doc('z', 'club-1')],
    '',
    'club-1',
    1,
  );
  assert.deepEqual(
    members.map((m) => m.uid),
    ['y'],
  );
});

test('selectClubMembers — filtre sur le nom sans accent et sans casse', () => {
  const members = selectClubMembers(
    [doc('a', 'club-1', { display_name: 'Amélie Dubois' })],
    'amelie',
    'club-1',
    20,
  );
  assert.equal(members.length, 1);
  assert.equal(members[0].display_name, 'Amélie Dubois');
});

test('selectClubMembers — n’expose aucune coordonnée privée', () => {
  const members = selectClubMembers(
    [
      doc('a', 'club-1', {
        email: 'prive@example.com',
        phone: '+33600000000',
        profile: { club_id: 'club-1', position: 'Milieu', phone: '+33600000000' },
      }),
    ],
    '',
    'club-1',
    20,
  );
  assert.equal(members.length, 1);
  assert.deepEqual(Object.keys(members[0]).sort(), [
    'avatar_url',
    'city',
    'club_id',
    'display_name',
    'position',
    'role',
    'uid',
  ]);
});

test('normalizeSearchText — accents, casse et espaces', () => {
  assert.equal(normalizeSearchText('  Éntraînement  '), 'entrainement');
});

test('le plafond serveur ne peut pas être élargi par le client', () => {
  assert.equal(CLUB_MEMBER_SEARCH_MAX, 30);
});
