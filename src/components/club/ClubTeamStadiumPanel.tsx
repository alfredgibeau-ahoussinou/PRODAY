import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Image,
} from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Polygon,
  Rect,
  Stop,
  Circle,
  G,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import type { Membership } from '../../models/Membership';
import type { Team } from '../../models/Team';
import type { User } from '../../models/User';
import {
  buildClubTeamStadiumMap,
  type ClubStadiumMarker,
  type ClubStadiumPlayer,
  type StadiumLineId,
} from '../../utils/clubTeamStadium';
import { formatTeamRowLabel, buildClubTeamRows } from '../../utils/clubStructureView';
import { STADIUM_SOUNDTRACK } from '../../content/stadiumAssets';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type Props = {
  teams: Team[];
  memberships: Membership[];
  members: User[];
  coachNamesByUid?: Map<string, string>;
  initialTeamId?: string | null;
  onTeamChange?: (teamId: string) => void;
};

type ViewMode = 'team' | 'player';

const LINE_LABEL: Record<StadiumLineId, string> = {
  att: 'Attaque',
  mid: 'Milieu',
  def: 'Défense',
  gk: 'Gardien',
};

/** Silhouettes tribunes — « gens sur la bande-son ». */
function CrowdSilhouettes({
  width,
  baseY,
  count,
  pulse,
}: {
  width: number;
  baseY: number;
  count: number;
  pulse: SharedValue<number>;
}) {
  const Crowds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const x = (width * 0.12) + ((width * 0.76) * i) / Math.max(1, count - 1);
      const h = 6 + ((i * 7) % 10);
      return { x, h, phase: (i % 5) / 5 };
    });
  }, [width, count]);

  return (
    <>
      {Crowds.map((c, i) => (
        <CrowdDot key={i} x={c.x} baseY={baseY} h={c.h} phase={c.phase} pulse={pulse} />
      ))}
    </>
  );
}

