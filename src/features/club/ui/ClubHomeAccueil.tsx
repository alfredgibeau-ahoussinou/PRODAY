/**
 * Composition visuelle Accueil Club — crest hero, priorité unique, équipes.
 * Bindings / handlers restent dans ClubHomeScreen. Pas de CTA copilote ici (FAB / Menu).
 */
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import type { TeamEvent } from '../../../models/TeamEvent';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import {
  clubEventTone,
  clubRadius,
  clubShadow,
  clubSpace,
  clubType,
} from '../theme/clubDesignSystem';
import { ClubStatusPill, ClubText } from './clubUi';

function formatKickoffDay(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** En-tête identité club — crest hero-level, nom sous le logo, méta discrète. */
export function ClubHomeIdentityHeader({
  greeting,
  clubName,
  statusLabel,
  statusTone,
  metaLine,
  onPressCrest,
  crestUploading,
}: {
  greeting: string;
  clubName: string;
  statusLabel: string;
  statusTone: 'ok' | 'warn' | 'alert';
  /** Ligne discrète sous le nom (ex. effectif · coachs · équipes). */
  metaLine?: string;
  /** Tap crest → ajouter / changer le logo. */
  onPressCrest?: () => void;
  crestUploading?: boolean;
}) {
  const { tokens, logoUrl } = useClubTheme();
  const styles = useMemo(() => identityStyles(tokens), [tokens]);
  const crestLetter = (clubName.trim().charAt(0) || 'C').toUpperCase();
  const meta = metaLine?.trim();

  const crestInner = logoUrl ? (
    <Image source={{ uri: logoUrl }} style={styles.crestImg} resizeMode="cover" />
  ) : (
    <LinearGradient
      colors={[tokens.accentDeep, tokens.accent]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.crestPh}
    >
      <ClubText style={styles.crestLetter}>{crestLetter}</ClubText>
    </LinearGradient>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.statusCol}>
        <ClubStatusPill label={statusLabel} tone={statusTone} />
      </View>
      <View style={styles.heroCol}>
        <PressableSpring
          onPress={onPressCrest}
          disabled={!onPressCrest || crestUploading}
          scaleTo={0.97}
          haptic={Boolean(onPressCrest)}
          style={[styles.crest, { borderColor: tokens.successSoft }]}
          accessibilityRole={onPressCrest ? 'button' : undefined}
          accessibilityLabel={logoUrl ? 'Changer le logo du club' : 'Ajouter le logo du club'}
        >
          <View style={styles.crestInner}>
            {crestUploading ? (
              <View style={[styles.crestPh, { backgroundColor: tokens.elevated }]}>
                <ClubText variant="caption" muted>
                  …
                </ClubText>
              </View>
            ) : (
              crestInner
            )}
          </View>
          {onPressCrest && !crestUploading ? (
            <View style={[styles.crestBadge, { backgroundColor: tokens.accent }]}>
              <Icon name="camera" size={14} color={tokens.onAccent} />
            </View>
          ) : null}
        </PressableSpring>
        <ClubText variant="label" muted style={styles.greet}>
          {greeting}
        </ClubText>
        <ClubText variant="h1" numberOfLines={2} style={styles.clubName}>
          {clubName}
        </ClubText>
        {meta ? (
          <ClubText variant="caption" muted numberOfLines={2} style={styles.meta}>
            {meta}
          </ClubText>
        ) : null}
      </View>
    </View>
  );
}

/** Bandeau mini-stats une ligne — effectif + coachs (+ équipes), pas de grille 2×2. */
export function ClubHomeMiniStats({
  players,
  coaches,
  teams,
  onPlayers,
  onCoaches,
  onTeams,
}: {
  players: number;
  coaches: number;
  teams: number;
  onPlayers: () => void;
  onCoaches: () => void;
  onTeams: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => miniStatsStyles(tokens), [tokens]);

  const cells = [
    { key: 'players', label: 'Effectif', value: players, onPress: onPlayers },
    { key: 'coaches', label: 'Coachs', value: coaches, onPress: onCoaches },
    { key: 'teams', label: 'Équipes', value: teams, onPress: onTeams },
  ] as const;

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.strip}>
        {cells.map((cell, i) => (
          <React.Fragment key={cell.key}>
            {i > 0 ? <View style={[styles.sep, { backgroundColor: tokens.border }]} /> : null}
            <PressableSpring onPress={cell.onPress} scaleTo={0.97} haptic style={styles.cell}>
              <ClubText variant="label" muted style={styles.label}>
                {cell.label}
              </ClubText>
              <ClubText variant="body" style={styles.value}>
                {cell.value}
              </ClubText>
            </PressableSpring>
          </React.Fragment>
        ))}
      </View>
    </AnimatedEntrance>
  );
}

