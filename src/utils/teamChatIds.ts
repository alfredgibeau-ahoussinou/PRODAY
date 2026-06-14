/** Identifiant thread groupe équipe (événement). */
export function teamThreadId(eventId: string): string {
  return `team__${eventId}`;
}

export function isTeamThread(threadId: string): boolean {
  return threadId.startsWith('team__');
}
