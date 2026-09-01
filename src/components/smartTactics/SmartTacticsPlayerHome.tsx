import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { SmartTacticsBoard } from './SmartTacticsBoard';
import type { SmartTacticsChapterProps } from './smartTacticsUi';
import { smartTacticsService } from '../../services/smartTactics.service';
import { tacticalShareService } from '../../services/matchTalk.service';
import { eventLineupToBoardSlots } from '../../utils/tacticalBoardSync';
import type { TacticalBoardSlot } from '../../models/SmartTactics';
import type { TacticalSharePayload } from '../../models/TacticalShare';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { JoueurXpBar } from '../player/joueurPortalUi';
import { resolveJoueurPageIdentity } from '../../content/joueurPageIdentity';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { JoueurArcadeShell, JoueurScorePop } from '../../features/joueur/JoueurGameFx';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { JoueurAttributeRadar, type JoueurAttributes } from '../../features/joueur/JoueurAttributeRadar';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';

function pickNextMatch(events: SmartTacticsChapterProps['events']) {
  return [...events]
    .filter(
      (e) =>
        (e.event_type === 'friendly' ||
          e.event_type === 'competition' ||
          e.event_type === 'tournament') &&
        e.starts_at.getTime() >= Date.now() - 2 * 60 * 60 * 1000,
    )
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0];
}

const TACTICAL_QUICK_CHIPS = [
  { label: '⚽ Placement tactique', query: 'Comment bien me positionner sur le terrain à mon poste ?' },
  { label: '🔥 Démarquage & Espaces', query: 'Quels mouvements faire pour créer de l’espace et me démarquer ?' },
  { label: '🛡️ Duels 1v1 & Défense', query: 'Comment maximiser mes chances de gagner mes duels ?' },
  { label: '⚡ Transition & Contre', query: 'Comment accélérer le jeu dès la récupération du ballon ?' },
  { label: '🎯 Finition & Tirs', query: 'Conseils pour être plus lucide et efficace face au but.' },
];

type SmartTacticsPlayerHomeProps = SmartTacticsChapterProps & {
  /** Dans un shell parent (Saison) — pas de JoueurArcadeShell ni header dupliqué. */
  embedded?: boolean;
};

