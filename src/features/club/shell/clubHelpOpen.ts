type OpenListener = () => void;

let openListener: OpenListener | null = null;
let fallbackListener: OpenListener | null = null;

/** Enregistre l’ouvreur du chatbot d’aide (monté par PoleHelpChatbot). */
export function registerClubHelpOpener(listener: OpenListener | null): void {
  openListener = listener;
}

/** Fallback si le widget d’aide n’est pas monté (ex. pôle supporter). */
export function registerClubHelpFallback(listener: OpenListener | null): void {
  fallbackListener = listener;
}

/** Ouvre le chatbot d’aide. Retourne false si aucun panneau n’est enregistré. */
export function openClubHelpChatbot(): boolean {
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
