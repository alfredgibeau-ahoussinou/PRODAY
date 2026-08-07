import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { ClubEventOrganization } from './ClubEventOrganization';
import { ClubTrialSheetsPanel } from './ClubTrialSheetsPanel';
import { ClubEquipmentMarketPanel } from './ClubEquipmentMarketPanel';
import { ClubRosterBoardPanel } from './ClubRosterBoardPanel';
import { ClubCamerasPanel } from './ClubCamerasPanel';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { radius, spacing } from '../../theme/designTokens';
import { defaultMatchSponsorPackage, CLUB_SPONSOR_PAYMENT_NOTICE } from '../../models/ClubSponsorPackage';
import type { User } from '../../models/User';

type HubSection =
  | 'overview'
  | 'events'
  | 'bourse'
  | 'mercato'
  | 'cameras'
  | 'equipment'
  | 'sponsors';

/**
 * Club Hub contextuel — sections, pas 15 boutons.
 */
export const ClubHubSections: React.FC<{
  clubId: string;
  profile: User;
  members: User[];
  teamsCount: number;
  playersCount: number;
  coachesCount: number;
  pendingCount: number;
}> = ({ clubId, profile, members, teamsCount, playersCount, coachesCount, pendingCount }) => {
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const [section, setSection] = useState<HubSection>('overview');
  const sponsorPkg = defaultMatchSponsorPackage(clubId);

  const chips: { id: HubSection; label: string }[] = [
    { id: 'overview', label: 'Pilotage' },
    { id: 'events', label: 'Organisation' },
    { id: 'bourse', label: 'Bourse' },
    { id: 'mercato', label: 'Mercato' },
    { id: 'cameras', label: 'Caméras' },
    { id: 'equipment', label: 'Équipements' },
    { id: 'sponsors', label: 'Sponsors' },
  ];

  return (
    <View style={styles.wrap}>
      <ProDayText variant="eyebrow" muted>
        Club Hub
      </ProDayText>
      <View style={styles.chips}>
        {chips.map((c) => (
          <PressableSpring
            key={c.id}
            onPress={() => setSection(c.id)}
            scaleTo={0.96}
            style={[
              styles.chip,
              {
                borderColor: section === c.id ? colors.accent : colors.border,
                backgroundColor: section === c.id ? colors.accentSoft : colors.surfaceMuted,
              },
            ]}
          >
            <ProDayText variant="caption" accent={section === c.id}>
              {c.label}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>

      {section === 'overview' ? (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="section">Pilotage président</ProDayText>
          <ProDayText variant="caption" muted>
            🟢 {teamsCount} équipes · {playersCount} joueurs · {coachesCount} coachs
          </ProDayText>
          {pendingCount > 0 ? (
            <ProDayText variant="caption" accent>
              🟠 {pendingCount} adhésion(s) à valider
            </ProDayText>
          ) : (
            <ProDayText variant="caption" muted>
              🟢 Aucune adhésion en attente
            </ProDayText>
          )}
          <PressableSpring onPress={() => setSection('bourse')} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              Bourse de recrutement interne
            </ProDayText>
          </PressableSpring>
          <PressableSpring onPress={() => setSection('cameras')} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              Caméras & Vidéo
            </ProDayText>
          </PressableSpring>
          <PressableSpring onPress={() => nav.openMatchs()} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              Match Center
            </ProDayText>
          </PressableSpring>
          <PressableSpring onPress={() => nav.setActiveTab('recrutement')} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              Suivi Observé → Intégré
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      ) : null}

      {section === 'events' ? (
        <ClubEventOrganization
          clubId={clubId}
          userId={profile.uid}
          organizerName={profile.display_name || 'Dirigeant'}
        />
      ) : null}

      {section === 'bourse' ? (
        <ClubRosterBoardPanel clubId={clubId} profile={profile} members={members} />
      ) : null}

      {section === 'mercato' ? (
        <View style={{ gap: spacing.sm }}>
          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="section">Mercato externe</ProDayText>
            <ProDayText variant="caption" muted>
              Après le vivier interne — recherches hors club et suivi Observé → Intégré.
            </ProDayText>
            <PressableSpring onPress={() => setSection('bourse')} scaleTo={0.96} haptic>
              <ProDayText variant="caption" accent style={styles.link}>
                D’abord la bourse interne
              </ProDayText>
            </PressableSpring>
            <PressableSpring onPress={() => nav.setActiveTab('recrutement')} scaleTo={0.96} haptic>
              <ProDayText variant="caption" accent style={styles.link}>
                Ouvrir le suivi
              </ProDayText>
            </PressableSpring>
          </ProDaySurface>
          <ClubTrialSheetsPanel clubId={clubId} profile={profile} />
        </View>
      ) : null}

      {section === 'cameras' ? (
        <ClubCamerasPanel clubId={clubId} profile={profile} />
      ) : null}

      {section === 'equipment' ? (
        <ClubEquipmentMarketPanel clubId={clubId} profile={profile} />
      ) : null}

      {section === 'sponsors' ? (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="section">Micro-sponsoring</ProDayText>
          <ProDayText variant="caption" muted>
            Package configurable : {sponsorPkg.label} — {(sponsorPkg.price_cents / 100).toFixed(0)} €
          </ProDayText>
          <ProDayText variant="caption" muted>
            Visibilité promise uniquement si disponible : {sponsorPkg.visibility_slots.join(', ')}.
          </ProDayText>
          <ProDayText variant="caption" muted>
            {CLUB_SPONSOR_PAYMENT_NOTICE}
          </ProDayText>
          <PressableSpring onPress={() => nav.openDashboard('sponsors')} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              Objectifs / financements club
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  link: { fontWeight: '800' },
});
