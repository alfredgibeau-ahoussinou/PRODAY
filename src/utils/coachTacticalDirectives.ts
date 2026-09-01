export type TacticalAnimationDirective = 'none' | 'pressing' | 'bloc' | 'projection';

export interface TacticalDirectiveConfig {
  id: TacticalAnimationDirective;
  label: string;
  badge: string;
  color: string;
  summary: string;
  detail: string;
}

export const TACTICAL_DIRECTIVES: Record<
  Exclude<TacticalAnimationDirective, 'none'>,
  TacticalDirectiveConfig
> = {
  pressing: {
    id: 'pressing',
    label: 'Pressing',
    badge: '⚡ Pressing Haut',
    color: '#F59E0B',
    summary: 'Cadrage haut & pièges axiaux',
    detail: 'Déclenchement coordonné à la passe adverse, fermeture des lignes intérieures et cadrage agressif.',
  },
  bloc: {
    id: 'bloc',
    label: 'Bloc',
    badge: '🛡️ Bloc Médian/Bas',
    color: '#38BDF8',
    summary: 'Compacité & coulissement',
    detail: 'Lignes serrées, réduction de la profondeur entre défense et milieu, coulissement latéral en bloc.',
  },
  projection: {
    id: 'projection',
    label: 'Projection',
    badge: '🚀 Projection',
    color: '#10B981',
    summary: 'Transitions rapides & couloirs',
    detail: 'Dédoublement des latéraux, courses tranchantes des ailiers et projection verticale des relayeurs.',
  },
};
