import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { playerType } from '../../theme/playerDesignSystem';
import type { RsvpStatus } from '../../models/TeamEvent';

export interface PlayerCalendarCardProps {
  kindLabel: string;
  dateLabel: string;
  title: string;
  subtitle?: string;
  city?: string;
  meetingTime?: string;
  teamName?: string;
  userRsvp?: RsvpStatus | 'pending' | null;
  status?: 'confirmed' | 'cancelled' | 'postponed' | 'completed';
  accentColor?: string;
  onPress: () => void;
  onExportCalendar?: () => void;
}

export const PlayerCalendarCard: React.FC<PlayerCalendarCardProps> = ({
  kindLabel,
  dateLabel,
  title,
  subtitle,
  city,
  meetingTime,
  teamName,
  userRsvp,
  status = 'confirmed',
  accentColor = PLAYER_DARK.accent,
  onPress,
  onExportCalendar,
}) => {
  const isCancelled = status === 'cancelled';
  const isPostponed = status === 'postponed';

  const kindUpper = kindLabel.toUpperCase();
  const isTraining = kindUpper.includes('ENTRAÎNEMENT') || kindUpper.includes('SEANCE');
  const isTournament = kindUpper.includes('TOURNOI') || kindUpper.includes('COMPÉTITION');

  const kindColor = isTraining
    ? '#10B981'
    : isTournament
      ? '#F59E0B'
      : accentColor;

  return (
    <PressableSpring
      style={[styles.card, isCancelled && styles.cardCancelled]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={styles.body}>
        {/* Ligne Supérieure : Date, Heure, Badge & Statut RSVP */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={13} color={PLAYER_DARK.textMuted} />
              <ProDayText style={styles.timeText}>{dateLabel}</ProDayText>
            </View>

            {meetingTime ? (
              <View style={styles.meetingBadge}>
                <ProDayText style={[styles.meetingText, { color: accentColor }]}>
                  · Rdv {meetingTime}
                </ProDayText>
              </View>
            ) : null}
          </View>

          <View style={styles.topRight}>
            <View style={[styles.kindTag, { backgroundColor: `${kindColor}18`, borderColor: `${kindColor}30` }]}>
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
                        : 'time'
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
                    styles.rsvpText,
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
          </View>
        </View>

        {/* Titre & Équipe */}
        <View style={styles.titleContainer}>
          <ProDayText
            style={[styles.title, isCancelled && styles.titleCancelled]}
            numberOfLines={2}
          >
            {title}
          </ProDayText>

          {teamName ? (
            <ProDayText style={styles.teamNameText} numberOfLines={1}>
              {teamName}
            </ProDayText>
          ) : null}

          {subtitle ? (
            <ProDayText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </ProDayText>
          ) : null}
        </View>

        {/* Pied de Carte : Lieu & Actions */}
        <View style={styles.footerRow}>
          {city ? (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={13} color={PLAYER_DARK.textMuted} />
              <ProDayText style={styles.locationText} numberOfLines={1}>
                {city}
              </ProDayText>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={styles.actionButtonsRow}>
            {isCancelled ? (
              <View style={styles.cancelledBadge}>
                <ProDayText style={styles.cancelledBadgeText}>ANNULÉ</ProDayText>
              </View>
            ) : isPostponed ? (
              <View style={styles.postponedBadge}>
                <ProDayText style={styles.postponedBadgeText}>REPORTÉ</ProDayText>
              </View>
            ) : null}

            {onExportCalendar ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onExportCalendar();
                }}
                style={styles.exportBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Ajouter au calendrier"
              >
                <Ionicons name="calendar-outline" size={14} color={PLAYER_DARK.textMuted} />
              </TouchableOpacity>
            ) : null}

            <Ionicons name="chevron-forward" size={16} color={PLAYER_DARK.textMuted} />
          </View>
        </View>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PLAYER_DARK.surface,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardCancelled: {
    opacity: 0.55,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  body: {
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    ...playerType.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  meetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingText: {
    ...playerType.caption,
    fontSize: 11.5,
    fontWeight: '600',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kindTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  kindTagText: {
    ...playerType.micro,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  rsvpYes: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  rsvpNo: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  rsvpPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  rsvpText: {
    ...playerType.micro,
    fontSize: 10,
    fontWeight: '700',
  },
  titleContainer: {
    gap: 2,
    paddingVertical: 2,
  },
  title: {
    ...playerType.headline,
    fontSize: 15,
    color: PLAYER_DARK.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  titleCancelled: {
    textDecorationLine: 'line-through',
    color: PLAYER_DARK.textMuted,
  },
  teamNameText: {
    ...playerType.caption,
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  subtitle: {
    ...playerType.caption,
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...playerType.caption,
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cancelledBadgeText: {
    ...playerType.micro,
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  postponedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  postponedBadgeText: {
    ...playerType.micro,
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  exportBtn: {
    padding: 4,
  },
});
