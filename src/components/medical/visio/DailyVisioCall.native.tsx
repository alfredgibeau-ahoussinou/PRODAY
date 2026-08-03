import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Daily, {
  DailyMediaView,
  type DailyCall,
  type DailyEventObjectAppMessage,
  type DailyParticipant,
} from '@daily-co/react-native-daily-js';
import * as WebBrowser from 'expo-web-browser';
import { ProDayText } from '../../ui/ProDayText';
import { PressableSpring } from '../../motion';
import { spacing, radius } from '../../../theme/designTokens';
import { MEDICAL_THEME } from '../../../content/medicalExperience';
import { VisioCallControls } from './VisioCallControls';
import { VisioCallChat } from './VisioCallChat';
import type { DailyVisioCallProps, VisioChatMessage } from './visioCallTypes';

type DailyMediaTrack = NonNullable<
  NonNullable<DailyParticipant['tracks']['video']>['track']
>;

type ParticipantTile = {
  sessionId: string;
  userName: string;
  local: boolean;
  videoTrack: DailyMediaTrack | null;
  audioTrack: DailyMediaTrack | null;
};

function participantTiles(call: DailyCall): ParticipantTile[] {
  const participants = call.participants();
  return Object.values(participants).map((p) => ({
    sessionId: p.session_id,
    userName: p.user_name || (p.local ? 'Vous' : 'Participant'),
    local: Boolean(p.local),
    videoTrack:
      p.tracks?.video?.state === 'playable' ? (p.tracks.video.track ?? null) : null,
    audioTrack:
      p.tracks?.audio?.state === 'playable' ? (p.tracks.audio.track ?? null) : null,
  }));
}

/**
 * Visio Daily in-app (natif) — Call Object + contrôles cam/mic/écran/chat.
 * Fallback navigateur Prebuilt si le module natif échoue (Expo Go / build sans plugin).
 */