/** Insight discret issu du workspace — une ligne, pas un hero briefing. */
export function ClubHomeInsightLine({ text }: { text: string }) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => insightStyles(tokens), [tokens]);
  const line = text.trim();
  if (!line) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={1} delayStep={36}>
      <View style={styles.row}>
        <View style={[styles.mark, { backgroundColor: tokens.accent }]} />
        <ClubText variant="caption" muted numberOfLines={2} style={styles.text}>
          {line}
        </ClubText>
      </View>
    </AnimatedEntrance>
  );
}

export type ClubHomePriority =
  | { kind: 'match'; event: TeamEvent }
  | { kind: 'training'; event: TeamEvent }
  | { kind: 'calm' };

/** Prochain événement — une seule priorité « jour J » (match / séance / calme). */
export function ClubHomeNextEventRow({
  priority,
  teamLabel,
  locationLabel,
  onOpen,
  onConvocations,
  onPlan,
}: {
  priority: ClubHomePriority;
  /** Équipe liée à l’événement (écran existant). */
  teamLabel?: string;
  locationLabel?: string;
  /** CTA principal → Matchs / Entraînements / Calendrier. */
  onOpen: () => void;
  /** CTA Convocations si RSVP en attente. */
  onConvocations?: () => void;
  /** Terrain libre → ouvrir Créer (honnête). */
  onPlan?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => nextEventStyles(tokens), [tokens]);

  if (priority.kind === 'calm') {
    return (
      <AnimatedEntrance kind="fadeUp" index={2} delayStep={36}>
        <View style={styles.card}>
          <LinearGradient
            colors={[tokens.pitchSoft, tokens.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.iconBadge, { backgroundColor: tokens.pitchSoft, borderColor: tokens.pitch }]}>
            <Icon name="football" size={22} color={tokens.pitch} />
          </View>
          <View style={styles.col}>
            <ClubText variant="label" style={{ color: tokens.pitch }}>
              Priorité du jour
            </ClubText>
            <ClubText variant="h2" style={styles.title}>
              Terrain libre
            </ClubText>
            <ClubText variant="caption" muted numberOfLines={2}>
              Aucun match ni séance imminente — planifiez quand vous êtes prêt.
            </ClubText>
            <View style={styles.ctaRow}>
              <PressableSpring onPress={onOpen} scaleTo={0.97} haptic style={styles.ctaPrimary}>
                <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                  Calendrier
                </ClubText>
              </PressableSpring>
              {onPlan ? (
                <PressableSpring
                  onPress={onPlan}
                  scaleTo={0.97}
                  haptic
                  style={[styles.ctaGhost, { borderColor: tokens.borderStrong }]}
                >
                  <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '700' }}>
                    Créer
                  </ClubText>
                </PressableSpring>
              ) : null}
            </View>
          </View>
        </View>
      </AnimatedEntrance>
    );
  }

  const isMatch = priority.kind === 'match';
  const tone = isMatch ? clubEventTone.match : clubEventTone.training;
  const event = priority.event;
  const starts = event.starts_at ? new Date(event.starts_at) : null;
  const clock = starts ? formatClock(starts) : null;
  const dayLabel = starts ? formatKickoffDay(starts) : null;
  const title = event.title?.trim() || (isMatch ? 'Prochain match' : 'Prochaine séance');
  const washFrom = isMatch ? 'rgba(91,163,255,0.22)' : tokens.pitchSoft;
  const washTo = tokens.surface;
  const metaBits = [teamLabel?.trim(), dayLabel, locationLabel?.trim()].filter(Boolean);
  const openLabel = isMatch ? 'Ouvrir' : 'Détail';

  return (
    <AnimatedEntrance kind="fadeUp" index={2} delayStep={36}>
      <View style={[styles.card, { borderColor: tone.color + '55' }]}>
        <LinearGradient
          colors={[washFrom, washTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.accentRail, { backgroundColor: tone.color }]} />
        <View style={[styles.iconBadge, { backgroundColor: tone.soft, borderColor: tone.color }]}>
          <Icon name={isMatch ? 'trophy' : 'football'} size={22} color={tone.color} />
        </View>
        <View style={styles.col}>
          <View style={styles.typeRow}>
            <View style={[styles.typePill, { backgroundColor: tone.soft, borderColor: tone.color }]}>
              <ClubText variant="label" style={{ color: tone.color, fontSize: 10, letterSpacing: 0.8 }}>
                {tone.label}
              </ClubText>
            </View>
            {clock ? (
              <ClubText variant="h2" style={[styles.clock, { color: tokens.foreground }]}>
                {clock}
              </ClubText>
            ) : (
              <ClubText variant="caption" muted>
                Horaire à confirmer
              </ClubText>
            )}
          </View>
          <ClubText variant="h2" numberOfLines={2} style={styles.title}>
            {title}
          </ClubText>
          {metaBits.length > 0 ? (
            <ClubText variant="caption" muted numberOfLines={2} style={styles.eventMeta}>
              {metaBits.join(' · ')}
            </ClubText>
          ) : null}
          <View style={styles.ctaRow}>
            <PressableSpring onPress={onOpen} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                {openLabel}
              </ClubText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
            {onConvocations ? (
              <PressableSpring
                onPress={onConvocations}
                scaleTo={0.97}
                haptic
                style={[styles.ctaGhost, { borderColor: tokens.warning + '66' }]}
              >
                <Icon name="people" size={13} color={tokens.warning} />
                <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '800' }}>
                  Convocations
                </ClubText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

export type ClubHomeTodayChip = {
  id: string;
  kind: 'match' | 'training';
  label: string;
  time?: string;
  onPress: () => void;
};

/** Liste « Aujourd’hui » — pleine quand il y a des RDV, masquée sinon. */
export function ClubHomeTodayPeek({
  chips,
  onSeeAll,
}: {
  chips: ClubHomeTodayChip[];
  onSeeAll?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => todayPeekStyles(tokens), [tokens]);
  const visible = chips.slice(0, 6);
  if (visible.length === 0) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={3} delayStep={36}>
      <View style={styles.block}>
        <View style={styles.head}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Aujourd’hui
          </ClubText>
          {onSeeAll ? (
            <PressableSpring onPress={onSeeAll} scaleTo={0.97} haptic style={styles.seeAll}>
              <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                Calendrier
              </ClubText>
              <Icon name="chevron-forward" size={12} color={tokens.accent} />
            </PressableSpring>
          ) : null}
        </View>
        <View style={styles.list}>
          {visible.map((chip) => {
            const tone = chip.kind === 'match' ? clubEventTone.match : clubEventTone.training;
            return (
              <PressableSpring
                key={chip.id}
                onPress={chip.onPress}
                scaleTo={0.98}
                haptic
                style={[styles.rowItem, { borderColor: tokens.border }]}
              >
                <View style={[styles.chipDot, { backgroundColor: tone.color }]} />
                <View style={styles.chipCol}>
                  <ClubText variant="caption" style={{ color: tone.color, fontWeight: '700' }}>
                    {tone.label}
                    {chip.time ? ` · ${chip.time}` : ''}
                  </ClubText>
                  <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '600' }}>
                    {chip.label}
                  </ClubText>
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.faint} />
              </PressableSpring>
            );
          })}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

