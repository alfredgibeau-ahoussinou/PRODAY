/**
 * Résolution finale d'un style de texte ProDay — **pure et testable**.
 *
 * Pourquoi ce module existe : la famille de police résolue est la **pile
 * système Apple** (`APPLE_FONT_STACK`, cf. `theme/typography.ts`) — `System`
 * sur iOS, la pile `-apple-system / SF Pro` sur le web, `Roboto` sur Android.
 * Cette pile n'expose qu'**un seul nom de famille** pour toutes les graisses :
 * `fontFamily.regular`, `.semibold`, `.bold`, `.extrabold`, `.black`,
 * `.display` et `.displayBold` retournent tous la même valeur.
 *
 * Conséquence : la graisse ne peut plus être encodée par le **nom** de la
 * famille (ce que permettaient les fichiers Inter/Syne, où chaque graisse était
 * une famille distincte). Retirer `fontWeight` du style final — ce que faisait
 * la version écrite pour les polices chargées — fait donc **retomber tous les
 * titres en graisse normale** : le gras, et avec lui la hiérarchie visuelle,
 * disparaissaient de toute l'application.
 *
 * On conserve donc le `fontWeight` d'entrée tout en continuant d'imposer la
 * pile système (aucune police tierce n'est chargée dans le projet).
 */
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { fontFamily, textVariants, type TextVariant } from './typography';

function numericWeight(weight: TextStyle['fontWeight'] | undefined): number | null {
  if (weight == null) return null;
  if (typeof weight === 'number') return weight;
  if (weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  const n = Number(weight);
  return Number.isFinite(n) ? n : null;
}

/**
 * Graisse effective d'un style : celle demandée si elle est explicite, sinon
 * celle définie par la variante typographique.
 */
export function resolveTextWeight(
  variant: TextVariant,
  weight: TextStyle['fontWeight'] | undefined,
): TextStyle['fontWeight'] {
  if (numericWeight(weight) != null) return weight as TextStyle['fontWeight'];
  return (textVariants[variant]?.fontWeight as TextStyle['fontWeight']) ?? '400';
}

/**
 * Famille effective : la variante `brand` garde le traitement « display », les
 * autres suivent leur variante, avec la pile système en repli.
 */
export function resolveTextFamily(variant: TextVariant): string {
  if (variant === 'brand') return fontFamily.display;
  return textVariants[variant]?.fontFamily ?? fontFamily.regular;
}

/**
 * Style de texte prêt pour `Text` : famille système imposée, **graisse
 * conservée**, `transform` retiré (jamais de distorsion sur du texte
 * d'interface). La couleur reste gérée par l'appelant.
 */
export function resolveProDayTextStyle(
  variant: TextVariant,
  style?: StyleProp<TextStyle>,
): TextStyle {
  const flat = StyleSheet.flatten([textVariants[variant], style]) as TextStyle;
  const {
    fontFamily: _fontFamily,
    fontWeight,
    transform: _transform,
    ...rest
  } = flat;

  return {
    ...rest,
    fontFamily: resolveTextFamily(variant),
    fontWeight: resolveTextWeight(variant, fontWeight),
  };
}
