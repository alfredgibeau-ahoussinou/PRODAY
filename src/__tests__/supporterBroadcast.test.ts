import {
  inferBroadcastFromApiPayload,
  extractProdayOfficialWatchUrl,
  isListedBroadcastItem,
} from '../utils/supporterBroadcast';

describe('supporterBroadcast', () => {
  it('n’invente pas de diffusion sans canal / URL', () => {
    expect(inferBroadcastFromApiPayload({})).toEqual({ listed: false });
  });

  it('liste un canal TNT fourni par l’API', () => {
    const result = inferBroadcastFromApiPayload({
      broadcasts: [{ name: 'France 2' }],
    });
    expect(result.listed).toBe(true);
    expect(result.label).toBe('France 2');
  });

  it('extrait un lien Daily ProDay, ignore le reste', () => {
    expect(
      extractProdayOfficialWatchUrl({
        description: 'Lien https://proday.daily.co/match-1 pour la visio',
      }),
    ).toContain('daily.co');
    expect(
      extractProdayOfficialWatchUrl({
        description: 'https://random-stream.example/piracy',
      }),
    ).toBeUndefined();
  });

  it('détecte un item listé', () => {
    expect(isListedBroadcastItem({ broadcastListed: true })).toBe(true);
    expect(isListedBroadcastItem({ watchUrl: 'https://proday.daily.co/x' })).toBe(true);
    expect(isListedBroadcastItem({})).toBe(false);
  });
});
