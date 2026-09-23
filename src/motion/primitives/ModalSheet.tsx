import React, { useMemo } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { prodayMotion } from '../tokens';

type Variant = 'full' | 'sheet';

export type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: Variant;
  gestureClose?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
  handleColor?: string;
  backdropColor?: string;
  accessibilityCloseLabel?: string;
};

/**
 * Modal / bottom-sheet générique — ouverture directe et robuste sur tous les écrans.
 */
export function ModalSheet({
  visible,
  onClose,
  children,
  variant = 'full',
  gestureClose = true,
  contentStyle,
  backgroundColor = '#0B0F14',
  borderColor = 'rgba(255,255,255,0.12)',
  handleColor = 'rgba(255,255,255,0.35)',
  backdropColor = prodayMotion.backdrop,
  accessibilityCloseLabel = 'Fermer',
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();
  const isSheet = variant === 'sheet';

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          gestureClose && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 60 || g.vy > 0.8) {
            onClose();
          }
        },
      }),
    [gestureClose, onClose],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isSheet ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={accessibilityCloseLabel}
        >
          <View style={[styles.backdrop, { backgroundColor: backdropColor }]} />
        </Pressable>

        <View
          style={[
            isSheet ? styles.sheet : styles.full,
            {
              backgroundColor,
              paddingBottom: isSheet ? Math.max(insets.bottom, 16) : 0,
              borderTopLeftRadius: isSheet ? 20 : 0,
              borderTopRightRadius: isSheet ? 20 : 0,
              borderColor,
            },
            contentStyle,
          ]}
        >
          {gestureClose ? (
            <View
              style={styles.handleRow}
              accessibilityElementsHidden
              {...pan.panHandlers}
            >
              <View style={[styles.handle, { backgroundColor: handleColor }]} />
            </View>
          ) : null}
          <View style={[styles.body, !isSheet && styles.bodyFull]}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  full: { flex: 1, width: '100%' },
  sheet: {
    maxHeight: '92%',
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  body: { flexShrink: 1, width: '100%' },
  bodyFull: { flex: 1 },
});
