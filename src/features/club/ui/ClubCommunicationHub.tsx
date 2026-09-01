/**
 * Composition visuelle hub Communication Club — priorité messagerie + tuiles.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { ClubText } from './clubUi';
import type { ClubCommTile } from './clubCommunicationModel';

/** Hero — ouvrir la messagerie (écran Messages existant). */
export function ClubCommInboxHero({
  subtitle,
  onOpenInbox,
  onOpenNotifications,
  unreadNotifications,
}: {
  subtitle: string;
  onOpenInbox: () => void;
  onOpenNotifications?: () => void;
  unreadNotifications?: number;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <LinearGradient
          colors={[tokens.pitchSoft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tokens.pitch }]} />
        <View style={[styles.iconBadge, { backgroundColor: tokens.pitchSoft, borderColor: tokens.pitch }]}>
          <Icon name="chat" size={22} color={tokens.pitch} />
        </View>
        <View style={styles.col}>
          <ClubText variant="label" style={{ color: tokens.pitch }}>
            Boîte de réception
          </ClubText>
          <ClubText variant="h2" style={styles.title}>
            Messagerie club
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {subtitle}
          </ClubText>
          <View style={styles.ctaRow}>
            <PressableSpring onPress={onOpenInbox} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                Ouvrir
              </ClubText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
            {onOpenNotifications ? (
              <PressableSpring
                onPress={onOpenNotifications}
                scaleTo={0.97}
                haptic
                style={[styles.ctaGhost, { borderColor: tokens.borderStrong }]}
              >
                <Icon name="notifications" size={13} color={tokens.foreground} />
                <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
                  {unreadNotifications && unreadNotifications > 0
                    ? `Alertes (${unreadNotifications})`
                    : 'Alertes'}
                </ClubText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

export type UrgentAnnouncementType = 'weather' | 'match_postponed' | 'pitch_change' | 'general_alert';

export interface ClubUrgentAnnouncement {
  id: string;
  type: UrgentAnnouncementType;
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'normal';
  createdAt?: string;
  targetGroup?: string;
}

/** Module d'annonces urgentes du club (intempéries, report de match, changement de terrain) avec badge prioritaire. */
export function ClubUrgentAnnouncementsCard({
  announcements,
  onCreateUrgent,
  onPressAnnouncement,
}: {
  announcements: ClubUrgentAnnouncement[];
  onCreateUrgent?: () => void;
  onPressAnnouncement?: (item: ClubUrgentAnnouncement) => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => urgentStyles(tokens), [tokens]);

  const getTypeMeta = (type: UrgentAnnouncementType) => {
    switch (type) {
      case 'weather':
        return { icon: 'warning' as const, label: 'Intempéries', tone: tokens.danger };
      case 'match_postponed':
        return { icon: 'time' as const, label: 'Report de match', tone: tokens.warning };
      case 'pitch_change':
        return { icon: 'football' as const, label: 'Changement terrain', tone: tokens.accent };
      default:
        return { icon: 'alert-circle' as const, label: 'Alerte urgente', tone: tokens.danger };
    }
  };

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={28}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.badgePriority, { backgroundColor: tokens.dangerSoft }]}>
              <Icon name="alert-circle" size={13} color={tokens.danger} />
              <ClubText variant="caption" style={{ color: tokens.danger, fontWeight: '900', fontSize: 10, letterSpacing: 0.5 }}>
                URGENT
              </ClubText>
            </View>
            <ClubText variant="body" style={{ fontWeight: '800' }}>
              Flash Info Club
            </ClubText>
          </View>
          {onCreateUrgent ? (
            <PressableSpring onPress={onCreateUrgent} scaleTo={0.96} haptic style={styles.btnCreate}>
              <Icon name="add" size={13} color={tokens.danger} />
              <ClubText variant="caption" style={{ color: tokens.danger, fontWeight: '800', fontSize: 11 }}>
                Publier
              </ClubText>
            </PressableSpring>
          ) : null}
        </View>

        {announcements.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="checkmark-circle" size={16} color={tokens.pitch} />
            <ClubText variant="caption" muted>
              Aucune perturbation signalée (météo, terrains et matchs conformes)
            </ClubText>
          </View>
        ) : (
          <View style={styles.list}>
            {announcements.map((ann) => {
              const meta = getTypeMeta(ann.type);
              return (
                <PressableSpring
                  key={ann.id}
                  onPress={() => onPressAnnouncement?.(ann)}
                  scaleTo={0.98}
                  haptic
                  style={[styles.announcementItem, { borderColor: meta.tone + '44' }]}
                >
                  <View style={[styles.annIconBadge, { backgroundColor: meta.tone + '15' }]}>
                    <Icon name={meta.icon} size={15} color={meta.tone} />
                  </View>
                  <View style={styles.annContent}>
                    <View style={styles.annTopRow}>
                      <View style={[styles.typePill, { backgroundColor: meta.tone + '20', borderColor: meta.tone + '55' }]}>
                        <ClubText variant="caption" style={{ color: meta.tone, fontWeight: '800', fontSize: 10 }}>
                          {meta.label}
                        </ClubText>
                      </View>
                      {ann.targetGroup ? (
                        <ClubText variant="caption" muted style={{ fontSize: 10 }}>
                          {ann.targetGroup}
                        </ClubText>
                      ) : null}
                    </View>
                    <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '700', marginTop: 2 }}>
                      {ann.title}
                    </ClubText>
                    <ClubText variant="caption" muted numberOfLines={2}>
                      {ann.message}
                    </ClubText>
                  </View>
                  <Icon name="chevron-forward" size={14} color={tokens.faint} />
                </PressableSpring>
              );
            })}
          </View>
        )}
      </View>
    </AnimatedEntrance>
  );
}

/** Tuile canal / destination existante. */
export function ClubCommTileRow({
  tile,
  index,
  onPress,
}: {
  tile: ClubCommTile;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => tileStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={28}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: tile.primary ? tokens.pitchSoft : tokens.accentSoft,
            },
          ]}
        >
          <Icon
            name={tile.icon}
            size={16}
            color={tile.primary ? tokens.pitch : tokens.accent}
          />
        </View>
        <View style={styles.col}>
          <ClubText variant="body" style={{ fontWeight: '700' }}>
            {tile.label}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {tile.hint}
          </ClubText>
        </View>
        <Icon name="chevron-forward" size={15} color={tokens.faint} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const heroStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.md,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xxl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      overflow: 'hidden',
      ...clubShadow.lift,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 16,
      bottom: 16,
      width: 4,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      flexShrink: 0,
      marginTop: 2,
    },
    col: { flex: 1, minWidth: 0, gap: 6 },
    title: {
      fontWeight: '800',
      letterSpacing: -0.35,
      color: tokens.foreground,
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.sm,
      marginTop: clubSpace.xs,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.accent,
    },
    ctaPrimaryLabel: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 12,
    },
    ctaGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
  });

const urgentStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      ...clubShadow.soft,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.xs,
    },
    badgePriority: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: clubRadius.pill,
    },
    btnCreate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.dangerSoft,
    },
    emptyWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.xs,
      paddingVertical: clubSpace.xs,
    },
    list: {
      gap: clubSpace.xs,
      marginTop: 2,
    },
    announcementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.sm,
      paddingHorizontal: clubSpace.sm,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
    },
    annIconBadge: {
      width: 32,
      height: 32,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    annContent: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    annTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.xs,
    },
    typePill: {
      paddingVertical: 1,
      paddingHorizontal: 6,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
    },
  });

const tileStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });
