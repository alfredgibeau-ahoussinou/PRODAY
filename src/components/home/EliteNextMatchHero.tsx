import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING, useEliteResponsive } from '../../theme/prodayEliteTheme';
import { EliteCard } from '../ui/EliteCard';
import { EliteBadge } from '../ui/EliteBadge';
import { EliteButton } from '../ui/EliteButton';
import { Icon } from '../ui/Icon';

export interface NextMatchDetails {
  id: string;
  opponentName: string;
  opponentLogo?: string;
  homeClubName: string;
  homeClubLogo?: string;
  isHome: boolean;
  dateLabel: string;      // ex: "Dimanche 8 Septembre"
  timeLabel: string;      // ex: "15:00"
  competitionLabel: string; // ex: "Départemental 1 · J13"
  stadiumName: string;
  stadiumAddress: string;
  userRsvpStatus: 'attending' | 'declined' | 'pending';
  totalAttending: number;
  totalCalled: number;
}

interface Props {
  match: NextMatchDetails;
  onRsvp: (status: 'attending' | 'declined') => void;
  onOpenCarpool?: () => void;
  onOpenMatchDetail?: () => void;
}

export const EliteNextMatchHero: React.FC<Props> = ({
  match,
  onRsvp,
  onOpenCarpool,
  onOpenMatchDetail,
}) => {
  const { isMobile, containerStyle } = useEliteResponsive();

  const openGps = () => {
    const query = encodeURIComponent(`${match.stadiumName} ${match.stadiumAddress}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const isAttending = match.userRsvpStatus === 'attending';
  const isDeclined = match.userRsvpStatus === 'declined';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <EliteCard padding="lg" style={styles.card}>
        {/* En-tête du match : Compétition + Date */}
        <View style={styles.topRow}>
          <EliteBadge label={match.competitionLabel} variant="info" size="sm" />
          <View style={styles.dateTimeBadge}>
            <View style={{ marginRight: 4 }}>
              <Icon name="time" size={13} color={ELITE_COLORS.textSecondary} />
            </View>
            <Text style={styles.dateTimeText}>
              {match.dateLabel} · {match.timeLabel}
            </Text>
          </View>
        </View>

        {/* Confrontation : Équipes */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenMatchDetail}
          style={styles.teamsRow}
        >
          {/* Équipe Domicile */}
          <View style={styles.teamCol}>
            <View style={[styles.teamShield, match.isHome && styles.userShield]}>
              <Icon name="shield" size={28} color={match.isHome ? ELITE_COLORS.primary : ELITE_COLORS.textSecondary} />
            </View>
            <Text style={[styles.teamName, match.isHome && styles.userTeamName]} numberOfLines={2}>
              {match.isHome ? match.homeClubName : match.opponentName}
            </Text>
            <Text style={styles.homeAwayTag}>{match.isHome ? 'DOMICILE' : 'EXTÉRIEUR'}</Text>
          </View>

          {/* VS & Compte à rebours */}
          <View style={styles.vsCol}>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.attendancePill}>
              <Text style={styles.attendanceText}>
                {match.totalAttending}/{match.totalCalled} prêts
              </Text>
            </View>
          </View>

          {/* Équipe Extérieure */}
          <View style={styles.teamCol}>
            <View style={[styles.teamShield, !match.isHome && styles.userShield]}>
              <Icon name="shield" size={28} color={!match.isHome ? ELITE_COLORS.primary : ELITE_COLORS.textSecondary} />
            </View>
            <Text style={[styles.teamName, !match.isHome && styles.userTeamName]} numberOfLines={2}>
              {!match.isHome ? match.homeClubName : match.opponentName}
            </Text>
            <Text style={styles.homeAwayTag}>{!match.isHome ? 'DOMICILE' : 'EXTÉRIEUR'}</Text>
          </View>
        </TouchableOpacity>

        {/* Lieu cliquable avec GPS */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openGps}
          style={styles.locationRow}
        >
          <View style={{ marginRight: 6 }}>
            <Icon name="location" size={15} color={ELITE_COLORS.primary} />
          </View>
          <Text style={styles.stadiumText} numberOfLines={1}>
            {match.stadiumName} · {match.stadiumAddress}
          </Text>
          <Text style={styles.gpsAction}>Itinéraire ↗</Text>
        </TouchableOpacity>

        {/* Convocations en 1 tap (SportEasy style) */}
        <View style={styles.rsvpSection}>
          <Text style={styles.rsvpTitle}>TA CONVOCATION :</Text>
          <View style={styles.rsvpButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onRsvp('attending')}
              style={[
                styles.rsvpBtn,
                styles.rsvpAttendBtn,
                isAttending && styles.rsvpBtnActiveAttend,
              ]}
            >
              <View style={{ marginRight: 6 }}>
                <Icon
                  name="checkmark-circle"
                  size={18}
                  color={isAttending ? '#000000' : ELITE_COLORS.primary}
                />
              </View>
              <Text style={[styles.rsvpBtnText, isAttending && { color: '#000000', fontWeight: '900' }]}>
                {isAttending ? 'JE SERAI LÀ ✅' : 'JE PARTICIPE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onRsvp('declined')}
              style={[
                styles.rsvpBtn,
                styles.rsvpDeclineBtn,
                isDeclined && styles.rsvpBtnActiveDecline,
              ]}
            >
              <View style={{ marginRight: 6 }}>
                <Icon
                  name="close"
                  size={18}
                  color={isDeclined ? '#FFFFFF' : ELITE_COLORS.danger}
                />
              </View>
              <Text style={[styles.rsvpBtnText, isDeclined ? { color: '#FFFFFF', fontWeight: '900' } : { color: ELITE_COLORS.danger }]}>
                {isDeclined ? 'ABSENT ❌' : 'ABSENT'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Raccourcis : Covoiturage & Feuille de Match */}
        <View style={styles.bottomActions}>
          {onOpenCarpool && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenCarpool}
              style={styles.subActionBtn}
            >
              <View style={{ marginRight: 6 }}>
                <Icon name="car" size={15} color={ELITE_COLORS.textSecondary} />
              </View>
              <Text style={styles.subActionText}>Covoiturage équipe</Text>
            </TouchableOpacity>
          )}

          {onOpenMatchDetail && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenMatchDetail}
              style={styles.subActionBtn}
            >
              <View style={{ marginRight: 6 }}>
                <Icon name="football" size={15} color={ELITE_COLORS.textSecondary} />
              </View>
              <Text style={styles.subActionText}>Feuille de match →</Text>
            </TouchableOpacity>
          )}
        </View>
      </EliteCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: ELITE_SPACING.lg,
    marginVertical: ELITE_SPACING.sm,
  },
  card: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderColor: ELITE_COLORS.borderHighlight,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ELITE_SPACING.md,
  },
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ELITE_RADIUS.sm,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  dateTimeText: {
    color: ELITE_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ELITE_SPACING.md,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  teamShield: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  userShield: {
    borderColor: ELITE_COLORS.borderAccent,
    backgroundColor: ELITE_COLORS.primarySoft,
  },
  teamName: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 120,
    minHeight: 36,
  },
  userTeamName: {
    color: ELITE_COLORS.primary,
    fontWeight: '800',
  },
  homeAwayTag: {
    color: ELITE_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  vsCol: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  vsText: {
    color: ELITE_COLORS.textMuted,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  attendancePill: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ELITE_RADIUS.full,
    marginTop: 6,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  attendanceText: {
    color: ELITE_COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    padding: 10,
    borderRadius: ELITE_RADIUS.md,
    marginVertical: ELITE_SPACING.sm,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  stadiumText: {
    flex: 1,
    color: ELITE_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  gpsAction: {
    color: ELITE_COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  rsvpSection: {
    marginTop: ELITE_SPACING.sm,
    paddingTop: ELITE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.border,
  },
  rsvpTitle: {
    color: ELITE_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  rsvpButtonsRow: {
    flexDirection: 'row',
    gap: ELITE_SPACING.md,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: ELITE_RADIUS.md,
    borderWidth: 1,
  },
  rsvpAttendBtn: {
    backgroundColor: ELITE_COLORS.primarySoft,
    borderColor: ELITE_COLORS.borderAccent,
  },
  rsvpBtnActiveAttend: {
    backgroundColor: ELITE_COLORS.primary,
    borderColor: ELITE_COLORS.primary,
  },
  rsvpDeclineBtn: {
    backgroundColor: ELITE_COLORS.dangerSoft,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rsvpBtnActiveDecline: {
    backgroundColor: ELITE_COLORS.danger,
    borderColor: ELITE_COLORS.danger,
  },
  rsvpBtnText: {
    color: ELITE_COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ELITE_SPACING.md,
    paddingTop: 8,
  },
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subActionText: {
    color: ELITE_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
