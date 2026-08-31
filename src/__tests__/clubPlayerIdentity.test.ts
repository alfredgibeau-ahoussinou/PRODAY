import { clubJerseyLabel, clubPositionShort } from '../features/club/ui/clubPlayerIdentity';

describe('clubPlayerIdentity', () => {
  it('abrège les postes football', () => {
    expect(clubPositionShort('Gardien')).toBe('GK');
    expect(clubPositionShort('Milieu défensif')).toBe('MDC');
    expect(clubPositionShort('Attaquant')).toBe('ST');
    expect(clubPositionShort(null)).toBeNull();
  });

  it('formate le numéro de maillot', () => {
    expect(clubJerseyLabel(10)).toBe('10');
    expect(clubJerseyLabel(null)).toBe('—');
    expect(clubJerseyLabel(150)).toBe('99');
  });
});
