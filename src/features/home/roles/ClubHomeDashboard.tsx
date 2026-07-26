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
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { clubAnnouncementsService } from '../../../services/clubAnnouncements.service';
import { sponsorsService } from '../../../services/sponsors.service';
import { usersService } from '../../../services/users.service';
import type { ClubAnnouncement } from '../../../models/ClubAnnouncement';
import type { ClubFundingGoal } from '../../../models/SponsorOffer';
import type { RolePanelAction } from '../../../content/roleDashboardExperience';
import { PushScreenTransition } from '../../../components/motion';
import { DetectionEventsScreen } from '../../../screens/DetectionEventsScreen';
import { ClubContactsScreen } from '../../../screens/club/ClubContactsScreen';

export const ClubHomeDashboard: React.FC<StaffRoleHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { data, refresh } = useDashboardData(profile);
  const nav = useTabNavigationActions();
  const clubId = profile.profile.club_id ?? profile.uid;

  const [membersCount, setMembersCount] = useState(0);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [fundingGoals, setFundingGoals] = useState<ClubFundingGoal[]>([]);
  const [extraLoading, setExtraLoading] = useState(true);
  const [showDetections, setShowDetections] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const loadClubData = useCallback(async () => {
    setExtraLoading(true);
    try {
      const [members, ann, goals] = await Promise.all([
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([]),
        clubAnnouncementsService.listByClub(clubId, 6),
        sponsorsService.listFundingGoalsForClub(clubId),
      ]);
      setMembersCount(members.length);
      setAnnouncements(ann);
      setFundingGoals(goals);
    } finally {
      setExtraLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void loadClubData();
  }, [loadClubData]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), loadClubData()]);
    await onRefresh?.();
  }, [refresh, loadClubData, onRefresh]);

  const handleQuickAction = (action: RolePanelAction) => {
    if (action.title === 'Annonces club') {
      nav.openDashboard('gestion');
      return;
    }
    if (action.title === 'Structure club') {
      nav.setActiveTab('home');
      return;
    }
    if (action.title === 'Détections') {
      setShowDetections(true);
      return;
    }
    if (action.title === 'Stages') {
      nav.openMercato('stages');
    }
  };

  return (
    <>
      <StaffRoleHomeShell
        profile={profile}
        role="club"
        unreadMessages={unreadMessages}
        globalScore={data.pulse.score}
        loading={data.loading || extraLoading}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing}
      >
        <StaffSectionTitle
          title={t('roleHome.club.rosterTitle')}
          subtitle={t('roleHome.club.rosterSub')}
        />
        <StaffStatRow
          items={[
            {
              label: t('roleHome.club.members'),
              value: String(membersCount),
              highlight: true,
            },
            {
              label: t('roleHome.club.announcements'),
              value: String(announcements.length),
            },
            {
              label: t('roleHome.club.funding'),
              value: String(fundingGoals.length),
            },
          ]}
        />
        <StaffListCard
          index={1}
          title={t('roleHome.club.manageRoster')}
          subtitle={t('roleHome.club.manageRosterSub')}
          onPress={() => nav.setActiveTab('home')}
        />
        <StaffListCard
          index={2}
          title={t('roleHome.club.contacts')}
          subtitle={t('roleHome.club.contactsSub')}
          onPress={() => setShowContacts(true)}
        />

        <StaffSectionTitle title={t('roleHome.club.announcementsTitle')} />
        {announcements.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.club.noAnnouncements')} />
        ) : (
          announcements.slice(0, 4).map((item, index) => (
            <StaffListCard
              key={item.id}
              index={index + 3}
              title={item.title}
              subtitle={item.body}
              onPress={() => nav.openDashboard('gestion')}
            />
          ))
        )}

        <StaffSectionTitle title={t('roleHome.club.fundingTitle')} />
        {fundingGoals.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.club.noFunding')} />
        ) : (
          fundingGoals.slice(0, 3).map((goal, index) => (
            <StaffListCard
              key={goal.id}
              index={index + 4}
              title={goal.title}
              subtitle={goal.description}
              meta={`${goal.raised_amount_eur}€ / ${goal.target_amount_eur}€`}
            />
          ))
        )}

        <StaffListCard
          index={7}
          title={t('roleHome.club.detections')}
          subtitle={t('roleHome.club.detectionsSub')}
          onPress={() => setShowDetections(true)}
        />

        <StaffSectionTitle title={t('roleHome.quickActions')} />
        <StaffQuickActions role="club" onAction={handleQuickAction} />
      </StaffRoleHomeShell>

      <PushScreenTransition active={showDetections}>
        {showDetections ? (
          <DetectionEventsScreen onBack={() => setShowDetections(false)} />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={showContacts}>
        {showContacts ? (
          <ClubContactsScreen
            clubId={clubId}
            canEdit
            onBack={() => setShowContacts(false)}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};
