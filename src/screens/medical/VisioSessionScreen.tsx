import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import { spacing, radius } from '../../theme/designTokens';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { openExternalUrl } from '../../utils/calComBooking';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { resolveVisioJoinUrl } from '../../services/visio.service';
import { getCallableErrorMessage } from '../../lib/firebaseFunctions';
import type { MedicalAppointment } from '../../models/MedicalAppointment';

const NativeWebView =
  Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

type VisioSessionScreenProps = {
  appointment: Pick<
    MedicalAppointment,
    'id' | 'meeting_link' | 'visio_provider' | 'physio_uid' | 'cal_booking_uid'
  >;
  title?: string;
  onBack: () => void;
};

/** Consultation vidéo embarquée (Cal Video natif, Daily secours) — pôle Santé. */
export const VisioSessionScreen: React.FC<VisioSessionScreenProps> = ({
  appointment,
  title = 'Consultation vidéo',
  onBack,
}) => {
  const { profile } = useAuth();
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  const meetingLink =
    appointment.meeting_link?.trim() ||
    (appointment.cal_booking_uid
      ? `https://app.cal.com/video/${appointment.cal_booking_uid.trim()}`
      : '');
  const isHost = profile?.uid === appointment.physio_uid;
  const displayName = profile?.display_name?.trim() || 'Participant';
  const userEmail = profile?.email?.trim();

  useEffect(() => {
    let cancelled = false;

    async function loadJoinUrl() {
      if (!meetingLink || !profile?.uid) {
        setFailed(true);
        setErrorMessage('Lien de visio manquant pour ce rendez-vous.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setFailed(false);
      setErrorMessage(null);

      try {
        const url = await resolveVisioJoinUrl({
          appointmentId: appointment.id,
          meetingLink,
          visioProvider: appointment.visio_provider,
          userName: displayName,
          userId: profile.uid,
          userEmail,
          isHost,
        });
        if (!cancelled) {
          setJoinUrl(url);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setFailed(true);
          setErrorMessage(getCallableErrorMessage(e));
          setLoading(false);
        }
      }
    }

    void loadJoinUrl();
    return () => {
      cancelled = true;
    };
  }, [
    appointment.id,
    appointment.visio_provider,
    displayName,
    isHost,
    meetingLink,
    profile?.uid,
  ]);

  const openExternal = () => {
    void openExternalUrl(joinUrl ?? meetingLink).catch(() => undefined);
  };

  const webIframe =
    Platform.OS === 'web' && joinUrl ? (
      React.createElement('iframe', {
        title: 'Consultation vidéo',
        src: joinUrl,
        allow: 'camera; microphone; fullscreen; display-capture; autoplay',
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 12,
          backgroundColor: MEDICAL_THEME.primaryBg,
        },
        onLoad: () => setLoading(false),
      })
    ) : null;

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title={title} subtitle="Téléconsultation sécurisée" onBack={onBack} />

      <View style={styles.frame}>
        {loading && !failed ? (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator color={MEDICAL_THEME.primary} size="large" />
            <ProDayText variant="caption" muted style={styles.loaderText}>
              Connexion à la visio…
            </ProDayText>
          </View>
        ) : null}

        {failed ? (
          <View style={styles.fallback}>
            <ProDayText variant="section">Visio indisponible</ProDayText>
            <ProDayText variant="body" muted style={styles.fallbackBody}>
              {errorMessage ??
                'La salle n’a pas pu être créée. Réessayez, ou ouvrez le lien dans le navigateur.'}
            </ProDayText>
            <PressableSpring style={styles.fallbackBtn} onPress={openExternal} scaleTo={0.97} haptic>
              <ProDayText variant="caption" inverse style={styles.fallbackBtnText}>
                Ouvrir la visio
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        {!failed && webIframe}

        {!failed && Platform.OS !== 'web' && NativeWebView && joinUrl ? (
          <NativeWebView
            source={{ uri: joinUrl }}
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
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            mediaCapturePermissionGrantType="grant"
            originWhitelist={['https://*']}
            setSupportMultipleWindows={false}
          />
        ) : null}

        {!failed && Platform.OS !== 'web' && !NativeWebView ? (
          <View style={styles.fallback}>
            <ProDayText variant="body" muted>
              WebView indisponible sur cette plateforme.
            </ProDayText>
            <PressableSpring style={styles.fallbackBtn} onPress={openExternal} scaleTo={0.97}>
              <ProDayText variant="caption" inverse style={styles.fallbackBtnText}>
                Ouvrir la visio
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}
      </View>

      {!failed && joinUrl ? (
        <PressableSpring style={styles.externalLink} onPress={openExternal} scaleTo={0.98}>
          <ProDayText variant="caption" accent style={styles.externalLinkText}>
            Ouvrir dans le navigateur ↗
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
};

function createStyles(c: import('../../theme/universeTheme').AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    frame: {
      flex: 1,
      margin: spacing.lg,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: MEDICAL_THEME.primaryBorder,
      backgroundColor: MEDICAL_THEME.primaryBg,
    },
    webview: {
      flex: 1,
      backgroundColor: MEDICAL_THEME.primaryBg,
    },
    loader: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      backgroundColor: 'rgba(240,253,250,0.9)',
      gap: spacing.sm,
    },
    loaderText: { marginTop: spacing.xs },
    fallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.sm,
    },
    fallbackBody: { textAlign: 'center', lineHeight: 20 },
    fallbackBtn: {
      marginTop: spacing.sm,
      backgroundColor: MEDICAL_THEME.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
    },
    fallbackBtnText: { fontWeight: '800' },
    externalLink: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    externalLinkText: { fontWeight: '700' },
  });
}
