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
import { useTranslation } from '../../context/LocaleContext';
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
}) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <ProDayText variant="title" style={styles.headerTitle}>
              {t('reels.favorites.title')}
            </ProDayText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icon name="close" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {entries.length === 0 ? (
              <ProDayText variant="body" style={styles.empty}>
                {t('reels.favorites.empty')}
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
                    <ProDayText variant="caption" style={styles.rowCaption} numberOfLines={2}>
                      {entry.caption || entry.bookmarkKey}
                    </ProDayText>
                    <ProDayText variant="caption" accent style={styles.resume}>
                      {t('reels.favorites.resume')}
                    </ProDayText>
                  </PressableSpring>
                  <Pressable onPress={() => onRemove(entry.bookmarkKey)} hitSlop={8}>
                    <Icon name="close" size={18} color="rgba(255,255,255,0.45)" />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: '#0B0D10',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#FFFFFF' },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { textAlign: 'center', lineHeight: 22, color: 'rgba(255,255,255,0.6)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '800', color: '#FFFFFF' },
  rowCaption: { color: 'rgba(255,255,255,0.55)' },
  resume: { fontWeight: '700', marginTop: 4 },
});
