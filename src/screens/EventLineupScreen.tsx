import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { TeamEvent, EventLineupSlot } from '../models/TeamEvent';
import { FORMATIONS, getPresentInviteeUids } from '../models/TeamEvent';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { PitchLineupView } from '../components/team/PitchLineupView';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import type { ProductLineId } from '../models/ProductLine';

interface EventLineupScreenProps {
  eventId: string;
  onBack: () => void;
}

export const EventLineupScreen: React.FC<EventLineupScreenProps> = ({
  eventId,
  onBack,
}) => {
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [formation, setFormation] = useState<string>('4-3-3');
  const [starters, setStarters] = useState<EventLineupSlot[]>([]);
  const [subs, setSubs] = useState<EventLineupSlot[]>([]);
  const [pool, setPool] = useState<EventLineupSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const ev = await teamEventsService.getById(eventId);
    setEvent(ev);
    if (!ev) {
      setLoading(false);
      return;
    }

    const presentUids = getPresentInviteeUids(ev);
    const allPresent: EventLineupSlot[] = [];
    for (const uid of presentUids) {
      const u = await usersService.getById(uid);
      if (u) {
        allPresent.push({
          uid,
          display_name: u.display_name,
          role: 'starter',
          position_label: u.profile.position,
        });
      }
    }

    if (ev.lineup) {
      setFormation(ev.lineup.formation);
      setStarters(ev.lineup.slots.filter((s) => s.role === 'starter'));
      setSubs(ev.lineup.slots.filter((s) => s.role === 'sub'));
      const used = new Set(ev.lineup.slots.map((s) => s.uid));
      setPool(allPresent.filter((s) => !used.has(s.uid)));
    } else {
      setFormation('4-3-3');
      setStarters([]);
      setSubs([]);
      setPool(allPresent);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const moveToStarters = (slot: EventLineupSlot) => {
    setPool((p) => p.filter((x) => x.uid !== slot.uid));
    setSubs((s) => s.filter((x) => x.uid !== slot.uid));
    setStarters((s) => [...s.filter((x) => x.uid !== slot.uid), { ...slot, role: 'starter' }]);
  };

  const moveToSubs = (slot: EventLineupSlot) => {
    setPool((p) => p.filter((x) => x.uid !== slot.uid));
    setStarters((s) => s.filter((x) => x.uid !== slot.uid));
    setSubs((s) => [...s.filter((x) => x.uid !== slot.uid), { ...slot, role: 'sub' }]);
  };

  const removeFromLineup = (uid: string) => {
    const slot =
      starters.find((s) => s.uid === uid) ?? subs.find((s) => s.uid === uid);
    if (!slot) return;
    setStarters((s) => s.filter((x) => x.uid !== uid));
    setSubs((s) => s.filter((x) => x.uid !== uid));
    setPool((p) => [...p, { ...slot, role: 'starter' }]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await teamEventsService.saveLineup(eventId, {
        formation,
        slots: [...starters, ...subs],
      });
      Alert.alert('Composition enregistrée', 'Visible par les convoqués présents.');
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Composition" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          {productLine === 'woman'
            ? 'Titulaires et remplaçants parmi les joueuses ayant confirmé leur présence.'
            : 'Titulaires et remplaçants parmi les joueurs ayant confirmé leur présence.'}
        </Text>

        <Text style={styles.label}>Système</Text>
        <View style={styles.row}>
          {FORMATIONS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, formation === f && styles.chipActive]}
              onPress={() => setFormation(f)}
            >
              <Text style={[styles.chipText, formation === f && styles.chipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <PitchLineupView formation={formation} starters={starters} />

        <Section
          title={`Titulaires (${starters.length})`}
          slots={starters}
          onRemove={removeFromLineup}
          styles={styles}
          productLine={productLine}
        />
        <Section
          title={`Remplaçants (${subs.length})`}
          slots={subs}
          onRemove={removeFromLineup}
          styles={styles}
          productLine={productLine}
        />

        {pool.length > 0 && (
          <>
            <Text style={styles.label}>Disponibles</Text>
            {pool.map((slot) => (
              <View key={slot.uid} style={styles.poolRow}>
                <Text style={styles.poolName}>{slot.display_name}</Text>
                <View style={styles.poolActions}>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => moveToStarters(slot)}
                  >
                    <Text style={styles.smallBtnText}>Titu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => moveToSubs(slot)}
                  >
                    <Text style={styles.smallBtnText}>Remp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.save, saving && styles.saveDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={styles.saveText}>Enregistrer la compo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Section: React.FC<{
  title: string;
  slots: EventLineupSlot[];
  onRemove: (uid: string) => void;
  styles: ReturnType<typeof createStyles>;
  productLine: ProductLineId;
}> = ({ title, slots, onRemove, styles, productLine }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{title}</Text>
    {slots.length === 0 ? (
      <Text style={styles.empty}>
        {productLine === 'woman' ? 'Aucune joueuse' : 'Aucun joueur'}
      </Text>
    ) : (
      slots.map((s) => (
        <View key={s.uid} style={styles.slotRow}>
          <Text style={styles.slotName}>
            {s.display_name}
            {s.position_label ? ` · ${s.position_label}` : ''}
          </Text>
          <TouchableOpacity onPress={() => onRemove(s.uid)}>
            <Text style={styles.remove}>Retirer</Text>
          </TouchableOpacity>
        </View>
      ))
    )}
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: { fontSize: 13, color: c.textSecondary, marginBottom: spacing.md, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '800', color: c.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipActive: { backgroundColor: c.ink, borderColor: c.ink },
  chipText: { fontSize: 12, fontWeight: '800', color: c.textSecondary },
  chipTextActive: { color: c.brandInverse },
  section: { marginBottom: spacing.sm },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  slotName: { fontSize: 14, fontWeight: '700', color: c.text, flex: 1 },
  remove: { fontSize: 12, fontWeight: '800', color: c.accent },
  empty: { fontSize: 13, color: c.textMuted },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  poolName: { fontSize: 14, fontWeight: '600', color: c.text },
  poolActions: { flexDirection: 'row', gap: spacing.xs },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  smallBtnText: { fontSize: 11, fontWeight: '800', color: c.text },
  save: {
    marginTop: spacing.xl,
    backgroundColor: c.ink,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: c.brandInverse, fontWeight: '900', fontSize: 16 },
  });
}