function CrowdDot({
  x,
  baseY,
  h,
  phase,
  pulse,
}: {
  x: number;
  baseY: number;
  h: number;
  phase: number;
  pulse: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const t = (pulse.value + phase) % 1;
    const lift = interpolate(t, [0, 0.5, 1], [0, -4, 0]);
    const op = interpolate(t, [0, 0.5, 1], [0.35, 0.85, 0.35]);
    return {
      opacity: op,
      transform: [{ translateY: lift }],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - 3,
          top: baseY - h,
          width: 6,
          height: h,
          borderRadius: 3,
          backgroundColor: 'rgba(245,245,240,0.55)',
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function StadiumPitch3D({
  width,
  height,
  markers,
  bench,
  accent,
  focusUid,
  onSelectPlayer,
  musicOn,
}: {
  width: number;
  height: number;
  markers: ClubStadiumMarker[];
  bench: ClubStadiumPlayer[];
  accent: string;
  focusUid: string | null;
  onSelectPlayer: (uid: string) => void;
  musicOn: boolean;
}) {
  const farY = height * 0.2;
  const nearY = height - 8;
  const midY = height * 0.5;
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: musicOn ? 900 : 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      false,
    );
  }, [musicOn, pulse]);

  const floodStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.12, 0.38]),
  }));

  const markerLayout = (m: ClubStadiumMarker) => {
    const t = m.depth;
    const inset = 0.2 + (0 - 0.2) * (t * 0.85);
    const leftRatio = inset + m.x * (1 - 2 * inset);
    const top = farY + (nearY - farY) * t;
    const scale = 0.68 + t * 0.48;
    return { left: leftRatio * width, top, scale };
  };

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sky3d" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#060B14" stopOpacity="1" />
            <Stop offset="1" stopColor="#0B1A12" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="grass3d" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3CAF6A" stopOpacity="0.95" />
            <Stop offset="0.4" stopColor="#1F7A45" stopOpacity="1" />
            <Stop offset="1" stopColor="#0A3A22" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="depth3d" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <Stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </LinearGradient>
          <LinearGradient id="stand3d" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#151C28" stopOpacity="1" />
            <Stop offset="1" stopColor="#070B10" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={width} height={height} fill="url(#sky3d)" />

        {/* Tribunes arrière (perspective) */}
        <Polygon
          points={`0,0 ${width},0 ${width * 0.88},${farY - 4} ${width * 0.12},${farY - 4}`}
          fill="url(#stand3d)"
        />
        <Polygon
          points={`${width * 0.08},${farY - 2} ${width * 0.92},${farY - 2} ${width * 0.84},${farY + 14} ${width * 0.16},${farY + 14}`}
          fill="rgba(255,255,255,0.04)"
        />

        {/* Projecteurs */}
        <G opacity={0.45}>
          <Polygon
            points={`${width * 0.18},0 ${width * 0.28},0 ${width * 0.42},${farY + 20} ${width * 0.32},${farY + 20}`}
            fill="rgba(255,250,220,0.12)"
          />
          <Polygon
            points={`${width * 0.72},0 ${width * 0.82},0 ${width * 0.68},${farY + 20} ${width * 0.58},${farY + 20}`}
            fill="rgba(255,250,220,0.12)"
          />
        </G>

        {/* Pelouse 3D */}
        <Polygon
          points={`0,${nearY} ${width},${nearY} ${width * 0.86},${farY} ${width * 0.14},${farY}`}
          fill="url(#grass3d)"
        />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const t0 = i / 7;
          const t1 = (i + 1) / 7;
          const y0 = farY + (nearY - farY) * t0;
          const y1 = farY + (nearY - farY) * t1;
          const in0 = 0.14 + (0 - 0.14) * t0 * 0.25;
          const in1 = 0.14 + (0 - 0.14) * t1 * 0.25;
          return (
            <Polygon
              key={i}
              points={`${width * in0},${y0} ${width * (1 - in0)},${y0} ${width * (1 - in1)},${y1} ${width * in1},${y1}`}
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'}
            />
          );
        })}
        <Polygon
          points={`0,${nearY} ${width},${nearY} ${width * 0.86},${farY} ${width * 0.14},${farY}`}
          fill="url(#depth3d)"
        />

        <Line
          x1={width / 2}
          y1={farY + 2}
          x2={width / 2}
          y2={nearY - 2}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1.5}
        />
        <Ellipse
          cx={width / 2}
          cy={midY}
          rx={Math.min(52, width * 0.14)}
          ry={Math.min(20, height * 0.07)}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.4}
          fill="none"
        />
        <Circle cx={width / 2} cy={midY} r={2.6} fill="rgba(255,255,255,0.55)" />
        <Rect
          x={width * 0.34}
          y={farY + 6}
          width={width * 0.32}
          height={height * 0.09}
          rx={2}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.1}
          fill="none"
        />
        <Rect
          x={width * 0.26}
          y={nearY - height * 0.15}
          width={width * 0.48}
          height={height * 0.13}
          rx={2}
          stroke="rgba(255,255,255,0.32)"
          strokeWidth={1.2}
          fill="none"
        />

        {/* Banc de touche (gauche) */}
        <Rect
          x={4}
          y={midY - 8}
          width={width * 0.08}
          height={height * 0.22}
          rx={4}
          fill="rgba(10,14,20,0.75)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
        />
      </Svg>

      {/* Projecteur animé */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: width * 0.2,
            top: 0,
            width: width * 0.6,
            height: farY + 40,
            backgroundColor: 'rgba(255,248,220,0.2)',
          },
          floodStyle,
        ]}
      />

      <CrowdSilhouettes width={width} baseY={farY - 6} count={18} pulse={pulse} />

      {/* Banc — joueurs surplus */}
      {bench.slice(0, 6).map((p, i) => (
        <Pressable
          key={`bench-${p.uid}`}
          onPress={() => onSelectPlayer(p.uid)}
          style={[
            styles.benchSeat,
            {
              left: 8,
              top: midY + i * 18,
              borderColor: focusUid === p.uid ? accent : 'rgba(255,255,255,0.25)',
            },
          ]}
        >
          <Text style={styles.benchSeatText} numberOfLines={1}>
            {p.jerseyNumber ?? p.shortName.slice(0, 2)}
          </Text>
        </Pressable>
      ))}

      {markers.map((m) => {
        const { left, top, scale } = markerLayout(m);
        const focused = focusUid === m.uid;
        const size = (focused ? 56 : 44) * scale;
        return (
          <Pressable
            key={m.uid}
            onPress={() => onSelectPlayer(m.uid)}
            style={[
              styles.marker,
              {
                left: left - size / 2,
                top: top - size * 0.8,
                width: size,
                zIndex: focused ? 8 : 2,
                transform: [{ scale: focused ? scale * 1.08 : scale }],
              },
            ]}
          >
            {focused ? (
              <View style={[styles.spotlight, { borderColor: accent }]} />
            ) : null}
            {m.photoUrl ? (
              <Image
                source={{ uri: m.photoUrl }}
                style={[
                  styles.markerPhoto,
                  focused && { width: 44, height: 44, borderRadius: 22, borderColor: accent },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.markerAvatar,
                  { backgroundColor: accent },
                  focused && { width: 44, height: 44, borderRadius: 22 },
                ]}
              >
                <Text style={styles.markerInitial}>
                  {(m.jerseyNumber != null
                    ? String(m.jerseyNumber)
                    : m.shortName.slice(0, 1)
                  ).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[styles.markerName, focused && styles.markerNameFocus]} numberOfLines={1}>
              {m.shortName}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Stade 3D immersif — équipe / joueur par joueur + bande-son + foule.
 */
export function ClubTeamStadiumPanel({
  teams,
  memberships,
  members,
  coachNamesByUid,
  initialTeamId,
  onTeamChange,
}: Props) {
  const { colors } = useAppTheme();
  const { width: winW } = useWindowDimensions();
  const stylesThemed = useMemo(() => createStyles(colors), [colors]);

  const player = useAudioPlayer(STADIUM_SOUNDTRACK);
  const audioStatus = useAudioPlayerStatus(player);
  const musicOn = Boolean(audioStatus.playing);

  const teamRows = useMemo(
    () => buildClubTeamRows(teams, memberships, coachNamesByUid ?? new Map()),
    [teams, memberships, coachNamesByUid],
  );

  const [teamId, setTeamId] = useState<string | null>(
    initialTeamId ?? teamRows[0]?.teamId ?? null,
  );
  const [mode, setMode] = useState<ViewMode>('team');
  const [focusUid, setFocusUid] = useState<string | null>(null);

  useEffect(() => {
    if (initialTeamId) setTeamId(initialTeamId);
  }, [initialTeamId]);

  useEffect(() => {
    if (!teamId && teamRows[0]) setTeamId(teamRows[0].teamId);
    if (teamId && !teamRows.some((r) => r.teamId === teamId) && teamRows[0]) {
      setTeamId(teamRows[0].teamId);
    }
  }, [teamId, teamRows]);

  const membersByUid = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of members) map.set(u.uid, u);
    return map;
  }, [members]);

  const stadium = useMemo(
    () =>
      teamId ? buildClubTeamStadiumMap(teamId, memberships, membersByUid) : null,
    [teamId, memberships, membersByUid],
  );

  const playList = useMemo(() => {
    if (!stadium) return [] as Array<ClubStadiumMarker | ClubStadiumPlayer>;
    return [...stadium.onPitch, ...stadium.bench];
  }, [stadium]);

  useEffect(() => {
    if (playList.length === 0) {
      setFocusUid(null);
      return;
    }
    if (!focusUid || !playList.some((p) => p.uid === focusUid)) {
      setFocusUid(playList[0]!.uid);
    }
  }, [playList, focusUid]);

  const focusIndex = playList.findIndex((p) => p.uid === focusUid);
  const focused = focusIndex >= 0 ? playList[focusIndex] : null;

  const pitchW = Math.min(winW - spacing.md * 2, 440);
  const pitchH = Math.round(pitchW * 1.22);
  const selectedRow = teamRows.find((r) => r.teamId === teamId);

  const selectTeam = (id: string) => {
    setTeamId(id);
    onTeamChange?.(id);
    setFocusUid(null);
  };

  const toggleMusic = async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
      if (audioStatus.playing) {
        player.pause();
      } else {
        player.loop = true;
        player.volume = 0.55;
        player.play();
      }
    } catch {
      try {
        player.pause();
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        /* ignore */
      }
    };
  }, [player]);

  const goPlayer = (delta: number) => {
    if (playList.length === 0) return;
    setMode('player');
    const next =
      focusIndex < 0 ? 0 : (focusIndex + delta + playList.length) % playList.length;
    setFocusUid(playList[next]!.uid);
  };

  if (teamRows.length === 0) {
    return (
      <View style={stylesThemed.empty}>
        <Icon name="football" size={28} color={colors.textMuted} />
        <ProDayText variant="section">Aucune équipe</ProDayText>
        <ProDayText variant="caption" muted>
          Crée une catégorie pour jouer le stade 3D.
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={stylesThemed.root}>
      <View style={stylesThemed.head}>
        <ProDayText variant="caption" muted style={stylesThemed.kicker}>
          Stade 3D · live
        </ProDayText>
        <ProDayText variant="section">
          {selectedRow ? formatTeamRowLabel(selectedRow) : 'Équipe'}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {stadium
            ? `${stadium.onPitch.length} terrain · ${stadium.bench.length} banc · mode ${mode === 'team' ? 'équipe' : 'joueur'}`
            : 'Choisis une équipe'}
        </ProDayText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stylesThemed.teamChips}
      >
        {teamRows.map((row) => {
          const on = row.teamId === teamId;
          return (
            <Pressable
              key={row.teamId}
              onPress={() => selectTeam(row.teamId)}
              style={[stylesThemed.chip, on && stylesThemed.chipOn]}
            >
              <Text style={[stylesThemed.chipText, on && stylesThemed.chipTextOn]} numberOfLines={1}>
                {row.category || row.name}
              </Text>
              <Text style={[stylesThemed.chipMeta, on && stylesThemed.chipTextOn]}>
                {row.licensedCount}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={stylesThemed.modeRow}>
        <Pressable
          onPress={() => setMode('team')}
          style={[stylesThemed.modeBtn, mode === 'team' && stylesThemed.modeBtnOn]}
        >
          <Text style={[stylesThemed.modeText, mode === 'team' && stylesThemed.modeTextOn]}>
            Équipe
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setMode('player');
            if (!focusUid && playList[0]) setFocusUid(playList[0].uid);
          }}
          style={[stylesThemed.modeBtn, mode === 'player' && stylesThemed.modeBtnOn]}
        >
          <Text style={[stylesThemed.modeText, mode === 'player' && stylesThemed.modeTextOn]}>
            Joueur par joueur
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void toggleMusic()}
          style={[stylesThemed.modeBtn, musicOn && stylesThemed.modeBtnOn]}
          accessibilityLabel={musicOn ? 'Couper la bande-son' : 'Lancer la bande-son'}
        >
          <Icon
            name={musicOn ? 'volume-high' : 'volume-mute'}
            size={14}
            color={musicOn ? colors.brandInverse : colors.textMuted}
          />
          <Text style={[stylesThemed.modeText, musicOn && stylesThemed.modeTextOn]}>
            Bande-son
          </Text>
        </Pressable>
      </View>

      <View style={stylesThemed.pitchWrap}>
        {stadium && stadium.onPitch.length === 0 && stadium.bench.length === 0 ? (
          <View style={[stylesThemed.pitchEmpty, { width: pitchW, height: pitchH * 0.45 }]}>
            <ProDayText variant="body" muted>
              Aucun licencié actif sur cette équipe.
            </ProDayText>
          </View>
        ) : stadium ? (
          <StadiumPitch3D
            width={pitchW}
            height={pitchH}
            markers={stadium.onPitch}
            bench={stadium.bench}
            accent={colors.accent}
            focusUid={mode === 'player' ? focusUid : null}
            onSelectPlayer={(uid) => {
              setMode('player');
              setFocusUid(uid);
            }}
            musicOn={musicOn}
          />
        ) : null}
      </View>

      {mode === 'player' && focused ? (
        <View style={stylesThemed.playerCard}>
          <View style={stylesThemed.playerCardMain}>
            <Text style={stylesThemed.playerCardName}>{focused.displayName}</Text>
            <Text style={stylesThemed.playerCardMeta}>
              {focused.positionLabel}
              {focused.jerseyNumber != null ? ` · #${focused.jerseyNumber}` : ''}
              {focusIndex >= 0 ? ` · ${focusIndex + 1}/${playList.length}` : ''}
            </Text>
          </View>
          <View style={stylesThemed.playerControls}>
            <Pressable onPress={() => goPlayer(-1)} style={stylesThemed.ctrlBtn}>
              <Icon name="arrow-back" size={18} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => goPlayer(1)} style={stylesThemed.ctrlBtn}>
              <Icon name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {stadium && mode === 'team' ? (
        <View style={stylesThemed.legend}>
          {(['att', 'mid', 'def', 'gk'] as StadiumLineId[]).map((line) => (
            <View key={line} style={stylesThemed.legendItem}>
              <Text style={stylesThemed.legendLabel}>{LINE_LABEL[line]}</Text>
              <Text style={stylesThemed.legendCount}>{stadium.byLine[line].length}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {musicOn ? (
        <ProDayText variant="caption" muted style={stylesThemed.musicHint}>
          Bande-son live · la foule des tribunes pulse avec l’ambiance.
        </ProDayText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  spotlight: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    top: -6,
    backgroundColor: 'rgba(0,108,252,0.18)',
  },
  markerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerInitial: { color: '#fff', fontWeight: '800', fontSize: 12 },
  markerName: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: 72,
    textAlign: 'center',
  },
  markerNameFocus: { fontSize: 11, fontWeight: '800' },
  benchSeat: {
    position: 'absolute',
    width: 22,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(20,28,36,0.9)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  benchSeatText: { fontSize: 8, fontWeight: '800', color: '#fff' },
});

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { gap: spacing.sm, marginBottom: spacing.md },
    head: { gap: 2, paddingHorizontal: 2 },
    kicker: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '800',
      fontSize: 10,
    },
    teamChips: { gap: 8, paddingVertical: 4, paddingRight: spacing.md },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      maxWidth: 140,
    },
    chipOn: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { fontSize: 13, fontWeight: '700', color: c.text, flexShrink: 1 },
    chipTextOn: { color: c.brandInverse },
    chipMeta: { fontSize: 11, fontWeight: '700', color: c.textMuted },
    modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    modeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    modeBtnOn: { backgroundColor: c.accent, borderColor: c.accent },
    modeText: { fontSize: 12, fontWeight: '700', color: c.textMuted },
    modeTextOn: { color: c.brandInverse },
    pitchWrap: {
      alignItems: 'center',
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: '#060B14',
    },
    pitchEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    playerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    playerCardMain: { flex: 1, minWidth: 0, gap: 2 },
    playerCardName: { fontSize: 16, fontWeight: '800', color: c.text },
    playerCardMeta: { fontSize: 12, fontWeight: '600', color: c.textMuted },
    playerControls: { flexDirection: 'row', gap: 8 },
    ctrlBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    legend: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    legendItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    legendLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted },
    legendCount: { fontSize: 16, fontWeight: '800', color: c.text, marginTop: 2 },
    musicHint: { textAlign: 'center' },
    empty: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
    },
  });
}
