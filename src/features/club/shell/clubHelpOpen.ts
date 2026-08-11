type OpenListener = () => void;

let openListener: OpenListener | null = null;

/** Enregistre l’ouvreur du chatbot d’aide (monté par PoleHelpChatbot). */
export function registerClubHelpOpener(listener: OpenListener | null): void {
  openListener = listener;
}

/** Ouvre le chatbot d’aide Club depuis le menu Assistant. */
export function openClubHelpChatbot(): void {
  openListener?.();
}
