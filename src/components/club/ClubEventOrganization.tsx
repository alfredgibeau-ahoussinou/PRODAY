import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { ClubTournamentWizard } from './ClubTournamentWizard';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { radius, spacing } from '../../theme/designTokens';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  clubTournamentsService,
} from '../../services/clubTournaments.service';
import {
  CLUB_TOURNAMENT_LIFECYCLE_LABELS,
  countConfirmedTeams,
  externalInviteUrl,
  remainingCapacity,
  type ClubTournamentEvent,
  type ClubTournamentLifecycle,
} from '../../models/ClubTournamentEvent';
import { Share } from 'react-native';

export type ClubEventKind =
  | 'tournament'
  | 'match'
  | 'stage'
  | 'detection'
  | 'plateau'
  | 'club_day'
  | 'internal'
  | 'other';

const EVENT_KINDS: { id: ClubEventKind; label: string }[] = [
  { id: 'tournament', label: 'Tournoi' },
  { id: 'match', label: 'Match' },
  { id: 'stage', label: 'Stage' },
  { id: 'detection', label: 'Détection' },
  { id: 'plateau', label: 'Plateau' },
  { id: 'club_day', label: 'Journée du club' },
  { id: 'internal', label: 'Événement interne' },
  { id: 'other', label: 'Autre' },
];

const LIFECYCLE_TONE: Record<ClubTournamentLifecycle, string> = {
  draft: '#8B8B9A',
  registration_open: '#10B981',
  registration_closed: '#F59E0B',
  confirmed: '#3B82F6',
  ongoing: '#22D3EE',
  completed: '#8B8B9A',
  cancelled: '#EF4444',
};

type Phase = 'list' | 'pick_type' | 'form' | 'tournament';

/**
 * Organisation des événements — entrée unique pour dirigeants club.
 * Gestion complète : création, cycle de vie, équipes inscrites, invitations
 * externes, reports / annulations, journal des changements.
 */
