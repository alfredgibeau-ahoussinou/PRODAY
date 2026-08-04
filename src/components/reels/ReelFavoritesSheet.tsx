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
import { reelsTheme } from './reelsTheme';

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
              <Icon name="close" size={22} color={reelsTheme.color.textDim} />
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
                    <ProDayText variant="caption" style={styles.resume}>
                      {t('reels.favorites.resume').toUpperCase()}
                    </ProDayText>
                  </PressableSpring>
                  <Pressable onPress={() => onRemove(entry.bookmarkKey)} hitSlop={8}>
                    <Icon name="close" size={18} color={reelsTheme.color.textFaint} />
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
    backgroundColor: reelsTheme.color.backdrop,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: reelsTheme.color.surface,
    borderTopLeftRadius: reelsTheme.radius.lg,
    borderTopRightRadius: reelsTheme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reelsTheme.color.hairline,
    padding: reelsTheme.space.lg,
    gap: reelsTheme.space.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: reelsTheme.color.hairlineStrong,
    marginBottom: reelsTheme.space.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: reelsTheme.color.text },
  list: { gap: reelsTheme.space.sm, paddingBottom: reelsTheme.space.lg },
  empty: { textAlign: 'center', lineHeight: 22, color: reelsTheme.color.textDim },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: reelsTheme.space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reelsTheme.color.hairline,
    borderRadius: reelsTheme.radius.md,
    padding: reelsTheme.space.md,
    backgroundColor: reelsTheme.color.surfaceRaised,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '800', color: reelsTheme.color.text },
  rowCaption: { color: reelsTheme.color.textDim },
  resume: {
    fontFamily: reelsTheme.type.kicker.fontFamily,
    color: reelsTheme.color.amber,
    letterSpacing: 1.2,
    marginTop: 6,
  },
});
