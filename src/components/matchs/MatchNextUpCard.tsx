import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { formatCalendarDate, type SeasonCalendarItem } from '../../utils/seasonCalendar';
import { ProDayText } from '../ui/ProDayText';
import { useMatchSkinTokens } from './matchCenterUi';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { RsvpStatus } from '../../models/TeamEvent';

import { colors } from '../../theme/designTokens';
interface MatchNextUpCardProps {
  item: SeasonCalendarItem;
  onPress: () => void;
  onRsvp?: (status: RsvpStatus) => void;
  onOpenCarpool?: () => void;
  currentRsvp?: RsvpStatus | null;
  rsvpBusy?: boolean;
}

function parseMatchTeams(title: string, defaultHome = 'Mon équipe'): { home: string; away: string } {
  const clean = title.trim();
  if (clean.toLowerCase().includes('entraînement') || clean.toLowerCase().includes('séance')) {
    return { home: clean, away: '' };
  }
  if (title.includes(' vs ') || title.includes(' VS ') || title.includes(' - ')) {
    const parts = title.split(/\s+vs\s+|\s+VS\s+|\s+-\s+/i);
    if (parts.length >= 2) {
      return { home: parts[0].trim(), away: parts[1].trim() };
    }
  }
  if (title.toLowerCase().startsWith('match vs ') || title.toLowerCase().startsWith('vs ')) {
    const opp = title.replace(/^(match\s+)?vs\s+/i, '').trim();
    return { home: defaultHome, away: opp || 'Adversaire' };
  }
  return { home: defaultHome, away: title.trim() };
}

