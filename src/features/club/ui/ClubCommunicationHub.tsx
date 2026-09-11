/**
 * Composition visuelle hub Communication Club — priorité messagerie + tuiles.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
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
          colors={['rgba(255, 255, 255, 0.03)', 'rgba(14, 14, 20, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.iconBadge}>
          <Icon name="chat" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.col}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <ClubText variant="caption" style={styles.kickerText}>
              CANAL DIRECT
            </ClubText>
          </View>
          <ClubText variant="section" style={styles.title}>
            Messagerie Club
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </ClubText>
          <View style={styles.ctaRow}>
            <PressableSpring onPress={onOpenInbox} scaleTo={0.96} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                Ouvrir
              </ClubText>
              <Icon name="chevron-forward" size={12} color="#000000" />
            </PressableSpring>
            {onOpenNotifications ? (
              <PressableSpring
                onPress={onOpenNotifications}
                scaleTo={0.96}
                haptic
                style={styles.ctaGhost}
              >
                <Icon name="notifications" size={13} color="#8E8E9F" />
                <ClubText variant="caption" style={styles.ctaGhostLabel}>
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
        return { icon: 'warning' as const, label: 'Intempéries', tone: '#F59E0B' };
      case 'match_postponed':
        return { icon: 'time' as const, label: 'Report de match', tone: '#F59E0B' };
      case 'pitch_change':
        return { icon: 'football' as const, label: 'Changement terrain', tone: '#3B82F6' };
      default:
        return { icon: 'alert-circle' as const, label: 'Alerte urgente', tone: '#EF4444' };
    }
  };

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={28}>
      <View style={styles.container}>
        <LinearGradient
          colors={
            announcements.length > 0
              ? ['rgba(245, 158, 11, 0.08)', 'rgba(20, 20, 26, 0.95)']
              : ['rgba(255, 255, 255, 0.03)', 'rgba(14, 14, 20, 0.7)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.badgePriority,
                announcements.length > 0 ? styles.badgePriorityWarn : styles.badgePriorityNormal,
              ]}
            >
              <Icon
                name={announcements.length > 0 ? 'alert-circle' : 'checkmark-circle'}
                size={12}
                color={announcements.length > 0 ? '#F59E0B' : '#10B981'}
              />
              <ClubText
                variant="caption"
                style={[
                  styles.badgePriorityText,
                  { color: announcements.length > 0 ? '#F59E0B' : '#10B981' },
                ]}
              >
                {announcements.length > 0 ? 'FLASH INFO CLUB' : 'STATUT NORMAL'}
              </ClubText>
            </View>
            <ClubText variant="body" style={styles.headerTitle}>
              Flash Info Club
            </ClubText>
          </View>
          {onCreateUrgent ? (
            <PressableSpring onPress={onCreateUrgent} scaleTo={0.96} haptic style={styles.btnCreate}>
              <Icon name="add" size={13} color="#D1D5DB" />
              <ClubText variant="caption" style={styles.btnCreateText}>
                Publier
              </ClubText>
            </PressableSpring>
          ) : null}
        </View>

        {announcements.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="checkmark-circle" size={15} color="#10B981" />
            <ClubText variant="caption" muted style={styles.emptyText}>
              Infrastructures, terrains et rencontres 100% opérationnels.
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
                  <View style={[styles.annIconBadge, { backgroundColor: meta.tone + '18' }]}>
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
                    <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '700', marginTop: 2, color: '#FFFFFF' }}>
                      {ann.title}
                    </ClubText>
                    <ClubText variant="caption" muted numberOfLines={2}>
                      {ann.message}
                    </ClubText>
                  </View>
                  <Icon name="chevron-forward" size={14} color="#8E8E9F" />
                </PressableSpring>
              );
            })}
          </View>
        )}
      </View>
    </AnimatedEntrance>
  );
}

export interface ClubOperationalCanalItem {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  badgeLabel?: string;
  badgeTone?: 'default' | 'warning' | 'success' | 'accent';
  onPress: () => void;
}

/** Grille opérationnelle 2-colonnes moderne des outils club. */
export function ClubOperationalCanalsGrid({
  items,
}: {
  items: ClubOperationalCanalItem[];
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => gridStyles(tokens), [tokens]);

  return (
    <View style={styles.gridContainer}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.gridCol}>
          <AnimatedEntrance kind="fadeUp" index={index} delayStep={25}>
            <PressableSpring
              onPress={item.onPress}
              scaleTo={0.97}
              haptic
              style={styles.gridCard}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.03)', 'rgba(14, 14, 20, 0.7)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.gridCardHeader}>
                <View style={styles.gridIconWrap}>
                  <Icon name={item.icon} size={17} color="#FFFFFF" />
                </View>
                {item.badgeLabel ? (
                  <View
                    style={[
                      styles.gridBadge,
                      item.badgeTone === 'warning'
                        ? styles.gridBadgeWarn
                        : item.badgeTone === 'success'
                          ? styles.gridBadgeGood
                          : styles.gridBadgeDefault,
                    ]}
                  >
                    <ClubText
                      variant="caption"
                      style={[
                        styles.gridBadgeText,
                        item.badgeTone === 'warning'
                          ? styles.gridBadgeTextWarn
                          : item.badgeTone === 'success'
                            ? styles.gridBadgeTextGood
                            : styles.gridBadgeTextDefault,
                      ]}
                    >
                      {item.badgeLabel}
                    </ClubText>
                  </View>
                ) : null}
              </View>

              <View style={styles.gridCardBody}>
                <ClubText variant="section" numberOfLines={1} style={styles.gridTitle}>
                  {item.title}
                </ClubText>
                <ClubText variant="caption" muted numberOfLines={1} style={styles.gridSubtitle}>
                  {item.subtitle}
                </ClubText>
              </View>

              <View style={styles.gridCardFooter}>
                <ClubText variant="caption" style={styles.gridActionText}>
                  Accéder
                </ClubText>
                <Icon name="chevron-forward" size={12} color="#8E8E9F" />
              </View>
            </PressableSpring>
          </AnimatedEntrance>
        </View>
      ))}
    </View>
  );
}

