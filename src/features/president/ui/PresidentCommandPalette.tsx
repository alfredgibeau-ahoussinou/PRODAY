import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { usePresidentTheme } from '../shell/PresidentThemeContext';
import { PresidentText } from './presidentUi';
import {
  presidentRadius,
  presidentShadow,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import type { PresidentNavResolvedItem } from '../navigation/resolvePresidentNavAccess';
import type { PresidentThemeTokens } from '../theme/presidentTokens';

type Props = {
  visible: boolean;
  items: PresidentNavResolvedItem[];
  onClose: () => void;
  onSelect: (id: PresidentNavResolvedItem['id']) => void;
};

/** Palette commande basique (recherche sections). */
export function PresidentCommandPalette({ visible, items, onClose, onSelect }: Props) {
  const { tokens } = usePresidentTheme();
  const [query, setQuery] = useState('');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.hint && i.hint.toLowerCase().includes(q)) ||
        i.id.includes(q),
    );
  }, [items, query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Rechercher">
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation?.()}
          accessibilityRole="button"
          accessibilityLabel="Rechercher">
          <View style={styles.searchRow}>
            <Icon name="search" size={18} color={tokens.accent} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Aller à… (⌘K)"
              placeholderTextColor={tokens.faint}
              style={styles.input}
            />
            <PressableSpring onPress={onClose} scaleTo={0.9} haptic>
              <Icon name="close" size={18} color={tokens.muted} />
            </PressableSpring>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => (
              <PressableSpring
                onPress={() => {
                  onSelect(item.id);
                  setQuery('');
                  onClose();
                }}
                scaleTo={0.98}
                haptic
                style={styles.item}
              >
                <Icon name={item.icon} size={18} color={tokens.champagne} />
                <View style={{ flex: 1 }}>
                  <PresidentText variant="body" style={{ fontWeight: '700' }}>
                    {item.label}
                  </PresidentText>
                  {item.hint ? (
                    <PresidentText variant="caption" muted>
                      {item.hint}
                    </PresidentText>
                  ) : null}
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.faint} />
              </PressableSpring>
            )}
            ListEmptyComponent={
              <View style={{ padding: presidentSpace.lg }}>
                <PresidentText variant="body" muted>
                  Aucune section ne correspond.
                </PresidentText>
              </View>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.overlay,
      justifyContent: 'flex-start',
      paddingTop: 80,
      paddingHorizontal: presidentSpace.lg,
    },
    panel: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: presidentRadius.xl,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      overflow: 'hidden',
      ...presidentShadow.card,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.sm,
      paddingHorizontal: presidentSpace.lg,
      paddingVertical: presidentSpace.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.hairline,
    },
    input: {
      flex: 1,
      color: tokens.foreground,
      fontSize: 16,
      paddingVertical: 8,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.md,
      paddingHorizontal: presidentSpace.lg,
      paddingVertical: presidentSpace.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.hairline,
    },
  });
}
