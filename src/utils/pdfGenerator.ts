import type { User } from '../models/User';

export interface PlayerCvData {
  display_name: string;
  position?: string;
  category?: string;
  level?: string;
  strong_foot?: string;
  city?: string;
  bio?: string;
  achievements?: string[];
}

/** Transforme le profil joueur en données structurées pour génération PDF (FlutterFlow / plugin PDF). */
export function buildPlayerCvFromUser(user: User): PlayerCvData {
  return {
    display_name: user.display_name,
    position: user.profile.position,
    category: user.profile.category,
    level: user.profile.level,
    strong_foot: user.profile.strong_foot,
    city: user.city,
    bio: user.profile.bio,
    achievements: user.profile.achievements,
  };
}

/** URL placeholder — en prod : Cloud Function ou Storage signed URL après génération. */
export function generateCvPdfUrl(user: User): string {
  const slug = encodeURIComponent(user.display_name.replace(/\s+/g, '-'));
  return `https://storage.proday.app/cv/${user.uid}/${slug}.pdf`;
}