export type ClubHomeTeamCard = {
  id: string;
  name: string;
  /** Ligne 1 — catégorie · genre (lisible, pas de troncature agressive). */
  metaPrimary: string;
  /** Ligne 2 — licenciés. */
  metaSecondary: string;
  coachesLabel: string;
  hasCoach: boolean;
  onPress: () => void;
};

/** Rail compact Mes équipes — cartes → espace équipe ; empty premium. */
export function ClubHomeTeamsRail({
  teams,
  onSeeAll,
  onCreateTeam,
}: {
  teams: ClubHomeTeamCard[];
  onSeeAll: () => void;
  onCreateTeam?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => teamsRailStyles(tokens), [tokens]);
  const visible = teams.slice(0, 4);

  return (
    <AnimatedEntrance kind="fadeUp" index={4} delayStep={36}>
      <View style={styles.block}>
        <View style={styles.head}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Mes équipes
          </ClubText>
          <PressableSpring onPress={onSeeAll} scaleTo={0.97} haptic style={styles.seeAll}>
            <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
              Toutes
            </ClubText>
            <Icon name="chevron-forward" size={12} color={tokens.accent} />
          </PressableSpring>
        </View>

        {visible.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: tokens.pitchSoft }]}>
              <Icon name="football" size={20} color={tokens.pitch} />
            </View>
            <ClubText variant="body" style={{ fontWeight: '700' }}>
              Aucune équipe pour l’instant
            </ClubText>
            <ClubText variant="caption" muted numberOfLines={2} style={styles.emptyBody}>
              Créez votre première catégorie (U7 → Seniors) pour structurer le club.
            </ClubText>
            {onCreateTeam ? (
              <PressableSpring onPress={onCreateTeam} scaleTo={0.97} haptic style={styles.emptyCta}>
                <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                  Créer une équipe
                </ClubText>
              </PressableSpring>
            ) : null}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
            nestedScrollEnabled
          >
            {visible.map((team) => (
              <PressableSpring
                key={team.id}
                onPress={team.onPress}
                scaleTo={0.97}
                haptic
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={`${team.name}${team.hasCoach ? '' : ', sans coach'}`}
              >
                <View
                  style={[
                    styles.accentBar,
                    { backgroundColor: team.hasCoach ? tokens.accent : tokens.warning },
                  ]}
                />
                <ClubText variant="body" numberOfLines={2} style={styles.teamName}>
                  {team.name}
                </ClubText>
                {team.metaPrimary ? (
                  <ClubText variant="caption" muted numberOfLines={2} style={styles.teamMeta}>
                    {team.metaPrimary}
                  </ClubText>
                ) : null}
                {team.metaSecondary ? (
                  <ClubText variant="caption" muted numberOfLines={1}>
                    {team.metaSecondary}
                  </ClubText>
                ) : null}
                {team.hasCoach ? (
                  <ClubText variant="caption" numberOfLines={2} style={styles.coachLine}>
                    {team.coachesLabel}
                  </ClubText>
                ) : (
                  <View style={[styles.noCoachPill, { backgroundColor: tokens.warningSoft }]}>
                    <ClubText
                      variant="caption"
                      style={{ color: tokens.warning, fontWeight: '800', fontSize: 11 }}
                    >
                      Sans coach
                    </ClubText>
                  </View>
                )}
              </PressableSpring>
            ))}
          </ScrollView>
        )}
      </View>
    </AnimatedEntrance>
  );
}

