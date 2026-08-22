import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubFinance } from '../../features/club/hooks/useClubFinance';
import { CLUB_VIDEO_PROVIDERS } from '../../features/club/video/ClubVideoProvider';
import { usePresidentFunding } from '../../features/president/hooks/usePresidentFunding';
import { usePresidentHealth } from '../../features/president/hooks/usePresidentHealth';
import { PresidentAiPanel } from '../../features/president/ai/PresidentAiPanel';
import { usePresidentShellNav } from '../../features/president/shell/PresidentShellNavContext';
import { usePresidentTheme } from '../../features/president/shell/PresidentThemeContext';
import {
  PresidentActionRow,
  PresidentBrandMark,
  PresidentEmptyState,
  PresidentLoading,
  PresidentSectionCard,
  PresidentText,
} from '../../features/president/ui/presidentUi';
import { PresidentSectionScreen } from './PresidentSectionScreen';
import {
  presidentRadius,
  presidentShadow,
  presidentSpace,
} from '../../features/president/theme/presidentDesignSystem';
import { isCoachMatchEvent } from '../../models/TeamEvent';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  CLUB_FINANCE_CATEGORY_SUGGESTIONS,
  CLUB_FINANCE_TYPE_LABELS,
  isClubFinanceExpenseType,
  type ClubFinanceEntryType,
} from '../../models/ClubFinanceEntry';
import {
  clubFinanceHonestyNote,
  summarizeClubCotisations,
} from '../../features/club/ui/clubFinanceModel';
import { PressableSpring } from '../../components/motion';
import type { PresidentThemeTokens } from '../../features/president/theme/presidentTokens';

