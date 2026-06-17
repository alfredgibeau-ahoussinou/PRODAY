import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import type { HealthPoleGroupId } from '../../utils/healthPoleSpecialties';
import { HEALTH_POLE_CONTENT } from '../../content/healthDirectory';
import { PhysioCarePanel } from '../feed/PhysioCarePanel';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface HealthPolePageProps {
  profile: User;
  poleGroup: HealthPoleGroupId;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  onBookPhysio: (physio: User) => void;
}

/** Page pôle santé — hero, services, annuaire praticiens. */
export const HealthPolePage: React.FC<HealthPolePageProps> = ({
  profile,
  poleGroup,
  onOpenChat,
  onOpenMessages,
  onBookPhysio,
}) => {
  const { colors } = useAppTheme();
  const content = HEALTH_POLE_CONTENT[poleGroup];
  const [injuryFocus, setInjuryFocus] = useState<string | null>(null);

  const injuryLabel = useMemo(
    () => content.injuryPaths?.find((p) => p.id === injuryFocus)?.focus ?? null,
    [content.injuryPaths, injuryFocus]
  );

  return (
    <View style={styles.root}>
      <ProDaySurface variant="accent" style={[styles.hero, { borderColor: colors.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name={content.icon} size={24} color={colors.accent} variant="filled" />
        </View>
        <View style={styles.heroCopy}>
          <ProDayText variant="caption" accent style={styles.eyebrow}>
            {content.eyebrow}
          </ProDayText>
          <ProDayText variant="section">{content.title}</ProDayText>
          <ProDayText variant="body" muted>
            {content.subtitle}
          </ProDayText>
        </View>
      </ProDaySurface>

      <ProDayText variant="eyebrow" muted style={styles.blockLabel}>
        Quand consulter ?
      </ProDayText>
      <View style={[styles.bulletList, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {content.whenToConsult.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
            <ProDayText variant="caption" muted style={styles.bulletText}>
              {line}
            </ProDayText>
          </View>
        ))}
      </View>

      <ProDayText variant="eyebrow" muted style={styles.blockLabel}>
        Accompagnements
      </ProDayText>
      <View style={styles.serviceGrid}>
        {content.services.map((service) => (
          <ProDaySurface
            key={service.id}
            variant="module"
            style={[styles.serviceCard, { borderColor: colors.border }]}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.accentSoft }]}>
              <Icon name={service.icon} size={16} color={colors.accent} variant="filled" />
            </View>
            <ProDayText variant="caption" accent style={styles.serviceTitle}>
              {service.title}
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.serviceBody}>
              {service.body}
            </ProDayText>
          </ProDaySurface>
        ))}
      </View>

      {content.injuryPaths && content.injuryPaths.length > 0 ? (
        <>
          <ProDayText variant="eyebrow" muted style={styles.blockLabel}>
            Parcours blessure
          </ProDayText>
          <View style={styles.pathRow}>
            {content.injuryPaths.map((path) => {
              const on = injuryFocus === path.id;
              return (
                <PressableSpring
                  key={path.id}
                  onPress={() => setInjuryFocus(on ? null : path.id)}
                  scaleTo={0.96}
                  haptic
                >
                  <View
                    style={[
                      styles.pathChip,
                      {
                        borderColor: on ? colors.accent : colors.border,
                        backgroundColor: on ? colors.accentSoft : colors.surface,
                      },
                    ]}
                  >
                    <ProDayText variant="caption" accent={on} style={styles.pathLabel}>
                      {path.label}
                    </ProDayText>
                    <ProDayText variant="caption" muted numberOfLines={1}>
                      {path.hint}
                    </ProDayText>
                  </View>
                </PressableSpring>
              );
            })}
          </View>
          {injuryLabel ? (
            <ProDayText variant="caption" accent style={styles.pathFocus}>
              Focus : {injuryLabel}
            </ProDayText>
          ) : null}
        </>
      ) : null}

      <ProDayText variant="caption" muted style={styles.bookingHint}>
        {content.bookingHint}
      </ProDayText>

      <PhysioCarePanel
        profile={profile}
        onOpenChat={onOpenChat}
        onOpenMessages={onOpenMessages}
        onBookPhysio={onBookPhysio}
        poleGroup={poleGroup}
        expanded
        hideHeader
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  eyebrow: { letterSpacing: 0.8, fontWeight: '800' },
  blockLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  bulletList: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  bulletText: { flex: 1, lineHeight: 18 },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  serviceCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    padding: spacing.sm,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  serviceTitle: { fontWeight: '800' },
  serviceBody: { lineHeight: 16, fontSize: 11 },
  pathRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  pathChip: {
    minWidth: '46%',
    flexGrow: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  pathLabel: { fontWeight: '800' },
  pathFocus: { marginBottom: spacing.sm, fontWeight: '700' },
  bookingHint: { marginBottom: spacing.sm, lineHeight: 18 },
});