export type ClubHomeWeekItem = {
  id: string;
  kind: 'match' | 'training';
  dayLabel: string;
  time?: string;
  label: string;
  onPress: () => void;
};

/** Aperçu semaine à venir — 3–4 lignes max. */
export function ClubHomeWeekPeek({
  items,
  onSeeAll,
}: {
  items: ClubHomeWeekItem[];
  onSeeAll: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => weekPeekStyles(tokens), [tokens]);
  const visible = items.slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={5} delayStep={36}>
      <View style={styles.block}>
        <View style={styles.head}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Semaine à venir
          </ClubText>
          <PressableSpring onPress={onSeeAll} scaleTo={0.97} haptic style={styles.seeAll}>
            <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
              Voir
            </ClubText>
            <Icon name="chevron-forward" size={12} color={tokens.accent} />
          </PressableSpring>
        </View>
        <View style={styles.list}>
          {visible.map((item) => {
            const tone = item.kind === 'match' ? clubEventTone.match : clubEventTone.training;
            return (
              <PressableSpring
                key={item.id}
                onPress={item.onPress}
                scaleTo={0.98}
                haptic
                style={styles.row}
              >
                <View style={styles.dayCol}>
                  <ClubText variant="caption" style={{ fontWeight: '800', color: tokens.foreground }}>
                    {item.dayLabel}
                  </ClubText>
                  {item.time ? (
                    <ClubText variant="caption" muted>
                      {item.time}
                    </ClubText>
                  ) : null}
                </View>
                <View style={[styles.dot, { backgroundColor: tone.color }]} />
                <View style={styles.col}>
                  <ClubText variant="caption" style={{ color: tone.color, fontWeight: '700' }}>
                    {tone.label}
                  </ClubText>
                  <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '600' }}>
                    {item.label}
                  </ClubText>
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.faint} />
              </PressableSpring>
            );
          })}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Tracker de statut des dossiers de licences (Certificat médical, Paiement cotisation, Licence validée FFF). */
