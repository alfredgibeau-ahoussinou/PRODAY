import {
  buildParentGuideTips,
  tipsToGuideNotifications,
  scheduleParentGuideReminders,
  audienceLabel,
} from '../services/parentAiGuide.service';
import {
  PARENT_PRIMARY_TABS,
  PARENT_MENU_TOOLS,
  primaryTabForParentNav,
  canonicalizeParentNav,
  isParentPrimaryTab,
} from '../features/parent/navigation/parentNavConfig';

describe('parentNavConfig', () => {
  it('expose 5 onglets primaires type Coach', () => {
    expect(PARENT_PRIMARY_TABS.map((t) => t.id)).toEqual([
      'home',
      'enfant',
      'guide',
      'plus',
      'reglages',
    ]);
  });

  it('range les outils secondaires sous Menu', () => {
    expect(PARENT_MENU_TOOLS.map((t) => t.id)).toEqual(['messages', 'agenda', 'trajet']);
    expect(primaryTabForParentNav('messages')).toBe('plus');
    expect(primaryTabForParentNav('guide')).toBe('guide');
    expect(isParentPrimaryTab('plus')).toBe(true);
    expect(isParentPrimaryTab('agenda')).toBe(false);
  });

  it('canonise l’ancien onglet profil → enfant', () => {
    expect(canonicalizeParentNav('profil')).toBe('enfant');
  });
});

describe('parentAiGuide', () => {
  it('produit des tips actionnables étiquetés guide', () => {
    const tips = buildParentGuideTips({
      childName: 'Léa',
      alerts: ['Contact en attente'],
      hasNextEvent: true,
      pendingContacts: 2,
      screenTimeNearLimit: true,
      childrenCount: 1,
    });
    expect(tips.length).toBeGreaterThanOrEqual(4);
    expect(tips.every((t) => t.labeledAs === 'guide_suggestion')).toBe(true);
    expect(tips.every((t) => t.body.includes('Vous pouvez'))).toBe(true);
    expect(tips.some((t) => t.audience === 'child')).toBe(true);
    expect(tips.some((t) => t.audience === 'parent')).toBe(true);
    expect(tips.some((t) => t.audience === 'actions')).toBe(true);
    expect(audienceLabel('child')).toContain('enfant');
  });

  it('convertit les tips en notifications in-app', () => {
    const tips = buildParentGuideTips({ childrenCount: 0 });
    const notifs = tipsToGuideNotifications(tips);
    expect(notifs[0]?.title.startsWith('[Guide]')).toBe(true);
    expect(notifs.every((n) => !n.read)).toBe(true);
  });

  it('stub des rappels push', async () => {
    const result = await scheduleParentGuideReminders(buildParentGuideTips());
    expect(result).toEqual({ scheduled: 0, mode: 'stub' });
  });
});
