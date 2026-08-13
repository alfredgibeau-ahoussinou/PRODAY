import { getTabShortLabel, getVisibleMainTabs } from '../content/poleExperience';
import {
  PRO_CLUB_OVERFLOW_TABS,
  PRO_CLUB_SHELL_TABS,
  PRO_PLAYER_OVERFLOW_TABS,
  PRO_PLAYER_SHELL_TABS,
} from '../navigation/shells/productShellTabs';

describe('club et staff shells', () => {
  it('applique les onglets architecture club (avec Shop et Covoiturage)', () => {
    expect(getVisibleMainTabs('pro', 'club')).toEqual([
      ...PRO_CLUB_SHELL_TABS,
      ...PRO_CLUB_OVERFLOW_TABS,
    ]);
    expect(getTabShortLabel('home', 'pro', 'club')).toBe('Accueil');
    expect(getTabShortLabel('covoiturage', 'pro', 'club')).toBe('Covoit');
    expect(getTabShortLabel('recrutement', 'pro', 'club')).toBe('Recrut.');
    expect(getTabShortLabel('matchs', 'pro', 'club')).toBe('Matchs');
    expect(getTabShortLabel('messages', 'pro', 'club')).toBe('Comm.');
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
      ...PRO_PLAYER_SHELL_TABS,
      ...PRO_PLAYER_OVERFLOW_TABS,
    ]);
    expect(getVisibleMainTabs('pro', 'player')).not.toContain('sante');
    expect(getTabShortLabel('home', 'pro', 'player')).toBe('Carrière');
    expect(getTabShortLabel('covoiturage', 'pro', 'player')).toBe('Covoiturage');
    expect(getTabShortLabel('recrutement', 'pro', 'player')).toBe('Opportunités');
    expect(getTabShortLabel('reels', 'pro', 'player')).toBe('Reels');
    expect(getTabShortLabel('matchs', 'pro', 'player')).toBe('Matchs');
    expect(getTabShortLabel('profil', 'pro', 'player')).toBe('Moi');
  });
});
