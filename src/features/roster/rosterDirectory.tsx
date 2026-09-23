/**
 * Annuaire de joueurs **partagé** Coach ↔ Club/Admin.
 *
 * Les deux pôles affichaient le même objet métier — une liste de joueurs, un
 * champ de recherche, des puces de filtre, une fiche joueur — avec deux
 * implémentations : celle du pôle Coach portait le geste et la disponibilité,
 * celle du pôle Club portait la licence et les adhésions. Résultat : deux
 * rythmes de liste, deux puces, deux fiches, et des correctifs à faire deux fois.
 *
 * La composition visuelle est donc **extraite ici**, sur le même principe que le
 * calendrier partagé (`features/calendar/calendarChrome`) :
 *
 *  - `tokens` : jetons de surface du pôle (`ProSurfaceTokens` + `bg`), satisfaits
 *    par `ClubThemeTokens` **et** `CoachThemeTokens` ;
 *  - `Text` : le composant texte du pôle (`ClubText`, `CoachText`), qui porte la
 *    couleur et la famille système.
 *
 * La typographie, la forme et la puce viennent du socle professionnel partagé
 * (`proType`, `proForm`, `proRadius`, `proSpace`, `proChip`) : les deux pôles
 * rendent donc exactement le même rythme, sans pouvoir dériver.
 *
 * Ce que la composition **ne** prend pas en charge, volontairement : le
 * **choix** des joueurs affichés. Chaque pôle garde son sélecteur (crans de
 * composition et disponibilité d'un côté, adhésions et licences de l'autre) —
 * c'est une règle métier, pas une question de présentation.
 */

import React, { createContext, useContext, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { ModalSheet } from '../../motion/primitives/ModalSheet';
import { PressableSpring } from '../../components/motion/PressableSpring';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import {
  proBorderStrong,
  proChip,
  proFaint,
  proForm,
  proRadius,
  proSemantic,
  proSpace,
  proType,
  type ProSurfaceTokens,
} from '../../theme/professionalDesign';

/** Jetons attendus : ceux du socle, plus le fond de page (présent dans les deux pôles). */
export type RosterChromeTokens = ProSurfaceTokens & { bg: string };

/** Contrat texte minimal partagé, comme pour le calendrier. */
export type RosterChromeTextProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export type RosterChromeText = (props: RosterChromeTextProps) => React.ReactNode;

type RosterChromeTheme = {
  tokens: RosterChromeTokens;
  Text: RosterChromeText;
};

const RosterChromeContext = createContext<RosterChromeTheme | null>(null);

export function RosterChromeProvider({
  tokens,
  Text,
  children,
}: RosterChromeTheme & { children: React.ReactNode }) {
  const value = useMemo<RosterChromeTheme>(() => ({ tokens, Text }), [tokens, Text]);
  return <RosterChromeContext.Provider value={value}>{children}</RosterChromeContext.Provider>;
}

function useRosterChrome(): RosterChromeTheme {
  const ctx = useContext(RosterChromeContext);
  if (!ctx) {
    throw new Error('RosterChrome : enveloppe de thème manquante (RosterChromeProvider).');
  }
  return ctx;
}

/** Rangée de l'annuaire — le pôle fournit le contenu, jamais la mise en forme. */
export type RosterItem = {
  id: string;
  name: string;
  /** Pastille de tête : numéro de maillot, ou initiales. */
  badge: string;
  /** Ligne secondaire, propre au pôle (« MC · Présent », « U17 · N° 512… »). */
  meta?: string;
  /** Couleur du point d'état — une couleur de statut du socle partagé. */
  tone?: string;
  /** État lisible par un lecteur d'écran quand le point de couleur ne suffit pas. */
  toneLabel?: string;
  /**
   * Bloc enrichi **sous** la rangée, injecté par le pôle : licence, adhésion,
   * conformité. C'est ce qui évite de faire grossir la rangée commune à chaque
   * donnée d'un pôle.
   */
  detail?: React.ReactNode;
};

export type RosterFilter = { id: string; label: string };

export type RosterProfileFact = { label: string; value: string; tone?: string };

export type RosterProfileAction = {
  id: string;
  label: string;
  icon: IconName;
  /** `accent` = action principale, `danger` = destructive, `neutral` = repli. */
  tone?: 'accent' | 'neutral' | 'danger';
  onPress: () => void;
};

/**
 * Champ de recherche — même gabarit que le champ du socle
 * (`proForm.fieldHeight` / `proForm.fieldRadius`), avec effacement explicite.
 */
export function RosterSearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  accessibilityLabel?: string;
}) {
  const { tokens } = useRosterChrome();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.search}>
      <Icon name="search" size={16} color={tokens.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.muted}
        style={[styles.searchInput, { color: tokens.foreground }]}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />
      {value.length > 0 ? (
        <PressableSpring
          onPress={() => onChangeText('')}
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          style={styles.searchClear}
        >
          <Icon name="close" size={15} color={tokens.muted} />
        </PressableSpring>
      ) : null}
    </View>
  );
}

