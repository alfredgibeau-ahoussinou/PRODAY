type EventHandler = (payload?: unknown) => void;

const handlers = new Map<string, Set<EventHandler>>();

/** Bus d'événements léger — actions utilisateur temps réel. */
export const eventBus = {
  on(event: string, handler: EventHandler): void {
    const set = handlers.get(event) ?? new Set<EventHandler>();
    set.add(handler);
    handlers.set(event, set);
  },

  off(event: string, handler: EventHandler): void {
    handlers.get(event)?.delete(handler);
  },

  emit(event: string, payload?: unknown): void {
    handlers.get(event)?.forEach((handler) => handler(payload));
  },
};
