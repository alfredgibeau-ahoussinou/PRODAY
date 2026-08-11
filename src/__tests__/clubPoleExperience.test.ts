import {
  CLUB_HUB_SECTION_CHIPS,
  CLUB_PITCH_ZONES,
  CLUB_POLE_MODULES,
  CLUB_MATCH_INVITE_STEPS,
  CLUB_HUB_BLOCKS,
} from '../content/clubPoleExperience';
import { CLUB_OFFERS } from '../content/clubOffers';

describe('club pole experience (site parity)', () => {
  it('exposes the 8 site modules', () => {
    expect(CLUB_POLE_MODULES).toHaveLength(8);
    expect(CLUB_POLE_MODULES.map((m) => m.id)).toEqual([
      'structure',
      'bourse-club',
      'pipeline-club',
      'convocations-club',
      'covoiturage-club',
      'tournois-club',
      'communication-club',
      'vitrine-club',
    ]);
  });

  it('exposes six pitch cockpit zones', () => {
    expect(CLUB_PITCH_ZONES).toHaveLength(6);
    expect(CLUB_PITCH_ZONES.map((z) => z.id)).toContain('bourse');
  });

  it('covers president hub blocks and invite funnel', () => {
    expect(CLUB_HUB_BLOCKS.length).toBeGreaterThanOrEqual(6);
    expect(CLUB_MATCH_INVITE_STEPS).toHaveLength(3);
  });

  it('maps hub chips to site sections including offers and video', () => {
    const ids = CLUB_HUB_SECTION_CHIPS.map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining(['overview', 'modules', 'bourse', 'invites', 'pitch', 'offers', 'video']),
    );
  });

  it('keeps four club commercial offers', () => {
    expect(Object.keys(CLUB_OFFERS)).toEqual(
      expect.arrayContaining([
        'club_amateur',
        'club_essentiel',
        'club_premium',
        'club_video_pro',
      ]),
    );
  });
});