export function ClubHomeLicenseTrackerCard({
  pendingCount,
  medicalMissingCount = 0,
  paymentPendingCount = 0,
  fffPendingCount = 0,
  onPress,
}: {
  pendingCount: number;
  medicalMissingCount?: number;
  paymentPendingCount?: number;
  fffPendingCount?: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => licenseTrackerStyles(tokens), [tokens]);

  const hasIssues = pendingCount > 0 || medicalMissingCount > 0 || paymentPendingCount > 0 || fffPendingCount > 0;

  return (
    <AnimatedEntrance kind="fadeUp" index={3} delayStep={36}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.card}>
        <View style={styles.head}>
          <View style={[styles.iconBadge, { backgroundColor: hasIssues ? tokens.warningSoft : tokens.pitchSoft }]}>
            <Icon name="document" size={18} color={hasIssues ? tokens.warning : tokens.pitch} />
          </View>
          <View style={styles.col}>
            <View style={styles.titleRow}>
              <ClubText variant="body" style={{ fontWeight: '700' }}>
                Suivi dossiers de licences
              </ClubText>
              {pendingCount > 0 ? (
                <View style={[styles.countChip, { backgroundColor: tokens.warningSoft }]}>
                  <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '800', fontSize: 11 }}>
                    {pendingCount} en attente
                  </ClubText>
                </View>
              ) : null}
            </View>
            <ClubText variant="caption" muted numberOfLines={1}>
              Certificat médical · Cotisation · Validation FFF
            </ClubText>
          </View>
          <Icon name="chevron-forward" size={15} color={tokens.faint} />
        </View>

        <View style={styles.stepsRow}>
          <View style={[styles.stepItem, { borderColor: medicalMissingCount > 0 ? tokens.warning + '66' : tokens.pitch + '55', backgroundColor: medicalMissingCount > 0 ? tokens.warningSoft : tokens.pitchSoft }]}>
            <Icon
              name={medicalMissingCount > 0 ? 'alert-circle' : 'checkmark-circle'}
              size={12}
              color={medicalMissingCount > 0 ? tokens.warning : tokens.pitch}
            />
            <ClubText variant="caption" style={{ color: medicalMissingCount > 0 ? tokens.warning : tokens.pitch, fontWeight: '700', fontSize: 11 }}>
              {medicalMissingCount > 0 ? `${medicalMissingCount} certif. manquant` : 'Certificats OK'}
            </ClubText>
          </View>

          <View style={[styles.stepItem, { borderColor: paymentPendingCount > 0 ? tokens.warning + '66' : tokens.pitch + '55', backgroundColor: paymentPendingCount > 0 ? tokens.warningSoft : tokens.pitchSoft }]}>
            <Icon
              name={paymentPendingCount > 0 ? 'gift' : 'checkmark-circle'}
              size={12}
              color={paymentPendingCount > 0 ? tokens.warning : tokens.pitch}
            />
            <ClubText variant="caption" style={{ color: paymentPendingCount > 0 ? tokens.warning : tokens.pitch, fontWeight: '700', fontSize: 11 }}>
              {paymentPendingCount > 0 ? `${paymentPendingCount} cotis. dues` : 'Cotisations OK'}
            </ClubText>
          </View>

          <View style={[styles.stepItem, { borderColor: fffPendingCount > 0 ? tokens.accent + '66' : tokens.pitch + '55', backgroundColor: fffPendingCount > 0 ? tokens.accentSoft : tokens.pitchSoft }]}>
            <Icon
              name={fffPendingCount > 0 ? 'time' : 'checkmark-circle'}
              size={12}
              color={fffPendingCount > 0 ? tokens.accent : tokens.pitch}
            />
            <ClubText variant="caption" style={{ color: fffPendingCount > 0 ? tokens.accent : tokens.pitch, fontWeight: '700', fontSize: 11 }}>
              {fffPendingCount > 0 ? `${fffPendingCount} FFF en cours` : 'Licences FFF OK'}
            </ClubText>
          </View>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

