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
import { resolveVisioJoinSession } from '../../services/visio.service';
import { getCallableErrorMessage } from '../../lib/firebaseFunctions';
import { isDailyMeetingLink } from '../../utils/visioMeetingLink';
import { DailyVisioCall } from '../../components/medical/visio/DailyVisioCall';
import { parseDailyJoinCredentials } from '../../components/medical/visio/parseDailyJoinCredentials';
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
 * Téléconsultation santé — Daily Call Object in-app (cam/mic/écran/chat).
 * Cal Video reste en iframe (web) / navigateur (natif) en secours.
 */
export const VisioSessionScreen: React.FC<VisioSessionScreenProps> = ({
  appointment,
  title = 'Consultation vidéo',
  onBack,
}) => {
  const { profile } = useAuth();
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<'daily' | 'cal' | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const fallbackLink =
    appointment.meeting_link?.trim() ||
    (appointment.cal_booking_uid
      ? `https://app.cal.com/video/${appointment.cal_booking_uid.trim()}`
      : '');
  const isHost = profile?.uid === appointment.physio_uid;
  const displayName = profile?.display_name?.trim() || 'Participant';
  const userEmail = profile?.email?.trim();

  const openExternalJoin = useCallback(async (url: string) => {
    if (Platform.OS === 'web') {
      await openExternalUrl(url).catch(() => undefined);
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url, {
        enableBarCollapsing: true,
        showTitle: true,
        controlsColor: MEDICAL_THEME.primary,
      });
    } catch {
      await openExternalUrl(url);
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
      setErrorMessage(null);
      setCallError(null);

      try {
        const session = await resolveVisioJoinSession({
          appointmentId: appointment.id,
          meetingLink: fallbackLink || `daily://${appointment.id}`,
          visioProvider: appointment.visio_provider,
          userName: displayName,
          userId: profile.uid,
          userEmail,
          isHost,
        });
        if (cancelled) return;

        setJoinUrl(session.joinUrl);
        setProvider(session.provider === 'daily' ? 'daily' : 'cal');
        setRoomUrl(session.roomUrl ?? null);
        setToken(session.token ?? null);

        if (session.provider !== 'daily') {
          // Cal Video : pas de Call Object — iframe web / navigateur natif.
          if (Platform.OS !== 'web') {
            await openExternalJoin(session.joinUrl);
          }
        }

        setLoading(false);
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
    openExternalJoin,
    profile?.uid,
    reloadKey,
    userEmail,
  ]);

  const dailyCredentials = useMemo(() => {
    if (roomUrl && isDailyMeetingLink(roomUrl)) {
      return { roomUrl, token };
    }
    if (joinUrl) return parseDailyJoinCredentials(joinUrl);
    return null;
  }, [joinUrl, roomUrl, token]);

  const useDailyInApp = provider === 'daily' && Boolean(dailyCredentials?.roomUrl);

  const reopen = () => {
    const url = joinUrl ?? fallbackLink;
    if (!url) return;
    void openExternalJoin(url);
  };

  const webCalIframe =
    Platform.OS === 'web' && joinUrl && provider === 'cal' ? (
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
            <PressableSpring
              style={styles.fallbackBtn}
              onPress={() => {
                setFailed(false);
                setErrorMessage(null);
                setReloadKey((k) => k + 1);
              }}
              scaleTo={0.97}
              haptic
            >
              <ProDayText variant="caption" inverse style={styles.fallbackBtnText}>
                Réessayer
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        {!failed && !loading && useDailyInApp && dailyCredentials && profile?.uid ? (
          <DailyVisioCall
            roomUrl={dailyCredentials.roomUrl}
            token={dailyCredentials.token}
            joinUrl={joinUrl ?? undefined}
            userName={displayName}
            userId={profile.uid}
            onLeft={onBack}
            onFatalError={setCallError}
          />
        ) : null}

        {!failed && !loading && !useDailyInApp && Platform.OS !== 'web' && provider === 'cal' ? (
          <View style={styles.fallback}>
            <ProDayText variant="section">Visio Cal Video</ProDayText>
            <ProDayText variant="body" muted style={styles.fallbackBody}>
              La consultation s’ouvre dans le navigateur. Autorisez caméra et micro.
            </ProDayText>
            <PressableSpring style={styles.fallbackBtn} onPress={reopen} scaleTo={0.97} haptic>
              <ProDayText variant="caption" inverse style={styles.fallbackBtnText}>
                Rouvrir la visio
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        {!failed && webCalIframe}

        {callError ? (
          <View style={styles.callErrorBanner}>
            <ProDayText variant="caption" style={styles.callErrorText}>
              {callError}
            </ProDayText>
          </View>
        ) : null}
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
      zIndex: 2,
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
    callErrorBanner: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      right: spacing.sm,
      backgroundColor: 'rgba(127, 29, 29, 0.92)',
      borderRadius: radius.md,
      padding: spacing.sm,
      zIndex: 5,
    },
    callErrorText: { color: '#FFF', textAlign: 'center' },
  });
}
