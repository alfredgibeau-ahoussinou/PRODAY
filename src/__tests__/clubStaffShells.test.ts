import { getTabShortLabel, getVisibleMainTabs } from '../content/poleExperience';

describe('club et staff shells', () => {
  it('applique les 5 onglets architecture club', () => {
    expect(getVisibleMainTabs('pro', 'club')).toEqual([
      'home',
      'recrutement',
      'matchs',
      'messages',
      'profil',
    ]);
    expect(getTabShortLabel('home', 'pro', 'club')).toBe('Structure');
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
    expect(agentTabs).toContain('feed');
    expect(recruiterTabs).toContain('feed');
    expect(organizerTabs).toContain('feed');
    expect(coachTabs).not.toContain('feed');
  });

  it('expose un shell pro joueur dédié', () => {
    expect(getVisibleMainTabs('pro', 'player')).toEqual([
      'home',
      'recrutement',
      'reels',
      'matchs',
      'profil',
    ]);
    expect(getTabShortLabel('home', 'pro', 'player')).toBe('Carrière');
    expect(getTabShortLabel('recrutement', 'pro', 'player')).toBe('Opportunités');
    expect(getTabShortLabel('reels', 'pro', 'player')).toBe('Portfolio');
    expect(getTabShortLabel('matchs', 'pro', 'player')).toBe('Groupe');
    expect(getTabShortLabel('profil', 'pro', 'player')).toBe('Moi');
  });
});

