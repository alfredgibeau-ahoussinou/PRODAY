import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../components/ui/ProDayText';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { prodayHaptics } from '../utils/prodayHaptics';
import { colors, spacing, radius } from '../theme/designTokens';
import { PRO_DATA_VIOLET } from '../theme/professionalDesign';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

export type NotificationCategory =
  | 'all'
  | 'convocation'
  | 'carpool'
  | 'coach_ai'
  | 'club'
  | 'mercato';

export interface CentralizedAlert {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'normal';
  badgeLabel: string;
  badgeColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  contextAction: () => void;
  actionLabel: string;
}

interface NotificationsScreenProps {
  onBack?: () => void;
}

/**
 * Page 25 : Notifications — Alertes centralisées avec redirection contextuelle.
 * Convocations, Covoiturage, Coaching IA, Club & Mercato.
 */
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const nav = useTabNavigationActions();
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set(['notif-5']));

  const initialAlerts: CentralizedAlert[] = useMemo(
    () => [
      {
        id: 'notif-1',
        category: 'convocation',
        title: 'Convocation Match J17 · Samedi 18:00',
        body: 'Le coach t’a convoqué pour le déplacement contre RC France. Confirme ta présence RSVP.',
        timestamp: 'Il y a 15 min',
        read: readIds.has('notif-1'),
        priority: 'high',
        badgeLabel: 'URGENT · RSVP',
        badgeColor: colors.error,
        icon: 'calendar',
        actionLabel: 'Répondre à la convocation',
        contextAction: () => nav.openMatchs({ homeTab: 'convocations' }),
      },
      {
        id: 'notif-2',
        category: 'carpool',
        title: 'Covoiturage Match J17',
        body: 'Thomas B. propose 3 places au départ de Porte Maillot (départ 16:30).',
        timestamp: 'Il y a 1h',
        read: readIds.has('notif-2'),
        priority: 'high',
        badgeLabel: 'COVOITURAGE',
        badgeColor: colors.success,
        icon: 'car',
        actionLabel: 'Réserver une place',
        contextAction: () => nav.openCarpool({ chapter: 'reserver' }),
      },
      {
        id: 'notif-3',
        category: 'coach_ai',
        title: 'Débrief & Drills Post-Séance Prêts',
        body: 'Ton Coach IA a généré 3 exercices personnalisés suite à ta séance d’hier.',
        timestamp: 'Il y a 3h',
        read: readIds.has('notif-3'),
        priority: 'medium',
        badgeLabel: 'COACH IA',
        badgeColor: colors.bookmark,
        icon: 'sparkles',
        actionLabel: 'Voir les exercices',
        contextAction: () => nav.openDashboard('train_ai'),
      },
      {
        id: 'notif-4',
        category: 'club',
        title: 'Changement de terrain entraînement',
        body: 'La séance de jeudi est déplacée sur le terrain d’honneur synthétique n°2.',
        timestamp: 'Hier',
        read: readIds.has('notif-4'),
        priority: 'normal',
        badgeLabel: 'ANNONCE CLUB',
        badgeColor: colors.tone4,
        icon: 'megaphone',
        actionLabel: 'Lire l’annonce',
        contextAction: () => nav.setActiveTab('messages'),
      },
      {
        id: 'notif-5',
        category: 'mercato',
        title: 'Détection U19 / Seniors R1',
        body: 'Un club partenaire recherche un profil correspondant à tes critères.',
        timestamp: 'Il y a 2j',
        read: readIds.has('notif-5'),
        priority: 'normal',
        badgeLabel: 'MERCATO',
        badgeColor: PRO_DATA_VIOLET,
        icon: 'flash',
        actionLabel: 'Voir l’opportunité',
        contextAction: () => nav.openMercato('detections'),
      },
    ],
    [readIds, nav]
  );

  const markAllAsRead = () => {
    prodayHaptics.impactLight();
    setReadIds(new Set(initialAlerts.map((a) => a.id)));
  };

  const handleAlertPress = (alert: CentralizedAlert) => {
    prodayHaptics.selection();
    setReadIds((prev) => new Set([...prev, alert.id]));
    alert.contextAction();
  };

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') return initialAlerts;
    return initialAlerts.filter((a) => a.category === activeFilter);
  }, [initialAlerts, activeFilter]);

  const unreadCount = useMemo(
    () => initialAlerts.filter((a) => !readIds.has(a.id)).length,
    [initialAlerts, readIds]
  );

  const filters: { id: NotificationCategory; label: string }[] = [
    { id: 'all', label: 'Toutes' },
    { id: 'convocation', label: 'Convocations' },
    { id: 'carpool', label: 'Covoiturage' },
    { id: 'coach_ai', label: 'Coaching IA' },
    { id: 'club', label: 'Club' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : null}
          <View>
            <View style={styles.titleWithBadge}>
              <ProDayText style={styles.headerTitle}>Notifications</ProDayText>
              {unreadCount > 0 ? (
                <View style={styles.unreadCountPill}>
                  <ProDayText style={styles.unreadCountText}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</ProDayText>
                </View>
              ) : null}
            </View>
            <ProDayText style={styles.headerSub}>
              Alertes centralisées avec redirection contextuelle
            </ProDayText>
          </View>
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn} activeOpacity={0.8}>
            <Ionicons name="checkmark-done" size={14} color={colors.success} />
            <ProDayText style={styles.markReadText}>Tout marquer lu</ProDayText>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersRail}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {filters.map((f) => {
            const isActive = f.id === activeFilter;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => {
                  prodayHaptics.selection();
                  setActiveFilter(f.id);
                }}
                activeOpacity={0.8}
              >
                <ProDayText style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f.label}
                </ProDayText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Alerts Feed */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={[styles.feedContent, { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={36} color={colors.textDim} />
            <ProDayText style={styles.emptyTitle}>Aucune notification</ProDayText>
            <ProDayText style={styles.emptySub}>
              Tu es à jour ! Les nouvelles alertes de convocation ou covoiturage apparaîtront ici.
            </ProDayText>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const isUnread = !readIds.has(alert.id);
            return (
              <TouchableOpacity
                key={alert.id}
                style={[styles.alertCard, isUnread && styles.alertCardUnread]}
                onPress={() => handleAlertPress(alert)}
                activeOpacity={0.85}
              >
                <View style={styles.alertCardHeader}>
                  <View style={styles.alertBadgeRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${alert.badgeColor}20`, borderColor: `${alert.badgeColor}55` }]}>
                      <Ionicons name={alert.icon} size={11} color={alert.badgeColor} />
                      <ProDayText style={[styles.categoryBadgeText, { color: alert.badgeColor }]}>
                        {alert.badgeLabel}
                      </ProDayText>
                    </View>
                    {isUnread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <ProDayText style={styles.alertTimestamp}>{alert.timestamp}</ProDayText>
                </View>

                <ProDayText style={styles.alertTitle}>{alert.title}</ProDayText>
                <ProDayText style={styles.alertBody}>{alert.body}</ProDayText>

                {/* Contextual Action Footer */}
                <View style={styles.alertFooter}>
                  <ProDayText style={styles.actionCtaText}>{alert.actionLabel}</ProDayText>
                  <Ionicons name="arrow-forward" size={14} color={colors.success} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  unreadCountPill: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.error,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  filtersRail: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.brandInverse,
    borderColor: colors.brandInverse,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.background,
    fontWeight: '900',
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    padding: spacing.lg,
    gap: 10,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  alertCardUnread: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.success,
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  alertTimestamp: {
    fontSize: 11,
    color: colors.textDim,
    fontWeight: '600',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  alertBody: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  actionCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
});
