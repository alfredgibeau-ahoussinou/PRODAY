import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { GeoPoint } from '../../models/User';
import { useTranslation } from '../../context/LocaleContext';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { captureCurrentLocation, formatCoordinates, openMapsAt } from '../../utils/geoLocation';
import { spacing, radius } from '../../theme/designTokens';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

interface CarpoolLocationCaptureProps {
  label: string;
  place: string;
  location?: GeoPoint;
  onPlaceChange: (value: string) => void;
  onLocationChange: (value: GeoPoint | undefined) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const CarpoolLocationCapture: React.FC<CarpoolLocationCaptureProps> = ({
  label,
  place,
  location,
  onPlaceChange,
  onLocationChange,
  disabled = false,
  compact = false,
}) => {
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const capture = async () => {
    setLoading(true);
    try {
      const coords = await captureCurrentLocation();
      onLocationChange(coords);
      if (!place.trim()) {
        onPlaceChange(t('carpool.location.currentPosition'));
      }
    } catch (e) {
      Alert.alert(
        t('carpool.location.title'),
        e instanceof Error ? e.message : t('carpool.location.failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <ProDayText variant="caption" style={styles.label}>
        {label}
      </ProDayText>
      <TextInput
        style={styles.input}
        placeholder={t('carpool.location.addressPlaceholder')}
        placeholderTextColor={palette.inkDim}
        value={place}
        onChangeText={onPlaceChange}
        editable={!disabled}
      />
      <View style={styles.actions}>
        <PressableSpring
          style={styles.geoBtn}
          onPress={() => void capture()}
          disabled={disabled || loading}
          scaleTo={0.96}
          haptic
        >
          {loading ? (
            <ActivityIndicator color={palette.signal} size="small" />
          ) : (
            <>
              <Icon name="location" size={16} color={palette.signal} />
              <ProDayText variant="caption" style={styles.geoBtnText}>
                {t('carpool.location.useCurrent')}
              </ProDayText>
            </>
          )}
        </PressableSpring>
        {location ? (
          <PressableSpring
            style={styles.mapLink}
            onPress={() => openMapsAt(location, place)}
            disabled={disabled}
            scaleTo={0.96}
            haptic
          >
            <ProDayText variant="caption" style={styles.mapLinkText}>
              {formatCoordinates(location)} · {t('carpool.location.map')}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    wrap: { gap: spacing.xs, marginTop: spacing.sm },
    wrapCompact: { marginTop: spacing.xs },
    label: { fontWeight: '700', color: palette.signal },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      borderColor: palette.fog,
      color: palette.ink,
      backgroundColor: palette.surfaceMuted,
    },
    actions: { gap: spacing.xs },
    geoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      alignSelf: 'flex-start',
      borderColor: palette.fog,
      backgroundColor: palette.signalSoft,
    },
    geoBtnText: { fontWeight: '700', color: palette.signal },
    mapLink: { paddingVertical: 4 },
    mapLinkText: { color: palette.inkMuted },
  });
}
