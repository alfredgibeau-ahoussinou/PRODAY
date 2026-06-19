import { buildOneClickCoverLetter } from '../utils/recruitmentOneClick';
import { buildConvocationShareMessage } from '../utils/teamEventShare';
import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import type { TeamEvent } from '../models/TeamEvent';

describe('recruitmentOneClick', () => {
  const profile = {
    display_name: 'Alex Martin',
    city: 'Lyon',
    profile: {
      position: 'Milieu',
      level: 'R1',
      season_stats: { matches: 12, goals: 3, assists: 5 },
    },
  } as User;

  const post = {
    title: 'Milieu créatif',
    club_name: 'FC Test',
  } as RecruitmentPost;

  it('génère une lettre avec identité et stats', () => {
    const letter = buildOneClickCoverLetter(profile, post);
    expect(letter).toContain('Alex Martin');
    expect(letter).toContain('Milieu créatif');
    expect(letter).toContain('12 match(s)');
  });
});

describe('teamEventShare', () => {
  it('inclut titre et ville', () => {
    const msg = buildConvocationShareMessage({
      id: 'e1',
      title: 'Entraînement',
      starts_at: new Date('2026-06-10T18:00:00'),
      city: 'Paris',
      location_label: 'Stade A',
      invitee_uids: ['a', 'b'],
      event_type: 'training',
      organizer_uid: 'org',
      organizer_name: 'Coach',
      rsvps: { a: 'yes' },
      ends_at: new Date('2026-06-10T20:00:00'),
      created_at: new Date(),
    } as unknown as TeamEvent);
    expect(msg).toContain('Entraînement');
    expect(msg).toContain('Paris');
    expect(msg).toContain('Stade A');
  });
});
