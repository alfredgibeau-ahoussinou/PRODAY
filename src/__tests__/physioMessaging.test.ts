import {
  isPhysioCarePair,
  physioCareThreadLabel,
  threadKindForParticipants,
} from '../utils/physioMessaging';

describe('physioMessaging', () => {
  it('détecte une paire joueur / kiné', () => {
    expect(isPhysioCarePair('physio', 'player')).toBe(true);
    expect(isPhysioCarePair('player', 'physio')).toBe(true);
    expect(isPhysioCarePair('player', 'coach')).toBe(false);
  });

  it('assigne le type de fil physio_care', () => {
    expect(threadKindForParticipants('physio', 'player')).toBe('physio_care');
    expect(threadKindForParticipants('agent', 'player')).toBe('standard');
  });

  it('libellé badge suivi kiné', () => {
    expect(physioCareThreadLabel('physio_care')).toBe('Suivi kiné');
    expect(physioCareThreadLabel('standard')).toBeNull();
  });
});
