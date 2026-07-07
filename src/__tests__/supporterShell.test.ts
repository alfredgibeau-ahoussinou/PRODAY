import { getVisibleMainTabs } from '../content/poleExperience';
import { SUPPORTER_SHELL_TABS } from '../navigation/shells/productShellTabs';

describe('supporter shell navigation', () => {
  it('expose la tribune home en premier onglet', () => {
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual(SUPPORTER_SHELL_TABS);
    expect(SUPPORTER_SHELL_TABS[0]).toBe('home');
    expect(SUPPORTER_SHELL_TABS).toContain('matchs');
    expect(SUPPORTER_SHELL_TABS).toContain('feed');
    expect(SUPPORTER_SHELL_TABS).toContain('messages');
    expect(SUPPORTER_SHELL_TABS).toContain('profil');
  });
});
