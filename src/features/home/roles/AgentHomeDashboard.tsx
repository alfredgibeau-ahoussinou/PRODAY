import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { StaffRoleHomeProps } from './resolveRoleHomeDashboard';
import {
  StaffRoleHomeShell,
  StaffSectionTitle,
  StaffStatRow,
  StaffQuickActions,
  StaffEmptyCard,
} from './staffRoleHomeShared';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useTabNavigation } from '../../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { useAppTheme } from '../../../context/ProductLineContext';
import { scoutingShortlistService } from '../../../services/scoutingShortlist.service';
import { usersService } from '../../../services/users.service';
import { clubsService } from '../../../services/clubs.service';
import type { RolePanelAction } from '../../../content/roleDashboardExperience';
import { FeedPublishModal } from '../../../components/feed/FeedPublishModal';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { spacing, radius } from '../../../theme/designTokens';
import { StyleSheet, View } from 'react-native';

interface MandateRow {
  uid: string;
  name: string;
  clubLabel: string;
  mandateEnd: string;
  negoStatus: string;
}

function deriveNegoStatus(
  availability: string | undefined,
  notes: string | undefined,
): string {
  if (availability === 'negotiating') return 'Discussion';
  if (availability === 'available') return 'Libre';
  if (availability === 'unavailable') return 'Sous contrat';
  if (notes?.trim()) return notes.trim().slice(0, 28);
  return '…';
}

function formatMandateEnd(updatedAt: Date): string {
  const end = new Date(updatedAt);
  end.setFullYear(end.getFullYear() + 1);
  const days = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Expiré';
  return `${days} j`;
}

export const AgentHomeDashboard: React.FC<StaffRoleHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { data, refresh } = useDashboardData(profile);
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const clubId = profile.profile.club_id ?? profile.uid;

  const [rows, setRows] = useState<MandateRow[]>([]);
  const [extraLoading, setExtraLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);

  const loadMandates = useCallback(async () => {
    setExtraLoading(true);
    try {
      const entries = await scoutingShortlistService.listByClub(clubId);
      const resolved = await Promise.all(
        entries.slice(0, 12).map(async (entry) => {
          const user = await usersService.getPublicById(entry.player_uid);
          let clubLabel = '…';
          const playerClubId = user?.profile.club_id;
          if (playerClubId) {
            const club = await clubsService.getById(playerClubId);
            clubLabel = club?.name ?? playerClubId.slice(0, 8);
          } else if (user?.profile.availability === 'available') {
            clubLabel = t('roleHome.agent.freeAgent');
          }
          return {
            uid: entry.player_uid,
            name: user?.display_name ?? entry.player_uid.slice(0, 8),
            clubLabel,
            mandateEnd: formatMandateEnd(entry.updated_at),
            negoStatus: deriveNegoStatus(user?.profile.availability, entry.notes),
          };
        }),
      );
      setRows(resolved);
    } finally {
      setExtraLoading(false);
    }
  }, [clubId, t]);

  useEffect(() => {
    void loadMandates();
  }, [loadMandates]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), loadMandates()]);
    await onRefresh?.();
  }, [refresh, loadMandates, onRefresh]);

  const handleQuickAction = (action: RolePanelAction) => {
    if (action.title === 'Repérage') {
      nav.openMercato('home');
      return;
    }
    if (action.title === 'Mandats') {
      nav.openProfile();
      return;
    }
    if (action.title === 'Matchs amicaux') {
      nav.openMatchs({ homeTab: 'matches' });
    }
  };

  const tableHeader = useMemo(
    () => (
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <ProDayText variant="caption" muted style={styles.colPlayer}>
          {t('roleHome.agent.colPlayer')}
        </ProDayText>
        <ProDayText variant="caption" muted style={styles.colClub}>
          {t('roleHome.agent.colClub')}
        </ProDayText>
        <ProDayText variant="caption" muted style={styles.colEnd}>
          {t('roleHome.agent.colEnd')}
        </ProDayText>
        <ProDayText variant="caption" muted style={styles.colNego}>
          {t('roleHome.agent.colNego')}
        </ProDayText>
      </View>
    ),
    [colors.border, t],
  );

  return (
    <>
      <StaffRoleHomeShell
        profile={profile}
        role="agent"
        unreadMessages={unreadMessages}
        globalScore={data.pulse.score}
        loading={data.loading || extraLoading}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing}
      >
        <StaffSectionTitle
          title={t('roleHome.agent.mandatesTitle')}
          subtitle={t('roleHome.agent.mandatesSub')}
        />
        <StaffStatRow
          items={[
            {
              label: t('roleHome.agent.represented'),
              value: String(rows.length),
              highlight: true,
            },
            {
              label: t('roleHome.agent.scouting'),
              value: String(data.detections.length),
            },
          ]}
        />

        {rows.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.agent.noMandates')} />
        ) : (
          <GlassCard style={styles.table}>
            {tableHeader}
            {rows.slice(0, 8).map((row) => (
              <PressableSpring
                key={row.uid}
                style={[styles.dataRow, { borderBottomColor: colors.border }]}
                onPress={() => nav.openMercato('home')}
                scaleTo={0.99}
              >
                <ProDayText variant="body" style={styles.colPlayer} numberOfLines={1}>
                  {row.name}
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.colClub} numberOfLines={1}>
                  {row.clubLabel}
                </ProDayText>
                <ProDayText variant="caption" style={styles.colEnd}>
                  {row.mandateEnd}
                </ProDayText>
                <ProDayText variant="caption" accent style={styles.colNego} numberOfLines={1}>
                  {row.negoStatus}
                </ProDayText>
              </PressableSpring>
            ))}
          </GlassCard>
        )}

        <GlassCard variant="accent" style={styles.cta}>
          <ProDayText variant="section">{t('roleHome.agent.publishTitle')}</ProDayText>
          <ProDayText variant="caption" muted>
            {t('roleHome.agent.publishSub')}
          </ProDayText>
          <PressableSpring
            style={styles.ctaBtn}
            onPress={() => setPublishOpen(true)}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="body" accent>
              {t('roleHome.agent.publishCta')}
            </ProDayText>
          </PressableSpring>
        </GlassCard>

        <StaffSectionTitle title={t('roleHome.quickActions')} />
        <StaffQuickActions role="agent" onAction={handleQuickAction} />
      </StaffRoleHomeShell>

      <FeedPublishModal
        visible={publishOpen}
        profile={profile}
        onClose={() => setPublishOpen(false)}
        onOpenChat={(threadId) => {
          setPublishOpen(false);
          tabNav.openChat(threadId);
        }}
        onOpenMessages={() => {
          setPublishOpen(false);
          nav.setActiveTab('messages');
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  table: {
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 0,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  colPlayer: { flex: 2.2, fontWeight: '700' },
  colClub: { flex: 1.8 },
  colEnd: { flex: 1, textAlign: 'center' },
  colNego: { flex: 1.6, textAlign: 'right' },
  cta: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
