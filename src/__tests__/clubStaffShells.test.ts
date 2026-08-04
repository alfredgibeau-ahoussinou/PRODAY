import { getTabShortLabel, getVisibleMainTabs } from '../content/poleExperience';

describe('club et staff shells', () => {
  it('applique les onglets architecture club (avec Shop et Covoiturage)', () => {
    expect(getVisibleMainTabs('pro', 'club')).toEqual([
      'home',
      'covoiturage',
      'recrutement',
      'matchs',
      'messages',
      'shop',
      'profil',
    ]);
    expect(getTabShortLabel('home', 'pro', 'club')).toBe('Structure');
    expect(getTabShortLabel('covoiturage', 'pro', 'club')).toBe('Covoiturage');
    expect(getTabShortLabel('recrutement', 'pro', 'club')).toBe('Recrutement');
    expect(getTabShortLabel('matchs', 'pro', 'club')).toBe('Calendrier');
    expect(getTabShortLabel('messages', 'pro', 'club')).toBe('Communication');
    expect(getTabShortLabel('profil', 'pro', 'club')).toBe('Vitrine');
  });

  it('différencie les onglets staff pro', () => {
    const coachTabs = getVisibleMainTabs('pro', 'coach');
    const agentTabs = getVisibleMainTabs('pro', 'agent');
    const recruiterTabs = getVisibleMainTabs('pro', 'recruiter');
    const organizerTabs = getVisibleMainTabs('pro', 'organizer');

    expect(coachTabs).toContain('covoiturage');
    expect(coachTabs.indexOf('covoiturage')).toBeLessThan(coachTabs.indexOf('matchs'));
    expect(agentTabs).toContain('feed');
    expect(recruiterTabs).toContain('feed');
    expect(organizerTabs).toContain('feed');
    expect(organizerTabs).toContain('covoiturage');
    expect(organizerTabs.indexOf('covoiturage')).toBeLessThan(organizerTabs.indexOf('matchs'));
    expect(coachTabs).not.toContain('feed');
    expect(coachTabs).toContain('shop');
    expect(agentTabs).toContain('shop');
    expect(recruiterTabs).toContain('shop');
    expect(organizerTabs).toContain('shop');
  });

  it('expose un shell pro joueur dédié', () => {
    expect(getVisibleMainTabs('pro', 'player')).toEqual([
      'home',
      'reels',
      'matchs',
      'messages',
      'profil',
      'covoiturage',
      'recrutement',
      'sante',
      'shop',
    ]);
    expect(getTabShortLabel('home', 'pro', 'player')).toBe('Carrière');
    expect(getTabShortLabel('covoiturage', 'pro', 'player')).toBe('Covoiturage');
    expect(getTabShortLabel('recrutement', 'pro', 'player')).toBe('Opportunités');
    expect(getTabShortLabel('reels', 'pro', 'player')).toBe('Reels');
    expect(getTabShortLabel('matchs', 'pro', 'player')).toBe('Matchs');
    expect(getTabShortLabel('profil', 'pro', 'player')).toBe('Moi');
  });
});

