import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
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
  AdminPaneHeader,
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import {
  clubQuoteService,
  computeClubQuoteTotal,
  type ClubQuoteRequest,
  type ClubQuoteStatus,
} from '../../../services/clubQuote.service';
import { useAuth } from '../../../context/AuthContext';
import { DEFAULT_PRICE_PER_MEMBER_EUR } from '../utils/adminPricing';
import { clubLivePackFromOfferHint } from '../../../content/clubLivePacks';
import { clubCommercialBillingService } from '../../../services/clubCommercialBilling.service';
import { AdminClubCommercialBillingCard } from '../ui/AdminClubCommercialBillingCard';
import type { Club } from '../../../models/Club';

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
  const [creating, setCreating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [createForm, setCreateForm] = useState({
    club_name: '',
    owner_name: '',
    email: '',
    members: '100',
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void data.refresh();
    }, 60000);
    return () => clearInterval(id);
  }, [autoRefresh, data.refresh]);

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

  if (creating) {
    return (
      <View style={styles.root}>
        <AdminSheetHeader
          title="Nouveau devis"
          onClose={() => setCreating(false)}
          closeLabel="Retour"
        />
        <View style={styles.form}>
          <AdminCard>
            <Field
              label="Club"
              value={createForm.club_name}
              onChange={(v) => setCreateForm((f) => ({ ...f, club_name: v }))}
              t={t}
            />
            <Field
              label="Responsable"
              value={createForm.owner_name}
              onChange={(v) => setCreateForm((f) => ({ ...f, owner_name: v }))}
              t={t}
            />
            <Field
              label="Email"
              value={createForm.email}
              onChange={(v) => setCreateForm((f) => ({ ...f, email: v }))}
              t={t}
            />
            <Field
              label="Adhérents (indicatif)"
              value={createForm.members}
              onChange={(v) => setCreateForm((f) => ({ ...f, members: v }))}
              t={t}
            />
            <AdminButton
              label={busy ? '…' : 'Créer la demande'}
              disabled={busy}
              onPress={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const id = await clubQuoteService.submit({
                      club_name: createForm.club_name,
                      owner_name: createForm.owner_name,
                      email: createForm.email,
                      members: createForm.members,
                      requester_uid: firebaseUser?.uid,
                    });
                    await data.refresh();
                    setCreating(false);
                    const created = (await clubQuoteService.listForAdmin('all', 20)).find(
                      (q) => q.id === id,
                    );
                    if (created) openQuote(created);
                    Alert.alert('Créé', 'Demande de devis enregistrée.');
                  } catch (e) {
                    Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            />
          </AdminCard>
        </View>
      </View>
    );
  }

  if (selected) {
    const matchedClub: Club | undefined = data.clubs.find(
      (c) =>
        (selected.requester_uid && c.owner_uid === selected.requester_uid) ||
        c.name.toLowerCase() === selected.club_name.toLowerCase(),
    );

    const pushAmountToClub = () => {
      if (!matchedClub || !firebaseUser?.uid) return;
      const amount = selected.quoted_total_eur ?? totalPreview;
      Alert.alert(
        'Appliquer le montant au club ?',
        `${amount} € sur « ${matchedClub.name} » (forfait ${
          selected.offer_hint === 'club_video_pro' ? 'Pro + Veo' : 'Tout inclus'
        }).`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: () => {
              void (async () => {
                setBusy(true);
                try {
                  await clubCommercialBillingService.setAmount({
                    clubId: matchedClub.id,
                    amountEur: amount,
                    offerId: clubLivePackFromOfferHint(selected.offer_hint),
                    note: optionsNote || undefined,
                    adminUid: firebaseUser.uid,
                    adminEmail: profile?.email ?? firebaseUser.email ?? undefined,
                  });
                  await data.refresh();
                  Alert.alert('OK', `Montant ${amount} € enregistré sur le club.`);
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

    return (
      <View style={styles.root}>
        <AdminSheetHeader
          title={selected.club_name}
          subtitle={`${selected.owner_name} · ${selected.email}`}
          onClose={() => setSelected(null)}
          closeLabel="Retour"
          right={<AdminBadge label={selected.status} tone="accent" />}
        />
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
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
            <AdminText variant="statSm" champagne>
              Total {totalPreview} €
            </AdminText>
            <AdminButton
              label={busy ? 'Envoi…' : 'Valider & envoyer le devis'}
              onPress={applyQuote}
              disabled={busy}
            />
            {matchedClub ? (
              <AdminButton
                label="Appliquer montant au club"
                variant="soft"
                disabled={busy}
                onPress={pushAmountToClub}
              />
            ) : (
              <AdminText variant="caption" color={t.faint}>
                Aucun club Firestore trouvé pour ce devis — créez / rattachez le club puis facturez
                depuis Clubs.
              </AdminText>
            )}
            <View style={styles.statusActions}>
              {(
                [
                  ['accepted', 'Marquer accepté'],
                  ['refused', 'Refuser'],
                  ['negotiating', 'Négociation'],
                  ['pending', 'Remettre en attente'],
                  ['archived', 'Archiver'],
                ] as const
              ).map(([status, label]) => (
                <AdminButton
                  key={status}
                  label={label}
                  variant={status === 'refused' ? 'danger' : 'ghost'}
                  disabled={busy || selected.status === status}
                  onPress={() => {
                    if (!firebaseUser?.uid) return;
                    Alert.alert('Changer le statut ?', `→ ${status}`, [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Confirmer',
                        onPress: () => {
                          void (async () => {
                            setBusy(true);
                            try {
                              await clubQuoteService.setStatus(
                                selected.id,
                                status,
                                firebaseUser.uid,
                                undefined,
                                profile?.email ?? firebaseUser.email ?? undefined,
                              );
                              await data.refresh();
                              setSelected(null);
                            } catch (e) {
                              Alert.alert(
                                'Erreur',
                                e instanceof Error ? e.message : 'Échec',
                              );
                            } finally {
                              setBusy(false);
                            }
                          })();
                        },
                      },
                    ]);
                  }}
                />
              ))}
            </View>
          </AdminCard>
          <AdminCard>
            <AdminText variant="h3">Demande</AdminText>
            <AdminText variant="body" color={t.muted}>
              {[selected.members, selected.teams, selected.coaches, selected.needs]
                .filter(Boolean)
                .join('\n') || 'Pas de détail complémentaire.'}
            </AdminText>
          </AdminCard>
          {matchedClub ? (
            <AdminClubCommercialBillingCard
              club={matchedClub}
              busy={busy}
              setBusy={setBusy}
              actorUid={firebaseUser?.uid ?? 'admin'}
              actorEmail={profile?.email ?? firebaseUser?.email ?? undefined}
              onRefresh={async () => {
                await data.refresh();
              }}
              suggestedAmountEur={selected.quoted_total_eur ?? totalPreview}
              suggestedOfferId={clubLivePackFromOfferHint(selected.offer_hint)}
            />
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AdminPaneHeader
          title="Commercial"
          subtitle={`CRM devis · ${sponsorPending} sponsors · refresh ${autoRefresh ? '60s' : 'manuel'}`}
        />
        <View style={styles.toolbar}>
          <AdminButton
            label={data.refreshing ? '…' : 'Rafraîchir'}
            variant="ghost"
            onPress={() => void data.refresh()}
          />
          <AdminButton
            label={autoRefresh ? 'Auto ON' : 'Auto OFF'}
            variant={autoRefresh ? 'soft' : 'ghost'}
            onPress={() => setAutoRefresh((v) => !v)}
          />
          {data.lastRefreshedAt ? (
            <AdminBadge
              label={data.lastRefreshedAt.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              tone="info"
            />
          ) : null}
        </View>
        <AdminButton
          label="Créer un devis"
          variant="soft"
          onPress={() => {
            setCreating(true);
            setCreateForm({
              club_name: '',
              owner_name: '',
              email: '',
              members: '100',
            });
          }}
        />
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
              <AdminText variant="caption" color={filter === id ? t.champagneBright : t.muted}>
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
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  form: { padding: adminSpace.lg, gap: adminSpace.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
