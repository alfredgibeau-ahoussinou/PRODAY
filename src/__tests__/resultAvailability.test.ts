import { countReachableResults, isDestinationOpenable } from '../features/search/resultAvailability';

describe('résultats de recherche — aucune destination sans issue', () => {
  it('une catégorie sans gestionnaire n est pas ouvrable', () => {
    expect(isDestinationOpenable(undefined)).toBe(false);
  });

  it('une catégorie avec gestionnaire réel est ouvrable', () => {
    expect(isDestinationOpenable(() => undefined)).toBe(true);
  });

  it('le total ne compte pas une catégorie non ouvrable', () => {
    const teams = [{ id: 't1' }, { id: 't2' }];
    const events = [{ id: 'e1' }];
    const pages = [{ id: 'p1' }];
    const noop = () => undefined;

    // Pôle sans gestionnaire d'équipe : les 2 équipes ne sont ni affichées ni comptées.
    expect(
      countReachableResults([
        { results: pages, handler: noop },
        { results: teams, handler: undefined },
        { results: events, handler: noop },
      ]),
    ).toBe(2);

    // Pôle complet : tout est ouvrable et donc annoncé.
    expect(
      countReachableResults([
        { results: pages, handler: noop },
        { results: teams, handler: noop },
        { results: events, handler: noop },
      ]),
    ).toBe(4);
  });

  it('sans aucun gestionnaire, le total annoncé est zéro', () => {
    expect(
      countReachableResults([
        { results: [{ id: 'a' }], handler: undefined },
        { results: [{ id: 'b' }], handler: undefined },
      ]),
    ).toBe(0);
  });
});
