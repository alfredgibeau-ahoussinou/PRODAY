/**
 * Disponibilité des résultats de recherche — règle pure et testée.
 *
 * Une ligne de résultat est une **promesse de navigation**. Si le pôle qui a ouvert la
 * recherche ne sait pas ouvrir cette catégorie (pas de gestionnaire câblé), la ligne ne doit
 * pas apparaître du tout : l'afficher grisée ou cliquable-sans-effet est exactement le
 * « bouton qui ne mène nulle part » interdit.
 *
 * Conséquence assumée : ces résultats ne comptent pas non plus dans le total annoncé, sinon
 * l'en-tête promettrait des résultats inatteignables.
 */

export type DestinationAvailability = {
  /** La catégorie est-elle ouvrable par le pôle appelant ? */
  openable: boolean;
};

/** Une catégorie n'est ouvrable que si un gestionnaire réel est fourni. */
export function isDestinationOpenable(handler: ((...args: never[]) => void) | undefined): boolean {
  return typeof handler === 'function';
}

/**
 * Total annoncé : uniquement les catégories réellement ouvrables.
 * Chaque entrée fournit sa liste de résultats et la présence de son gestionnaire.
 */
export function countReachableResults(
  groups: Array<{ results: readonly unknown[]; handler: ((...args: never[]) => void) | undefined }>,
): number {
  return groups.reduce(
    (total, group) => total + (isDestinationOpenable(group.handler) ? group.results.length : 0),
    0,
  );
}