/** Tuile canal / destination existante (conservée pour rétrocompatibilité). */
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
      gap: 14,
      padding: 16,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      overflow: 'hidden',
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      flexShrink: 0,
      marginTop: 2,
    },
    col: { flex: 1, minWidth: 0, gap: 4 },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    kickerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    kickerText: {
      color: '#8E8E9F',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    title: {
      fontWeight: '800',
      fontSize: 16,
      letterSpacing: -0.2,
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 12,
      color: '#8E8E9F',
      lineHeight: 16,
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
    },
    ctaPrimaryLabel: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 12,
    },
    ctaGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      backgroundColor: '#181820',
    },
    ctaGhostLabel: {
      color: '#D1D5DB',
      fontWeight: '700',
      fontSize: 12,
    },
  });

const urgentStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: 10,
      padding: 14,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badgePriority: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 6,
    },
    badgePriorityWarn: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
    badgePriorityNormal: {
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    badgePriorityText: {
      fontWeight: '900',
      fontSize: 10,
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontWeight: '800',
      fontSize: 14,
      color: '#FFFFFF',
    },
    btnCreate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    btnCreateText: {
      color: '#D1D5DB',
      fontWeight: '700',
      fontSize: 11,
    },
    emptyWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    emptyText: {
      fontSize: 12,
      color: '#8E8E9F',
      flex: 1,
    },
    list: {
      gap: 8,
      marginTop: 2,
    },
    announcementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: '#181820',
      borderWidth: 1,
    },
    annIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
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
      gap: 6,
    },
    typePill: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 6,
      borderWidth: 1,
    },
  });

const gridStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      gap: 8,
    },
    gridCol: {
      width: '50%',
      paddingHorizontal: 4,
    },
    gridCard: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      padding: 14,
      gap: 10,
      overflow: 'hidden',
    },
    gridCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gridIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    gridBadgeDefault: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    gridBadgeWarn: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
    gridBadgeGood: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    gridBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    gridBadgeTextDefault: {
      color: '#9CA3AF',
    },
    gridBadgeTextWarn: {
      color: '#F59E0B',
    },
    gridBadgeTextGood: {
      color: '#10B981',
    },
    gridCardBody: {
      gap: 2,
    },
    gridTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    gridSubtitle: {
      color: '#8E8E9F',
      fontSize: 11,
    },
    gridCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    gridActionText: {
      color: '#8E8E9F',
      fontSize: 11,
      fontWeight: '600',
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
