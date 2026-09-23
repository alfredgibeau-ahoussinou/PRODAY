import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ModalSheet } from '../../motion/primitives/ModalSheet';
import { PressableSpring } from '../motion/PressableSpring';
import type { TeamEvent } from '../../models/TeamEvent';
import { getPendingInviteeUids } from '../../models/TeamEvent';
import { usersService } from '../../services/users.service';
import {
  RSVP_REMINDER_COOLDOWN_MS,
  executeRsvpReminderForPlayer,
} from '../../utils/coachRsvpReminders';
import { staffNotificationsService } from '../../services/staffNotifications.service';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { withAlpha } from '../../components/navigation/tabBarShared';
import type { CoachComponentTokens } from '../../features/coach/theme/coachPitchTokens';
import { proForm, proRadius, proSemantic, proSpace } from '../../theme/professionalDesign';

type RowState = 'idle' | 'sending' | 'sent' | 'failed';

/** « il y a 3h », « il y a 45 min » — le délai restant avant nouvelle relance. */
function cooldownLabel(remindedAt: number): string {
  const minutes = Math.max(1, Math.round((Date.now() - remindedAt) / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours}h`;
}

interface PendingRow {
  uid: string;
  name: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Convocation réelle dont on détaille les réponses en attente. */
  event: TeamEvent | null;
  tokens: CoachComponentTokens;
}

/**
 * Détail des réponses en attente d'une convocation — déroulé du compteur de
 * l'accueil Coach. Une rangée par joueur convoqué sans réponse, avec sa relance
 * **individuelle** (même chemin d'envoi que la relance groupée :
 * `executeRsvpReminderForPlayer`). Les noms sont lus à l'ouverture de la
 * feuille, pour les joueurs concernés seulement — jamais un annuaire entier.
 */
export const CoachPendingRsvpSheet: React.FC<Props> = ({
  visible,
  onClose,
  event,
  tokens,
}) => {
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  /** Acteur de session — nommé dans la trace d'historique de chaque relance. */
  const profile = useSessionProfile();
  const [rows, setRows] = useState<PendingRow[] | null>(null);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  /** Dernière relance **journalisée** < 24 h par joueur — le garde-fou visible. */
  const [cooldownAt, setCooldownAt] = useState<Record<string, number>>({});
  const [loadFailed, setLoadFailed] = useState(false);

  const pendingUids = useMemo(
    () => (event ? getPendingInviteeUids(event) : []),
    [event],
  );

  /** Lecture paresseuse des noms — à l'ouverture, pour les joueurs concernés. */
  const loadRows = useCallback(async () => {
    if (pendingUids.length === 0) {
      setRows([]);
      setLoadFailed(false);
      return;
    }
    setRows(null);
    setLoadFailed(false);
    setRowStates({});
    setCooldownAt({});
    const loaded = await Promise.all(
      pendingUids.map(async (uid) => {
        const member = await usersService.getPublicById(uid).catch(() => null);
        return { uid, name: member?.display_name?.trim() || 'Joueur' } as PendingRow;
      }),
    );
    setRows(loaded.sort((a, b) => a.name.localeCompare(b.name, 'fr')));

    /**
     * Le garde-fou 24 h est lu ici pour **l'affichage** (lignes « Relancé il y
     * a Xh ») ; le chemin d'envoi le re-vérifie lui-même avant chaque envoi.
     */
    if (event?.club_id) {
      const logs = await staffNotificationsService
        .listReminderLogsForEvent(event.id)
        .catch(() => []);
      const now = Date.now();
      const recent: Record<string, number> = {};
      for (const log of logs) {
        const age = now - log.created_at.getTime();
        if (age >= RSVP_REMINDER_COOLDOWN_MS) continue;
        const meta = (log.meta ?? {}) as { recipient_uids?: unknown; player_uid?: unknown };
        const covered: string[] = Array.isArray(meta.recipient_uids)
          ? (meta.recipient_uids as string[])
          : typeof meta.player_uid === 'string'
            ? [meta.player_uid]
            : [];
        for (const uid of covered) {
          const newer = recent[uid] === undefined || log.created_at.getTime() > recent[uid];
          if (newer) recent[uid] = log.created_at.getTime();
        }
      }
      setCooldownAt(recent);
    }
  }, [pendingUids]);

  useEffect(() => {
    if (visible && event) void loadRows();
  }, [visible, event, loadRows]);

  /** Une relance (individuelle ou groupée) en cours → l'en-tête montre un spinner. */
  const anySending =
    rows !== null && rows.some((row) => (rowStates[row.uid] ?? 'idle') === 'sending');
  const sentCount =
    rows === null ? 0 : rows.filter((row) => (rowStates[row.uid] ?? 'idle') === 'sent').length;
  const allSent = rows !== null && rows.length > 0 && sentCount === rows.length;

  /**
   * Cibles réelles du « Tout relancer » : les lignes pas déjà « Relancé » **et**
   * hors garde-fou 24 h. Les joueurs en cooldown sont exclus ici — et le chemin
   * d'envoi re-vérifie de toute façon avant chaque envoi.
   */
  const bulkTargets =
    rows === null
      ? []
      : rows.filter(
          (row) =>
            (rowStates[row.uid] ?? 'idle') !== 'sent' && cooldownAt[row.uid] === undefined,
        );
  const blockedCount = rows === null ? 0 : rows.filter((row) => cooldownAt[row.uid] !== undefined).length;

  const remind = useCallback(
    async (uid: string, playerName?: string) => {
      if (!event) return;
      setRowStates((prev) => ({ ...prev, [uid]: 'sending' }));
      const ok = await executeRsvpReminderForPlayer(event, uid, {
        actor: profile ? { user: profile, isAdmin: profile.is_admin } : null,
        playerName: playerName ?? null,
      });
      setRowStates((prev) => ({ ...prev, [uid]: ok ? 'sent' : 'failed' }));
    },
    [event, profile],
  );

  /**
   * Relance **tout le monde pas encore prévenu** — la même relance individuelle
   * (`executeRsvpReminderForPlayer`), appliquée à chaque joueur dont la ligne
   * n'est pas déjà « Relancé ». Une seule source de vérité : chaque ligne passe
   * par les mêmes états spinner → Relancé/Échec que la relance à l'unité, donc
   * le résultat visible ne peut pas diverger de ce qui a été envoyé.
   */
  const remindAll = useCallback(async () => {
    if (!event || rows === null || anySending) return;
    const targets = rows.filter(
      (row) =>
        (rowStates[row.uid] ?? 'idle') !== 'sent' && cooldownAt[row.uid] === undefined,
    );
    if (targets.length === 0) return;
    for (const row of targets) {
      setRowStates((prev) => ({ ...prev, [row.uid]: 'sending' }));
      const ok = await executeRsvpReminderForPlayer(event, row.uid, {
        actor: profile ? { user: profile, isAdmin: profile.is_admin } : null,
        playerName: row.name,
      });
      setRowStates((prev) => ({ ...prev, [row.uid]: ok ? 'sent' : 'failed' }));
    }
  }, [event, rows, rowStates, anySending, profile, cooldownAt]);

  const countLabel = rows === null ? '' : `${rows.length} réponse${rows.length > 1 ? 's' : ''} en attente`;

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      variant="sheet"
      backgroundColor={tokens.surface}
      borderColor={tokens.border}
      handleColor={tokens.muted}
    >
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Ionicons name="notifications-outline" size={16} color={proSemantic.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Réponses en attente</Text>
          {event ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {countLabel} · {event.title || 'Événement'}
            </Text>
          ) : null}
        </View>

        {/*
         * Relance groupée — le même chemin que les boutons à l'unité ci-dessous.
         * Visible tant qu'il reste au moins une ligne non « Relancé » (reprise
         * des échecs incluse), puis « Relancés » une fois tout le monde prévenu.
         */
        }
        {rows !== null && rows.length > 0 ? (
          allSent ? (
            <View style={[styles.bulkBtn, styles.bulkBtnDone]}>
              <MaterialCommunityIcons name="check" size={14} color={proSemantic.success} />
              <Text style={styles.bulkBtnTextDone}>Relancés</Text>
            </View>
          ) : anySending ? (
            <ActivityIndicator size="small" color={proSemantic.warning} />
          ) : (
            <PressableSpring
              onPress={() => void remindAll()}
              scaleTo={0.96}
              haptic
              disabled={bulkTargets.length === 0}
              accessibilityRole="button"
              accessibilityLabel={
                bulkTargets.length === 0
                  ? 'Tous les joueurs ont déjà été relancés il y a moins de 24 heures'
                  : `Relancer les ${bulkTargets.length} joueurs qui n’ont pas répondu`
              }
              style={[
                styles.bulkBtn,
                bulkTargets.length === 0 && styles.bulkBtnCooldown,
              ]}
            >
              <Ionicons
                name={bulkTargets.length === 0 ? 'time-outline' : 'paper-plane'}
                size={12}
                color={bulkTargets.length === 0 ? proSemantic.warning : proSemantic.onDanger}
              />
              <Text
                style={
                  bulkTargets.length === 0 ? styles.bulkBtnTextCooldown : styles.bulkBtnText
                }
              >
                {bulkTargets.length === 0 ? 'Déjà relancés' : 'Tout relancer'}
              </Text>
            </PressableSpring>
          )
        ) : null}
      </View>

      {rows === null ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color={tokens.accent} />
          <Text style={styles.noteText}>Lecture des joueurs…</Text>
        </View>
      ) : loadFailed ? (
        <View style={styles.centerBlock}>
          <Text style={styles.noteText}>La lecture des joueurs a échoué.</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.centerBlock}>
          <Text style={styles.noteText}>Tout le monde a répondu à cette convocation.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => {
            const state = rowStates[row.uid] ?? 'idle';
            return (
              <View key={row.uid} style={styles.row}>
                <View style={styles.rowBadge}>
                  <Text style={styles.rowBadgeText}>
                    {row.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.rowName}>
                  {row.name}
                </Text>

                {state === 'sending' ? (
                  <ActivityIndicator size="small" color={tokens.accent} />
                ) : cooldownAt[row.uid] !== undefined && state === 'idle' ? (
                  /** Garde-fou 24 h : déjà relancé, pas cliquable, avec le délai. */
                  <View style={[styles.remindBtn, styles.remindBtnCooldown]}>
                    <Ionicons name="time-outline" size={13} color={proSemantic.warning} />
                    <Text style={styles.remindBtnTextCooldown}>
                      Relancé {cooldownLabel(cooldownAt[row.uid])}
                    </Text>
                  </View>
                ) : (
                  <PressableSpring
                    onPress={() => void remind(row.uid, row.name)}
                    disabled={state === 'sent'}
                    scaleTo={0.96}
                    haptic={state !== 'sent'}
                    style={[
                      styles.remindBtn,
                      state === 'sent' && styles.remindBtnSent,
                      state === 'failed' && styles.remindBtnFailed,
                    ]}
                  >
                    {state === 'sent' ? (
                      <>
                        <MaterialCommunityIcons name="check" size={14} color={proSemantic.success} />
                        <Text style={styles.remindBtnTextSent}>Relancé</Text>
                      </>
                    ) : state === 'failed' ? (
                      <Text style={styles.remindBtnTextFailed}>Échec — réessayer</Text>
                    ) : (
                      <>
                        <Ionicons name="notifications-outline" size={13} color={tokens.accent} />
                        <Text style={styles.remindBtnText}>Relancer</Text>
                      </>
                    )}
                  </PressableSpring>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ModalSheet>
  );
};

const createStyles = (tokens: CoachComponentTokens) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: proSpace.lg,
      paddingTop: proSpace.sm,
      paddingBottom: proSpace.md,
    },
    headerBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: withAlpha(proSemantic.warning, 0.14),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    bulkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      minHeight: proForm.chipHeight - 4,
      borderRadius: proForm.chipRadius,
      backgroundColor: proSemantic.warning,
      paddingHorizontal: proSpace.md,
    },
    bulkBtnText: {
      /** Texte posé sur un aplat de statut — même règle que `onDanger`. */
      color: proSemantic.onDanger,
      fontSize: 11.5,
      fontWeight: '800',
          },
    bulkBtnDone: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.success, 0.4),
    },
    bulkBtnCooldown: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.warning, 0.4),
    },
    bulkBtnTextCooldown: {
      color: proSemantic.warning,
      fontSize: 11.5,
      fontWeight: '800',
          },
    remindBtnCooldown: {
      borderColor: withAlpha(proSemantic.warning, 0.4),
    },
    remindBtnTextCooldown: {
      color: proSemantic.warning,
      fontSize: 11.5,
      fontWeight: '700',
          },
    bulkBtnTextDone: {
      color: proSemantic.success,
      fontSize: 11.5,
      fontWeight: '800',
          },
    title: {
      color: tokens.foreground,
      fontSize: 15,
      fontWeight: '800',
            letterSpacing: -0.2,
    },
    subtitle: {
      color: tokens.muted,
      fontSize: 11.5,
            marginTop: 1,
    },
    list: {
      paddingHorizontal: proSpace.lg,
      paddingBottom: proSpace.xl,
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: proForm.chipHeight + 8,
      borderRadius: proRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      paddingHorizontal: proSpace.md,
      paddingVertical: proSpace.xs,
    },
    rowBadge: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: withAlpha(tokens.accent, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBadgeText: {
      color: tokens.accent,
      fontSize: 12,
      fontWeight: '800',
          },
    rowName: {
      color: tokens.foreground,
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      fontWeight: '600',
          },
    remindBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      minHeight: proForm.chipHeight,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.4),
      paddingHorizontal: proSpace.md,
    },
    remindBtnText: {
      color: tokens.accent,
      fontSize: 11.5,
      fontWeight: '700',
          },
    remindBtnSent: {
      borderColor: withAlpha(proSemantic.success, 0.4),
    },
    remindBtnTextSent: {
      color: proSemantic.success,
      fontSize: 11.5,
      fontWeight: '700',
          },
    remindBtnFailed: {
      borderColor: withAlpha(proSemantic.danger, 0.4),
    },
    remindBtnTextFailed: {
      color: proSemantic.danger,
      fontSize: 11.5,
      fontWeight: '700',
          },
    centerBlock: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: proSpace.xl,
    },
    noteText: {
      color: tokens.muted,
      fontSize: 12.5,
            textAlign: 'center',
    },
  });
