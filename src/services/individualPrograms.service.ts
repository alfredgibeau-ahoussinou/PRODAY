import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  IndividualTrainingProgram,
  CreateIndividualProgramInput,
  AssignedExerciseSnapshot,
} from '../models/IndividualTrainingProgram';

const COL = 'individual_training_programs';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapDoc(id: string, data: Record<string, unknown>): IndividualTrainingProgram {
  const rawExercises = Array.isArray(data.exercises) ? data.exercises : [];
  const exercises: AssignedExerciseSnapshot[] = rawExercises.map((e: Record<string, unknown>, idx) => ({
    id: String(e.id ?? `ex_${idx}`),
    library_exercise_id: e.library_exercise_id ? String(e.library_exercise_id) : undefined,
    title: String(e.title ?? 'Exercice'),
    instructions: Array.isArray(e.instructions) ? e.instructions.map(String) : [],
    reps_label: e.reps_label ? String(e.reps_label) : undefined,
    duration_min: typeof e.duration_min === 'number' ? e.duration_min : undefined,
    equipment: Array.isArray(e.equipment) ? e.equipment.map(String) : [],
    diagram: e.diagram as AssignedExerciseSnapshot['diagram'],
    player_completed: Boolean(e.player_completed),
    player_completed_at: e.player_completed_at ? toDate(e.player_completed_at) : undefined,
    player_feedback: e.player_feedback ? String(e.player_feedback) : undefined,
    coach_reviewed: Boolean(e.coach_reviewed),
    coach_reviewed_at: e.coach_reviewed_at ? toDate(e.coach_reviewed_at) : undefined,
    coach_feedback: e.coach_feedback ? String(e.coach_feedback) : undefined,
  }));

  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : undefined,
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    coach_uid: String(data.coach_uid ?? ''),
    coach_name: String(data.coach_name ?? ''),
    title: String(data.title ?? 'Programme individuel'),
    objective: data.objective ? String(data.objective) : undefined,
    due_date: data.due_date ? toDate(data.due_date) : undefined,
    exercises,
    status: (data.status as IndividualTrainingProgram['status']) ?? 'active',
    completed_by_player: Boolean(data.completed_by_player),
    player_notes: data.player_notes ? String(data.player_notes) : undefined,
    reviewed_by_coach: Boolean(data.reviewed_by_coach),
    coach_final_notes: data.coach_final_notes ? String(data.coach_final_notes) : undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

const inMemoryPrograms = new Map<string, IndividualTrainingProgram>();

export const individualProgramsService = {
  /**
   * Récupère un programme par son identifiant.
   */
  async getProgram(id: string): Promise<IndividualTrainingProgram | null> {
    const database = getDb();
    if (database && isFirebaseConfigured()) {
      try {
        const snap = await getDoc(doc(database, COL, id));
        if (snap.exists()) {
          return mapDoc(snap.id, snap.data() as Record<string, unknown>);
        }
      } catch {
        // Fallback
      }
    }
    return inMemoryPrograms.get(id) ?? null;
  },

  /**
   * Crée un programme individuel avec snapshot immuable des exercices.
   */
  async createProgram(input: CreateIndividualProgramInput): Promise<IndividualTrainingProgram> {
    const database = getDb();
    const now = new Date();

    const snapshotExercises: AssignedExerciseSnapshot[] = input.exercises.map((e, idx) => ({
      ...e,
      id: e.id || `ex_${idx}_${Date.now()}`,
      player_completed: false,
      coach_reviewed: false,
    }));

    const payload: Record<string, unknown> = {
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      player_uid: input.player_uid,
      player_name: input.player_name,
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      title: input.title.trim(),
      objective: input.objective?.trim() ?? null,
      due_date: input.due_date ? Timestamp.fromDate(input.due_date) : null,
      exercises: snapshotExercises,
      status: 'active',
      completed_by_player: false,
      player_notes: null,
      reviewed_by_coach: false,
      coach_final_notes: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    let id = `prog_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL), payload);
      id = ref.id;
    }

    const created: IndividualTrainingProgram = {
      id,
      club_id: input.club_id,
      team_id: input.team_id,
      player_uid: input.player_uid,
      player_name: input.player_name,
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      title: input.title.trim(),
      objective: input.objective?.trim(),
      due_date: input.due_date,
      exercises: snapshotExercises,
      status: 'active',
      completed_by_player: false,
      reviewed_by_coach: false,
      created_at: now,
      updated_at: now,
    };

    inMemoryPrograms.set(id, created);
    return created;
  },

  /**
   * Liste les programmes assignés à un joueur.
   */
  async listForPlayer(playerUid: string, max = 20): Promise<IndividualTrainingProgram[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !playerUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('player_uid', '==', playerUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('player_uid', '==', playerUid), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  /**
   * Liste les programmes créés par un coach.
   */
  async listForCoach(coachUid: string, max = 30): Promise<IndividualTrainingProgram[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !coachUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('coach_uid', '==', coachUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('coach_uid', '==', coachUid), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  /**
   * Le joueur marque un exercice comme complété (avec feedback éventuel).
   */
  async markExerciseCompleted(
    programId: string,
    exerciseId: string,
    completed: boolean,
    feedback?: string,
  ): Promise<void> {
    const mem = inMemoryPrograms.get(programId);
    if (mem) {
      mem.exercises = mem.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            player_completed: completed,
            player_completed_at: completed ? new Date() : undefined,
            player_feedback: feedback !== undefined ? feedback : ex.player_feedback,
          };
        }
        return ex;
      });
      mem.completed_by_player = mem.exercises.length > 0 && mem.exercises.every((e) => e.player_completed);
      inMemoryPrograms.set(programId, mem);
    }

    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, programId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const prog = mapDoc(snap.id, snap.data() as Record<string, unknown>);
    const updatedExercises = prog.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          player_completed: completed,
          player_completed_at: completed ? new Date() : undefined,
          player_feedback: feedback !== undefined ? feedback : ex.player_feedback,
        };
      }
      return ex;
    });

    const allCompleted = updatedExercises.length > 0 && updatedExercises.every((e) => e.player_completed);

    await updateDoc(ref, {
      exercises: updatedExercises,
      completed_by_player: allCompleted,
      status: allCompleted ? 'completed' : prog.status,
      updated_at: serverTimestamp(),
    });
  },

  async setExercisePlayerCompletion(
    programId: string,
    exerciseId: string,
    completed: boolean,
    feedback?: string,
  ): Promise<void> {
    return this.markExerciseCompleted(programId, exerciseId, completed, feedback);
  },

  /**
   * Le coach valide la réalisation d'un exercice et ajoute son observation.
   */
  async coachReviewExercise(
    programId: string,
    exerciseId: string,
    reviewed: boolean,
    coachFeedback?: string,
  ): Promise<void> {
    const mem = inMemoryPrograms.get(programId);
    if (mem) {
      mem.exercises = mem.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            coach_reviewed: reviewed,
            coach_reviewed_at: reviewed ? new Date() : undefined,
            coach_feedback: coachFeedback !== undefined ? coachFeedback : ex.coach_feedback,
          };
        }
        return ex;
      });
      mem.reviewed_by_coach = mem.exercises.length > 0 && mem.exercises.every((e) => e.coach_reviewed);
      inMemoryPrograms.set(programId, mem);
    }

    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, programId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const prog = mapDoc(snap.id, snap.data() as Record<string, unknown>);
    const updatedExercises = prog.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          coach_reviewed: reviewed,
          coach_reviewed_at: reviewed ? new Date() : undefined,
          coach_feedback: coachFeedback !== undefined ? coachFeedback : ex.coach_feedback,
        };
      }
      return ex;
    });

    const allReviewed = updatedExercises.length > 0 && updatedExercises.every((e) => e.coach_reviewed);

    await updateDoc(ref, {
      exercises: updatedExercises,
      reviewed_by_coach: allReviewed,
      updated_at: serverTimestamp(),
    });
  },

  async reviewExerciseByCoach(
    programId: string,
    exerciseId: string,
    coachUid: string,
    coachFeedback?: string,
  ): Promise<void> {
    return this.coachReviewExercise(programId, exerciseId, true, coachFeedback);
  },

  /**
   * Clôture ou archivage du programme par le coach avec synthèse.
   */
  async finalizeProgramReview(
    programId: string,
    finalNotes: string,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    await updateDoc(doc(database, COL, programId), {
      coach_final_notes: finalNotes.trim(),
      reviewed_by_coach: true,
      status: 'completed',
      updated_at: serverTimestamp(),
    });
  },
};
