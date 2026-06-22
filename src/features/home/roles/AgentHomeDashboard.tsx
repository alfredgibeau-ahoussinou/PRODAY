import React, { useCallback, useEffect, useState } from 'react';
import type { StaffRoleHomeProps } from './resolveRoleHomeDashboard';
import {
  StaffRoleHomeShell,
  StaffSectionTitle,
  StaffStatRow,
  StaffQuickActions,
  StaffListCard,
  StaffEmptyCard,
} from './staffRoleHomeShared';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useTabNavigation } from '../../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { scoutingShortlistService } from '../../../services/scoutingShortlist.service';
import { usersService } from '../../../services/users.service';
import type { RolePanelAction } from '../../../content/roleDashboardExperience';
import { FeedPublishModal } from '../../../components/feed/FeedPublishModal';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { spacing } from '../../../theme/designTokens';
import { StyleSheet } from 'react-native';

interface MandatePlayer {
  uid: string;
  name: string;
  position?: string;
  city?: string;
}

export const AgentHomeDashboard: React.FC<StaffRoleHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { data, refresh } = useDashboardData(profile);
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const clubId = profile.profile.club_id ?? profile.uid;

  const [players, setPlayers] = useState<MandatePlayer[]>([]);
  const [extraLoading, setExtraLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);

  const loadMandates = useCallback(async () => {
    setExtraLoading(true);
    try {
      const entries = await scoutingShortlistService.listByClub(clubId);
      const resolved = await Promise.all(
        entries.slice(0, 12).map(async (entry) => {
          const user = await usersService.getPublicById(entry.player_uid);
          return {
            uid: entry.player_uid,
            name: user?.display_name ?? entry.player_uid.slice(0, 8),
            position: user?.profile.position,
            city: user?.city,
          };
        })
      );
      setPlayers(resolved);
    } finally {
      setExtraLoading(false);
    }
  }, [clubId]);

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
              value: String(players.length),
              highlight: true,
            },
            {
              label: t('roleHome.agent.scouting'),
              value: String(data.detections.length),
            },
          ]}
        />

        {players.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.agent.noMandates')} />
        ) : (
          players.slice(0, 6).map((player, index) => (
            <StaffListCard
              key={player.uid}
              index={index + 1}
              title={player.name}
              subtitle={`${player.position ?? ''} · ${player.city ?? ''}`.trim()}
              onPress={() => nav.openMercato('home')}
            />
          ))
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

        <StaffListCard
          index={5}
          title={t('roleHome.agent.mercatoScouting')}
          subtitle={t('roleHome.agent.mercatoScoutingSub')}
          onPress={() => nav.openMercato('home')}
        />

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
