type OpenListener = () => void;

let openListener: OpenListener | null = null;
let fallbackListener: OpenListener | null = null;
/** Priorité shell Club — vrai Copilote immersif (écrase le FAQ PoleHelp). */
let clubCopilotListener: OpenListener | null = null;

/** Enregistre l’ouvreur du chatbot d’aide (monté par PoleHelpChatbot). */
export function registerClubHelpOpener(listener: OpenListener | null): void {
  openListener = listener;
}

/** Fallback si le widget d’aide n’est pas monté (ex. pôle supporter). */
export function registerClubHelpFallback(listener: OpenListener | null): void {
  fallbackListener = listener;
}

/** Enregistre le sheet Copilote du ClubAppShell (prioritaire sur le FAQ). */
export function registerClubCopilotOpener(listener: OpenListener | null): void {
  clubCopilotListener = listener;
}

/** Ouvre le Copilote Club (ou le fallback aide). Retourne false si aucun panneau. */
export function openClubHelpChatbot(): boolean {
  if (clubCopilotListener) {
    clubCopilotListener();
    return true;
  }
  if (openListener) {
    openListener();
    return true;
  }
  if (fallbackListener) {
    fallbackListener();
    return true;
  }
  return false;
}
