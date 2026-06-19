import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';

export function buildOneClickCoverLetter(profile: User, post: RecruitmentPost): string {
  const p = profile.profile;
  const lines = [
    `Bonjour,`,
    ``,
    `Je suis ${profile.display_name}, ${p.position ?? 'joueur'}${p.level ? ` (${p.level})` : ''}${profile.city ? ` basé(e) à ${profile.city}` : ''}.`,
    `Votre annonce « ${post.title} » pour ${post.club_name} m'intéresse.`,
  ];

  if (p.bio?.trim()) {
    lines.push('', p.bio.trim().slice(0, 280));
  } else if (p.cv_headline?.trim()) {
    lines.push('', p.cv_headline.trim());
  }

  const stats = p.season_stats;
  if (stats && (stats.matches > 0 || stats.goals > 0)) {
    lines.push(
      '',
      `Cette saison : ${stats.matches} match(s), ${stats.goals} but(s), ${stats.assists} passe(s) décisive(s).`,
    );
  }

  lines.push('', 'Cordialement,', profile.display_name);
  return lines.join('\n');
}
