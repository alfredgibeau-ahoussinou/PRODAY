import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion';
import { openExternalUrl } from '../../utils/calComBooking';
import { spacing, radius } from '../../theme/designTokens';

const NativeWebView =
  Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

type CalComBookingEmbedProps = {
  embedUrl: string;
  bookingUrl: string;
  height?: number;
  /** Libellé du bouton fallback / ouverture externe */
  openLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Calendrier Cal.com embarqué (WebView natif / iframe web).
 * Les sportifs réservent sans compte Cal.com ; le praticien voit son agenda public.
 */
export const CalComBookingEmbed: React.FC<CalComBookingEmbedProps> = ({
  embedUrl,
  bookingUrl,
  height = 520,
  openLabel = 'Ouvrir Cal.com',
  style,
}) => {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const frameStyle = useMemo(
    () => [styles.frame, { height }, style],
    [height, style]
  );

  const openExternal = () => {
    void openExternalUrl(bookingUrl).catch(() => undefined);
  };

  if (failed) {
    return (
      <View style={[styles.fallback, { minHeight: Math.min(height, 180) }, style]}>
        <Text style={styles.fallbackTitle}>Calendrier indisponible ici</Text>
        <Text style={styles.fallbackBody}>
          Ouvrez Cal.com pour voir les créneaux et réserver.
        </Text>
        <PressableSpring style={styles.fallbackBtn} onPress={openExternal} scaleTo={0.97} haptic>
          <Text style={styles.fallbackBtnText}>{openLabel}</Text>
        </PressableSpring>
      </View>
    );
  }

  const webIframe =
    Platform.OS === 'web' ? (
      React.createElement('iframe', {
        title: 'Cal.com',
        src: embedUrl,
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 12,
          backgroundColor: '#F0FDFA',
        },
        onLoad: () => setLoading(false),
      })
    ) : null;

  return (
    <View style={frameStyle}>
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator color="#0F766E" />
        </View>
      ) : null}

      {webIframe}

      {Platform.OS !== 'web' && NativeWebView ? (
        <NativeWebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
          onHttpError={() => {
            setLoading(false);
            setFailed(true);
          }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          originWhitelist={['https://*', 'http://*']}
          setSupportMultipleWindows={false}
        />
      ) : null}

      {Platform.OS !== 'web' && !NativeWebView ? (
        <View style={styles.fallback}>
          <Text style={styles.fallbackBody}>WebView indisponible sur cette plateforme.</Text>
          <PressableSpring style={styles.fallbackBtn} onPress={openExternal} scaleTo={0.97}>
            <Text style={styles.fallbackBtnText}>{openLabel}</Text>
          </PressableSpring>
        </View>
      ) : null}

      <PressableSpring style={styles.externalLink} onPress={openExternal} scaleTo={0.98}>
        <Text style={styles.externalLinkText}>{openLabel} ↗</Text>
      </PressableSpring>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F0FDFA',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(240,253,250,0.85)',
  },
  fallback: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#134E4A',
    textAlign: 'center',
  },
  fallbackBody: {
    fontSize: 13,
    color: '#0F766E',
    textAlign: 'center',
    lineHeight: 18,
  },
  fallbackBtn: {
    marginTop: spacing.sm,
    backgroundColor: '#0F766E',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  fallbackBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  externalLink: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#99F6E4',
    backgroundColor: '#CCFBF1',
  },
  externalLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
});
