type OpenListener = () => void;

let openListener: OpenListener | null = null;

export function registerCoachHelpOpener(listener: OpenListener | null): void {
  openListener = listener;
}

export function openCoachHelpChatbot(): void {
  openListener?.();
}
