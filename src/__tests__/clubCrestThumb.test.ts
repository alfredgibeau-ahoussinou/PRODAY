import { clubMonogram } from '../utils/clubMonogram';

describe('clubMonogram', () => {
  it('ignore FC / Football Club pour les initiales', () => {
    expect(clubMonogram('Football Club de Melun')).toMatch(/^[A-ZÀ-Ÿ]{1,2}$/);
    expect(clubMonogram('FC Melun')).toBe('ME');
  });

  it('gère Le Mée', () => {
    expect(clubMonogram('Le Mée Sports')).toBe('LM');
  });
});
