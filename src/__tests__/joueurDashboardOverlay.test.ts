import {
  isJoueurDashboardOverlayView,
  shouldStayOnTabForDashboard,
  trainHubViewForDashboard,
} from '../navigation/joueurDashboardOverlay';

describe('joueurDashboardOverlay', () => {
  it('identifie les deep links Coach IA / train / coach humain', () => {
    expect(isJoueurDashboardOverlayView('train_ai')).toBe(true);
    expect(isJoueurDashboardOverlayView('train_coach')).toBe(true);
    expect(isJoueurDashboardOverlayView('tactics_coach')).toBe(true);
    expect(isJoueurDashboardOverlayView('train')).toBe(true);
    expect(isJoueurDashboardOverlayView('smart_tactics')).toBe(false);
    expect(isJoueurDashboardOverlayView('gestion')).toBe(false);
    expect(isJoueurDashboardOverlayView(null)).toBe(false);
  });

  it('reste sur l’onglet courant pour un joueur (pas de reset Accueil)', () => {
    expect(shouldStayOnTabForDashboard('train_ai', 'player')).toBe(true);
    expect(shouldStayOnTabForDashboard('train_coach', 'player')).toBe(true);
    expect(shouldStayOnTabForDashboard('tactics_coach', 'player')).toBe(true);
    expect(shouldStayOnTabForDashboard('train', 'player')).toBe(true);
    expect(shouldStayOnTabForDashboard('gestion', 'player')).toBe(false);
    expect(shouldStayOnTabForDashboard('train_ai', 'coach')).toBe(false);
    expect(shouldStayOnTabForDashboard('gestion', 'coach')).toBe(true);
    expect(shouldStayOnTabForDashboard('smart_tactics', 'coach')).toBe(true);
    expect(shouldStayOnTabForDashboard('gestion', 'club')).toBe(true);
    expect(shouldStayOnTabForDashboard('sponsors', 'club')).toBe(true);
    expect(shouldStayOnTabForDashboard('train_ai', null)).toBe(false);
  });

  it('mappe train_ai / train_coach vers les vues Train Hub', () => {
    expect(trainHubViewForDashboard('train_ai')).toBe('ai');
    expect(trainHubViewForDashboard('train_coach')).toBe('coach');
    expect(trainHubViewForDashboard('train')).toBe('hub');
    expect(trainHubViewForDashboard('tactics_coach')).toBe('hub');
  });
});
