import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import type { ReelBookmarkEntry } from '../../utils/reelBookmarks';
import { spacing, radius } from '../../theme/designTokens';

interface ReelFavoritesSheetProps {
  visible: boolean;
  entries: ReelBookmarkEntry[];
  onClose: () => void;
  onResume: (bookmarkKey: string) => void;
  onRemove: (bookmarkKey: string) => void;
}

export const ReelFavoritesSheet: React.FC<ReelFavoritesSheetProps> = ({
  visible,
  entries,
  onClose,
  onResume,
  onRemove,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <ProDayText variant="section">Mes favoris</ProDayText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="close" size={22} color="#111" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {entries.length === 0 ? (
            <ProDayText variant="body" muted style={styles.empty}>
              Aucun reel en favori. Appuyez sur l’icône signet pendant la lecture.
            </ProDayText>
          ) : (
            entries.map((entry) => (
              <View key={entry.bookmarkKey} style={styles.row}>
                <PressableSpring
                  style={styles.rowMain}
                  onPress={() => {
                    onResume(entry.bookmarkKey);
                    onClose();
                  }}
                  scaleTo={0.98}
                  haptic
                >
                  <ProDayText variant="caption" style={styles.rowTitle}>
                    @{entry.authorName}
                  </ProDayText>
                  <ProDayText variant="caption" muted numberOfLines={2}>
                    {entry.caption || entry.bookmarkKey}
                  </ProDayText>
                  <ProDayText variant="caption" accent style={styles.resume}>
                    Reprendre ici
                  </ProDayText>
                </PressableSpring>
                <Pressable onPress={() => onRemove(entry.bookmarkKey)} hitSlop={8}>
                  <Icon name="close" size={18} color="#888" />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { textAlign: 'center', lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '800' },
  resume: { fontWeight: '700', marginTop: 4 },
});