export const ClubEventOrganization: React.FC<{
  clubId: string;
  userId: string;
  organizerName?: string;
  teamId?: string | null;
}> = ({ clubId, userId, organizerName }) => {
  const { colors } = useAppTheme();
  const [phase, setPhase] = useState<Phase>('list');
  const [kind, setKind] = useState<ClubEventKind | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [category, setCategory] = useState('');
  const [teams, setTeams] = useState('');
  const [participants, setParticipants] = useState('');
  const [pitches, setPitches] = useState('');
  const [owner, setOwner] = useState('');
  const [notes, setNotes] = useState('');

  const kindLabel = useMemo(
    () => EVENT_KINDS.find((k) => k.id === kind)?.label ?? '',
    [kind],
  );

  const resetForm = () => {
    setName('');
    setDate('');
    setTime('');
    setPlace('');
    setCategory('');
    setTeams('');
    setParticipants('');
    setPitches('');
    setOwner('');
    setNotes('');
  };

  const startCreate = () => {
    resetForm();
    setKind(null);
    setPhase('pick_type');
  };

  const pickKind = (id: ClubEventKind) => {
    setKind(id);
    if (id === 'tournament') {
      setPhase('tournament');
      return;
    }
    setPhase('form');
  };

  const mapToTeamEventType = (k: ClubEventKind) => {
    switch (k) {
      case 'detection':
        return 'detection' as const;
      case 'match':
        return 'friendly' as const;
      case 'tournament':
        return 'tournament' as const;
      case 'stage':
      case 'plateau':
      case 'club_day':
      case 'internal':
      case 'other':
      default:
        return 'other' as const;
    }
  };

  const saveSimpleEvent = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Indiquez le nom de l’événement.');
      return;
    }
    if (!kind) return;
    setSaving(true);
    try {
      const day = date.trim() || new Date().toISOString().slice(0, 10);
      const hm = time.trim() || '10:00';
      const starts = new Date(`${day}T${hm.length === 5 ? hm : '10:00'}:00`);
      const ends = new Date(starts.getTime() + 2 * 60 * 60 * 1000);
      await teamEventsService.create({
        organizer_uid: userId,
        organizer_name: organizerName?.trim() || 'Dirigeant',
        club_id: clubId,
        event_type: mapToTeamEventType(kind),
        title: name.trim(),
        starts_at: starts,
        ends_at: ends,
        city: place.trim() || 'À préciser',
        location_label: place.trim() || undefined,
        invitee_uids: [],
        max_participants: participants.trim()
          ? parseInt(participants, 10) || undefined
          : undefined,
        categories: category.trim() ? [category.trim()] : undefined,
        description: [
          kindLabel ? `Type : ${kindLabel}` : '',
          teams.trim() ? `Équipes : ${teams.trim()}` : '',
          pitches.trim() ? `Terrains : ${pitches.trim()}` : '',
          owner.trim() ? `Responsable : ${owner.trim()}` : '',
          notes.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
      });
      Alert.alert('Événement créé', 'Votre événement est prêt. Les détails sont enregistrés.');
      setPhase('list');
      resetForm();
      setKind(null);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setSaving(false);
    }
  };

  if (phase === 'tournament') {
    return (
      <View style={styles.wrap}>
        <PressableSpring onPress={() => setPhase('list')} scaleTo={0.97}>
          <ProDayText variant="caption" accent style={styles.back}>
            ← Organisation des événements
          </ProDayText>
        </PressableSpring>
        <ClubTournamentWizard clubId={clubId} userId={userId} />
      </View>
    );
  }

  if (phase === 'pick_type') {
    return (
      <View style={styles.wrap}>
        <ProDayText variant="section">Type d’événement</ProDayText>
        <ProDayText variant="caption" muted style={styles.lead}>
          Choisissez le format. Les tournois ouvrent l’organisation automatisée.
        </ProDayText>
        <View style={styles.kindGrid}>
          {EVENT_KINDS.map((k) => (
            <PressableSpring
              key={k.id}
              onPress={() => pickKind(k.id)}
              scaleTo={0.96}
              style={[styles.kindChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            >
              <ProDayText variant="caption">{k.label}</ProDayText>
            </PressableSpring>
          ))}
        </View>
        <PressableSpring onPress={() => setPhase('list')} scaleTo={0.97}>
          <ProDayText variant="caption" muted style={styles.back}>
            Annuler
          </ProDayText>
        </PressableSpring>
      </View>
    );
  }

  if (phase === 'form' && kind) {
    const fields: [string, string, (v: string) => void, boolean?][] = [
      ['Nom de l’événement', name, setName],
      ['Date (AAAA-MM-JJ)', date, setDate],
      ['Heure (HH:MM)', time, setTime],
      ['Lieu', place, setPlace],
      ['Catégorie / âge', category, setCategory],
      ['Nombre d’équipes', teams, setTeams, true],
      ['Nombre de participants', participants, setParticipants, true],
      ['Terrains disponibles', pitches, setPitches],
      ['Responsable de l’événement', owner, setOwner],
      ['Informations complémentaires', notes, setNotes],
    ];
    return (
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <ProDayText variant="section">Créer : {kindLabel}</ProDayText>
        <ProDayText variant="caption" muted style={styles.lead}>
          Type : {kindLabel}
        </ProDayText>
        {fields.map(([label, value, setter, numeric]) => (
          <View key={label} style={styles.field}>
            <ProDayText variant="caption" muted>
              {label}
            </ProDayText>
            <TextInput
              value={value}
              onChangeText={setter}
              keyboardType={numeric ? 'number-pad' : 'default'}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
              multiline={label.startsWith('Informations')}
            />
          </View>
        ))}
        <PressableSpring
          onPress={() => void saveSimpleEvent()}
          disabled={saving}
          scaleTo={0.97}
          haptic
          style={[styles.cta, { backgroundColor: colors.accent }]}
        >
          <ProDayText variant="caption" inverse>
            {saving ? 'Enregistrement…' : 'Créer l’événement'}
          </ProDayText>
        </PressableSpring>
        <PressableSpring onPress={() => setPhase('pick_type')} scaleTo={0.97}>
          <ProDayText variant="caption" muted style={styles.back}>
            ← Changer le type
          </ProDayText>
        </PressableSpring>
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Organisation des événements</ProDayText>
      <ProDayText variant="caption" muted style={styles.lead}>
        Créez un tournoi, un match, un stage ou une journée club. Les tournois
        génèrent poules, matchs, horaires, terrains et classements auto.
      </ProDayText>
      <PressableSpring
        onPress={startCreate}
        scaleTo={0.97}
        haptic
        style={[styles.cta, { backgroundColor: colors.accent }]}
      >
        <ProDayText variant="caption" inverse>
          + Créer un événement
        </ProDayText>
      </PressableSpring>
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" muted>
          Tournoi : équipes, poules, matchs, scores, classement en direct, phases finales.
        </ProDayText>
      </ProDaySurface>
      <ClubTournamentManagerList clubId={clubId} userId={userId} organizerName={organizerName} />
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Gestion des tournois du club — cycle de vie + invitations externes  */
/* ------------------------------------------------------------------ */

const ClubTournamentManagerList: React.FC<{
  clubId: string;
  userId: string;
  organizerName?: string;
}> = ({ clubId, userId, organizerName: organizerNameProp }) => {
  const { colors } = useAppTheme();
  // Nom d'organisateur réel (jamais un libellé générique) — tracé dans les actions.
  const profile = useSessionProfile();
  const organizerName =
    organizerNameProp?.trim() || profile?.display_name?.trim() || 'Organisateur club';
  const [tournaments, setTournaments] = useState<ClubTournamentEvent[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteOpenFor, setInviteOpenFor] = useState<string | null>(null);

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const list = await clubTournamentsService.listForClub(clubId, 20);
      setTournaments(list);
    } catch {
      setTournaments([]);
    } finally {
      setBusy(false);
    }
  }, [clubId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = (t: ClubTournamentEvent, next: ClubTournamentLifecycle) => {
    void (async () => {
      setBusy(true);
      try {
        await clubTournamentsService.setStatus(t.id, next, { by: organizerName });
        await load();
      } catch (e) {
        Alert.alert('Statut', e instanceof Error ? e.message : 'Transition impossible.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const cancelTournament = (t: ClubTournamentEvent) => {
    Alert.alert(
      'Annuler le tournoi',
      `${t.name} passera en « Annulé ». Les équipes inscrites doivent être prévenues — utilisez le lien d'invitation ou la communication du club.`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler le tournoi',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await clubTournamentsService.cancel(t.id, { by: organizerName, reason: 'Annulé par l’organisateur' });
                await load();
              } catch (e) {
                Alert.alert('Annulation', e instanceof Error ? e.message : 'Action impossible.');
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  const postponeTournament = (t: ClubTournamentEvent) => {
    const base = t.starts_at ? new Date(t.starts_at) : new Date();
    const next = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    Alert.alert(
      'Reporter le tournoi',
      `Décaler ${t.name} et tous ses matchs au ${next.toLocaleDateString('fr-FR')} ?`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Reporter +7 jours',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await clubTournamentsService.postpone(t.id, next, { by: organizerName });
                await load();
              } catch (e) {
                Alert.alert('Report', e instanceof Error ? e.message : 'Action impossible.');
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (tournaments === null) {
    return (
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" muted>
          {busy ? 'Chargement des tournois…' : 'Aucun tournoi listé.'}
        </ProDayText>
      </ProDaySurface>
    );
  }

  if (tournaments.length === 0) {
    return (
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" muted>
          Aucun tournoi enregistré pour ce club. Créez-en un pour gérer les inscriptions,
          les poules et les invitations externes.
        </ProDayText>
      </ProDaySurface>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {tournaments.map((t) => (
        <ProDaySurface key={t.id} variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            <ProDayText variant="section" style={{ flex: 1, minWidth: '60%' }}>
              {t.name}
            </ProDayText>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radius.pill,
                backgroundColor: `${LIFECYCLE_TONE[t.status]}22`,
                borderWidth: 1,
                borderColor: `${LIFECYCLE_TONE[t.status]}66`,
              }}
            >
              <ProDayText variant="caption" style={{ color: LIFECYCLE_TONE[t.status], fontWeight: '800', fontSize: 10 }}>
                {CLUB_TOURNAMENT_LIFECYCLE_LABELS[t.status].toUpperCase()}
              </ProDayText>
            </View>
          </View>

          <ProDayText variant="caption" muted>
            {[
              t.category,
              t.starts_at ? new Date(t.starts_at).toLocaleDateString('fr-FR') : null,
              t.venue_label,
              t.city,
              `${countConfirmedTeams(t)} équipe(s)${t.capacity ? ` / ${t.capacity}` : ''}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </ProDayText>

          {(t.external_invites?.length ?? 0) > 0 ? (
            <ProDayText variant="caption" muted>
              Invitations externes :{' '}
              {t.external_invites!
                .map((i) => `${i.club_name} (${i.status})`)
                .join(', ')}
            </ProDayText>
          ) : null}

          {(t.change_log?.length ?? 0) > 0 ? (
            <ProDayText variant="caption" muted numberOfLines={2}>
              Journal : {t.change_log!.slice(-2).map((c) => c.label).join(' · ')}
            </ProDayText>
          ) : null}

          <View style={styles.kindGrid}>
            {t.status === 'draft' ? (
              <PressableSpring
                onPress={() => changeStatus(t, 'registration_open')}
                disabled={busy}
                scaleTo={0.96}
                style={[styles.kindChip, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <ProDayText variant="caption" accent>
                  Ouvrir les inscriptions
                </ProDayText>
              </PressableSpring>
            ) : null}
            {t.status === 'registration_open' ? (
              <>
                <PressableSpring
                  onPress={() => setInviteOpenFor(inviteOpenFor === t.id ? null : t.id)}
                  scaleTo={0.96}
                  style={[styles.kindChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                >
                  <ProDayText variant="caption">Inviter un club externe</ProDayText>
                </PressableSpring>
                <PressableSpring
                  onPress={() => changeStatus(t, 'registration_closed')}
                  disabled={busy}
                  scaleTo={0.96}
                  style={[styles.kindChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                >
                  <ProDayText variant="caption">Fermer les inscriptions</ProDayText>
                </PressableSpring>
              </>
            ) : null}
            {t.status === 'registration_closed' ? (
              <PressableSpring
                onPress={() => changeStatus(t, 'confirmed')}
                disabled={busy}
                scaleTo={0.96}
                style={[styles.kindChip, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <ProDayText variant="caption" accent>
                  Confirmer le tournoi
                </ProDayText>
              </PressableSpring>
            ) : null}
            {t.status === 'confirmed' ? (
              <PressableSpring
                onPress={() => changeStatus(t, 'ongoing')}
                disabled={busy}
                scaleTo={0.96}
                style={[styles.kindChip, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <ProDayText variant="caption" accent>
                  Démarrer (en cours)
                </ProDayText>
              </PressableSpring>
            ) : null}
            {t.status === 'ongoing' ? (
              <PressableSpring
                onPress={() => changeStatus(t, 'completed')}
                disabled={busy}
                scaleTo={0.96}
                style={[styles.kindChip, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <ProDayText variant="caption" accent>
                  Clôturer
                </ProDayText>
              </PressableSpring>
            ) : null}
            {t.status !== 'cancelled' && t.status !== 'completed' ? (
              <>
                <PressableSpring
                  onPress={() => postponeTournament(t)}
                  disabled={busy}
                  scaleTo={0.96}
                  style={[styles.kindChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                >
                  <ProDayText variant="caption">Reporter +7j</ProDayText>
                </PressableSpring>
                <PressableSpring
                  onPress={() => cancelTournament(t)}
                  disabled={busy}
                  scaleTo={0.96}
                  style={[styles.kindChip, { borderColor: '#EF444466', backgroundColor: 'rgba(239,68,68,0.08)' }]}
                >
                  <ProDayText variant="caption" style={{ color: '#EF4444' }}>
                    Annuler
                  </ProDayText>
                </PressableSpring>
              </>
            ) : null}
          </View>

          {inviteOpenFor === t.id ? (
            <ExternalInvitePanel
              tournament={t}
              userId={userId}
              organizerName={organizerName}
              onDone={() => {
                setInviteOpenFor(null);
                void load();
              }}
            />
          ) : null}
        </ProDaySurface>
      ))}
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Panneau invitations externes — clubs sans compte ProDay             */
/* ------------------------------------------------------------------ */

const ExternalInvitePanel: React.FC<{
  tournament: ClubTournamentEvent;
  userId: string;
  organizerName?: string;
  onDone: () => void;
}> = ({ tournament, onDone }) => {
  const { colors } = useAppTheme();
  const [clubName, setClubName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [busy, setBusy] = useState(false);

  const remaining = remainingCapacity(tournament);
  const pendingApprovals = (tournament.external_invites ?? []).filter(
    (i) => i.status === 'accepted' && i.requires_approval,
  );

  const createInvite = () => {
    if (!clubName.trim()) {
      Alert.alert('Nom requis', 'Indiquez le nom du club ou de l’équipe invitée.');
      return;
    }
    void (async () => {
      setBusy(true);
      try {
        await clubTournamentsService.createExternalInvite(tournament.id, {
          club_name: clubName,
          contact_name: contactName,
          contact_email: contactEmail,
          requires_approval: requiresApproval,
        });
        setClubName('');
        setContactName('');
        setContactEmail('');
        Alert.alert(
          'Invitation créée',
          'Copiez le lien d’invitation et envoyez-le au club invité (email, SMS, WhatsApp). Aucun compte ProDay n’est requis pour répondre.',
          [
            {
              text: 'Copier le dernier lien',
              onPress: () => {
                void loadLatestLink();
              },
            },
            { text: 'Fermer', onPress: onDone },
          ],
        );
      } catch (e) {
        Alert.alert('Invitation', e instanceof Error ? e.message : 'Création impossible.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const loadLatestLink = async () => {
    try {
      const fresh = await clubTournamentsService.getById(tournament.id);
      const last = fresh?.external_invites?.[fresh.external_invites.length - 1];
      if (last) {
        await Share.share({ message: `${tournament.name} — invitation ${last.club_name} : ${externalInviteUrl(tournament.id, last.token)}` });
      }
      onDone();
    } catch {
      onDone();
    }
  };

  return (
    <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
      <ProDayText variant="caption" muted>
        Invitez un club, une équipe ou des participants externes sans compte ProDay. Le lien
        permet de voir les informations publiques du tournoi et d’accepter ou décliner. Chaque
        inscription reste « en attente d’approbation » tant que vous ne l’avez pas validée.
      </ProDayText>
      {remaining !== null ? (
        <ProDayText variant="caption" muted>
          Places restantes : {remaining}
        </ProDayText>
      ) : null}

      {pendingApprovals.length > 0 ? (
        <View style={{ gap: spacing.xs }}>
          <ProDayText variant="caption" style={{ color: '#F59E0B', fontWeight: '800' }}>
            {pendingApprovals.length} inscription(s) à approuver
          </ProDayText>
          {pendingApprovals.map((i) => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <ProDayText variant="caption" style={{ flex: 1 }}>
                {i.club_name} — {i.contact_name ?? i.contact_email ?? 'contact inconnu'}
              </ProDayText>
              <PressableSpring
                onPress={() => {
                  void (async () => {
                    setBusy(true);
                    try {
                      await clubTournamentsService.approveExternalInvite(tournament.id, i.id);
                      onDone();
                    } catch (e) {
                      Alert.alert('Approbation', e instanceof Error ? e.message : 'Action impossible.');
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
                disabled={busy}
                scaleTo={0.95}
                style={[styles.kindChip, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <ProDayText variant="caption" accent>
                  Approuver
                </ProDayText>
              </PressableSpring>
              <PressableSpring
                onPress={() => {
                  void (async () => {
                    setBusy(true);
                    try {
                      await clubTournamentsService.revokeExternalInvite(tournament.id, i.id);
                      onDone();
                    } catch (e) {
                      Alert.alert('Révocation', e instanceof Error ? e.message : 'Action impossible.');
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
                disabled={busy}
                scaleTo={0.95}
                style={[styles.kindChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              >
                <ProDayText variant="caption" muted>
                  Rejeter
                </ProDayText>
              </PressableSpring>
            </View>
          ))}
        </View>
      ) : null}

      {[
        ['Nom du club / équipe invité(e)', clubName, setClubName],
        ['Personne de contact', contactName, setContactName],
        ['Email de contact (optionnel)', contactEmail, setContactEmail],
      ].map(([label, value, setter]) => (
        <View key={label as string} style={styles.field}>
          <ProDayText variant="caption" muted>
            {label as string}
          </ProDayText>
          <TextInput
            value={value as string}
            onChangeText={setter as (v: string) => void}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
          />
        </View>
      ))}

      <PressableSpring
        onPress={() => setRequiresApproval(!requiresApproval)}
        scaleTo={0.97}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 4 }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: requiresApproval ? colors.accent : colors.border,
            backgroundColor: requiresApproval ? colors.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {requiresApproval ? <ProDayText variant="caption" inverse style={{ fontSize: 11 }}>✓</ProDayText> : null}
        </View>
        <ProDayText variant="caption" muted>
          Approbation organisateur requise avant confirmation
        </ProDayText>
      </PressableSpring>

      <PressableSpring
        onPress={createInvite}
        disabled={busy}
        scaleTo={0.97}
        haptic
        style={[styles.cta, { backgroundColor: colors.accent, alignSelf: 'stretch' }]}
      >
        <ProDayText variant="caption" inverse>
          {busy ? 'Création…' : 'Créer le lien d’invitation externe'}
        </ProDayText>
      </PressableSpring>

      {(tournament.external_invites ?? []).filter((i) => i.status !== 'revoked').length > 0 ? (
        <View style={{ gap: 4 }}>
          <ProDayText variant="caption" muted>
            Liens actifs :
          </ProDayText>
          {(tournament.external_invites ?? [])
            .filter((i) => i.status !== 'revoked')
            .map((i) => (
              <PressableSpring
                key={i.id}
                onPress={() => {
                  void Share.share({
                    message: `${tournament.name} — invitation ${i.club_name} : ${externalInviteUrl(tournament.id, i.token)}`,
                  });
                }}
                scaleTo={0.97}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 }}
              >
                <ProDayText variant="caption" accent style={{ flex: 1 }} numberOfLines={1}>
                  {i.club_name} · {i.status} · {externalInviteUrl(tournament.id, i.token)}
                </ProDayText>
                <PressableSpring
                  onPress={() => {
                    void (async () => {
                      try {
                        await clubTournamentsService.revokeExternalInvite(tournament.id, i.id);
                        onDone();
                      } catch (e) {
                        Alert.alert('Révocation', e instanceof Error ? e.message : 'Action impossible.');
                      }
                    })();
                  }}
                  scaleTo={0.94}
                >
                  <ProDayText variant="caption" style={{ color: '#EF4444' }}>
                    Révoquer
                  </ProDayText>
                </PressableSpring>
              </PressableSpring>
            ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingBottom: spacing.lg },
  lead: { marginBottom: spacing.xs },
  back: { marginTop: spacing.sm },
  kindGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  kindChip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  field: { gap: 4, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  cta: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  card: { padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.sm },
});