function getInitials(name: string): string {
  const words = name.replace(/^(FC|AS|US|RC|OGC|AJ|SCO|SC)\s+/i, '').split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

export const MatchNextUpCard: React.FC<MatchNextUpCardProps> = ({
  item,
  onPress,
  onRsvp,
  onOpenCarpool,
  currentRsvp,
  rsvpBusy = false,
}) => {
  const skin = useMatchSkinTokens();
  const isMatch = item.kind === 'friendly_match' || item.kind === 'competition_fixture' || item.subtitle?.toLowerCase().includes('match');
  const teams = parseMatchTeams(item.title);
  const homeInitials = getInitials(teams.home);
  const awayInitials = getInitials(teams.away);

  const startsAt = item.starts_at ? new Date(item.starts_at) : new Date();
  const timeStr = `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}`;
  const isToday = new Date().toDateString() === startsAt.toDateString();

  return (
    <AnimatedEntrance kind="zoom" delayStep={0}>
      <PressableSpring
        onPress={onPress}
        scaleTo={0.99}
        haptic
        style={[
          styles.card,
          {
            borderColor: `${skin.accent}40`,
          },
        ]}
      >
        {/* Glow Header */}
        <View style={styles.headerRow}>
          <View style={[styles.clashPill, { backgroundColor: `${skin.accent}20`, borderColor: `${skin.accent}55` }]}>
            <Ionicons name="flame" size={12} color={skin.accent} />
            <ProDayText style={[styles.clashText, { color: skin.accent }]}>
              {isMatch ? 'CHOC DE LA SEMAINE' : 'PROCHAIN RENDEZ-VOUS'}
            </ProDayText>
          </View>

          <View style={[styles.timePill, isToday && { backgroundColor: `${skin.accent}25`, borderColor: skin.accent }]}>
            <Ionicons name="time" size={11} color={isToday ? skin.accent : '#9CA3AF'} />
            <ProDayText style={[styles.timeText, isToday && { color: skin.accent, fontWeight: '800' }]}>
              {isToday ? `AUJOURD'HUI · ${timeStr}` : formatCalendarDate(startsAt)}
            </ProDayText>
          </View>
        </View>

        {/* Head-to-Head Clash Presentation */}
        <View style={styles.h2hContainer}>
          {/* Équipe Domicile */}
          <View style={styles.teamCol}>
            <View style={[styles.crestHexagon, { borderColor: `${skin.accent}60`, backgroundColor: `${skin.accent}18` }]}>
              <ProDayText style={[styles.crestInitials, { color: skin.accent }]}>
                {homeInitials}
              </ProDayText>
            </View>
            <ProDayText numberOfLines={1} style={styles.teamName}>
              {teams.home}
            </ProDayText>
            <View style={[styles.homeAwayTag, { backgroundColor: `${skin.accent}14` }]}>
              <ProDayText style={[styles.homeAwayText, { color: skin.accent }]}>DOMICILE</ProDayText>
            </View>
          </View>

          {/* VS Center Orb */}
          <View style={styles.vsCol}>
            <View style={[styles.vsCircle, { borderColor: `${skin.accent}35` }]}>
              <ProDayText style={[styles.vsText, { color: skin.accent }]}>VS</ProDayText>
            </View>
            <ProDayText style={styles.matchTime}>{timeStr}</ProDayText>
            <ProDayText style={styles.competitionLabel} numberOfLines={1}>
              {item.subtitle || 'Match Équipe'}
            </ProDayText>
          </View>

          {/* Équipe Extérieur */}
          <View style={styles.teamCol}>
            <View style={[styles.crestHexagon, { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#1A1A24' }]}>
              <ProDayText style={[styles.crestInitials, { color: '#E5E7EB' }]}>
                {awayInitials}
              </ProDayText>
            </View>
            <ProDayText numberOfLines={1} style={styles.teamName}>
              {teams.away}
            </ProDayText>
            <View style={[styles.homeAwayTag, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <ProDayText style={[styles.homeAwayText, { color: '#9CA3AF' }]}>EXTÉRIEUR</ProDayText>
            </View>
          </View>
        </View>

        {/* Stadium & City Strip */}
        <View style={styles.venueStrip}>
          <Ionicons name="location-sharp" size={13} color={skin.accent} />
          <ProDayText style={styles.venueText} numberOfLines={1}>
            {item.city ? `Stade & Ville : ${item.city}` : 'Terrain du match'}
          </ProDayText>
        </View>

        {/* RSVP 1-Tap Bar (if interactive) */}
        {onRsvp ? (
          <View style={styles.rsvpSection}>
            <View style={styles.rsvpHeaderRow}>
              <ProDayText style={styles.rsvpPrompt}>
                {currentRsvp === 'yes' ? '✅ Tu es confirmé pour ce match' : currentRsvp === 'no' ? '❌ Tu as décliné cette convocation' : '⚡ Ta présence pour ce match :'}
              </ProDayText>
            </View>

            <View style={styles.rsvpButtonsRow}>
              <PressableSpring
                onPress={() => {
                  prodayHaptics.confirm();
                  onRsvp('yes');
                }}
                disabled={rsvpBusy}
                scaleTo={0.96}
                haptic
                style={[
                  styles.rsvpBtn,
                  currentRsvp === 'yes'
                    ? [styles.rsvpBtnActiveYes, { borderColor: skin.accent, backgroundColor: `${skin.accent}25` }]
                    : styles.rsvpBtnDefault,
                ]}
              >
                <Ionicons name="checkmark-circle" size={14} color={currentRsvp === 'yes' ? skin.accent : '#22C55E'} />
                <ProDayText style={[styles.rsvpBtnText, currentRsvp === 'yes' && { color: skin.accent, fontWeight: '800' }]}>
                  Présent
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => {
                  prodayHaptics.press();
                  onRsvp('maybe');
                }}
                disabled={rsvpBusy}
                scaleTo={0.96}
                haptic
                style={[
                  styles.rsvpBtn,
                  currentRsvp === 'maybe'
                    ? [styles.rsvpBtnActiveMaybe, { borderColor: '#F59E0B', backgroundColor: '#F59E0B20' }]
                    : styles.rsvpBtnDefault,
                ]}
              >
                <Ionicons name="time" size={14} color={currentRsvp === 'maybe' ? '#F59E0B' : '#F59E0B'} />
                <ProDayText style={[styles.rsvpBtnText, currentRsvp === 'maybe' && { color: '#F59E0B', fontWeight: '800' }]}>
                  Incertain
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => {
                  prodayHaptics.press();
                  onRsvp('no');
                }}
                disabled={rsvpBusy}
                scaleTo={0.96}
                haptic
                style={[
                  styles.rsvpBtn,
                  currentRsvp === 'no'
                    ? [styles.rsvpBtnActiveNo, { borderColor: '#EF4444', backgroundColor: '#EF444420' }]
                    : styles.rsvpBtnDefault,
                ]}
              >
                <Ionicons name="close-circle" size={14} color={currentRsvp === 'no' ? '#EF4444' : '#9CA3AF'} />
                <ProDayText style={[styles.rsvpBtnText, currentRsvp === 'no' && { color: '#EF4444', fontWeight: '800' }]}>
                  Absent
                </ProDayText>
              </PressableSpring>
            </View>
          </View>
        ) : null}

        {/* Matchday Quick Action Shortcuts */}
        <View style={styles.actionStrip}>
          {onOpenCarpool ? (
            <PressableSpring
              onPress={onOpenCarpool}
              scaleTo={0.96}
              haptic
              style={styles.actionItem}
            >
              <Ionicons name="car-outline" size={13} color={skin.accent} />
              <ProDayText style={[styles.actionText, { color: skin.accent }]}>
                Covoiturage
              </ProDayText>
            </PressableSpring>
          ) : null}

          <PressableSpring
            onPress={onPress}
            scaleTo={0.96}
            haptic
            style={styles.actionItem}
          >
            <Ionicons name="chatbubbles-outline" size={13} color="#9CA3AF" />
            <ProDayText style={styles.actionText}>
              Vestiaire
            </ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={onPress}
            scaleTo={0.96}
            haptic
            style={styles.actionItem}
          >
            <Ionicons name="navigate-outline" size={13} color="#9CA3AF" />
            <ProDayText style={styles.actionText}>
              Détails & GPS →
            </ProDayText>
          </PressableSpring>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  clashText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  h2hContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  crestHexagon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestInitials: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 100,
  },
  homeAwayTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  homeAwayText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  vsCol: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  matchTime: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  competitionLabel: {
    fontSize: 10,
    color: '#8B8B9A',
    fontWeight: '600',
    maxWidth: 90,
    textAlign: 'center',
  },
  venueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  venueText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontWeight: '600',
    flex: 1,
  },
  rsvpSection: {
    backgroundColor: colors.backgroundAlt,
    padding: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rsvpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rsvpPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  rsvpButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  rsvpBtnDefault: {
    backgroundColor: '#161620',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rsvpBtnActiveYes: {},
  rsvpBtnActiveMaybe: {},
  rsvpBtnActiveNo: {},
  rsvpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8B9A',
  },
});

