import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { GeoPoint } from '../../models/User';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { captureCurrentLocation, formatCoordinates, openMapsAt } from '../../utils/geoLocation';
import { spacing, radius } from '../../theme/designTokens';

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
  const { colors } = useAppTheme();
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
      <ProDayText variant="caption" accent style={styles.label}>
        {label}
      </ProDayText>
      <TextInput
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface },
        ]}
        placeholder={t('carpool.location.addressPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={place}
        onChangeText={onPlaceChange}
        editable={!disabled}
      />
      <View style={styles.actions}>
        <PressableSpring
          style={[styles.geoBtn, { borderColor: colors.border, backgroundColor: colors.accentSoft }]}
          onPress={() => void capture()}
          disabled={disabled || loading}
          scaleTo={0.96}
          haptic
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <>
              <Icon name="location" size={16} color={colors.accent} />
              <ProDayText variant="caption" accent style={styles.geoBtnText}>
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
            <ProDayText variant="caption" muted>
              {formatCoordinates(location)} · {t('carpool.location.map')}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginTop: spacing.sm },
  wrapCompact: { marginTop: spacing.xs },
  label: { fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
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
  },
  geoBtnText: { fontWeight: '700' },
  mapLink: { paddingVertical: 4 },
});
