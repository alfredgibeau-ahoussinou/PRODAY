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
  it('envoie verification vers personnes / decisions', () => {
    expect(resolveAdminWorkItemNavigation(navItem('verification'))).toEqual({
      section: 'personnes',
      screenTab: 'decisions',
    });
  });

  it('envoie reel et report vers communication / decisions', () => {
    expect(resolveAdminWorkItemNavigation(navItem('reel'))).toEqual({
      section: 'operations',
      hubTab: 'communication',
      screenTab: 'decisions',
    });
    expect(resolveAdminWorkItemNavigation(navItem('report'))).toEqual({
      section: 'operations',
      hubTab: 'communication',
      screenTab: 'decisions',
    });
  });

  it('envoie payment vers finances / paiements', () => {
    expect(resolveAdminWorkItemNavigation(navItem('payment'))).toEqual({
      section: 'finances',
      screenTab: 'paiements',
    });
  });

  it('envoie application vers recrutement / candidatures', () => {
    expect(resolveAdminWorkItemNavigation(navItem('application'))).toEqual({
      section: 'operations',
      hubTab: 'recrutement',
      screenTab: 'candidatures',
    });
  });

  it('envoie quote vers finances / sponsors', () => {
    expect(resolveAdminWorkItemNavigation(navItem('quote'))).toEqual({
      section: 'finances',
      screenTab: 'sponsors',
    });
  });

  it('envoie post vers recrutement / posts', () => {
    expect(resolveAdminWorkItemNavigation(navItem('post'))).toEqual({
      section: 'operations',
      hubTab: 'recrutement',
      screenTab: 'posts',
    });
  });

  it('envoie membership vers clubs', () => {
    expect(resolveAdminWorkItemNavigation(navItem('membership'))).toEqual({
      section: 'clubs',
      screenTab: 'clubs',
    });
  });

  it('envoie subscription_request vers finances / abonnements', () => {
    expect(resolveAdminWorkItemNavigation(navItem('subscription_request'))).toEqual({
      section: 'finances',
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
      }),
    ).toEqual({ section: 'clubs', screenTab: 'clubs' });
  });
});
