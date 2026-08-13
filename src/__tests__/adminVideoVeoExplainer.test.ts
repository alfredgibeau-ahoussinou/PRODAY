/**
 * Explication admin — connexion ProDay ↔ Veo.
 */
import { ADMIN_VIDEO_VEO_DEMO } from '../content/adminVideoVeoExplainer';

describe('adminVideoVeoExplainer', () => {
  it('expose la chaîne Caméra → Joueurs et un script démo', () => {
    expect(ADMIN_VIDEO_VEO_DEMO.chain).toHaveLength(5);
    expect(ADMIN_VIDEO_VEO_DEMO.chain[0]?.label).toBe('Caméra');
    expect(ADMIN_VIDEO_VEO_DEMO.howItWorks.length).toBeGreaterThanOrEqual(5);
    expect(ADMIN_VIDEO_VEO_DEMO.demoScript.length).toBeGreaterThanOrEqual(4);
    expect(ADMIN_VIDEO_VEO_DEMO.pitch.toLowerCase()).toContain('veo');
  });
});