/** Alerte présence — RSVP en attente (conservée pour réemploi ; Accueil privilégie le CTA priorité). */
export function ClubHomePresenceAlert({
  pendingCount,
  eventLabel,
  onPress,
}: {
  pendingCount: number;
  eventLabel?: string;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => presenceStyles(tokens), [tokens]);
  if (pendingCount <= 0) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={3} delayStep={36}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View style={[styles.icon, { backgroundColor: tokens.warningSoft }]}>
          <Icon name="people" size={16} color={tokens.warning} />
        </View>
        <View style={styles.col}>
          <ClubText variant="body" style={{ fontWeight: '700' }}>
            {pendingCount} réponse{pendingCount > 1 ? 's' : ''} de présence en attente
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={1}>
            {eventLabel?.trim() || 'Convocations à relancer'}
          </ClubText>
        </View>
        <Icon name="chevron-forward" size={15} color={tokens.faint} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

/** Peek communication / notifications — faits workspace, pas de feed bruyant. */
export function ClubHomeCommPeek({
  pendingMemberships,
  onNotifications,
  onCommunication,
  onPlayers,
}: {
  pendingMemberships: number;
  onNotifications: () => void;
  onCommunication: () => void;
  onPlayers: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => commPeekStyles(tokens), [tokens]);

  const membershipLine =
    pendingMemberships > 0
      ? `${pendingMemberships} adhésion${pendingMemberships > 1 ? 's' : ''} à valider`
      : 'Aucune adhésion en attente';

  return (
    <AnimatedEntrance kind="fadeUp" index={7} delayStep={36}>
      <View style={styles.block}>
        <ClubText variant="label" muted style={styles.sectionLabel}>
          Communication
        </ClubText>
        <View style={styles.list}>
          <PressableSpring onPress={onPlayers} scaleTo={0.98} haptic style={styles.row}>
            <View
              style={[
                styles.icon,
                {
                  backgroundColor:
                    pendingMemberships > 0 ? tokens.warningSoft : tokens.accentSoft,
                },
              ]}
            >
              <Icon
                name="checkmark-circle"
                size={16}
                color={pendingMemberships > 0 ? tokens.warning : tokens.accent}
              />
            </View>
            <View style={styles.col}>
              <ClubText variant="body" style={{ fontWeight: '700' }}>
                Adhésions
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1}>
                {membershipLine}
              </ClubText>
            </View>
            <Icon name="chevron-forward" size={15} color={tokens.faint} />
          </PressableSpring>
          <PressableSpring onPress={onNotifications} scaleTo={0.98} haptic style={styles.row}>
            <View style={[styles.icon, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="notifications" size={16} color={tokens.accent} />
            </View>
            <View style={styles.col}>
              <ClubText variant="body" style={{ fontWeight: '700' }}>
                Notifications
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1}>
                Alertes club et rappels
              </ClubText>
            </View>
            <Icon name="chevron-forward" size={15} color={tokens.faint} />
          </PressableSpring>
          <PressableSpring onPress={onCommunication} scaleTo={0.98} haptic style={styles.row}>
            <View style={[styles.icon, { backgroundColor: tokens.accentSoft }]}>
              <Icon name="chat" size={16} color={tokens.accent} />
            </View>
            <View style={styles.col}>
              <ClubText variant="body" style={{ fontWeight: '700' }}>
                Messages club
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1}>
                Annonces et échanges
              </ClubText>
            </View>
            <Icon name="chevron-forward" size={15} color={tokens.faint} />
          </PressableSpring>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

type TodoItem = {
  id: string;
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
};

/** Liste « À faire » — actions seulement ; sinon bandeau succès discret. */
export function ClubHomeTodoSection({
  items,
  showSuccessWhenEmpty = true,
}: {
  items: TodoItem[];
  /** État succès premium quand rien à traiter. */
  showSuccessWhenEmpty?: boolean;
  /** @deprecated Conservé pour compat. */
  emptySummary?: string;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => todoStyles(tokens), [tokens]);

  if (items.length === 0) {
    if (!showSuccessWhenEmpty) return null;
    return (
      <AnimatedEntrance kind="fadeUp" index={6} delayStep={36}>
        <View style={styles.successRow}>
          <View style={[styles.successIcon, { backgroundColor: tokens.successSoft }]}>
            <Icon name="checkmark-circle" size={16} color={tokens.success} />
          </View>
          <View style={styles.col}>
            <ClubText variant="body" style={{ fontWeight: '700' }}>
              Tout est à jour
            </ClubText>
            <ClubText variant="caption" muted numberOfLines={1}>
              Aucune action urgente pour le club
            </ClubText>
          </View>
        </View>
      </AnimatedEntrance>
    );
  }

  return (
    <AnimatedEntrance kind="fadeUp" index={6} delayStep={36}>
      <View style={styles.block}>
        <View style={styles.head}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            À faire
          </ClubText>
          <View style={[styles.countChip, { backgroundColor: tokens.warningSoft }]}>
            <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '800' }}>
              {items.length}
            </ClubText>
          </View>
        </View>
        <View style={styles.list}>
          {items.map((item, index) => (
            <PressableSpring
              key={item.id}
              onPress={item.onPress}
              scaleTo={0.98}
              haptic
              style={styles.row}
            >
              <View style={styles.rank}>
                <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '800' }}>
                  {index + 1}
                </ClubText>
              </View>
              <View style={styles.icon}>
                <Icon name={item.icon} size={16} color={tokens.accent} />
              </View>
              <View style={styles.col}>
                <ClubText variant="body" style={{ fontWeight: '700' }}>
                  {item.label}
                </ClubText>
                <ClubText variant="caption" muted numberOfLines={2}>
                  {item.hint}
                </ClubText>
              </View>
              <Icon name="chevron-forward" size={15} color={tokens.faint} />
            </PressableSpring>
          ))}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Raccourcis texte (max 2) — pas de grosses cartes. */
