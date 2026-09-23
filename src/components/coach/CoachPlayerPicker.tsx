import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import {
  COACH_COMPONENT_FALLBACK,
  COACH_PITCH,
  type CoachComponentTokens,
} from '../../features/coach/theme/coachPitchTokens';
import { availabilityTone } from './CoachFutPlayerCard';
import { availabilityLabel, type SquadPlayer } from '../../utils/coachSquadRoster';
import { coachChrome } from '../../features/coach/theme/coachDesignSystem';
import {
  proCard,
  proForm,
  proRadius,
  proSemantic,
  proSpace,
  proType,
} from '../../theme/professionalDesign';

export type PickerFilter = 'all' | 'available';

type Props = {
  visible: boolean;
  /** Poste visé, ex. « Attaquant gauche (LW) ». */
  targetLabel?: string;
  candidates: SquadPlayer[];
  /** Joueur actuellement posé sur ce poste (peut être retiré). */
  currentPlayerId?: string | null;
  /** Joueur déjà aligné ailleurs — la sélection le déplace, sans rien perdre. */
  isPlayerUsed?: (playerId: string) => boolean;
  onSelect: (player: SquadPlayer) => void;
  onClear?: () => void;
  onClose: () => void;
  tokens?: CoachComponentTokens;
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Sélecteur de joueur — recherche + information de disponibilité, rien d'autre.
 *
 * L'écran ne montre ni statistiques ni actions administratives : le numéro, le
 * nom, le poste, la disponibilité. Un joueur déjà aligné sur un autre poste est
 * signalé et sa sélection **déplace** la composition sans perdre les autres
 * choix.
 */
export function CoachPlayerPicker({
  visible,
  targetLabel,
  candidates,
  currentPlayerId,
  isPlayerUsed,
  onSelect,
  onClear,
  onClose,
  tokens = COACH_COMPONENT_FALLBACK,
}: Props) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PickerFilter>('all');

  const rows = useMemo(() => {
    const needle = normalize(query.trim());
    return candidates
      .filter((player) => (filter === 'available' ? player.availability === 'present' : true))
      .filter((player) => {
        if (!needle) return true;
        return (
          normalize(player.name).includes(needle) ||
          normalize(player.pos ?? '').includes(needle) ||
          (player.num != null && String(player.num).includes(needle))
        );
      });
  }, [candidates, filter, query]);

  const isSheet = coachChrome.modalIsSheet(width);

  return (
    <Modal
      visible={visible}
      animationType={isSheet ? 'slide' : 'fade'}
      transparent={isSheet}
      presentationStyle={isSheet ? undefined : 'pageSheet'}
      onRequestClose={onClose}
    >
      <View style={isSheet ? styles.backdrop : styles.panelHost}>
        <View
          style={[
            isSheet ? styles.sheet : styles.panel,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: tokens.foreground }]} numberOfLines={1}>
                Choisir un joueur
              </Text>
              {targetLabel ? (
                <Text style={[styles.subtitle, { color: tokens.muted }]} numberOfLines={1}>
                  {targetLabel}
                </Text>
              ) : null}
            </View>
            <PressableSpring
              onPress={onClose}
              scaleTo={0.94}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={[styles.closeBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            >
              <Icon name="close" size={18} color={tokens.foreground} />
            </PressableSpring>
          </View>

          <View
            style={[
              styles.search,
              { backgroundColor: tokens.elevated, borderColor: tokens.border },
            ]}
          >
            <Icon name="search" size={16} color={tokens.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un joueur, un poste, un numéro"
              placeholderTextColor={tokens.muted}
              style={[styles.searchInput, { color: tokens.foreground }]}
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Rechercher un joueur"
            />
          </View>

          {/* Un seul rang de filtres — « un petit nombre de filtres utiles ». */}
          <View style={styles.filters}>
            {(
              [
                { id: 'all' as PickerFilter, label: `Tous (${candidates.length})` },
                {
                  id: 'available' as PickerFilter,
                  label: `Disponibles (${candidates.filter((p) => p.availability === 'present').length})`,
                },
              ]
            ).map((option) => {
              const active = filter === option.id;
              return (
                <PressableSpring
                  key={option.id}
                  onPress={() => setFilter(option.id)}
                  scaleTo={0.97}
                  haptic
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.chip,
                    { borderColor: active ? tokens.accent : tokens.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? tokens.accent : tokens.muted, fontWeight: active ? '700' : '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {rows.length === 0 ? (
              <Text style={[styles.empty, { color: tokens.muted }]}>
                Aucun joueur ne correspond à cette recherche.
              </Text>
            ) : (
              rows.map((player) => {
                const used = player.id !== currentPlayerId && (isPlayerUsed?.(player.id) ?? false);
                const tone = availabilityTone(player.availability);
                const disabled = player.availability === 'absent';
                return (
                  <PressableSpring
                    key={player.id}
                    onPress={() => onSelect(player)}
                    disabled={disabled}
                    scaleTo={0.98}
                    haptic
                    accessibilityRole="button"
                    accessibilityLabel={player.name}
                    style={[
                      styles.row,
                      { borderColor: tokens.border, opacity: disabled ? 0.45 : 1 },
                      player.id === currentPlayerId && { borderColor: tokens.accent },
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                      <Text style={[styles.avatarText, { color: tokens.foreground }]}>{player.num ?? '—'}</Text>
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowName, { color: tokens.foreground }]} numberOfLines={1}>
                        {player.name}
                      </Text>
                      <Text style={[styles.rowMeta, { color: tokens.muted }]} numberOfLines={1}>
                        {player.pos ?? 'Poste non renseigné'} · {availabilityLabel(player.availability)}
                        {used ? ' · déjà aligné' : ''}
                      </Text>
                    </View>
                    <View style={[styles.dot, { backgroundColor: tone }]} />
                    <Text
                      style={[
                        styles.rowAction,
                        {
                          color:
                            player.id === currentPlayerId
                              ? tokens.muted
                              : tokens.accent,
                        },
                      ]}
                    >
                      {player.id === currentPlayerId ? 'Retirer' : used ? 'Déplacer' : 'Choisir'}
                    </Text>
                  </PressableSpring>
                );
              })
            )}
          </ScrollView>

          {onClear && currentPlayerId ? (
            <PressableSpring
              onPress={onClear}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Vider ce poste"
              style={[styles.clearBtn, { borderColor: tokens.border }]}
            >
              <Text style={[styles.clearText, { color: proSemantic.danger }]}>
                Vider ce poste
              </Text>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COACH_PITCH.scrim,
  },
  panelHost: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: proSpace.xl,
  },
  sheet: {
    borderTopLeftRadius: proRadius.xxl,
    borderTopRightRadius: proRadius.xxl,
    borderWidth: 1,
    paddingHorizontal: proSpace.lg,
    paddingTop: proSpace.lg,
    paddingBottom: proSpace.xxl,
    maxHeight: '86%',
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: proRadius.xl,
    borderWidth: 1,
    padding: proSpace.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.md,
  },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...proType.h2 },
  subtitle: { ...proType.caption },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    marginTop: proSpace.md,
    height: proForm.fieldHeight,
    borderRadius: proForm.fieldRadius,
    borderWidth: 1,
    paddingHorizontal: proSpace.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.sm,
  },
  searchInput: {
    flex: 1,
    ...proType.body,
    padding: 0,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: proForm.chipGap,
    marginTop: proSpace.md,
  },
  chip: {
    minHeight: 36,
    borderRadius: proForm.chipRadius,
    borderWidth: 1,
    paddingHorizontal: proSpace.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { ...proType.caption },
  list: {
    marginTop: proSpace.md,
  },
  listContent: {
    gap: proSpace.sm,
    paddingBottom: proSpace.md,
  },
  empty: {
    ...proType.caption,
    textAlign: 'center',
    paddingVertical: proSpace.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.md,
    minHeight: 56,
    borderRadius: proRadius.md,
    borderWidth: 1,
    paddingHorizontal: proSpace.md,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...proType.caption, fontWeight: '800' },
  rowBody: { flex: 1, minWidth: 0, gap: 1 },
  rowName: { ...proType.body, fontWeight: '600' },
  rowMeta: { ...proType.caption },
  dot: { width: 8, height: 8, borderRadius: proRadius.pill },
  rowAction: { ...proType.caption, fontWeight: '700' },
  clearBtn: {
    marginTop: proSpace.md,
    minHeight: proForm.actionMinHeight,
    borderRadius: proForm.actionRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { ...proType.nav, fontWeight: '700' },
});
