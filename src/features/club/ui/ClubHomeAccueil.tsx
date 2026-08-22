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

function formatKickoff(d: Date): string {
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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
      <LinearGradient
        colors={[tokens.pitch, '#06241C', tokens.bg]}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.heroWash}
        pointerEvents="none"
      />
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
          <ClubText variant="caption" muted numberOfLines={1} style={styles.meta}>
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

/** Prochain événement — une seule priorité (match / séance / jour calme). */
export function ClubHomeNextEventRow({
  priority,
  onPress,
}: {
  priority: ClubHomePriority;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => nextEventStyles(tokens), [tokens]);

  if (priority.kind === 'calm') {
    return (
      <AnimatedEntrance kind="fadeUp" index={2} delayStep={36}>
        <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
          <View style={[styles.dot, { backgroundColor: tokens.pitch }]} />
          <View style={styles.col}>
            <ClubText variant="label" muted>
              Prochaine priorité
            </ClubText>
            <ClubText variant="body" style={{ fontWeight: '700' }}>
              Terrain libre
            </ClubText>
            <ClubText variant="caption" muted>
              Aucun match ni séance imminente
            </ClubText>
          </View>
          <Icon name="chevron-forward" size={15} color={tokens.faint} />
        </PressableSpring>
      </AnimatedEntrance>
    );
  }

  const isMatch = priority.kind === 'match';
  const tone = isMatch ? clubEventTone.match : clubEventTone.training;
  const event = priority.event;
  const starts = event.starts_at ? new Date(event.starts_at) : null;
  const kickLabel = starts ? formatKickoff(starts) : 'Horaire à confirmer';
  const clock = starts ? formatClock(starts) : null;
  const title = event.title?.trim() || (isMatch ? 'Prochain match' : 'Prochaine séance');

  return (
    <AnimatedEntrance kind="fadeUp" index={2} delayStep={36}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View style={[styles.dot, { backgroundColor: tone.color }]} />
        <View style={styles.col}>
          <ClubText variant="label" style={{ color: tone.color }}>
            {tone.label}
            {clock ? ` · ${clock}` : ''}
          </ClubText>
          <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
            {title}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={1}>
            {kickLabel}
          </ClubText>
        </View>
        <Icon name="chevron-forward" size={15} color={tokens.faint} />
      </PressableSpring>
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
          <ClubText variant="label" muted>
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
  meta: string;
  coachesLabel: string;
  hasCoach: boolean;
  onPress: () => void;
};

/** Rail compact Mes équipes — 2 à 4 cartes, pas de grille KPI. */
export function ClubHomeTeamsRail({
  teams,
  onSeeAll,
}: {
  teams: ClubHomeTeamCard[];
  onSeeAll: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => teamsRailStyles(tokens), [tokens]);
  const visible = teams.slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={4} delayStep={36}>
      <View style={styles.block}>
        <View style={styles.head}>
          <ClubText variant="label" muted>
            Mes équipes
          </ClubText>
          <PressableSpring onPress={onSeeAll} scaleTo={0.97} haptic style={styles.seeAll}>
            <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
              Toutes
            </ClubText>
            <Icon name="chevron-forward" size={12} color={tokens.accent} />
          </PressableSpring>
        </View>
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
            >
              <View
                style={[
                  styles.accentBar,
                  { backgroundColor: team.hasCoach ? tokens.accent : tokens.warning },
                ]}
              />
              <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
                {team.name}
              </ClubText>
              <ClubText variant="caption" muted numberOfLines={1}>
                {team.meta}
              </ClubText>
              <ClubText
                variant="caption"
                numberOfLines={1}
                style={{
                  color: team.hasCoach ? tokens.muted : tokens.warning,
                  fontWeight: '600',
                }}
              >
                {team.coachesLabel}
              </ClubText>
            </PressableSpring>
          ))}
        </ScrollView>
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
          <ClubText variant="label" muted>
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

/** Alerte présence — RSVP en attente sur les prochains événements. */
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
        <ClubText variant="label" muted>
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

/** Liste « À faire » — uniquement s’il y a des priorités (pas de bandeau vide). */
export function ClubHomeTodoSection({
  items,
}: {
  items: TodoItem[];
  /** @deprecated Conservé pour compat ; l’état vide est masqué. */
  emptySummary?: string;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => todoStyles(tokens), [tokens]);
  if (items.length === 0) return null;

  return (
    <AnimatedEntrance kind="fadeUp" index={6} delayStep={36}>
      <View style={styles.block}>
        <View style={styles.head}>
          <ClubText variant="label" muted>
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
                <ClubText variant="caption" muted numberOfLines={1}>
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
    heroWash: {
      ...StyleSheet.absoluteFillObject,
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
      letterSpacing: 0.2,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '600',
      textTransform: 'none',
      textAlign: 'center',
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      flexShrink: 0,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });

const todayPeekStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
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
      width: 168,
      gap: 6,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.md,
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
  });

const weekPeekStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
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

const commPeekStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
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