function formatEventWhen(startsAt?: Date | string | null): string {
  if (!startsAt) return 'Date à confirmer';
  const d = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (Number.isNaN(d.getTime())) return 'Date à confirmer';
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PresidentOverviewScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Mon club"
      title={ws.club?.name ?? 'Vue club'}
      subtitle="Identité, structure et statut · lecture directionnelle."
      liveLines={[
        `Ville : ${[ws.club?.city, ws.club?.department].filter(Boolean).join(' · ') || '…'}`,
        `Vérifié : ${ws.club?.verified ? 'oui' : 'non'}`,
        `Statut opérationnel : ${ws.statusLabel}`,
        `${ws.teams.length} équipes · ${ws.players.length} licenciés · ${ws.coaches.length} coachs`,
      ]}
      links={[
        {
          label: 'Ouvrir la vitrine Club',
          hint: 'Identité, logo, pack',
          icon: 'business',
          clubNav: 'club',
        },
      ]}
    >
      <PresidentSectionCard eyebrow="Pilotage" title="Continuer dans le pôle">
        <PresidentActionRow
          label="Équipes"
          hint="Structure sportive"
          icon="football"
          accent
          onPress={() => shellNav?.requestNav('teams')}
        />
        <PresidentActionRow
          label="Adhérents"
          hint={
            ws.pendingMemberships > 0
              ? `${ws.pendingMemberships} validation(s) en attente`
              : 'Licenciés & validations'
          }
          icon="people"
          onPress={() => shellNav?.requestNav('members')}
        />
        <PresidentActionRow
          label="Sportif"
          hint="Matchs & entraînements du jour"
          icon="trophy"
          onPress={() => shellNav?.requestNav('sport')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentSportScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  const upcomingMatches = useMemo(
    () =>
      ws.events
        .filter((e) => isCoachMatchEvent(e))
        .slice(0, 8),
    [ws.events],
  );
  return (
    <PresidentSectionScreen
      eyebrow="Sportif"
      title="Pilotage sportif"
      subtitle="Matchs, entraînements et rythme de la semaine · vue direction."
      liveLines={[
        `Matchs aujourd’hui : ${ws.todayMatches.length}`,
        `Entraînements aujourd’hui : ${ws.todayTrainings.length}`,
        `Événements récents chargés : ${ws.events.length}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[
        { label: 'Match Center Club', icon: 'trophy', clubNav: 'matches' },
        { label: 'Calendrier Club', icon: 'calendar', clubNav: 'calendar' },
      ]}
    >
      <PresidentSectionCard eyebrow="Aujourd’hui" title="Terrain">
        {ws.todayMatches.length === 0 && ws.todayTrainings.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun match ni entraînement aujourd’hui.
          </PresidentText>
        ) : (
          <>
            {ws.todayMatches.map((m) => (
              <PresidentActionRow
                key={m.id}
                label={m.title || 'Match'}
                hint={formatEventWhen(m.starts_at)}
                icon="trophy"
              />
            ))}
            {ws.todayTrainings.map((t) => (
              <PresidentActionRow
                key={t.id}
                label={t.title || 'Entraînement'}
                hint={formatEventWhen(t.starts_at)}
                icon="time"
              />
            ))}
          </>
        )}
      </PresidentSectionCard>
      <PresidentSectionCard eyebrow="À venir" title="Prochains matchs">
        {upcomingMatches.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun match chargé pour le moment.
          </PresidentText>
        ) : (
          upcomingMatches.map((m) => (
            <PresidentActionRow
              key={m.id}
              label={m.title || 'Match'}
              hint={formatEventWhen(m.starts_at)}
              icon="trophy"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard title="Sections liées">
        <PresidentActionRow
          label="Équipes"
          hint="Structure & effectifs"
          icon="football"
          accent
          onPress={() => shellNav?.requestNav('teams')}
        />
        <PresidentActionRow
          label="Saison"
          hint="Calendrier stratégique"
          icon="calendar"
          onPress={() => shellNav?.requestNav('season')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

function formatEur(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function formatEntryDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Saisie date sans tiret (AAAA MM JJ) ; parse aussi ISO / slash. */
function todayFinanceDateInput(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, ' ');
}

function parseFinanceDateInput(raw: string): Date {
  const normalized = raw.trim().replace(/[./\s]+/g, '-');
  return new Date(`${normalized}T12:00:00`);
}

const FINANCE_TYPE_OPTIONS: { id: ClubFinanceEntryType; label: string }[] = [
  { id: 'cotisation', label: 'Cotisation' },
  { id: 'depense', label: 'Dépense' },
  { id: 'recette', label: 'Recette' },
  { id: 'autre', label: 'Autre' },
];

export function PresidentFinanceScreen() {
  const ws = useClubWorkspace();
  const profile = useSessionProfile();
  const shellNav = usePresidentShellNav();
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => financeStyles(tokens), [tokens]);
  const { goals, loading: goalsLoading } = usePresidentFunding(ws.clubId);
  const {
    entries,
    totals,
    loading: ledgerLoading,
    create,
    softDelete,
  } = useClubFinance(ws.clubId);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<ClubFinanceEntryType>('cotisation');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Licence');
  const [dateStr, setDateStr] = useState(() => todayFinanceDateInput());

  const loading = goalsLoading || ledgerLoading;
  const cotisationSummary = useMemo(() => summarizeClubCotisations(entries), [entries]);

  const resetForm = useCallback(() => {
    setType('cotisation');
    setLabel('');
    setAmount('');
    setCategory('Licence');
    setDateStr(todayFinanceDateInput());
  }, []);

  const submit = useCallback(async () => {
    if (!ws.clubId || !profile?.uid) {
      Alert.alert('Club requis', 'Compte dirigeant rattaché à un club requis.');
      return;
    }
    const amountEur = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(amountEur) || amountEur <= 0) {
      Alert.alert('Montant', 'Saisissez un montant positif.');
      return;
    }
    if (!label.trim()) {
      Alert.alert('Libellé', 'Indiquez un libellé.');
      return;
    }
    const entryDate = parseFinanceDateInput(dateStr);
    if (Number.isNaN(entryDate.getTime())) {
      Alert.alert('Date', 'Date invalide (AAAA MM JJ).');
      return;
    }
    setSaving(true);
    try {
      await create({
        club_id: ws.clubId,
        type,
        amount_eur: amountEur,
        label: label.trim(),
        category: category.trim() || 'Divers',
        entry_date: entryDate,
        created_by_uid: profile.uid,
        created_by_name: profile.display_name,
      });
      setFormOpen(false);
      resetForm();
      Alert.alert('Enregistré', `${CLUB_FINANCE_TYPE_LABELS[type]} ajoutée.`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }, [amount, category, create, dateStr, label, profile, resetForm, type, ws.clubId]);

  return (
    <PresidentSectionScreen
      eyebrow="Finances"
      title="Direction financière"
      subtitle="Ledger club partagé — cotisations enregistrées manuellement, sans prélèvement SEPA auto."
      liveLines={
        loading
          ? ['Chargement du ledger et des objectifs…']
          : [
              `Recettes ${formatEur(totals.recettes_eur)} · Dépenses ${formatEur(totals.depenses_eur)} · Solde ${formatEur(totals.solde_eur)}`,
              cotisationSummary.label,
              goals.length > 0
                ? `${goals.length} objectif${goals.length > 1 ? 's' : ''} de financement`
                : 'Aucun objectif de financement sponsor',
            ]
      }
      links={[
        { label: 'Finances Club', icon: 'stats-chart', clubNav: 'finances' },
        { label: 'Joueurs Club', icon: 'people', clubNav: 'players' },
        { label: 'Sponsoring Club', icon: 'gift', clubNav: 'sponsoring' },
      ]}
    >
      <PresidentSectionCard eyebrow="Cotisations" title="Qui a payé (enregistré)">
        <PresidentText variant="body" muted>
          {cotisationSummary.count > 0
            ? cotisationSummary.label
            : 'Aucune cotisation au ledger. Ouvrez Finances Club pour encaisser un adhérent.'}
        </PresidentText>
        <PresidentText variant="caption" muted>
          {clubFinanceHonestyNote()}
        </PresidentText>
        <PresidentActionRow
          label="Enregistrer une cotisation"
          hint="Même ledger que Finances Club"
          icon="people"
          accent
          onPress={() => {
            resetForm();
            setType('cotisation');
            setFormOpen(true);
          }}
        />
        <PresidentActionRow
          label="Ouvrir Finances Club"
          hint="Couverture adhérents · filtres cotisations"
          icon="stats-chart"
          onPress={() => shellNav?.openClubDeepLink('finances')}
        />
      </PresidentSectionCard>

      <PresidentSectionCard eyebrow="Ledger" title="Cotisations & dépenses">
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <PresidentText variant="caption" muted>
              Recettes
            </PresidentText>
            <PresidentText variant="h3" champagne>
              {formatEur(totals.recettes_eur)}
            </PresidentText>
          </View>
          <View style={styles.kpi}>
            <PresidentText variant="caption" muted>
              Dépenses
            </PresidentText>
            <PresidentText variant="h3">{formatEur(totals.depenses_eur)}</PresidentText>
          </View>
          <View style={styles.kpi}>
            <PresidentText variant="caption" muted>
              Solde
            </PresidentText>
            <PresidentText variant="h3" champagne>
              {formatEur(totals.solde_eur)}
            </PresidentText>
          </View>
        </View>
        <PresidentActionRow
          label="Ajouter une écriture"
          hint="Cotisation, dépense ou recette"
          icon="add"
          accent
          onPress={() => {
            resetForm();
            setFormOpen(true);
          }}
        />
        {entries.length === 0 && !ledgerLoading ? (
          <PresidentText variant="body" muted>
            Aucune écriture pour l’instant · le même ledger que le pôle Club.
          </PresidentText>
        ) : (
          entries.slice(0, 12).map((e) => {
            const expense = isClubFinanceExpenseType(e.type);
            return (
              <PresidentActionRow
                key={e.id}
                label={e.label}
                hint={`${CLUB_FINANCE_TYPE_LABELS[e.type]} · ${formatEntryDate(e.entry_date)} · ${expense ? 'sortie ' : 'entrée '}${formatEur(e.amount_eur)}`}
                icon="stats-chart"
                onPress={() =>
                  Alert.alert('Retirer du ledger ?', e.label, [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Supprimer',
                      style: 'destructive',
                      onPress: () => {
                        void softDelete(e.id).catch((err) =>
                          Alert.alert(
                            'Erreur',
                            err instanceof Error ? err.message : 'Suppression impossible.',
                          ),
                        );
                      },
                    },
                  ])
                }
              />
            );
          })
        )}
        {entries.length > 12 ? (
          <PresidentText variant="caption" muted>
            +{entries.length - 12} autres · ouvrir Finances Club pour la liste complète.
          </PresidentText>
        ) : null}
      </PresidentSectionCard>

      {goals.length > 0 ? (
        <PresidentSectionCard eyebrow="Objectifs" title="Financement club (sponsors)">
          {goals.map((g) => (
            <PresidentActionRow
              key={g.id}
              label={g.title}
              hint={`${g.raised_amount_eur ?? 0} / ${g.target_amount_eur ?? 0} €`}
              icon="stats-chart"
            />
          ))}
        </PresidentSectionCard>
      ) : null}

      <Modal visible={formOpen} transparent animationType="fade" onRequestClose={() => setFormOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => !saving && setFormOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation?.()}>
            <PresidentBrandMark compact />
            <PresidentText variant="h2">Nouvelle écriture</PresidentText>
            <View style={styles.typeRow}>
              {FINANCE_TYPE_OPTIONS.map((opt) => {
                const on = opt.id === type;
                return (
                  <PressableSpring
                    key={opt.id}
                    onPress={() => setType(opt.id)}
                    scaleTo={0.97}
                    style={[styles.typeChip, on && styles.typeChipOn]}
                  >
                    <PresidentText
                      variant="caption"
                      style={{
                        color: on ? tokens.accentText : tokens.muted,
                        fontWeight: '700',
                      }}
                    >
                      {opt.label}
                    </PresidentText>
                  </PressableSpring>
                );
              })}
            </View>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Libellé"
              placeholderTextColor={tokens.muted}
              style={styles.input}
            />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Montant (€)"
              placeholderTextColor={tokens.muted}
              style={styles.input}
            />
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Catégorie"
              placeholderTextColor={tokens.muted}
              style={styles.input}
            />
            <View style={styles.chips}>
              {CLUB_FINANCE_CATEGORY_SUGGESTIONS.slice(0, 6).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.miniChip, category === c && styles.typeChipOn]}
                >
                  <PresidentText
                    variant="caption"
                    style={{ color: category === c ? tokens.accentText : tokens.muted }}
                  >
                    {c}
                  </PresidentText>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={dateStr}
              onChangeText={setDateStr}
              autoCapitalize="none"
              placeholder="Date AAAA MM JJ"
              placeholderTextColor={tokens.muted}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <PressableSpring
                onPress={() => setFormOpen(false)}
                disabled={saving}
                style={styles.modalBtnGhost}
              >
                <PresidentText variant="body">Annuler</PresidentText>
              </PressableSpring>
              <PressableSpring
                onPress={() => void submit()}
                disabled={saving}
                haptic
                style={styles.modalBtn}
              >
                <PresidentText variant="body" style={{ color: tokens.accentText, fontWeight: '800' }}>
                  {saving ? '…' : 'Enregistrer'}
                </PresidentText>
              </PressableSpring>
            </View>
            {saving ? <ActivityIndicator color={tokens.accent} /> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </PresidentSectionScreen>
  );
}

function financeStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    kpiRow: { flexDirection: 'row', gap: presidentSpace.sm, marginBottom: presidentSpace.sm },
    kpi: {
      flex: 1,
      gap: 4,
      padding: presidentSpace.sm,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surfaceRaised,
    },
    modalScrim: {
      flex: 1,
      backgroundColor: tokens.overlay,
      justifyContent: 'center',
      padding: presidentSpace.xl,
    },
    modalSheet: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: presidentRadius.xl,
      borderWidth: 1,
      borderColor: tokens.borderLuxury,
      padding: presidentSpace.xl,
      gap: presidentSpace.sm,
      ...presidentShadow.deep,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    typeChip: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    typeChipOn: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    input: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: presidentRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: tokens.foreground,
      backgroundColor: tokens.surface,
      fontSize: 15,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    miniChip: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: presidentRadius.sm,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    modalActions: { flexDirection: 'row', gap: presidentSpace.sm, marginTop: 8 },
    modalBtnGhost: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
    },
    modalBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: presidentRadius.md,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      ...presidentShadow.glow(tokens),
    },
  });
}

export function PresidentMembersScreen() {
  const ws = useClubWorkspace();
  const pending = useMemo(
    () => ws.memberships.filter((m) => m.status === 'pending').slice(0, 8),
    [ws.memberships],
  );
  const recentPlayers = useMemo(() => ws.players.slice(0, 10), [ws.players]);

  return (
    <PresidentSectionScreen
      eyebrow="Adhérents"
      title="Licenciés & validations"
      subtitle="Vue direction sur le vivier licencié et les demandes en attente."
      liveLines={[
        `Licenciés (joueurs) : ${ws.players.length}`,
        `Membres club listés : ${ws.members.length}`,
        `Adhésions en attente : ${ws.pendingMemberships}`,
      ]}
      links={[
        { label: 'Joueurs Club', icon: 'people', clubNav: 'players' },
        { label: 'Licences Club', icon: 'document', clubNav: 'licenses' },
      ]}
    >
      <PresidentSectionCard eyebrow="Priorité" title="Validations en attente">
        {pending.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucune adhésion en attente.
          </PresidentText>
        ) : (
          pending.map((m) => (
            <PresidentActionRow
              key={m.id}
              label={m.player_name || m.player_uid.slice(0, 8)}
              hint={`Statut · ${m.status}`}
              icon="people"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard eyebrow="Effectif" title="Licenciés">
        {recentPlayers.length === 0 ? (
          <PresidentEmptyState
            title="Aucun licencié"
            body="Les joueurs rattachés au club apparaîtront ici."
          />
        ) : (
          recentPlayers.map((p) => (
            <PresidentActionRow
              key={p.uid}
              label={p.display_name}
              hint={p.email || 'Licencié'}
              icon="person"
            />
          ))
        )}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentTeamsScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Équipes"
      title="Structure sportive"
      subtitle="Catégories, effectifs et encadrement · lecture exécutive."
      liveLines={[
        `${ws.teams.length} équipe${ws.teams.length > 1 ? 's' : ''}`,
        `Sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[{ label: 'Équipes Club', icon: 'football', clubNav: 'teams' }]}
    >
      <PresidentSectionCard eyebrow="Structure" title="Équipes du club">
        {ws.teamRows.length === 0 ? (
          <PresidentEmptyState
            title="Aucune équipe"
            body="Créez vos catégories dans le Pôle Club pour les voir ici."
          />
        ) : (
          ws.teamRows.map((r) => (
            <PresidentActionRow
              key={r.teamId}
              label={r.name}
              hint={`${r.category ? `${r.category} · ` : ''}${r.licensedCount} licenciés · coach ${r.coachNames[0] ?? '…'}`}
              icon="football"
            />
          ))
        )}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentStaffScreen() {
  const ws = useClubWorkspace();
  const orphanTeams = useMemo(
    () => ws.teamRows.filter((r) => !r.coachNames[0]).slice(0, 8),
    [ws.teamRows],
  );
  return (
    <PresidentSectionScreen
      eyebrow="Staff"
      title="Encadrement sportif"
      subtitle="Coachs et équipes encore sans responsable."
      liveLines={[
        `Encadrants recensés : ${ws.coaches.length}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[{ label: 'Staff Club', icon: 'school', clubNav: 'coaches' }]}
    >
      <PresidentSectionCard eyebrow="Encadrement" title="Coachs">
        {ws.coaches.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun coach listé pour le moment.
          </PresidentText>
        ) : (
          ws.coaches.map((c) => (
            <PresidentActionRow
              key={c.uid}
              label={c.display_name}
              hint={c.email || 'Coach'}
              icon="school"
            />
          ))
        )}
      </PresidentSectionCard>
      {orphanTeams.length > 0 ? (
        <PresidentSectionCard eyebrow="Attention" title="Équipes sans coach">
          {orphanTeams.map((r) => (
            <PresidentActionRow
              key={r.teamId}
              label={r.name}
              hint={r.category || 'Affectation manquante'}
              icon="warning"
            />
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentSponsorsScreen() {
  const ws = useClubWorkspace();
  const { goals, loading } = usePresidentFunding(ws.clubId);
  return (
    <PresidentSectionScreen
      eyebrow="Sponsors"
      title="Partenaires & développement"
      subtitle="Objectifs de financement partagés · lecture directionnelle."
      liveLines={
        loading
          ? ['Chargement…']
          : goals.length > 0
            ? [`${goals.length} objectif${goals.length > 1 ? 's' : ''} de financement`]
            : undefined
      }
      emptyTitle={!loading && goals.length === 0 ? 'Aucun partenaire listé' : undefined}
      emptyBody={
        !loading && goals.length === 0
          ? 'Les objectifs club_funding_goals alimenteront cet espace dès création.'
          : undefined
      }
      links={[{ label: 'Sponsoring Club', icon: 'briefcase', clubNav: 'sponsoring' }]}
    >
      {goals.length > 0 ? (
        <PresidentSectionCard eyebrow="Partenaires" title="Objectifs actifs">
          {goals.map((g) => (
            <PresidentActionRow
              key={g.id}
              label={g.title}
              hint={`${g.raised_amount_eur ?? 0} / ${g.target_amount_eur ?? 0} €`}
              icon="briefcase"
            />
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentCommunicationScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Communication"
      title="Annonces & messages"
      subtitle="Priorités de diffusion pour la direction · le détail d’envoi reste opérationnel."
      liveLines={[
        `Événements à communiquer : ${ws.events.length}`,
        `Alertes / todos : ${ws.todoCount}`,
        ws.briefingHeadline ? `Brief : ${ws.briefingHeadline}` : 'Brief club disponible dès données',
      ]}
      links={[
        { label: 'Communication Club', icon: 'chat', clubNav: 'communication' },
        { label: 'Notifications Club', icon: 'notifications', clubNav: 'notifications' },
      ]}
    >
      <PresidentSectionCard eyebrow="À diffuser" title="Signaux direction">
        {ws.briefingSummary ? (
          <PresidentText variant="body" muted>
            {ws.briefingSummary}
          </PresidentText>
        ) : (
          <PresidentText variant="body" muted>
            Aucun brief éditorial pour le moment.
          </PresidentText>
        )}
        <PresidentActionRow
          label="Voir les alertes"
          hint="Signaux prioritaires"
          icon="notifications"
          accent
          onPress={() => shellNav?.requestNav('alerts')}
        />
        <PresidentActionRow
          label="Événements"
          hint="Agenda à annoncer"
          icon="calendar"
          onPress={() => shellNav?.requestNav('events')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentEventsScreen() {
  const ws = useClubWorkspace();
  const list = useMemo(() => ws.events.slice(0, 12), [ws.events]);
  return (
    <PresidentSectionScreen
      eyebrow="Événements"
      title="Agenda stratégique"
      subtitle="Tournois, réunions et temps forts du club."
      liveLines={[`Événements chargés : ${ws.events.length}`]}
      links={[
        { label: 'Événements Club', icon: 'flag', clubNav: 'events' },
        { label: 'Calendrier Club', icon: 'calendar', clubNav: 'calendar' },
      ]}
    >
      <PresidentSectionCard eyebrow="Agenda" title="Prochains temps forts">
        {list.length === 0 ? (
          <PresidentEmptyState
            title="Aucun événement"
            body="Les événements club apparaîtront ici dès qu’ils sont planifiés."
          />
        ) : (
          list.map((e) => (
            <PresidentActionRow
              key={e.id}
              label={e.title || 'Événement'}
              hint={formatEventWhen(e.starts_at)}
              icon="calendar"
            />
          ))
        )}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentRecruitmentScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  const vivier = useMemo(() => ws.players.slice(0, 10), [ws.players]);
  return (
    <PresidentSectionScreen
      eyebrow="Recrutement"
      title="Vivier & suivi"
      subtitle="Lecture directionnelle du bassin interne · le kanban détaillé reste en Club."
      liveLines={[
        `Licenciés (vivier) : ${ws.players.length}`,
        `Coachs : ${ws.coaches.length}`,
        `Adhésions en attente : ${ws.pendingMemberships}`,
        `Équipes sans coach : ${ws.teamsWithoutCoach}`,
      ]}
      links={[{ label: 'Recrutement Club', icon: 'briefcase', clubNav: 'recruitment' }]}
    >
      <PresidentSectionCard eyebrow="Interne" title="Vivier licencié">
        {vivier.length === 0 ? (
          <PresidentEmptyState
            title="Vivier vide"
            body="Les joueurs du club constitueront le bassin de recrutement interne."
          />
        ) : (
          vivier.map((p) => (
            <PresidentActionRow
              key={p.uid}
              label={p.display_name}
              hint="Licencié · bassin interne"
              icon="person"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard title="Actions direction">
        <PresidentActionRow
          label="Adhérents & validations"
          hint={
            ws.pendingMemberships > 0
              ? `${ws.pendingMemberships} en attente`
              : 'Ouvrir la section Adhérents'
          }
          icon="people"
          accent
          onPress={() => shellNav?.requestNav('members')}
        />
        <PresidentActionRow
          label="Staff"
          hint="Équipes sans coach"
          icon="school"
          onPress={() => shellNav?.requestNav('staff')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentVideoScreen() {
  const ws = useClubWorkspace();
  return (
    <PresidentSectionScreen
      eyebrow="Vidéo"
      title="Captation club"
      subtitle="Vue direction sur les options de captation · aucun fournisseur imposé."
      liveLines={[
        `Club : ${ws.club?.name ?? '…'}`,
        `Fournisseurs référencés : ${CLUB_VIDEO_PROVIDERS.length}`,
        `Connectés : ${CLUB_VIDEO_PROVIDERS.filter((p) => p.connected).length}`,
      ]}
      links={[{ label: 'Centre vidéo Club', icon: 'videocam', clubNav: 'video' }]}
    >
      <PresidentSectionCard eyebrow="Options" title="Fournisseurs">
        {CLUB_VIDEO_PROVIDERS.map((p) => (
          <PresidentActionRow
            key={p.id}
            label={p.label}
            hint={`${p.description}${p.connected ? ' · connecté' : ' · non connecté'}`}
            icon="videocam"
          />
        ))}
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentDocumentsScreen() {
  return (
    <PresidentSectionScreen
      eyebrow="Documents"
      title="Bureau & archives"
      subtitle="Espace prêt pour PV, statuts et dossiers direction."
      emptyTitle="Documents à brancher"
      emptyBody="Aucun coffre documentaire club n’est encore branché. Structure UI prête pour la suite."
      links={[{ label: 'Permissions Club', icon: 'shield', clubNav: 'permissions' }]}
    />
  );
}

export function PresidentReportsScreen() {
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Rapports"
      title="Synthèses de direction"
      subtitle="Brouillons via l’assistant · confirmation humaine obligatoire."
      emptyTitle="Pas d’export automatique"
      emptyBody="Demandez une trame de rapport à l’IA, puis validez avant diffusion."
      links={[]}
    >
      <PresidentSectionCard title="Actions">
        <PresidentActionRow
          label="Préparer un rapport avec l’IA"
          hint="Ouvre l’assistant exécutif"
          icon="star-four-points"
          accent
          onPress={() => shellNav?.requestNav('ai')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentInsightsScreen() {
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Analyses"
      title="Indicateurs de direction"
      subtitle={`Santé globale ${health.overall}%.`}
      liveLines={health.axes.map((a) => `${a.label} : ${a.score}% · ${a.summary}`)}
      links={[{ label: 'Stats Club', icon: 'stats-chart', clubNav: 'stats' }]}
    >
      <PresidentSectionCard title="Approfondir">
        <PresidentActionRow
          label="Cockpit santé"
          hint="Retour à l’accueil exécutif"
          icon="home"
          accent
          onPress={() => shellNav?.requestNav('cockpit')}
        />
        <PresidentActionRow
          label="Alertes"
          hint="Signaux prioritaires"
          icon="notifications"
          onPress={() => shellNav?.requestNav('alerts')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentAiScreen() {
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const { tokens } = usePresidentTheme();
  if (ws.loading) return <PresidentLoading />;
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, padding: presidentSpace.lg }}>
      <PresidentText variant="label" champagne>
        IA exécutive
      </PresidentText>
      <PresidentText variant="h1" style={{ marginBottom: presidentSpace.md }}>
        Assistant Président
      </PresidentText>
      <PresidentAiPanel workspace={ws} insights={health.insights} />
    </View>
  );
}

export function PresidentSettingsScreen() {
  const shellNav = usePresidentShellNav();
  return (
    <PresidentSectionScreen
      eyebrow="Paramètres"
      title="Pôle Président"
      subtitle="Identité Executive ProDay. Retour au Pôle Club pour l’opérationnel quotidien."
      links={[
        { label: 'Permissions Club', icon: 'shield', clubNav: 'permissions' },
        { label: 'Hub Club', icon: 'business', clubNav: 'club' },
      ]}
    >
      <PresidentSectionCard title="Navigation">
        <PresidentActionRow
          label="Retourner au Pôle Club"
          hint="Gestion quotidienne terrain"
          icon="football"
          accent
          onPress={() => shellNav?.exitToClub?.()}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentBoardScreen() {
  return (
    <PresidentSectionScreen
      eyebrow="Comité"
      title="Bureau dirigeant"
      subtitle="Composition du comité · structure prête."
      emptyTitle="Comité non renseigné"
      emptyBody="Ajoutez bientôt président, trésorier, secrétaire. Aucune donnée dupliquée : rattachement au club."
      links={[{ label: 'Hub Club', icon: 'people', clubNav: 'club' }]}
    />
  );
}

export function PresidentSeasonScreen() {
  const ws = useClubWorkspace();
  const shellNav = usePresidentShellNav();
  const highlights = useMemo(() => ws.events.slice(0, 8), [ws.events]);
  return (
    <PresidentSectionScreen
      eyebrow="Saison"
      title="Calendrier stratégique"
      subtitle="Temps forts de la saison en cours."
      liveLines={[
        `Événements suivis : ${ws.events.length}`,
        `Matchs du jour : ${ws.todayMatches.length}`,
      ]}
      links={[{ label: 'Calendrier Club', icon: 'calendar', clubNav: 'calendar' }]}
    >
      <PresidentSectionCard eyebrow="Saison" title="Temps forts">
        {highlights.length === 0 ? (
          <PresidentText variant="body" muted>
            Aucun temps fort chargé.
          </PresidentText>
        ) : (
          highlights.map((e) => (
            <PresidentActionRow
              key={e.id}
              label={e.title || 'Événement'}
              hint={formatEventWhen(e.starts_at)}
              icon="flag"
            />
          ))
        )}
      </PresidentSectionCard>
      <PresidentSectionCard title="Sections liées">
        <PresidentActionRow
          label="Sportif"
          hint="Matchs & entraînements"
          icon="trophy"
          accent
          onPress={() => shellNav?.requestNav('sport')}
        />
        <PresidentActionRow
          label="Événements"
          hint="Agenda complet"
          icon="calendar"
          onPress={() => shellNav?.requestNav('events')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}

export function PresidentGoalsScreen() {
  const ws = useClubWorkspace();
  const { goals, loading } = usePresidentFunding(ws.clubId);
  return (
    <PresidentSectionScreen
      eyebrow="Objectifs"
      title="Cibles de direction"
      subtitle="Objectifs de financement club + cibles sportives à venir."
      liveLines={
        loading
          ? ['Chargement…']
          : goals.length > 0
            ? goals.map((g) => g.title)
            : undefined
      }
      emptyTitle={!loading && goals.length === 0 ? 'Aucun objectif enregistré' : undefined}
      emptyBody={
        !loading && goals.length === 0
          ? 'Les objectifs sportifs / admin seront branchés ici. Les funding goals existants s’affichent dès création.'
          : undefined
      }
      links={[{ label: 'Sponsoring Club', icon: 'flag', clubNav: 'sponsoring' }]}
    >
      {goals.length > 0 ? (
        <PresidentSectionCard eyebrow="Cibles" title="Objectifs actifs">
          {goals.map((g) => (
            <PresidentActionRow
              key={g.id}
              label={g.title}
              hint={`${g.raised_amount_eur ?? 0} / ${g.target_amount_eur ?? 0} €`}
              icon="flag"
            />
          ))}
        </PresidentSectionCard>
      ) : null}
    </PresidentSectionScreen>
  );
}

export function PresidentAlertsScreen() {
  const ws = useClubWorkspace();
  const health = usePresidentHealth(ws);
  const shellNav = usePresidentShellNav();
  const alerts = [
    ...health.insights,
    ...(ws.pendingMemberships > 0
      ? [`${ws.pendingMemberships} adhésion(s) en attente`]
      : []),
    ...(ws.teamsWithoutCoach > 0
      ? [`${ws.teamsWithoutCoach} équipe(s) sans coach`]
      : []),
  ];
  return (
    <PresidentSectionScreen
      eyebrow="Alertes"
      title="Signaux prioritaires"
      subtitle="Ce qui demande une décision de direction."
      liveLines={alerts.length > 0 ? alerts : undefined}
      emptyTitle={alerts.length === 0 ? 'Aucune alerte' : undefined}
      emptyBody={
        alerts.length === 0
          ? 'Votre cockpit ne signale rien d’urgent pour le moment.'
          : undefined
      }
      links={[
        { label: 'Notifications Club', icon: 'notifications', clubNav: 'notifications' },
      ]}
    >
      <PresidentSectionCard title="Traiter dans le pôle">
        <PresidentActionRow
          label="Adhérents"
          hint="Validations"
          icon="people"
          accent
          onPress={() => shellNav?.requestNav('members')}
        />
        <PresidentActionRow
          label="Staff"
          hint="Équipes sans coach"
          icon="school"
          onPress={() => shellNav?.requestNav('staff')}
        />
        <PresidentActionRow
          label="Recrutement"
          hint="Vivier & suivi"
          icon="briefcase"
          onPress={() => shellNav?.requestNav('recruitment')}
        />
      </PresidentSectionCard>
    </PresidentSectionScreen>
  );
}
