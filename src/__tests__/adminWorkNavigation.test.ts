import { resolveAdminWorkItemNavigation, resolveAdminSearchHitNavigation } from '../utils/adminWorkNavigation';
import type { AdminWorkItem } from '../utils/adminInsights';

function navItem(kind: AdminWorkItem['kind']): AdminWorkItem {
  return {
    id: `${kind}-1`,
    kind,
    priority: 'medium',
    title: 'Test',
    subtitle: 'Sub',
    targetTab: 'users',
  };
}

describe('adminWorkNavigation', () => {
  it('envoie verification vers users / decisions', () => {
    expect(resolveAdminWorkItemNavigation(navItem('verification'))).toEqual({
      section: 'users',
      screenTab: 'decisions',
    });
  });

  it('envoie reel vers contenus et report vers signalements contenu', () => {
    expect(resolveAdminWorkItemNavigation(navItem('reel'))).toEqual({
      section: 'contenus',
      screenTab: 'fil',
    });
    expect(resolveAdminWorkItemNavigation(navItem('report'))).toEqual({
      section: 'contenus',
      screenTab: 'signalements',
    });
  });

  it('envoie payment vers business / paiements', () => {
    expect(resolveAdminWorkItemNavigation(navItem('payment'))).toEqual({
      section: 'business',
      screenTab: 'paiements',
    });
  });

  it('envoie application vers clubs / candidatures', () => {
    expect(resolveAdminWorkItemNavigation(navItem('application'))).toEqual({
      section: 'clubs',
      screenTab: 'apps',
    });
  });

  it('envoie quote vers business / sponsors', () => {
    expect(resolveAdminWorkItemNavigation(navItem('quote'))).toEqual({
      section: 'business',
      screenTab: 'sponsors',
    });
  });

  it('envoie post vers clubs / posts', () => {
    expect(resolveAdminWorkItemNavigation(navItem('post'))).toEqual({
      section: 'clubs',
      screenTab: 'posts',
    });
  });

  it('envoie membership vers clubs / validation', () => {
    expect(resolveAdminWorkItemNavigation(navItem('membership'))).toEqual({
      section: 'clubs',
      screenTab: 'validation',
    });
  });

  it('envoie subscription_request vers business / abonnements', () => {
    expect(resolveAdminWorkItemNavigation(navItem('subscription_request'))).toEqual({
      section: 'business',
      screenTab: 'abonnements',
    });
  });

  it('mappe un hit recherche club vers Clubs', () => {
    expect(
      resolveAdminSearchHitNavigation({
        id: 'c-1',
        kind: 'club',
        title: 'AS Test',
        subtitle: 'Paris',
        targetTab: 'clubs',
        entityId: 'c-1',
      }),
    ).toEqual({ section: 'clubs', screenTab: 'all', focusId: 'c-1' });
  });
});
