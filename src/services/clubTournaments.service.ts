import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { GeneratedTournamentPlan } from '../utils/clubTournamentGenerator';
import {
  planToLiveFixtures,
  canTransitionLifecycle,
  canAcceptExternalRegistration,
  countConfirmedTeams,
  remainingCapacity,
  type ClubTournamentEvent,
  type ClubTournamentExternalInvite,
  type ClubTournamentLifecycle,
  type ClubTournamentLiveFixture,
} from '../models/ClubTournamentEvent';

const COL = 'club_tournaments';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  if (typeof v === 'string') return new Date(v);
  return new Date(0);
}

function toDateOrNull(v: unknown): Date | undefined {
  if (!v) return undefined;
  const d = toDate(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapFixture(raw: Record<string, unknown>): ClubTournamentLiveFixture {
  return {
    id: String(raw.id ?? ''),
    poolId: raw.poolId == null ? null : String(raw.poolId),
    roundLabel: String(raw.roundLabel ?? ''),
    homeTeamId: String(raw.homeTeamId ?? ''),
    awayTeamId: String(raw.awayTeamId ?? ''),
    homeName: String(raw.homeName ?? ''),
    awayName: String(raw.awayName ?? ''),
    pitchIndex: typeof raw.pitchIndex === 'number' ? raw.pitchIndex : 1,
    startsAt: toDate(raw.startsAt),
    endsAt: toDate(raw.endsAt),
    phase: raw.phase === 'knockout' ? 'knockout' : 'pool',
    home_score: typeof raw.home_score === 'number' ? raw.home_score : null,
    away_score: typeof raw.away_score === 'number' ? raw.away_score : null,
    status: (raw.status as ClubTournamentLiveFixture['status']) ?? 'scheduled',
    delay_min: typeof raw.delay_min === 'number' ? raw.delay_min : undefined,
  };
}

function mapInvite(raw: Record<string, unknown>): ClubTournamentExternalInvite {
  return {
    id: String(raw.id ?? ''),
    club_name: String(raw.club_name ?? ''),
    contact_name: raw.contact_name ? String(raw.contact_name) : undefined,
    contact_email: raw.contact_email ? String(raw.contact_email) : undefined,
    contact_phone: raw.contact_phone ? String(raw.contact_phone) : undefined,
    category: raw.category ? String(raw.category) : undefined,
    token: String(raw.token ?? ''),
    status: (raw.status as ClubTournamentExternalInvite['status']) ?? 'sent',
    requires_approval: raw.requires_approval === true,
    responded_at: raw.responded_at ? toDate(raw.responded_at) : undefined,
    responded_by: raw.responded_by ? String(raw.responded_by) : undefined,
    created_at: toDate(raw.created_at),
    expires_at: raw.expires_at ? toDate(raw.expires_at) : undefined,
    note: raw.note ? String(raw.note) : undefined,
  };
}

function mapEvent(id: string, data: Record<string, unknown>): ClubTournamentEvent {
  const fixturesRaw = Array.isArray(data.fixtures) ? data.fixtures : [];
  return {
    id,
    club_id: String(data.club_id ?? ''),
    created_by: String(data.created_by ?? ''),
    name: String(data.name ?? 'Tournoi'),
    category: String(data.category ?? ''),
    format: (data.format as ClubTournamentEvent['format']) ?? 'pools_only',
    public: data.public === true,
    status: (data.status as ClubTournamentEvent['status']) ?? 'draft',
    pools: (data.pools as ClubTournamentEvent['pools']) ?? [],
    teams: (data.teams as ClubTournamentEvent['teams']) ?? [],
    fixtures: fixturesRaw.map((f) => mapFixture(f as Record<string, unknown>)),
    partners: Array.isArray(data.partners)
      ? (data.partners as ClubTournamentEvent['partners'])
      : [],
    starts_at: toDateOrNull(data.starts_at),
    ends_at: toDateOrNull(data.ends_at),
    venue_label: data.venue_label ? String(data.venue_label) : undefined,
    city: data.city ? String(data.city) : undefined,
    capacity: typeof data.capacity === 'number' ? data.capacity : undefined,
    registration_deadline: toDateOrNull(data.registration_deadline),
    participation_conditions: data.participation_conditions
      ? String(data.participation_conditions)
      : undefined,
    entry_fee_label: data.entry_fee_label ? String(data.entry_fee_label) : undefined,
    external_invites: Array.isArray(data.external_invites)
      ? (data.external_invites as Record<string, unknown>[]).map(mapInvite)
      : [],
    change_log: Array.isArray(data.change_log)
      ? (data.change_log as Record<string, unknown>[]).map((c) => ({
          at: toDate(c.at),
          label: String(c.label ?? ''),
          by: c.by ? String(c.by) : undefined,
        }))
      : [],
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

function serializeFixture(f: ClubTournamentLiveFixture) {
  return {
    ...f,
    startsAt: f.startsAt.toISOString(),
    endsAt: f.endsAt.toISOString(),
  };
}

function serializeInvite(i: ClubTournamentExternalInvite) {
  return {
    ...i,
    created_at: toDate(i.created_at) ?? new Date(),
    responded_at: i.responded_at ? toDate(i.responded_at) : undefined,
    expires_at: i.expires_at ? toDate(i.expires_at) : undefined,
  };
}

function newToken(): string {
  return `inv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export const clubTournamentsService = {
  async listForClub(clubId: string, max = 20): Promise<ClubTournamentEvent[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapEvent(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapEvent(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async getById(id: string): Promise<ClubTournamentEvent | null> {
    if (!isFirebaseConfigured() || !id) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, id));
    if (!snap.exists()) return null;
    return mapEvent(snap.id, snap.data() as Record<string, unknown>);
  },

  async createFromPlan(input: {
    club_id: string;
    created_by: string;
    plan: GeneratedTournamentPlan;
    makePublic?: boolean;
    /** Créé en brouillon par défaut ; `registration_open` sur demande. */
    status?: ClubTournamentLifecycle;
    starts_at?: Date;
    ends_at?: Date;
    venue_label?: string;
    city?: string;
    capacity?: number;
    registration_deadline?: Date;
    participation_conditions?: string;
    entry_fee_label?: string;
  }): Promise<ClubTournamentEvent> {
    const fixtures = planToLiveFixtures(input.plan);
    const status: ClubTournamentLifecycle = input.status ?? 'draft';
    const local: ClubTournamentEvent = {
      id: `local_${Date.now()}`,
      club_id: input.club_id,
      created_by: input.created_by,
      name: input.plan.name,
      category: input.plan.category,
      format: input.plan.format,
      public: input.makePublic !== false,
      status,
      pools: input.plan.pools,
      teams: input.plan.teams,
      fixtures,
      partners: [],
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      venue_label: input.venue_label,
      city: input.city,
      capacity: input.capacity,
      registration_deadline: input.registration_deadline,
      participation_conditions: input.participation_conditions,
      entry_fee_label: input.entry_fee_label,
      external_invites: [],
      change_log: [],
      created_at: new Date(),
      updated_at: new Date(),
    };
    if (!isFirebaseConfigured()) return local;
    const database = getDb();
    if (!database) return local;
    const ref = await addDoc(collection(database, COL), {
      club_id: local.club_id,
      created_by: local.created_by,
      name: local.name,
      category: local.category,
      format: local.format,
      public: local.public,
      status: local.status,
      pools: local.pools,
      teams: local.teams,
      fixtures: fixtures.map(serializeFixture),
      partners: [],
      starts_at: local.starts_at ?? null,
      ends_at: local.ends_at ?? null,
      venue_label: local.venue_label ?? null,
      city: local.city ?? null,
      capacity: local.capacity ?? null,
      registration_deadline: local.registration_deadline ?? null,
      participation_conditions: local.participation_conditions ?? null,
      entry_fee_label: local.entry_fee_label ?? null,
      external_invites: [],
      change_log: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { ...local, id: ref.id };
  },

  async updateFixtures(
    id: string,
    fixtures: ClubTournamentLiveFixture[],
  ): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      fixtures: fixtures.map(serializeFixture),
      updated_at: serverTimestamp(),
    });
  },

  async setPublic(id: string, isPublic: boolean): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      public: isPublic,
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Transition d'état validée côté client (les règles Firestore restent la
   * barrière finale). Les transitions interdites lèvent une erreur explicite.
   */
  async setStatus(
    id: string,
    next: ClubTournamentLifecycle,
    opts?: { label?: string; by?: string },
  ): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Tournoi introuvable.');
    if (current.status === next) return;
    if (!canTransitionLifecycle(current.status, next)) {
      throw new Error(
        `Transition impossible : ${current.status} → ${next}. Consultez le cycle de vie du tournoi.`,
      );
    }
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      status: next,
      change_log: [
        ...(current.change_log ?? []),
        {
          at: new Date(),
          label: opts?.label ?? `Statut : ${next}`,
          by: opts?.by,
        },
      ],
      updated_at: serverTimestamp(),
    });
  },

  /** Report : décale tous les fixtures et la date de début. */
  async postpone(
    id: string,
    newStartsAt: Date,
    opts?: { by?: string },
  ): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Tournoi introuvable.');
    if (current.status === 'cancelled' || current.status === 'completed') {
      throw new Error('Ce tournoi ne peut plus être reporté.');
    }
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    const base = current.starts_at ? toDate(current.starts_at) : new Date();
    const shiftMs = newStartsAt.getTime() - base.getTime();
    await updateDoc(doc(database, COL, id), {
      starts_at: newStartsAt,
      ...(current.registration_deadline
        ? {
            registration_deadline: new Date(
              toDate(current.registration_deadline).getTime() + shiftMs,
            ),
          }
        : {}),
      fixtures: current.fixtures.map((f) => ({
        ...serializeFixture(f),
        startsAt: new Date(f.startsAt.getTime() + shiftMs).toISOString(),
        endsAt: new Date(f.endsAt.getTime() + shiftMs).toISOString(),
      })),
      change_log: [
        ...(current.change_log ?? []),
        {
          at: new Date(),
          label: `Reporté au ${newStartsAt.toLocaleDateString('fr-FR')}`,
          by: opts?.by,
        },
      ],
      updated_at: serverTimestamp(),
    });
  },

  /** Annulation — depuis tout état actif. Les participants devraient être notifiés. */
  async cancel(id: string, opts?: { by?: string; reason?: string }): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Tournoi introuvable.');
    if (current.status === 'cancelled') return;
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      status: 'cancelled',
      change_log: [
        ...(current.change_log ?? []),
        {
          at: new Date(),
          label: `Annulé${opts?.reason ? ` — ${opts.reason}` : ''}`,
          by: opts?.by,
        },
      ],
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Crée une invitation externe (club sans compte ProDay).
   * Vérifie capacité et fermeture des inscriptions avant création ; jamais
   * l'invité n'est marqué confirmé tant qu'il n'a pas répondu et, si requis,
   * été approuvé par l'organisateur.
   */
  async createExternalInvite(
    id: string,
    input: {
      club_name: string;
      contact_name?: string;
      contact_email?: string;
      contact_phone?: string;
      category?: string;
      requires_approval?: boolean;
      expires_at?: Date;
      note?: string;
    },
  ): Promise<ClubTournamentExternalInvite> {
    const current = await this.getById(id);
    if (!current) throw new Error('Tournoi introuvable.');
    if (!input.club_name.trim()) throw new Error('Indiquez le nom du club ou de l’équipe invitée.');
    if (current.status === 'cancelled') throw new Error('Ce tournoi est annulé.');
    if (
      current.status === 'registration_closed' ||
      current.status === 'ongoing' ||
      current.status === 'completed'
    ) {
      throw new Error('Les inscriptions sont fermées — impossible d’inviter de nouvelles équipes.');
    }
    const remaining = remainingCapacity(current);
    if (remaining !== null && remaining <= 0) {
      throw new Error('Capacité atteinte — augmentez la capacité avant d’inviter.');
    }
    // Doublon : même nom de club déjà invité (actif).
    const duplicate = (current.external_invites ?? []).some(
      (i) =>
        i.club_name.trim().toLowerCase() === input.club_name.trim().toLowerCase() &&
        (i.status === 'sent' || i.status === 'viewed' || i.status === 'accepted'),
    );
    if (duplicate) {
      throw new Error(`${input.club_name.trim()} est déjà invité(e) à ce tournoi.`);
    }

    const invite: ClubTournamentExternalInvite = {
      id: `ext_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      club_name: input.club_name.trim(),
      contact_name: input.contact_name?.trim() || undefined,
      contact_email: input.contact_email?.trim() || undefined,
      contact_phone: input.contact_phone?.trim() || undefined,
      category: input.category?.trim() || undefined,
      token: newToken(),
      status: 'sent',
      requires_approval: input.requires_approval !== false,
      created_at: new Date(),
      expires_at: input.expires_at ?? current.registration_deadline,
      note: input.note?.trim() || undefined,
    };

    if (!isFirebaseConfigured()) return invite;
    const database = getDb();
    if (!database) return invite;
    await updateDoc(doc(database, COL, id), {
      external_invites: [...(current.external_invites ?? []).map(serializeInvite), serializeInvite(invite)],
      updated_at: serverTimestamp(),
    });
    return invite;
  },

  /** Organisateur — révoque une invitation (le lien devient inutilisable). */
  async revokeExternalInvite(id: string, inviteId: string): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Tournoi introuvable.');
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      external_invites: (current.external_invites ?? []).map((i) =>
        i.id === inviteId ? { ...i, status: 'revoked' as const } : serializeInvite(i),
      ),
      updated_at: serverTimestamp(),
    });
  },

  /** Organisateur — approuve une inscription externe en attente d'approbation. */
  async approveExternalInvite(id: string, inviteId: string): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Tournoi introuvable.');
    const invite = (current.external_invites ?? []).find((i) => i.id === inviteId);
    if (!invite) throw new Error('Invitation introuvable.');
    if (invite.status !== 'accepted') {
      throw new Error('Seule une inscription acceptée par l’invité peut être approuvée.');
    }
    const remaining = remainingCapacity(current);
    if (remaining !== null && remaining <= 0) {
      throw new Error('Capacité atteinte — approbation impossible.');
    }
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      external_invites: (current.external_invites ?? []).map((i) =>
        i.id === inviteId
          ? serializeInvite({ ...invite, requires_approval: false })
          : serializeInvite(i),
      ),
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Réponse invité externe (page web publique, sans compte) — accepter ou
   * décliner. Vérifie expiration / révocation / capacité / doublon et n'accorde
   * aucun accès privé : la réponse est enregistrée sur le document tournoi.
   */
  async respondToExternalInvite(
    tournamentId: string,
    token: string,
    response: 'accepted' | 'declined',
    contact: {
      club_name?: string;
      contact_name?: string;
      contact_email?: string;
      contact_phone?: string;
      category?: string;
      note?: string;
    },
  ): Promise<{ status: 'accepted' | 'declined' | 'pending_approval'; clubName: string }> {
    const current = await this.getById(tournamentId);
    if (!current) throw new Error('Tournoi introuvable.');
    const guard = canAcceptExternalRegistration(current, token);
    if (!guard.ok) throw new Error(guard.reason ?? 'Inscription impossible.');

    const invites = current.external_invites ?? [];
    const idx = invites.findIndex((i) => i.token === token);
    const invite = invites[idx]!;
    const clubName = contact.club_name?.trim() || invite.club_name;
    // Doublon d'inscription : un autre token du même club déjà accepté.
    const duplicate = invites.some(
      (i) =>
        i.id !== invite.id &&
        i.status === 'accepted' &&
        i.club_name.trim().toLowerCase() === clubName.toLowerCase(),
    );
    if (duplicate) throw new Error('Une inscription existe déjà pour ce club.');

    const nextInvite: ClubTournamentExternalInvite = {
      ...invite,
      club_name: clubName,
      contact_name: contact.contact_name?.trim() || invite.contact_name,
      contact_email: contact.contact_email?.trim() || invite.contact_email,
      contact_phone: contact.contact_phone?.trim() || invite.contact_phone,
      category: contact.category?.trim() || invite.category,
      note: contact.note?.trim() || invite.note,
      status: response,
      responded_at: new Date(),
      responded_by: 'external',
    };

    if (!isFirebaseConfigured()) {
      return {
        status: response === 'accepted' && nextInvite.requires_approval ? 'pending_approval' : response,
        clubName,
      };
    }
    const database = getDb();
    if (!database) {
      return {
        status: response === 'accepted' && nextInvite.requires_approval ? 'pending_approval' : response,
        clubName,
      };
    }
    const nextInvites = invites.map((i, iIdx) => (iIdx === idx ? serializeInvite(nextInvite) : serializeInvite(i)));
    await updateDoc(doc(database, COL, tournamentId), {
      external_invites: nextInvites,
      updated_at: serverTimestamp(),
    });
    return {
      status: response === 'accepted' && nextInvite.requires_approval ? 'pending_approval' : response,
      clubName,
    };
  },

  /** Compteurs utiles écran organisateur. */
  countsFor(event: ClubTournamentEvent): {
    confirmedTeams: number;
    pendingApprovals: number;
    remaining: number | null;
  } {
    const invites = event.external_invites ?? [];
    return {
      confirmedTeams: countConfirmedTeams(event),
      pendingApprovals: invites.filter((i) => i.status === 'accepted' && i.requires_approval).length,
      remaining: remainingCapacity(event),
    };
  },
};