/**
 * Puces de filtre — la géométrie et l'état viennent de `proChip`, donc une puce
 * Coach et une puce Club/Admin sont le même objet.
 */
export function RosterFilterChips({
  filters,
  activeId,
  onChange,
  label,
}: {
  filters: RosterFilter[];
  activeId: string;
  onChange: (id: string) => void;
  /** Libellé discret au-dessus de la rangée (utilisé dans la fiche). */
  label?: string;
}) {
  const { tokens, Text } = useRosterChrome();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.filterBlock}>
      {label ? (
        <Text style={[proType.label, { color: tokens.muted }]}>{label}</Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((filter) => {
          const active = filter.id === activeId;
          return (
            <PressableSpring
              key={filter.id}
              onPress={() => onChange(filter.id)}
              scaleTo={0.97}
              haptic
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={proChip(tokens, active)}
            >
              <Text style={[proType.caption, active ? styles.chipTextOn : styles.chipTextOff]}>
                {filter.label}
              </Text>
            </PressableSpring>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Liste des joueurs — une seule rangée possible, quel que soit le pôle. */
export function RosterList({
  items,
  onSelect,
  emptyTitle,
  emptyBody,
}: {
  items: RosterItem[];
  onSelect: (item: RosterItem) => void;
  emptyTitle: string;
  emptyBody: string;
}) {
  const { tokens, Text } = useRosterChrome();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Icon name="people" size={26} color={tokens.muted} />
        <Text style={[proType.h3, { color: tokens.foreground }]}>{emptyTitle}</Text>
        <Text style={[proType.caption, styles.emptyBody]}>{emptyBody}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.rows, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
      {items.map((item, index) => (
        <PressableSpring
          key={item.id}
          onPress={() => onSelect(item)}
          scaleTo={0.99}
          accessibilityRole="button"
          accessibilityLabel={
            item.meta ? `${item.badge} ${item.name}, ${item.meta}` : `${item.badge} ${item.name}`
          }
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.border },
          ]}
        >
          <View style={styles.rowMain}>
            <View
              style={[styles.rowBadge, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            >
              <Text style={[styles.rowBadgeText, { color: tokens.foreground }]}>{item.badge}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowName, { color: tokens.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.meta ? (
                <Text style={[proType.caption, styles.rowMeta]} numberOfLines={1}>
                  {item.meta}
                </Text>
              ) : null}
            </View>
            {item.tone ? (
              <View
                style={[styles.rowDot, { backgroundColor: item.tone }]}
                accessibilityLabel={item.toneLabel}
              />
            ) : null}
            <Icon name="chevron-forward" size={15} color={proFaint(tokens)} />
          </View>
          {item.detail ? <View style={styles.rowDetail}>{item.detail}</View> : null}
        </PressableSpring>
      ))}
    </View>
  );
}

/** Composition complète : recherche, filtres, liste. */
export function RosterDirectory({
  query,
  onQueryChange,
  searchPlaceholder,
  filters,
  activeFilter,
  onFilterChange,
  items,
  onSelect,
  emptyTitle,
  emptyBody,
  header,
  footer,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  searchPlaceholder: string;
  filters: RosterFilter[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  items: RosterItem[];
  onSelect: (item: RosterItem) => void;
  emptyTitle: string;
  emptyBody: string;
  /** Bloc propre au pôle, affiché au-dessus de la recherche. */
  header?: React.ReactNode;
  /** Bloc propre au pôle, affiché sous la liste (banc, adhésions…). */
  footer?: React.ReactNode;
}) {
  return (
    <View style={stylesDirectory.root}>
      {header}
      <RosterSearchField
        value={query}
        onChangeText={onQueryChange}
        placeholder={searchPlaceholder}
      />
      <RosterFilterChips filters={filters} activeId={activeFilter} onChange={onFilterChange} />
      <RosterList
        items={items}
        onSelect={onSelect}
        emptyTitle={emptyTitle}
        emptyBody={emptyBody}
      />
      {footer}
    </View>
  );
}

/**
 * Fiche joueur — **une seule** pour les deux pôles.
 *
 * Le pôle fournit le contenu (faits chiffrés, sections, actions) ; la surface,
 * l'en-tête, la grille de faits et les boutons sont communs. La fiche s'ouvre en
 * `ModalSheet`, la primitive de modale de l'application : fermeture au fond,
 * au glissement, et mouvement réduit respecté.
 */
export function RosterProfileSheet({
  visible,
  onClose,
  name,
  badge,
  kicker,
  title,
  meta,
  facts,
  children,
  actions,
  footnote,
}: {
  visible: boolean;
  onClose: () => void;
  name: string;
  badge: string;
  kicker?: string;
  title?: string;
  meta?: string;
  facts?: RosterProfileFact[];
  /** Sections propres au pôle (disponibilité, conformité…). */
  children?: React.ReactNode;
  actions?: RosterProfileAction[];
  footnote?: string;
}) {
  const { tokens, Text } = useRosterChrome();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      variant="sheet"
      backgroundColor={tokens.surface}
      borderColor={tokens.border}
      handleColor={proBorderStrong(tokens)}
      accessibilityCloseLabel="Fermer la fiche joueur"
    >
      <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHead}>
          <View style={[styles.sheetBadge, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
            <Text style={[styles.sheetBadgeText, { color: tokens.foreground }]}>{badge}</Text>
          </View>
          <View style={styles.sheetHeadText}>
            {kicker ? (
              <Text style={[proType.label, { color: tokens.accent }]} numberOfLines={1}>
                {kicker}
              </Text>
            ) : null}
            <Text style={[styles.sheetName, { color: tokens.foreground }]} numberOfLines={2}>
              {name}
            </Text>
            {title ? (
              <Text
                style={[proType.body, styles.sheetTitle, { color: tokens.foreground }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : null}
            {meta ? (
              <Text style={[proType.caption, { color: tokens.muted }]} numberOfLines={2}>
                {meta}
              </Text>
            ) : null}
          </View>
        </View>

        {facts && facts.length > 0 ? (
          <View style={[styles.factGrid, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
            {facts.map((fact) => (
              <View key={fact.label} style={styles.factCell}>
                <Text
                  style={[
                    styles.factValue,
                    { color: fact.tone ?? tokens.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {fact.value}
                </Text>
                <Text style={[proType.caption, { color: tokens.muted }]} numberOfLines={1}>
                  {fact.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {children}

        {actions && actions.length > 0 ? (
          <View style={styles.actionColumn}>
            {actions.map((action) => {
              const tone = action.tone ?? 'neutral';
              const background =
                tone === 'accent'
                  ? tokens.accent
                  : tone === 'danger'
                    ? tokens.elevated
                    : tokens.elevated;
              const foreground =
                tone === 'accent'
                  ? tokens.onAccent
                  : tone === 'danger'
                    ? proSemantic.danger
                    : tokens.foreground;
              return (
                <PressableSpring
                  key={action.id}
                  onPress={action.onPress}
                  scaleTo={0.98}
                  haptic
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: background, borderColor: tokens.border },
                  ]}
                >
                  <Icon name={action.icon} size={17} color={foreground} />
                  <Text style={[styles.actionLabel, { color: foreground }]} numberOfLines={1}>
                    {action.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>
        ) : null}

        {footnote ? (
          <Text style={[proType.caption, styles.footnote]}>{footnote}</Text>
        ) : null}
      </ScrollView>
    </ModalSheet>
  );
}

const stylesDirectory = StyleSheet.create({
  root: { gap: proSpace.sm },
});

const createStyles = (tokens: RosterChromeTokens) =>
  StyleSheet.create({
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      minHeight: proForm.fieldHeight,
      paddingHorizontal: proSpace.md,
      borderRadius: proForm.fieldRadius,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
      borderColor: tokens.border,
    },
    searchInput: { flex: 1, ...proType.body, padding: 0 },
    searchClear: {
      width: 28,
      height: 28,
      borderRadius: proRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBlock: { gap: proSpace.xs },
    filterRow: { flexDirection: 'row', alignItems: 'center', gap: proForm.chipGap },
    chipTextOn: { color: tokens.accent, fontWeight: '800' },
    chipTextOff: { color: tokens.muted, fontWeight: '600' },
    rows: {
      borderRadius: proRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      marginTop: proSpace.sm,
    },
    row: { paddingHorizontal: proSpace.md, paddingVertical: proSpace.sm },
    rowMain: { flexDirection: 'row', alignItems: 'center', gap: proSpace.md },
    rowBadge: {
      width: 36,
      height: 36,
      borderRadius: proRadius.pill,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBadgeText: { ...proType.caption, fontWeight: '800' },
    rowBody: { flex: 1, minWidth: 0 },
    rowName: { ...proType.body, fontWeight: '700' },
    rowMeta: { color: tokens.muted },
    rowDot: { width: 9, height: 9, borderRadius: proRadius.pill },
    rowDetail: { marginTop: proSpace.sm },
    empty: {
      alignItems: 'center',
      gap: proSpace.sm,
      padding: proSpace.xl,
      borderRadius: proRadius.lg,
      borderWidth: 1,
      marginTop: proSpace.sm,
    },
    emptyBody: { color: tokens.muted, textAlign: 'center' },
    sheetBody: { padding: proSpace.lg, gap: proSpace.lg, paddingBottom: proSpace.xl },
    sheetHead: { flexDirection: 'row', alignItems: 'center', gap: proSpace.md },
    sheetBadge: {
      width: 52,
      height: 52,
      borderRadius: proRadius.pill,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetBadgeText: { ...proType.h3, fontWeight: '800' },
    sheetHeadText: { flex: 1, minWidth: 0, gap: 2 },
    sheetName: { ...proType.h3, fontWeight: '800' },
    sheetTitle: { fontWeight: '700' },
    factGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: proSpace.md,
      borderRadius: proRadius.lg,
      borderWidth: 1,
      paddingVertical: proSpace.md,
    },
    /** Trois colonnes : six faits tiennent sur deux lignes, sans orphelin. */
    factCell: { width: '33.33%', alignItems: 'center', gap: 2 },
    factValue: { ...proType.body, fontWeight: '800' },
    actionColumn: { gap: proSpace.sm },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: proSpace.sm,
      minHeight: proForm.actionMinHeight,
      paddingHorizontal: proSpace.lg,
      borderRadius: proForm.actionRadius,
      borderWidth: 1,
    },
    actionLabel: { ...proType.nav, fontWeight: '700' },
    footnote: { color: tokens.muted, textAlign: 'center' },
  });
