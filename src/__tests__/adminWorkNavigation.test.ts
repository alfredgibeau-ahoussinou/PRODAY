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

  it('envoie reel vers contenus et report vers signalements', () => {
    expect(resolveAdminWorkItemNavigation(navItem('reel'))).toEqual({
      section: 'contenus',
      screenTab: 'fil',
    });
    expect(resolveAdminWorkItemNavigation(navItem('report'))).toEqual({
      section: 'signalements',
    });
  });

  it('envoie payment vers abonnements / paiements', () => {
    expect(resolveAdminWorkItemNavigation(navItem('payment'))).toEqual({
      section: 'abonnements',
      screenTab: 'paiements',
    });
  });

  it('envoie application vers recrutement / candidatures', () => {
    expect(resolveAdminWorkItemNavigation(navItem('application'))).toEqual({
      section: 'recrutement',
      screenTab: 'apps',
    });
  });

  it('envoie quote vers sponsors', () => {
    expect(resolveAdminWorkItemNavigation(navItem('quote'))).toEqual({
      section: 'sponsors',
      screenTab: 'sponsors',
    });
  });

  it('envoie post vers recrutement / posts', () => {
    expect(resolveAdminWorkItemNavigation(navItem('post'))).toEqual({
      section: 'recrutement',
      screenTab: 'posts',
    });
  });

  it('envoie membership vers clubs', () => {
    expect(resolveAdminWorkItemNavigation(navItem('membership'))).toEqual({
      section: 'clubs',
      screenTab: 'clubs',
    });
  });

  it('envoie subscription_request vers abonnements / demandes', () => {
    expect(resolveAdminWorkItemNavigation(navItem('subscription_request'))).toEqual({
      section: 'abonnements',
      screenTab: 'demandes',
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
      }),
    ).toEqual({ section: 'clubs', screenTab: 'clubs', focusId: 'c-1' });
  });
});
