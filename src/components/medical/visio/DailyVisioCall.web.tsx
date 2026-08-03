import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import DailyIframe, {
  type DailyCall,
  type DailyEventObjectAppMessage,
  type DailyParticipant,
} from '@daily-co/daily-js';
import { ProDayText } from '../../ui/ProDayText';
import { spacing, radius } from '../../../theme/designTokens';
import { MEDICAL_THEME } from '../../../content/medicalExperience';
import { VisioCallControls } from './VisioCallControls';
import { VisioCallChat } from './VisioCallChat';
import type { DailyVisioCallProps, VisioChatMessage } from './visioCallTypes';

type Tile = {
  sessionId: string;
  userName: string;
  local: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
};

function toTiles(call: DailyCall): Tile[] {
  return Object.values(call.participants()).map((p: DailyParticipant) => ({
    sessionId: p.session_id,
    userName: p.user_name || (p.local ? 'Vous' : 'Participant'),
    local: Boolean(p.local),
    videoTrack:
      p.tracks?.video?.state === 'playable'
        ? ((p.tracks.video.persistentTrack ?? p.tracks.video.track) as MediaStreamTrack | null)
        : null,
    audioTrack:
      p.tracks?.audio?.state === 'playable'
        ? ((p.tracks.audio.persistentTrack ?? p.tracks.audio.track) as MediaStreamTrack | null)
        : null,
  }));
}

function VideoTile({
  tile,
  mirror,
  mutedAudio,
  style,
}: {
  tile: Tile;
  mirror?: boolean;
  mutedAudio?: boolean;
  style?: Record<string, string | number | undefined>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const tracks: MediaStreamTrack[] = [];
    if (tile.videoTrack) tracks.push(tile.videoTrack);
    if (!mutedAudio && tile.audioTrack) tracks.push(tile.audioTrack);
    el.srcObject = tracks.length ? new MediaStream(tracks) : null;
  }, [mutedAudio, tile.audioTrack, tile.videoTrack]);

  if (!tile.videoTrack) {
    return React.createElement(
      'div',
      {
        style: {
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: MEDICAL_THEME.primary,
          color: '#fff',
          fontWeight: 800,
          fontSize: 28,
        },
      },
      tile.userName.slice(0, 1).toUpperCase()
    );
  }

  return React.createElement('video', {
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: Boolean(mutedAudio),
    style: {
      ...style,
      objectFit: 'cover',
      transform: mirror ? 'scaleX(-1)' : undefined,
      background: '#0B1220',
    },
  });
}

/** Visio Daily in-app (web) — Call Object + contrôles cam/mic/écran/chat. */
export const DailyVisioCall: React.FC<DailyVisioCallProps> = ({
  roomUrl,
  token,
  userName,
  onLeft,
  onFatalError,
}) => {
  const callRef = useRef<DailyCall | null>(null);
  const [joining, setJoining] = useState(true);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<VisioChatMessage[]>([]);

  const refresh = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    setTiles(toTiles(call));
    const local = call.participants().local;
    if (local) {
      setCamOn(local.tracks?.video?.state !== 'off');
      setMicOn(local.tracks?.audio?.state !== 'off');
      setScreenSharing(local.tracks?.screenVideo?.state === 'playable');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const call = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: true,
    });
    callRef.current = call;

    const bump = () => {
      if (!cancelled) refresh();
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
          (ev as { errorMsg?: string })?.errorMsg || 'Erreur lors de la connexion visio.';
        if (!cancelled) onFatalError?.(msg);
      })
      .on('app-message', (ev: DailyEventObjectAppMessage) => {
        const data = ev?.data as { type?: string; text?: string } | undefined;
        if (data?.type !== 'chat' || typeof data.text !== 'string') return;
        const fromId = (ev as { fromId?: string }).fromId;
        const from =
          (fromId && call.participants()[fromId]?.user_name) || 'Participant';
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

    void call
      .join({ url: roomUrl, token: token || undefined, userName })
      .then(() => {
        if (!cancelled) {
          setJoining(false);
          refresh();
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setJoining(false);
        onFatalError?.(
          e instanceof Error ? e.message : 'Impossible de rejoindre la salle visio.'
        );
      });

    return () => {
      cancelled = true;
      callRef.current = null;
      void call.leave().finally(() => {
        try {
          call.destroy();
        } catch {
          /* ignore */
        }
      });
    };
  }, [onFatalError, onLeft, refresh, roomUrl, token, userName]);

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
        call.stopScreenShare();
        setScreenSharing(false);
      } else {
        call.startScreenShare();
        setScreenSharing(true);
      }
    } catch {
      onFatalError?.('Partage d’écran refusé ou indisponible dans ce navigateur.');
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

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        {main ? (
          <View style={styles.mainTile}>
            <VideoTile
              tile={main}
              mirror={main.local}
              mutedAudio={main.local}
              style={{ width: '100%', height: '100%' }}
            />
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
            <VideoTile
              tile={local}
              mirror
              mutedAudio
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        ) : null}
      </View>

      <VisioCallControls
        camOn={camOn}
        micOn={micOn}
        screenSharing={screenSharing}
        chatOpen={chatOpen}
        screenShareSupported
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
  pip: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 140,
    height: 100,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: MEDICAL_THEME.primaryBorder,
    backgroundColor: '#111827',
  },
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
  hint: { textAlign: 'center', marginTop: spacing.sm },
});

export default DailyVisioCall;