export function ClubHomeShortcutLinks({
  links,
}: {
  links: { id: string; label: string; onPress: () => void }[];
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => shortcutStyles(tokens), [tokens]);
  const visible = links.slice(0, 2);
  if (visible.length === 0) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={8} delayStep={36}>
      <View style={styles.row}>
        {visible.map((link, i) => (
          <React.Fragment key={link.id}>
            {i > 0 ? (
              <ClubText variant="caption" muted style={styles.dot}>
                ·
              </ClubText>
            ) : null}
            <PressableSpring onPress={link.onPress} scaleTo={0.97} haptic style={styles.link}>
              <ClubText variant="body" style={{ color: tokens.accent, fontWeight: '700' }}>
                {link.label}
              </ClubText>
              <Icon name="chevron-forward" size={13} color={tokens.accent} />
            </PressableSpring>
          </React.Fragment>
        ))}
      </View>
    </AnimatedEntrance>
  );
}

const sectionLabelBase = {
  letterSpacing: 1.05,
  opacity: 0.92,
};

const identityStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      paddingTop: clubSpace.xl,
      paddingBottom: clubSpace.xl,
      paddingHorizontal: clubSpace.lg,
      marginHorizontal: -clubSpace.xs,
      overflow: 'hidden',
      borderRadius: clubRadius.xl,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.bg,
      ...clubShadow.soft,
    },
    heroCol: {
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingTop: clubSpace.sm,
    },
    crest: {
      width: 112,
      height: 112,
      borderRadius: clubRadius.pill,
      borderWidth: 3,
      backgroundColor: tokens.elevated,
      flexShrink: 0,
      marginBottom: clubSpace.xs,
      ...clubShadow.lift,
    },
    crestInner: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: clubRadius.pill,
      overflow: 'hidden',
    },
    crestImg: { width: '100%', height: '100%' },
    crestPh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    crestBadge: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: tokens.bg,
      zIndex: 2,
    },
    crestLetter: {
      ...clubType.display,
      color: tokens.onAccent,
      fontSize: 44,
      lineHeight: 48,
    },
    greet: {
      letterSpacing: 0.35,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '700',
      textTransform: 'uppercase',
      textAlign: 'center',
      opacity: 0.85,
    },
    clubName: {
      letterSpacing: -0.55,
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '800',
      textAlign: 'center',
      paddingHorizontal: clubSpace.md,
    },
    meta: {
      textAlign: 'center',
      marginTop: 2,
      opacity: 0.9,
      lineHeight: 17,
      paddingHorizontal: clubSpace.sm,
    },
    statusCol: {
      position: 'absolute',
      top: clubSpace.md,
      right: clubSpace.md,
      zIndex: 2,
      maxWidth: 120,
    },
  });

const miniStatsStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: clubSpace.sm,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    cell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 2,
    },
    label: {
      fontSize: 9,
      lineHeight: 11,
      letterSpacing: 0.9,
    },
    value: {
      fontWeight: '800',
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.3,
      color: tokens.foreground,
    },
    sep: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      marginVertical: 4,
    },
  });

const insightStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.sm,
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    mark: {
      width: 3,
      height: 14,
      borderRadius: 2,
      marginTop: 1,
      flexShrink: 0,
    },
    text: {
      flex: 1,
      lineHeight: 17,
    },
  });

const nextEventStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.md,
      paddingVertical: clubSpace.xl,
      paddingHorizontal: clubSpace.lg,
      paddingLeft: clubSpace.lg + 4,
      minHeight: 128,
      borderRadius: clubRadius.xxl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      overflow: 'hidden',
      ...clubShadow.lift,
    },
    accentRail: {
      position: 'absolute',
      left: 0,
      top: 14,
      bottom: 14,
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
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    typePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: clubRadius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    clock: {
      fontWeight: '800',
      letterSpacing: -0.5,
      fontSize: 22,
      lineHeight: 26,
    },
    title: {
      fontWeight: '800',
      letterSpacing: -0.4,
      color: tokens.foreground,
    },
    eventMeta: {
      lineHeight: 17,
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
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
      letterSpacing: 0.2,
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

const todayPeekStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
    sectionLabel: sectionLabelBase,
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    list: { gap: clubSpace.xs },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
    },
    chipDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      flexShrink: 0,
    },
    chipCol: { flex: 1, minWidth: 0, gap: 1 },
  });

const teamsRailStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
    sectionLabel: sectionLabelBase,
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    rail: {
      gap: clubSpace.sm,
      paddingRight: clubSpace.lg,
    },
    card: {
      width: 188,
      minHeight: 132,
      gap: 5,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.md,
      paddingLeft: clubSpace.md + 4,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      ...clubShadow.soft,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    teamName: {
      fontWeight: '800',
      letterSpacing: -0.2,
      lineHeight: 20,
    },
    teamMeta: {
      lineHeight: 16,
    },
    coachLine: {
      color: tokens.muted,
      fontWeight: '600',
      marginTop: 2,
      lineHeight: 16,
    },
    noCoachPill: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: clubRadius.pill,
    },
    emptyCard: {
      gap: clubSpace.sm,
      alignItems: 'flex-start',
      paddingVertical: clubSpace.xl,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    emptyIcon: {
      width: 40,
      height: 40,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyBody: {
      lineHeight: 17,
      marginBottom: 2,
    },
    emptyCta: {
      marginTop: clubSpace.xs,
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
  });

const weekPeekStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
    sectionLabel: sectionLabelBase,
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    list: { gap: clubSpace.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.sm,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    dayCol: {
      width: 44,
      gap: 1,
      flexShrink: 0,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      flexShrink: 0,
    },
    col: { flex: 1, minWidth: 0, gap: 1 },
  });

const presenceStyles = (tokens: ClubThemeTokens) =>
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

const licenseTrackerStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.xs,
    },
    countChip: {
      paddingVertical: 1,
      paddingHorizontal: 6,
      borderRadius: clubRadius.pill,
    },
    stepsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.xs,
      paddingTop: 2,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
    },
  });

const commPeekStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
    sectionLabel: sectionLabelBase,
    list: { gap: clubSpace.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.sm,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });

const todoStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
    sectionLabel: sectionLabelBase,
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    countChip: {
      minWidth: 22,
      height: 22,
      borderRadius: clubRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 7,
    },
    list: { gap: clubSpace.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.sm,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    successRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    successIcon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rank: {
      width: 22,
      height: 22,
      borderRadius: clubRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });

const shortcutStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.xs,
    },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: clubSpace.xs,
      paddingHorizontal: clubSpace.sm,
    },
    dot: { fontWeight: '700' },
  });
