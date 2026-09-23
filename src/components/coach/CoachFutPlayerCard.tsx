import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import {
  COACH_COMPONENT_FALLBACK,
  COACH_PITCH,
  type CoachComponentTokens,
} from '../../features/coach/theme/coachPitchTokens';
import { proRadius } from '../../theme/professionalDesign';
import type { SquadAvailability, SquadPlayer } from '../../utils/coachSquadRoster';

export type PlayerMarkerSize = 'pitch' | 'bench' | 'detail';

interface CoachFutPlayerCardProps {
  /** Joueur **réel** du club — numéro et poste peuvent être non renseignés. */
  player: SquadPlayer;
  size?: PlayerMarkerSize;
  isSelected?: boolean;
  isTarget?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /**
   * Fin de geste — utilisé par le terrain pour reposer un jeton levé par appui
   * long quand aucun glisser n'a suivi, et quand le terrain reprend la main.
   */
  onPressOut?: () => void;
  /** Masque le libellé (utile quand le terrain est très étroit). */
  hideName?: boolean;
  /** Largeur imposée du libellé, pour que deux voisins ne se chevauchent jamais. */
  labelWidth?: number;
  /** Diamètre imposé du disque — le terrain le calcule pour rester sans chevauchement. */
  avatarSize?: number;
  /** Jetons du socle professionnel injectés par l'écran (repli hors shell). */
  tokens?: CoachComponentTokens;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<PlayerMarkerSize, { avatar: number; name: number; num: number }> = {
  pitch: { avatar: 42, name: 10.5, num: 9.5 },
  bench: { avatar: 36, name: 10, num: 9 },
  detail: { avatar: 56, name: 13, num: 11 },
};

export function playerInitials(name: string): string {
  const parts = name
    .replace(/[.]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

/** Pastille de disponibilité — une seule, discrète, jamais un badge à texte. */
export function availabilityTone(availability: SquadAvailability): string {
  switch (availability) {
    case 'present':
      return COACH_PITCH.available;
    case 'pending':
      return COACH_PITCH.pending;
    case 'absent':
    default:
      return COACH_PITCH.unavailable;
  }
}

/**
 * Jeton de joueur — **une seule forme** pour le terrain, le banc et les fiches.
 *
 * Le rendu FUT (angle doré, bandeau d'OVR, bandeau de statistiques) est
 * remplacé par le registre partagé Coach ↔ Club/Admin : un disque de
 * dimensions constantes (photo ou initiales), le numéro en pastille, le
 * libellé en dessous. Aucune statistique sur le terrain : elles vivent dans la
 * fiche joueur.
 */
export const CoachFutPlayerCard: React.FC<CoachFutPlayerCardProps> = ({
  player,
  size = 'pitch',
  isSelected = false,
  isTarget = false,
  onPress,
  onLongPress,
  onPressOut,
  hideName = false,
  labelWidth,
  avatarSize,
  tokens = COACH_COMPONENT_FALLBACK,
  style,
}) => {
  const base = SIZES[size];
  const dims = avatarSize ? { ...base, avatar: avatarSize } : base;
  const status = availabilityTone(player.availability);

  const ringColor = isSelected
    ? tokens.accent
    : isTarget
      ? tokens.muted
      : tokens.isLight
        ? tokens.border
        : COACH_PITCH.lineStrong;

  return (
    <PressableSpring
      onPress={onPress}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      scaleTo={0.94}
      haptic={false}
      disabled={!onPress && !onLongPress && !onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${player.name}${player.num != null ? ` (n° ${player.num})` : ''}${
        player.pos ? `, ${player.pos}` : ''
      }`}
      style={[styles.root, { width: dims.avatar + 18 }, style]}
    >
      <View
        style={[
          styles.avatarWrap,
          {
            width: dims.avatar,
            height: dims.avatar,
            borderRadius: proRadius.pill,
            borderColor: ringColor,
            borderWidth: isSelected || isTarget ? 2 : 1,
            backgroundColor: isSelected ? tokens.soft : tokens.elevated,
          },
        ]}
      >
        {player.photoUrl ? (
          <Image
            source={{ uri: player.photoUrl }}
            style={[styles.photo, { borderRadius: proRadius.pill }]}
          />
        ) : (
          <Text
          style={[styles.initials, { fontSize: dims.avatar * 0.34, color: tokens.foreground }]}
          numberOfLines={1}
          allowFontScaling={false}
          >
            {playerInitials(player.name)}
          </Text>
        )}

        {player.num != null ? (
          <View style={[styles.numberPill, { backgroundColor: tokens.accent }]}>
            <Text
              style={[styles.numberText, { fontSize: dims.num, color: tokens.onAccent }]}
              allowFontScaling={false}
            >
              {player.num}
            </Text>
          </View>
        ) : null}

        {/* Disponibilité : un point de couleur, pas un badge textuel. */}
        <View
          style={[
            styles.statusDot,
            { backgroundColor: status, borderColor: tokens.bg },
          ]}
        />
      </View>

      {!hideName ? (
        <Text
          style={[
            styles.name,
            {
              fontSize: dims.name,
              color: isSelected ? tokens.accent : tokens.foreground,
              width: labelWidth ?? dims.avatar + 34,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          allowFontScaling={false}
        >
          {player.name}
        </Text>
      ) : null}
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  numberPill: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: proRadius.pill,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 10,
    height: 10,
    borderRadius: proRadius.pill,
    borderWidth: 2,
  },
  name: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
