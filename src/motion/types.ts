/** Contextes de motion — un preset par intention, pas une anim unique partout. */
export type MotionContext =
  | 'nav' // navigation principale (rapide)
  | 'detail' // profondeur / push
  | 'form' // formulaires dédiés
  | 'sheet' // bottom sheet bas → haut
  | 'modal' // modal profondeur
  | 'tab' // micro-transition onglets
  | 'live' // match / live immersif, non bloquant
  | 'video' // vidéo prioritaire, anim courte
  | 'shared'; // shared element (opt-in)

export type NavDirection = 1 | -1;

export type MotionSpring = {
  damping: number;
  stiffness: number;
  mass: number;
};
