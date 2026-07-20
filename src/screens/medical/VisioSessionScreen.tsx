import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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

type VisioSessionScreenProps = {
  appointment: Pick<
    MedicalAppointment,
    'id' | 'meeting_link' | 'visio_provider' | 'physio_uid' | 'cal_booking_uid'
  >;
  title?: string;
  onBack: () => void;
};

/**
 * Téléconsultation santé.
 * Sur natif, Daily/Cal Video s'ouvrent dans le navigateur in-app (le WebView iOS
 * casse Daily avec about:srcdoc → « meeting does not exist »).
 */
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
  const [opened, setOpened] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  const fallbackLink =
    appointment.meeting_link?.trim() ||
    (appointment.cal_booking_uid
      ? `https://app.cal.com/video/${appointment.cal_booking_uid.trim()}`
      : '');
  const isHost = profile?.uid === appointment.physio_uid;
  const displayName = profile?.display_name?.trim() || 'Participant';
  const userEmail = profile?.email?.trim();

  const openJoinUrl = useCallback(async (url: string) => {
    if (Platform.OS === 'web') return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        enableBarCollapsing: true,
        showTitle: true,
        controlsColor: MEDICAL_THEME.primary,
      });
      setOpened(true);
    } catch {
      await openExternalUrl(url);
      setOpened(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAndJoin() {
      if (!profile?.uid) {
        setFailed(true);
        setErrorMessage('Connexion requise pour rejoindre la visio.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setFailed(false);
      setOpened(false);
      setErrorMessage(null);

      try {
        const url = await resolveVisioJoinUrl({
          appointmentId: appointment.id,
          meetingLink: fallbackLink || `daily://${appointment.id}`,
          visioProvider: appointment.visio_provider,
          userName: displayName,
          userId: profile.uid,
          userEmail,
          isHost,
        });
        if (cancelled) return;

        setJoinUrl(url);
        setLoading(false);

        if (Platform.OS !== 'web') {
          await openJoinUrl(url);
        }
      } catch (e) {
        if (!cancelled) {
          setFailed(true);
          setErrorMessage(getCallableErrorMessage(e));
          setLoading(false);
        }
      }
    }

    void loadAndJoin();
    return () => {
      cancelled = true;
    };
  }, [
    appointment.id,
    appointment.visio_provider,
    displayName,
    fallbackLink,
    isHost,
    openJoinUrl,
    profile?.uid,
    userEmail,
  ]);

  const reopen = () => {
    const url = joinUrl ?? fallbackLink;
    if (!url) return;
    if (Platform.OS === 'web') {
      void openExternalUrl(url).catch(() => undefined);
      return;
    }
    void openJoinUrl(url);
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
          <View style={styles.loader}>
            <ActivityIndicator color={MEDICAL_THEME.primary} size="large" />
            <ProDayText variant="caption" muted style={styles.loaderText}>
              Préparation de la salle…
            </ProDayText>
          </View>
        ) : null}

        {failed ? (
          <View style={styles.fallback}>
            <ProDayText variant="section">Visio indisponible</ProDayText>
            <ProDayText variant="body" muted style={styles.fallbackBody}>
              {errorMessage ??
                'La salle n’a pas pu être créée. Réessayez dans un instant.'}
            </ProDayText>
            <PressableSpring style={styles.fallbackBtn} onPress={reopen} scaleTo={0.97} haptic>
              <ProDayText variant="caption" inverse style={styles.fallbackBtnText}>
                Réessayer
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        {!failed && !loading && Platform.OS !== 'web' ? (
          <View style={styles.fallback}>
            <ProDayText variant="section">
              {opened ? 'Visio ouverte' : 'Prêt à rejoindre'}
            </ProDayText>
            <ProDayText variant="body" muted style={styles.fallbackBody}>
              {opened
                ? 'La consultation s’est ouverte dans le navigateur. Autorisez caméra et micro, puis revenez ici à la fin.'
                : 'Appuyez pour entrer directement dans la salle vidéo.'}
            </ProDayText>
            <PressableSpring style={styles.fallbackBtn} onPress={reopen} scaleTo={0.97} haptic>
              <ProDayText variant="caption" inverse style={styles.fallbackBtnText}>
                {opened ? 'Rouvrir la visio' : 'Rejoindre la visio'}
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        {!failed && webIframe}
      </View>
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
    loader: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
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
  });
}
