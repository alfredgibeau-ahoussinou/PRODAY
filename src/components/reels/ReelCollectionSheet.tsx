import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useTranslation } from '../../context/LocaleContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { reelsTheme } from './reelsTheme';

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
  canPublish?: boolean;
  onPublish?: () => void;
}

/**
 * « Ta sélection » — une seule surface calme, réchauffée, pour choisir le terrain
 * et l'ambiance du fil, plus l'accès aux favoris. Skin Floodlight editorial.
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
  canPublish,
  onPublish,
}: ReelCollectionSheetProps<P, T>) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);

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
        style={[
          styles.rowLabel,
          { color: active ? reelsTheme.color.text : reelsTheme.color.textDim },
        ]}
      >
        {option.label}
      </ProDayText>
      {active ? <View style={styles.tick} /> : null}
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
              <Icon name="close" size={22} color={reelsTheme.color.textDim} />
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
            <Icon name="bookmark" size={18} color={reelsTheme.color.amber} />
            <ProDayText variant="caption" style={styles.favoritesText}>
              {t('reels.favorites', { n: favoritesCount })}
            </ProDayText>
            <Icon name="chevron-forward" size={16} color={reelsTheme.color.textFaint} />
          </PressableSpring>

          {canPublish && onPublish ? (
            <PressableSpring
              style={styles.publish}
              scaleTo={0.98}
              haptic
              onPress={() => {
                onClose();
                onPublish();
              }}
              accessibilityRole="button"
              accessibilityLabel={t('reels.upload.title')}
            >
              <Icon name="videocam" size={18} color={reelsTheme.color.onAmber} />
              <ProDayText variant="caption" style={styles.publishText}>
                {t('reels.upload.title').toUpperCase()}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(bottomInset: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: reelsTheme.color.backdrop,
    },
    sheet: {
      backgroundColor: reelsTheme.color.surface,
      borderTopLeftRadius: reelsTheme.radius.lg,
      borderTopRightRadius: reelsTheme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: reelsTheme.color.hairline,
      paddingHorizontal: reelsTheme.space.lg,
      paddingTop: reelsTheme.space.sm,
      paddingBottom: bottomInset + reelsTheme.space.lg,
      gap: reelsTheme.space.md,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: reelsTheme.color.hairlineStrong,
      marginBottom: reelsTheme.space.xxs,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: reelsTheme.color.text },
    section: { gap: 2 },
    sectionLabel: {
      color: reelsTheme.color.amber,
      letterSpacing: reelsTheme.type.kicker.letterSpacing,
      marginBottom: reelsTheme.space.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 11,
    },
    rowLabel: { fontSize: 19 },
    tick: {
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: reelsTheme.color.amber,
      transform: [{ rotate: '45deg' }],
    },
    favorites: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: reelsTheme.space.sm,
      paddingVertical: reelsTheme.space.md,
      paddingHorizontal: reelsTheme.space.md,
      borderRadius: reelsTheme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: reelsTheme.color.hairline,
      backgroundColor: reelsTheme.color.surfaceRaised,
    },
    favoritesText: {
      flex: 1,
      color: reelsTheme.color.text,
      fontWeight: '700',
    },
    publish: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: reelsTheme.space.sm,
      paddingVertical: 15,
      borderRadius: reelsTheme.radius.md,
      backgroundColor: reelsTheme.color.amber,
    },
    publishText: {
      color: reelsTheme.color.onAmber,
      fontFamily: reelsTheme.type.kicker.fontFamily,
      letterSpacing: 1.4,
    },
  });
}