export function SmartTacticsPlayerHome({
  profile,
  events,
  members,
  wellnessByUid,
  refreshing,
  onRefresh,
  embedded = false,
}: SmartTacticsPlayerHomeProps) {
  const session = useJoueurSession();
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const progressApi = useJoueurProgress();
  const identity =
    session?.identity ??
    resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'neutral' });
  const accent = joueurTheme.accent;
  const accentAlt = joueurTheme.accentBright;
  const accentSoft = playerColors.accentSoft;
  const nav = useTabNavigationActions();

  const [briefs, setBriefs] = useState<TacticalSharePayload[]>([]);
  const [focusUid, setFocusUid] = useState(profile.uid);
  const [pop, setPop] = useState<string | null>(null);

  // Forme interactive
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [sleepHours, setSleepHours] = useState<'8h+' | '6-7h' | '<6h'>('8h+');
  const [muscleFeel, setMuscleFeel] = useState<'fresh' | 'sore' | 'tight'>('fresh');
  const [wellnessLogged, setWellnessLogged] = useState(false);

  // Tactique interactive
  const [tacticalPhase, setTacticalPhase] = useState<'attack' | 'defense'>('attack');

  // Checklist préparation match
  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({
    hydration: true,
    stretching: false,
    tactics: false,
  });

  const flash = (text: string) => {
    setPop(text);
    setTimeout(() => setPop(null), 900);
  };

  useEffect(() => {
    void tacticalShareService.listForPlayer(profile.uid).then(setBriefs);
  }, [profile.uid]);

  const next = useMemo(() => pickNextMatch(events), [events]);
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );
  const me = cards.find((c) => c.uid === profile.uid);

  // Dynamic calculated readiness from interactive checkin
  const calculatedReadiness = useMemo(() => {
    let score = 75;
    if (energyLevel === 'high') score += 12;
    else if (energyLevel === 'medium') score += 4;
    else score -= 10;

    if (sleepHours === '8h+') score += 8;
    else if (sleepHours === '6-7h') score += 2;
    else score -= 8;

    if (muscleFeel === 'fresh') score += 5;
    else if (muscleFeel === 'sore') score -= 5;
    else score -= 15;

    return Math.min(100, Math.max(40, score));
  }, [energyLevel, sleepHours, muscleFeel]);

  const playerAttributes: JoueurAttributes = useMemo(() => {
    const ovr = progressApi?.ovr ?? me?.overall ?? 80;
    return {
      pace: Math.min(99, Math.round(ovr * 0.98)),
      shooting: Math.min(99, Math.round(ovr * 0.94)),
      passing: Math.min(99, Math.round(ovr * 1.02)),
      dribbling: Math.min(99, Math.round(ovr * 1.01)),
      defending: Math.min(99, Math.round(ovr * 0.88)),
      physical: Math.min(99, Math.round(ovr * 0.96)),
    };
  }, [progressApi?.ovr, me?.overall]);

  const board = useMemo(() => {
    if (!next?.lineup || next.lineup.slots.length === 0) return null;
    const mapped = eventLineupToBoardSlots(next.lineup);
    const used = new Set(next.lineup.slots.map((s) => s.uid));
    const pool: TacticalBoardSlot[] = members
      .filter((m) => !used.has(m.uid))
      .map((m) => ({
        uid: m.uid,
        display_name: m.display_name,
        role: 'sub' as const,
        position_label: m.profile.position,
      }));
    return {
      formation: mapped.formation || next.lineup.formation || '4-3-3',
      starters: mapped.starters,
      bench: mapped.bench,
      pool,
    };
  }, [next, members]);

  const mySlot = board
    ? board.starters.find((s) => s.uid === profile.uid) ??
      board.bench.find((s) => s.uid === profile.uid)
    : null;

  const inLineup = Boolean(next?.lineup?.slots.some((s) => s.uid === profile.uid));

  const handleLogWellness = async () => {
    joueurGamePress();
    setWellnessLogged(true);
    if (progressApi?.ready) {
      await progressApi.grantXp(10);
      flash('+10 XP Forme validée');
    }
  };

  const toggleChecklist = (key: string) => {
    joueurGamePress();
    setPrepChecklist((prev) => {
      const nextVal = !prev[key];
      if (nextVal) flash('+5 XP Checklist');
      return { ...prev, [key]: nextVal };
    });
  };

  const scroll = (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.pad, embedded ? styles.padEmbedded : styles.padStandalone]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={Boolean(refreshing)}
          onRefresh={onRefresh}
          tintColor={accent}
        />
      }
    >
      <JoueurScorePop text={pop ?? ''} color={PLAYER_DARK.accent} visible={Boolean(pop)} />

      {!embedded ? (
        <View style={styles.headerBlock}>
          <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
            {identity.hudLabel}
          </ProDayText>
          <ProDayText variant="title" style={styles.title}>
            Tactique & Stats
          </ProDayText>
          <ProDayText variant="caption" style={styles.support}>
            Briefing coach · XI publié · Coach IA pour progresser tactiquement.
          </ProDayText>
        </View>
      ) : null}

      {/* 1. COACH IA — CARTE INTERACTIVE & SUGGESTIONS */}
      <View style={[styles.coachCta, { borderColor: `${accent}44`, backgroundColor: PLAYER_DARK.surface }]}>
        <View style={styles.coachCtaHead}>
          <View style={[styles.coachIconBadge, { backgroundColor: `${accent}20` }]}>
            <Icon name="star-four-points" size={18} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
              COACH IA TACTIQUE
            </ProDayText>
            <ProDayText variant="section" style={styles.heroTitle}>
              Parler tactique & drills
            </ProDayText>
          </View>
        </View>
        <ProDayText variant="caption" style={styles.heroBody}>
          Pose une question tactique pour ton poste ou choisis une consigne rapide :
        </ProDayText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TACTICAL_QUICK_CHIPS.map((chip) => (
            <PressableSpring
              key={chip.label}
              onPress={() => {
                joueurGamePress();
                nav.openDashboard('tactics_coach');
              }}
              scaleTo={0.96}
              haptic
              style={[styles.quickPromptChip, { borderColor: `${accent}44`, backgroundColor: `${accent}12` }]}
            >
              <ProDayText variant="caption" style={[styles.quickPromptText, { color: accent }]}>
                {chip.label}
              </ProDayText>
            </PressableSpring>
          ))}
        </ScrollView>
      </View>

      {/* 2. MATCH & FIXTURE — AVEC COMPTE À REBOURS OU CHECKLIST PRÉPA */}
      <View style={[styles.hero, { borderColor: PLAYER_DARK.border }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        {!next ? (
          <View style={styles.prepCardInner}>
            <View style={styles.cardHeadRow}>
              <View>
                <ProDayText variant="caption" style={[styles.heroKicker, { color: accent }]}>
                  PRÉPARATION SAISON
                </ProDayText>
                <ProDayText variant="section" style={styles.heroTitle}>
                  Objectifs de la semaine
                </ProDayText>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${accent}18` }]}>
                <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                  En forme
                </ProDayText>
              </View>
            </View>
            <ProDayText variant="caption" style={styles.heroBody}>
              Aucun match officiel programmé aujourd'hui. Coche ta routine de préparation :
            </ProDayText>

            <View style={styles.checklistGrid}>
              {[
                { id: 'hydration', label: '💧 Hydratation & Nutrition', done: prepChecklist.hydration },
                { id: 'stretching', label: '🧘 Mobilité & Récupération', done: prepChecklist.stretching },
                { id: 'tactics', label: '🧠 Visualisation & Vidéos', done: prepChecklist.tactics },
              ].map((item) => (
                <PressableSpring
                  key={item.id}
                  onPress={() => toggleChecklist(item.id)}
                  scaleTo={0.98}
                  style={[
                    styles.checklistItem,
                    {
                      borderColor: item.done ? `${accent}66` : PLAYER_DARK.border,
                      backgroundColor: item.done ? `${accent}12` : 'rgba(255,255,255,0.02)',
                    },
                  ]}
                >
                  <Icon
                    name={item.done ? 'checkmark-circle' : 'time'}
                    size={16}
                    color={item.done ? accent : PLAYER_DARK.textMuted}
                  />
                  <ProDayText
                    variant="caption"
                    style={{
                      color: item.done ? PLAYER_DARK.text : PLAYER_DARK.textMuted,
                      fontWeight: item.done ? '700' : '500',
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>
        ) : (
          <>
            <ProDayText variant="caption" style={[styles.heroKicker, { color: accent }]}>
              PROCHAIN MATCH
            </ProDayText>
            <ProDayText variant="title" style={styles.heroTitle} numberOfLines={2}>
              {next.title}
            </ProDayText>
            <ProDayText variant="caption" style={styles.heroBody}>
              {formatCalendarDate(next.starts_at)}
              {next.location_label || next.city
                ? ` · ${next.location_label || next.city}`
                : ''}
            </ProDayText>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: inLineup
                      ? accentSoft
                      : 'rgba(255,255,255,0.06)',
                  },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={{
                    color: inLineup ? accentAlt : accent,
                    fontWeight: '800',
                  }}
                >
                  {next.lineup && next.lineup.slots.length > 0
                    ? inLineup
                      ? mySlot?.role === 'starter'
                        ? 'Titulaire'
                        : 'Banc'
                      : 'Hors XI'
                    : 'XI en attente'}
                </ProDayText>
              </View>
              {mySlot?.position_label ? (
                <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
                  {mySlot.position_label}
                </ProDayText>
              ) : null}
            </View>
          </>
        )}
      </View>

      {/* 3. TA FORME & CHECK-IN BIEN-ÊTRE DU JOUR (INTERACTIF) */}
      <View style={[styles.panel, { borderColor: PLAYER_DARK.border }]}>
        <View style={styles.panelHead}>
          <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
            TA FORME & BIEN-ÊTRE
          </ProDayText>
          <View style={[styles.miniBadge, { backgroundColor: `${accent}18` }]}>
            <ProDayText variant="caption" style={{ color: accent, fontWeight: '800', fontSize: 10 }}>
              {wellnessLogged ? '✓ Mis à jour' : 'À valider'}
            </ProDayText>
          </View>
        </View>

        <View style={styles.meRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <ProDayText variant="section" style={styles.meName}>
              {profile.display_name}
            </ProDayText>
            <JoueurXpBar
              label="Overall"
              value={progressApi?.ovr ?? me?.overall ?? 82}
              max={99}
              color={accent}
            />
            <JoueurXpBar
              label="Disponibilité"
              value={calculatedReadiness}
              max={100}
              color={accentAlt}
            />
          </View>
          <View style={[styles.ovrBadge, { borderColor: accent }]}>
            <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
              NOTE
            </ProDayText>
            <ProDayText variant="title" style={styles.ovrValue}>
              {progressApi?.ovr ?? me?.overall ?? 82}
            </ProDayText>
          </View>
        </View>

        {/* Curseurs interactifs d'auto-évaluation */}
        <View style={styles.wellnessSection}>
          <ProDayText variant="caption" style={styles.wellnessTitle}>
            Auto-évaluation du jour :
          </ProDayText>

          <View style={styles.selectorRow}>
            <ProDayText variant="caption" style={styles.selectorLabel}>⚡ Énergie</ProDayText>
            <View style={styles.selectorPills}>
              {(['high', 'medium', 'low'] as const).map((lvl) => (
                <PressableSpring
                  key={lvl}
                  onPress={() => { joueurGamePress(); setEnergyLevel(lvl); }}
                  style={[
                    styles.pillBtn,
                    energyLevel === lvl && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    style={[styles.pillText, energyLevel === lvl && { color: PLAYER_DARK.bg, fontWeight: '800' }]}
                  >
                    {lvl === 'high' ? 'Top' : lvl === 'medium' ? 'Normal' : 'Faible'}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>

          <View style={styles.selectorRow}>
            <ProDayText variant="caption" style={styles.selectorLabel}>😴 Sommeil</ProDayText>
            <View style={styles.selectorPills}>
              {(['8h+', '6-7h', '<6h'] as const).map((lvl) => (
                <PressableSpring
                  key={lvl}
                  onPress={() => { joueurGamePress(); setSleepHours(lvl); }}
                  style={[
                    styles.pillBtn,
                    sleepHours === lvl && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    style={[styles.pillText, sleepHours === lvl && { color: PLAYER_DARK.bg, fontWeight: '800' }]}
                  >
                    {lvl}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>

          <View style={styles.selectorRow}>
            <ProDayText variant="caption" style={styles.selectorLabel}>💪 Muscles</ProDayText>
            <View style={styles.selectorPills}>
              {(['fresh', 'sore', 'tight'] as const).map((lvl) => (
                <PressableSpring
                  key={lvl}
                  onPress={() => { joueurGamePress(); setMuscleFeel(lvl); }}
                  style={[
                    styles.pillBtn,
                    muscleFeel === lvl && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    style={[styles.pillText, muscleFeel === lvl && { color: PLAYER_DARK.bg, fontWeight: '800' }]}
                  >
                    {lvl === 'fresh' ? 'Frais' : lvl === 'sore' ? 'Courbatures' : 'Gêne'}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>

          <PressableSpring
            onPress={handleLogWellness}
            scaleTo={0.98}
            haptic
            style={[styles.logBtn, { backgroundColor: `${accent}20`, borderColor: `${accent}55` }]}
          >
            <Icon name="checkmark-circle" size={16} color={accent} />
            <ProDayText variant="caption" style={[styles.logBtnText, { color: accent }]}>
              {wellnessLogged ? '✓ Forme synchronisée (+10 XP)' : 'Valider ma forme du jour (+10 XP)'}
            </ProDayText>
          </PressableSpring>
        </View>
      </View>

      {/* 4. RADAR DES ATTRIBUTS JOUER */}
      <View style={[styles.panel, { borderColor: PLAYER_DARK.border }]}>
        <View style={styles.panelHead}>
          <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
            RADAR DES ATTRIBUTS
          </ProDayText>
          <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
            {profile.profile.position || 'Joueur'}
          </ProDayText>
        </View>

        <View style={styles.radarContainer}>
          <JoueurAttributeRadar attributes={playerAttributes} size={230} accent={accent} />
        </View>
      </View>

      {/* 5. BRIEFING & CONSIGNES TACTIQUES (AVEC/SANS BALLON) */}
      <View style={[styles.panel, { borderColor: PLAYER_DARK.border }]}>
        <View style={styles.panelHead}>
          <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
            CONSIGNES TACTIQUES DU POSTE
          </ProDayText>
          <View style={styles.phaseToggle}>
            <PressableSpring
              onPress={() => { joueurGamePress(); setTacticalPhase('attack'); }}
              style={[
                styles.phaseBtn,
                tacticalPhase === 'attack' && { backgroundColor: accent, borderColor: accent },
              ]}
            >
              <ProDayText
                variant="caption"
                style={[styles.phaseBtnText, tacticalPhase === 'attack' && { color: PLAYER_DARK.bg, fontWeight: '800' }]}
              >
                ⚽ Avec ballon
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => { joueurGamePress(); setTacticalPhase('defense'); }}
              style={[
                styles.phaseBtn,
                tacticalPhase === 'defense' && { backgroundColor: accent, borderColor: accent },
              ]}
            >
              <ProDayText
                variant="caption"
                style={[styles.phaseBtnText, tacticalPhase === 'defense' && { color: PLAYER_DARK.bg, fontWeight: '800' }]}
              >
                🛡️ Sans ballon
              </ProDayText>
            </PressableSpring>
          </View>
        </View>

        {tacticalPhase === 'attack' ? (
          <View style={styles.tacticalTipsBlock}>
            <View style={styles.tipRow}>
              <View style={[styles.tipBullet, { backgroundColor: accent }]} />
              <ProDayText variant="caption" style={styles.tipText}>
                Propose des solutions de passes vers l'avant et attaque les espaces libres entre les lignes.
              </ProDayText>
            </View>
            <View style={styles.tipRow}>
              <View style={[styles.tipBullet, { backgroundColor: accent }]} />
              <ProDayText variant="caption" style={styles.tipText}>
                Prends l'information avant de recevoir le ballon pour jouer en 1 ou 2 touches.
              </ProDayText>
            </View>
          </View>
        ) : (
          <View style={styles.tacticalTipsBlock}>
            <View style={styles.tipRow}>
              <View style={[styles.tipBullet, { backgroundColor: '#EF4444' }]} />
              <ProDayText variant="caption" style={styles.tipText}>
                Recadre immédiatement à la perte et resserre le bloc équipe pour fermer l'axe.
              </ProDayText>
            </View>
            <View style={styles.tipRow}>
              <View style={[styles.tipBullet, { backgroundColor: '#EF4444' }]} />
              <ProDayText variant="caption" style={styles.tipText}>
                Garde la communication active avec tes partenaires et surveille le joueur dans ton dos.
              </ProDayText>
            </View>
          </View>
        )}
      </View>

      {/* 6. Published XI */}
      <View style={[styles.panel, { borderColor: PLAYER_DARK.border }]}>
        <View style={styles.panelHead}>
          <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
            COMPOSITION D'ÉQUIPE
          </ProDayText>
          {board ? (
            <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
              {board.formation}
            </ProDayText>
          ) : null}
        </View>

        {!board ? (
          <ProDayText variant="caption" style={styles.empty}>
            Le XI n’est pas encore publié pour le prochain match. Tu le verras ici en lecture seule dès validation du coach.
          </ProDayText>
        ) : (
          <>
            <SmartTacticsBoard
              formation={board.formation}
              starters={board.starters}
              bench={board.bench}
              pool={board.pool}
              cards={cards}
              readOnly
              highlightUid={focusUid}
              seedKey={`tactics-home|${next?.id}|${board.starters.map((s) => s.uid).join(',')}`}
              onChangeFormation={() => undefined}
              onStartersChange={() => undefined}
              onBenchChange={() => undefined}
              onPoolChange={() => undefined}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {[...board.starters, ...board.bench].slice(0, 16).map((s) => {
                const mine = s.uid === profile.uid;
                const on = focusUid === s.uid;
                return (
                  <PressableSpring
                    key={s.uid}
                    onPress={() => {
                      joueurGamePress();
                      setFocusUid(s.uid);
                    }}
                    scaleTo={0.95}
                    haptic
                    style={[
                      styles.chip,
                      {
                        borderColor: mine
                          ? accent
                          : on
                            ? accent
                            : PLAYER_DARK.border,
                        backgroundColor: mine
                          ? accentSoft
                          : PLAYER_DARK.surface,
                      },
                    ]}
                  >
                    <ProDayText
                      variant="caption"
                      style={{
                        color: mine ? accent : PLAYER_DARK.text,
                        fontWeight: '800',
                        fontSize: 11,
                      }}
                      numberOfLines={1}
                    >
                      {mine ? 'Toi' : s.display_name.split(' ')[0]}
                    </ProDayText>
                  </PressableSpring>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      {/* 7. ACTIONS INFÉRIEURES */}
      <View style={styles.actions}>
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            nav.openMatchs();
          }}
          scaleTo={0.97}
          haptic
          style={[styles.ctaPrimary, { backgroundColor: accent }]}
        >
          <ProDayText variant="caption" style={styles.ctaPrimaryText}>
            Ouvrir Matchs
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            nav.setActiveTab('recrutement');
          }}
          scaleTo={0.97}
          style={[styles.ctaSecondary, { borderColor: PLAYER_DARK.border }]}
        >
          <ProDayText variant="caption" style={styles.ctaSecondaryText}>
            Squad & Club
          </ProDayText>
        </PressableSpring>
      </View>
    </ScrollView>
  );

  if (embedded) {
    return scroll;
  }

  return (
    <JoueurArcadeShell identity={identity} liveLabel="TACTIQUE">
      {scroll}
    </JoueurArcadeShell>
  );
}

export function SmartTacticsPlayerHomeLoading({ accent }: { accent: string }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.md,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  padEmbedded: {
    paddingTop: spacing.xs,
  },
  padStandalone: {
    paddingTop: spacing.xl + 8,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PLAYER_DARK.bg,
  },
  headerBlock: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.6,
  },
  title: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  support: {
    color: PLAYER_DARK.textMuted,
    lineHeight: 18,
    fontSize: 13,
  },
  coachCta: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.xs,
  },
  coachCtaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coachIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickPromptText: {
    fontWeight: '700',
    fontSize: 12,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
    gap: 6,
    backgroundColor: PLAYER_DARK.surface,
    overflow: 'hidden',
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  heroBody: { color: PLAYER_DARK.textMuted, lineHeight: 19, fontSize: 13 },
  prepCardInner: { gap: spacing.xs },
  cardHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistGrid: {
    gap: 6,
    marginTop: 6,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: PLAYER_DARK.surface,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  meRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  meName: { color: PLAYER_DARK.text, fontWeight: '700', fontSize: 16 },
  ovrBadge: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  ovrValue: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 24,
  },
  wellnessSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PLAYER_DARK.border,
    gap: 8,
  },
  wellnessTitle: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorLabel: {
    color: PLAYER_DARK.text,
    fontWeight: '600',
    fontSize: 13,
  },
  selectorPills: {
    flexDirection: 'row',
    gap: 6,
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillText: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  logBtnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  phaseToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  phaseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  phaseBtnText: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  tacticalTipsBlock: {
    gap: 8,
    marginTop: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    color: PLAYER_DARK.text,
    lineHeight: 18,
    fontSize: 13,
    flex: 1,
  },
  empty: { color: PLAYER_DARK.textMuted, lineHeight: 20, flexShrink: 1, fontSize: 13 },
  chipRow: { gap: 8, paddingTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: spacing.xs },
  ctaPrimary: {
    flex: 1.2,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: PLAYER_DARK.bg,
    fontWeight: '800',
    fontSize: 13,
  },
  ctaSecondary: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: PLAYER_DARK.surface,
  },
  ctaSecondaryText: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 13,
  },
});
