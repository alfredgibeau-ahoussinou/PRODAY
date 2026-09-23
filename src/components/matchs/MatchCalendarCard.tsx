import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayText } from '../ui/ProDayText';
import { useMatchSkinTokens } from './matchCenterUi';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { playerType } from '../../theme/playerDesignSystem';
import type { RsvpStatus } from '../../models/TeamEvent';

interface MatchCalendarCardProps {
  kindLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  city: string;
  linkLabel?: string;
  meetingTime?: string;
  teamName?: string;
  userRsvp?: RsvpStatus | 'pending' | null;
  status?: 'confirmed' | 'cancelled' | 'postponed' | 'completed';
  onPress: () => void;
  onExportCalendar?: () => void;
}

/**
 * Carte d'Événement Épurée & Directe Style Apple / ProDay
 * Affiche l'heure, le type, le titre, le lieu, l'heure de convocation et le statut RSVP du joueur.
 */
export const MatchCalendarCard: React.FC<MatchCalendarCardProps> = ({
  kindLabel,
  dateLabel,
  title,
  subtitle,
  city,
  meetingTime,
  teamName,
  userRsvp,
  status = 'confirmed',
  onPress,
  onExportCalendar,
}) => {
  const skin = useMatchSkinTokens();
  const isCancelled = status === 'cancelled';
  const isPostponed = status === 'postponed';

  const kindUpper = kindLabel.toUpperCase();
  const isTraining = kindUpper.includes('ENTRAÎNEMENT') || kindUpper.includes('SEANCE');
  const isTournament = kindUpper.includes('TOURNOI') || kindUpper.includes('COMPÉTITION');

  const kindColor = isTraining
    ? '#10B981'
    : isTournament
      ? '#F59E0B'
      : skin.accent;

  return (
    <PressableSpring
      style={[
        styles.card,
        isCancelled && styles.cardCancelled,
      ]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={styles.body}>
        {/* Ligne 1 : Date, Heure, Badge Catégorie & Statut RSVP */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.dateWrap}>
              <Ionicons name="time-outline" size={13} color={PLAYER_DARK.textMuted} />
              <ProDayText style={styles.dateText}>
                {dateLabel}
              </ProDayText>
            </View>

            {meetingTime ? (
              <View style={styles.meetingWrap}>
                <ProDayText style={styles.meetingText}>
                  · Rdv {meetingTime}
                </ProDayText>
              </View>
            ) : null}
          </View>

          <View style={styles.topRight}>
            <View style={[styles.kindTag, { backgroundColor: `${kindColor}18` }]}>
              <ProDayText style={[styles.kindTagText, { color: kindColor }]}>
                {kindLabel.toUpperCase()}
              </ProDayText>
            </View>

            {userRsvp ? (
              <View
                style={[
                  styles.rsvpBadge,
                  userRsvp === 'yes'
                    ? styles.rsvpYes
                    : userRsvp === 'no'
                      ? styles.rsvpNo
                      : styles.rsvpPending,
                ]}
              >
                <Ionicons
                  name={
                    userRsvp === 'yes'
                      ? 'checkmark-circle'
                      : userRsvp === 'no'
                        ? 'close-circle'
                        : 'alert-circle'
                  }
                  size={11}
                  color={
                    userRsvp === 'yes'
                      ? '#10B981'
                      : userRsvp === 'no'
                        ? '#EF4444'
                        : '#F59E0B'
                  }
                />
                <ProDayText
                  style={[
                    styles.rsvpBadgeText,
                    {
                      color:
                        userRsvp === 'yes'
                          ? '#10B981'
                          : userRsvp === 'no'
                            ? '#EF4444'
                            : '#F59E0B',
                    },
                  ]}
                >
                  {userRsvp === 'yes'
                    ? 'Présent'
                    : userRsvp === 'no'
                      ? 'Absent'
                      : 'En attente'}
                </ProDayText>
              </View>
            ) : null}

            {onExportCalendar ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onExportCalendar();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.calendarBtn}
                accessibilityLabel="Ajouter au calendrier"
              >
                <Ionicons name="calendar-outline" size={13} color={PLAYER_DARK.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Ligne 2 : Affiche / Titre de l'événement */}
        <View style={styles.titleRow}>
          <ProDayText
            style={[
              styles.titleText,
              isCancelled && styles.titleCancelled,
            ]}
            numberOfLines={2}
          >
            {title}
          </ProDayText>
          {isCancelled ? (
            <View style={styles.cancelledBadge}>
              <ProDayText style={styles.cancelledText}>ANNULÉ</ProDayText>
            </View>
          ) : isPostponed ? (
            <View style={styles.postponedBadge}>
              <ProDayText style={styles.postponedText}>REPORTÉ</ProDayText>
            </View>
          ) : null}
        </View>

        {/* Ligne 3 : Équipe, Lieu & Chevron */}
        <View style={styles.bottomRow}>
          <View style={styles.locationWrap}>
            {teamName ? (
              <ProDayText style={styles.teamText} numberOfLines={1}>
                {teamName} ·{' '}
              </ProDayText>
            ) : null}
            <Ionicons name="location-outline" size={12} color={PLAYER_DARK.textMuted} />
            <ProDayText style={styles.locationText} numberOfLines={1}>
              {subtitle ? `${subtitle} · ` : ''}{city || 'Lieu non renseigné'}
            </ProDayText>
          </View>

          <Ionicons name="chevron-forward" size={14} color={PLAYER_DARK.textMuted} />
        </View>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 14,
    marginBottom: 8,
  },
  cardCancelled: {
    opacity: 0.6,
  },
  body: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    ...playerType.caption,
    fontWeight: '600',
    color: PLAYER_DARK.textMuted,
  },
  meetingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingText: {
    ...playerType.caption,
    fontWeight: '500',
    color: PLAYER_DARK.textMuted,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kindTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kindTagText: {
    ...playerType.micro,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  rsvpYes: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  rsvpNo: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rsvpPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  rsvpBadgeText: {
    ...playerType.micro,
    fontWeight: '700',
  },
  calendarBtn: {
    padding: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    ...playerType.headline,
    color: PLAYER_DARK.text,
    flex: 1,
  },
  titleCancelled: {
    textDecorationLine: 'line-through',
    color: PLAYER_DARK.textMuted,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cancelledText: {
    ...playerType.micro,
    color: '#EF4444',
    fontWeight: '800',
  },
  postponedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postponedText: {
    ...playerType.micro,
    color: '#F59E0B',
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  teamText: {
    ...playerType.caption,
    color: PLAYER_DARK.text,
    fontWeight: '600',
  },
  locationText: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
    flex: 1,
  },
});
