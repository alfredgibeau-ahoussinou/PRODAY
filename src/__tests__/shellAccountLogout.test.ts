import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function source(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('logout mobile Club / Coach / Président', () => {
  it('expose ShellAccountSection avec action déconnexion', () => {
    const shared = source('components/shell/ShellAccountSection.tsx');
    expect(shared).toContain('export function ShellAccountSection');
    expect(shared).toContain('onSignOut');
    expect(shared).toContain('log-out');
    expect(shared).toContain('safeBottom');
  });

  it('branche la déconnexion dans les menus mobiles des 3 pôles', () => {
    const coach = source('features/coach/shell/CoachMenuPane.tsx');
    const club = source('features/club/shell/ClubMenuPane.tsx');
    const president = source('features/president/shell/PresidentMenuPane.tsx');

    expect(coach).toContain('ShellAccountSection');
    expect(coach).toContain('onSignOut={shellNav?.signOut}');
    expect(coach).toContain("requestNav('profil')");

    expect(club).toContain('ShellAccountSection');
    expect(club).toContain('onSignOut={shellNav?.signOut}');

    expect(president).toContain('ShellAccountSection');
    expect(president).toContain('onSignOut={shellNav?.signOut}');
    expect(president).toContain('Déconnexion');
  });

  it('expose aussi la déconnexion sur le hub Club (compte)', () => {
    const hub = source('screens/club/ClubHubScreen.tsx');
    expect(hub).toContain('ShellAccountSection');
    expect(hub).toContain('onSignOut={shellNav?.signOut}');
  });
});

describe('notifications identité officielle', () => {
  it('pointe app.json et le plugin vers proday-notification-icon', () => {
    const app = source('../app.json');
    expect(app).toContain('proday-notification-icon.png');
    expect(app).toContain('"color": "#C5A059"');
  });

  it('enregistre les drawable Android notification_icon', () => {
    for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      const path = resolve(
        root,
        `../android/app/src/main/res/drawable-${density}/notification_icon.png`,
      );
      expect(readFileSync(path).length).toBeGreaterThan(100);
    }
    const colors = source('../android/app/src/main/res/values/colors.xml');
    expect(colors).toContain('notification_icon_color');
    expect(colors).toContain('#C5A059');
    const manifest = source('../android/app/src/main/AndroidManifest.xml');
    expect(manifest).toContain('@drawable/notification_icon');
    expect(manifest).toContain('default_notification_icon');
  });
});
