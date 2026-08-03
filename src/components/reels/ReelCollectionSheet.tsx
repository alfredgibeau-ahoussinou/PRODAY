import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { spacing, radius } from '../../theme/designTokens';

type Option<T extends string> = { id: T; label: string };

interface ReelCollectionSheetProps<P extends string, T extends string> {
  visible: boolean;
  onClose: () => void;
  poleOptions: Option<P>[];
  pole: P;
  onPoleChange: (id: P) => void;
  themeOptions: Option<T>[];
  theme: T;
  onThemeChange: (id: T) => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
}

/**
 * « Ta sélection » — une seule surface calme pour choisir le terrain et l'ambiance
 * du fil, plus l'accès aux favoris. Remplace les rangées de pilules en surimpression.
 */
export function ReelCollectionSheet<P extends string, T extends string>({
  visible,
  onClose,
  poleOptions,
  pole,
  onPoleChange,
  themeOptions,
  theme,
  onThemeChange,
  favoritesCount,
  onOpenFavorites,
}: ReelCollectionSheetProps<P, T>) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);

  const renderRow = <V extends string>(
    option: Option<V>,
    active: boolean,
    onPress: (id: V) => void,
  ) => (
    <PressableSpring
      key={option.id}
      style={styles.row}
      scaleTo={0.99}
      onPress={() => {
        prodayHaptics.tabSwitch();
        onPress(option.id);
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <ProDayText
        variant="section"
        style={[styles.rowLabel, { color: active ? '#FFFFFF' : colors.textMuted }]}
      >
        {option.label}
      </ProDayText>
      {active ? <View style={[styles.tick, { backgroundColor: colors.accent }]} /> : null}
    </PressableSpring>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <ProDayText variant="title" style={styles.title}>
              {t('reels.collection.title')}
            </ProDayText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icon name="close" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          {poleOptions.length > 1 ? (
            <View style={styles.section}>
              <ProDayText variant="eyebrow" style={styles.sectionLabel}>
                {t('reels.collection.focus')}
              </ProDayText>
              {poleOptions.map((o) => renderRow(o, o.id === pole, onPoleChange))}
            </View>
          ) : null}

          <View style={styles.section}>
            <ProDayText variant="eyebrow" style={styles.sectionLabel}>
              {t('reels.collection.theme')}
            </ProDayText>
            {themeOptions.map((o) => renderRow(o, o.id === theme, onThemeChange))}
          </View>

          <PressableSpring
            style={styles.favorites}
            scaleTo={0.98}
            haptic
            onPress={() => {
              onClose();
              onOpenFavorites();
            }}
          >
            <Icon name="bookmark" size={18} color={colors.accent} />
            <ProDayText variant="caption" style={styles.favoritesText}>
              {t('reels.favorites', { n: favoritesCount })}
            </ProDayText>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </PressableSpring>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], bottomInset: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
      backgroundColor: '#0B0D10',
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: bottomInset + spacing.xl,
      gap: spacing.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.18)',
      marginBottom: spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: '#FFFFFF' },
    section: { gap: 2 },
    sectionLabel: {
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 11,
    },
    rowLabel: { fontSize: 19 },
    tick: { width: 20, height: 3, borderRadius: 2 },
    favorites: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    favoritesText: {
      flex: 1,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
}
