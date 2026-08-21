import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminLoading,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import {
  clubQuoteService,
  computeClubQuoteTotal,
  type ClubQuoteRequest,
  type ClubQuoteStatus,
} from '../../../services/clubQuote.service';
import { useAuth } from '../../../context/AuthContext';
import { DEFAULT_PRICE_PER_MEMBER_EUR } from '../utils/adminPricing';

type Filter = ClubQuoteStatus | 'all';

export function AdminCommercialPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [filter, setFilter] = useState<Filter>('pending');
  const [selected, setSelected] = useState<ClubQuoteRequest | null>(null);
  const [price, setPrice] = useState(String(DEFAULT_PRICE_PER_MEMBER_EUR));
  const [members, setMembers] = useState('100');
  const [discount, setDiscount] = useState('0');
  const [optionsEur, setOptionsEur] = useState('0');
  const [optionsNote, setOptionsNote] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    return data.clubQuoteRequests.filter((q) => {
      if (focusId) return q.id === focusId;
      if (filter === 'all') return true;
      return q.status === filter;
    });
  }, [data.clubQuoteRequests, filter, focusId]);

  const sponsorPending = data.sponsorQuoteRequests.length;

  const openQuote = (q: ClubQuoteRequest) => {
    setSelected(q);
    setPrice(String(q.price_per_member_eur ?? DEFAULT_PRICE_PER_MEMBER_EUR));
    const parsedMembers = Number.parseInt(q.members ?? '', 10);
    setMembers(String(q.members_count ?? (Number.isFinite(parsedMembers) ? parsedMembers : 100)));
    setDiscount(String(q.discount_pct ?? 0));
    setOptionsEur('0');
    setOptionsNote(q.options_note ?? '');
  };

  const totalPreview = computeClubQuoteTotal({
    membersCount: Number(members) || 0,
    pricePerMember: Number(price) || 0,
    discountPct: Number(discount) || 0,
    optionsEur: Number(optionsEur) || 0,
  });

  const applyQuote = () => {
    if (!selected || !firebaseUser?.uid) return;
    Alert.alert(
      'Valider le devis ?',
      `Total ${totalPreview} € · ${price} € / adhérent. Le club verra ce montant.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await clubQuoteService.applyQuote(selected.id, {
                  pricePerMember: Number(price) || DEFAULT_PRICE_PER_MEMBER_EUR,
                  membersCount: Number(members) || 0,
                  discountPct: Number(discount) || 0,
                  optionsEur: Number(optionsEur) || 0,
                  optionsNote,
                  adminUid: firebaseUser.uid,
                  adminEmail: profile?.email ?? firebaseUser.email ?? undefined,
                });
                await data.refresh();
                setSelected(null);
                Alert.alert('Devis envoyé', `Total ${totalPreview} € enregistré.`);
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (data.loading) return <AdminLoading />;

  if (selected) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <AdminButton label="Retour" variant="ghost" onPress={() => setSelected(null)} />
          <AdminText variant="h1">{selected.club_name}</AdminText>
          <AdminText variant="caption" color={t.muted}>
            {selected.owner_name} · {selected.email}
          </AdminText>
          <AdminBadge label={selected.status} tone="accent" />
        </View>
        <View style={styles.form}>
          <AdminCard>
            <AdminText variant="h2">Calculateur</AdminText>
            <AdminText variant="caption" color={t.muted}>
              Prix par adhérent (défaut catalogue {DEFAULT_PRICE_PER_MEMBER_EUR} €) — jamais hardcodé dans l’UI métier.
            </AdminText>
            <Field label="€ / adhérent" value={price} onChange={setPrice} t={t} />
            <Field label="Adhérents" value={members} onChange={setMembers} t={t} />
            <Field label="Remise %" value={discount} onChange={setDiscount} t={t} />
            <Field label="Options €" value={optionsEur} onChange={setOptionsEur} t={t} />
            <Field label="Note options" value={optionsNote} onChange={setOptionsNote} t={t} multiline />
            <AdminText variant="statSm" color={t.accentHot}>
              Total {totalPreview} €
            </AdminText>
            <AdminButton
              label={busy ? 'Envoi…' : 'Valider & envoyer le devis'}
              onPress={applyQuote}
              disabled={busy}
            />
          </AdminCard>
          <AdminCard>
            <AdminText variant="h3">Demande</AdminText>
            <AdminText variant="body" color={t.muted}>
              {[selected.members, selected.teams, selected.coaches, selected.needs]
                .filter(Boolean)
                .join('\n') || 'Pas de détail complémentaire.'}
            </AdminText>
          </AdminCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminText variant="h1">Commercial</AdminText>
        <AdminText variant="caption" color={t.muted}>
          CRM devis clubs · {sponsorPending} devis sponsors en attente
        </AdminText>
        <View style={styles.chips}>
          {(
            [
              ['pending', 'À traiter'],
              ['quoted', 'Envoyés'],
              ['accepted', 'Acceptés'],
              ['all', 'Tous'],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setFilter(id)}
              style={[
                styles.chip,
                {
                  backgroundColor: filter === id ? t.accentSoft : t.surfaceRaised,
                  borderColor: filter === id ? t.accent : t.border,
                },
              ]}
            >
              <AdminText variant="caption" color={filter === id ? t.accentHot : t.muted}>
                {label}
              </AdminText>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: adminSpace.lg, gap: 8 }}
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune demande"
            body="Les devis clubs arrivent ici dès qu’un club en fait la demande."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openQuote(item)}>
            <AdminCard>
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText variant="h3">{item.club_name}</AdminText>
                  <AdminText variant="caption" color={t.muted}>
                    {item.owner_name} · {item.email}
                  </AdminText>
                  <AdminText variant="caption" color={t.faint}>
                    {item.offer_hint === 'club_video_pro' ? 'Pro + Veo' : 'Tout inclus'}
                    {item.quoted_total_eur != null ? ` · ${item.quoted_total_eur} €` : ''}
                  </AdminText>
                </View>
                <AdminBadge
                  label={item.status}
                  tone={
                    item.status === 'pending'
                      ? 'warn'
                      : item.status === 'quoted'
                        ? 'accent'
                        : item.status === 'accepted'
                          ? 'success'
                          : 'info'
                  }
                />
              </View>
            </AdminCard>
          </Pressable>
        )}
      />
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  t,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  t: typeof ADMIN_TOKENS;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <AdminText variant="label" color={t.faint}>
        {label}
      </AdminText>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor={t.faint}
        style={[
          styles.input,
          {
            color: t.foreground,
            borderColor: t.border,
            backgroundColor: t.surfaceRaised,
            minHeight: multiline ? 72 : undefined,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    padding: adminSpace.lg,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ADMIN_TOKENS.hairline,
  },
  form: { padding: adminSpace.lg, gap: adminSpace.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