export const DailyVisioCall: React.FC<DailyVisioCallProps> = ({
  roomUrl,
  token,
  userName,
  joinUrl,
  onLeft,
  onFatalError,
}) => {
  const callRef = useRef<DailyCall | null>(null);
  const [joining, setJoining] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [tiles, setTiles] = useState<ParticipantTile[]>([]);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<VisioChatMessage[]>([]);
  const [screenShareSupported, setScreenShareSupported] = useState(Platform.OS === 'android');

  const refreshParticipants = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    setTiles(participantTiles(call));
    const local = call.participants().local;
    if (local) {
      setCamOn(local.tracks?.video?.state !== 'off');
      setMicOn(local.tracks?.audio?.state !== 'off');
      setScreenSharing(local.tracks?.screenVideo?.state === 'playable');
    }
  }, []);

  const openPrebuiltFallback = useCallback(async () => {
    const url = joinUrl || (token ? `${roomUrl}?t=${encodeURIComponent(token)}` : roomUrl);
    try {
      await WebBrowser.openBrowserAsync(url, {
        enableBarCollapsing: true,
        showTitle: true,
        controlsColor: MEDICAL_THEME.primary,
      });
    } catch {
      onFatalError?.('Impossible d’ouvrir la visio.');
    }
  }, [joinUrl, onFatalError, roomUrl, token]);

  useEffect(() => {
    let cancelled = false;
    let call: DailyCall | null = null;

    async function start() {
      try {
        call = Daily.createCallObject({
          audioSource: true,
          videoSource: true,
        });
        callRef.current = call;

        const bump = () => {
          if (!cancelled) refreshParticipants();
        };

        call
          .on('joined-meeting', bump)
          .on('participant-joined', bump)
          .on('participant-updated', bump)
          .on('participant-left', bump)
          .on('track-started', bump)
          .on('track-stopped', bump)
          .on('left-meeting', () => {
            if (!cancelled) onLeft();
          })
          .on('error', (ev) => {
            const msg =
              (ev as { errorMsg?: string })?.errorMsg ||
              'Erreur visio Daily. Réessayez ou ouvrez dans le navigateur.';
            if (!cancelled) {
              setFatal(msg);
              setJoining(false);
            }
          })
          .on('app-message', (ev: DailyEventObjectAppMessage) => {
            const data = ev?.data as { type?: string; text?: string } | undefined;
            if (data?.type !== 'chat' || typeof data.text !== 'string') return;
            const from =
              (ev as { fromId?: string }).fromId && call
                ? call.participants()[(ev as { fromId: string }).fromId]?.user_name ||
                  'Participant'
                : 'Participant';
            setMessages((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                from,
                text: data.text!.slice(0, 500),
                at: Date.now(),
                local: false,
              },
            ]);
          });

        await call.join({
          url: roomUrl,
          token: token || undefined,
          userName,
        });

        if (cancelled) return;
        setScreenShareSupported(Platform.OS === 'android' || Platform.OS === 'ios');
        setJoining(false);
        refreshParticipants();
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error
            ? e.message
            : 'Module visio natif indisponible. Ouverture navigateur…';
        setFatal(msg);
        setJoining(false);
        await openPrebuiltFallback();
      }
    }

    void start();

    return () => {
      cancelled = true;
      const c = callRef.current ?? call;
      callRef.current = null;
      if (c) {
        try {
          c.leave().catch(() => undefined);
        } catch {
          /* ignore */
        }
        try {
          c.destroy();
        } catch {
          /* ignore */
        }
      }
    };
  }, [onLeft, openPrebuiltFallback, refreshParticipants, roomUrl, token, userName]);

  const hangUp = useCallback(async () => {
    const call = callRef.current;
    if (call) {
      try {
        await call.leave();
      } catch {
        /* ignore */
      }
      try {
        call.destroy();
      } catch {
        /* ignore */
      }
      callRef.current = null;
    }
    onLeft();
  }, [onLeft]);

  const toggleCam = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    const next = !camOn;
    await call.setLocalVideo(next);
    setCamOn(next);
  }, [camOn]);

  const toggleMic = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    const next = !micOn;
    await call.setLocalAudio(next);
    setMicOn(next);
  }, [micOn]);

  const toggleScreenShare = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    try {
      if (screenSharing) {
        await call.stopScreenShare();
        setScreenSharing(false);
      } else {
        await call.startScreenShare();
        setScreenSharing(true);
      }
    } catch {
      setScreenShareSupported(false);
      onFatalError?.(
        Platform.OS === 'ios'
          ? 'Partage d’écran iOS nécessite un build natif avec extension Broadcast.'
          : 'Partage d’écran indisponible sur cet appareil.'
      );
    }
  }, [onFatalError, screenSharing]);

  const sendChat = useCallback(
    (text: string) => {
      const call = callRef.current;
      if (!call) return;
      call.sendAppMessage({ type: 'chat', text }, '*');
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-local`,
          from: userName,
          text,
          at: Date.now(),
          local: true,
        },
      ]);
    },
    [userName]
  );

  const remote = useMemo(() => tiles.filter((t) => !t.local), [tiles]);
  const local = useMemo(() => tiles.find((t) => t.local) ?? null, [tiles]);
  const main = remote[0] ?? local;

  if (joining) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={MEDICAL_THEME.primary} size="large" />
        <ProDayText variant="caption" muted style={styles.hint}>
          Connexion à la salle sécurisée…
        </ProDayText>
      </View>
    );
  }

  if (fatal && tiles.length === 0) {
    return (
      <View style={styles.center}>
        <ProDayText variant="section">Visio</ProDayText>
        <ProDayText variant="body" muted style={styles.hint}>
          {fatal}
        </ProDayText>
        <PressableSpring style={styles.fallbackBtn} onPress={openPrebuiltFallback} scaleTo={0.97} haptic>
          <ProDayText variant="caption" inverse style={styles.fallbackLabel}>
            Ouvrir dans le navigateur
          </ProDayText>
        </PressableSpring>
        <PressableSpring onPress={onLeft} scaleTo={0.97}>
          <ProDayText variant="caption" muted>
            Retour
          </ProDayText>
        </PressableSpring>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        {main ? (
          <View style={styles.mainTile}>
            {main.videoTrack ? (
              <DailyMediaView
                videoTrack={main.videoTrack}
                audioTrack={main.local ? null : main.audioTrack}
                mirror={main.local}
                objectFit="cover"
                style={styles.video}
              />
            ) : (
              <View style={styles.avatar}>
                <ProDayText variant="section" style={styles.avatarText}>
                  {main.userName.slice(0, 1).toUpperCase()}
                </ProDayText>
              </View>
            )}
            <ProDayText variant="caption" style={styles.nameTag}>
              {main.userName}
            </ProDayText>
          </View>
        ) : (
          <View style={styles.center}>
            <ProDayText variant="body" muted>
              En attente du correspondant…
            </ProDayText>
          </View>
        )}

        {local && main?.sessionId !== local.sessionId ? (
          <View style={styles.pip}>
            {local.videoTrack ? (
              <DailyMediaView
                videoTrack={local.videoTrack}
                audioTrack={null}
                mirror
                objectFit="cover"
                style={styles.video}
              />
            ) : (
              <View style={[styles.avatar, styles.pipAvatar]}>
                <ProDayText variant="caption" style={styles.avatarText}>
                  Vous
                </ProDayText>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <VisioCallControls
        camOn={camOn}
        micOn={micOn}
        screenSharing={screenSharing}
        chatOpen={chatOpen}
        screenShareSupported={screenShareSupported}
        onToggleCam={() => void toggleCam()}
        onToggleMic={() => void toggleMic()}
        onToggleScreenShare={() => void toggleScreenShare()}
        onToggleChat={() => setChatOpen((v) => !v)}
        onHangUp={() => void hangUp()}
      />

      {chatOpen ? (
        <VisioCallChat
          messages={messages}
          onSend={sendChat}
          onClose={() => setChatOpen(false)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1220' },
  stage: { flex: 1 },
  mainTile: { flex: 1 },
  video: { flex: 1, width: '100%', height: '100%' },
  pip: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 112,
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: MEDICAL_THEME.primaryBorder,
    backgroundColor: '#111827',
  },
  pipAvatar: { flex: 1 },
  avatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MEDICAL_THEME.primary,
  },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 28 },
  nameTag: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  hint: { textAlign: 'center', lineHeight: 20 },
  fallbackBtn: {
    marginTop: spacing.sm,
    backgroundColor: MEDICAL_THEME.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  fallbackLabel: { fontWeight: '800' },
});

export default DailyVisioCall;
