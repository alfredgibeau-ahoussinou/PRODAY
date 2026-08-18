import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { AdminDataRow } from '../../../components/admin/hq/AdminDataRow';
import { useAdminData } from '../../../context/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/admin.service';
import { adminAuditService } from '../../../services/adminAudit.service';
import { subscriptionUpgradeRequestService } from '../../../services/subscriptionUpgradeRequest.service';
import type { SubscriptionUpgradeRequest } from '../../../models/SubscriptionUpgradeRequest';
import {
  SUBSCRIPTION_PLANS,
  planIdForRole,
  type SubscriptionPlanId,
  ROLES_WITHOUT_STORE_PLAN,
} from '../../../content/subscriptionPlans';
import {
  ADMIN_INSPECTOR_WIDTH,
  ADMIN_SUBSCRIPTION_FILTERS,
  ADMIN_WIDE_BREAKPOINT,
  adminStatusLabel,
  type AdminSubscriptionFilter,
} from '../../../navigation/adminTabConfig';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import { getRoleLabel } from '../../signup/signupFlowConfig';
import {
  isSubscriptionAccessActive,
  subscriptionFromUserFields,
} from '../../../utils/subscriptionLogic';
import type { User } from '../../../models/User';

type Props = {
  focusId?: string;
  focusQuery?: string;
};

type TabId = 'membres' | 'demandes' | 'formules' | 'achats';

/**
 * Abonnements — transitions Gratuit ↔ Payant, catalogue, historique.
 */
export function AdminFocAbonnementsScreen({ focusId, focusQuery }: Props) {
  const { users, refreshing, refresh } = useAdminData();
  const { profile, firebaseUser } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= ADMIN_WIDE_BREAKPOINT;
  const styles = useMemo(() => createStyles(wide), [wide]);

  const [tab, setTab] = useState<TabId>('membres');
  const [filter, setFilter] = useState<AdminSubscriptionFilter>('all');
  const [query, setQuery] = useState(focusQuery ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(focusId ?? null);
  const [busy, setBusy] = useState(false);
  const [purchases, setPurchases] = useState<
    Awaited<ReturnType<typeof adminService.listSubscriptionPurchases>>
  >([]);
  const [grantMonths, setGrantMonths] = useState(1);
  const [pickedPlan, setPickedPlan] = useState<SubscriptionPlanId | null>(null);
  const [proRequests, setProRequests] = useState<SubscriptionUpgradeRequest[]>([]);

  useEffect(() => {
    void subscriptionUpgradeRequestService.listPendingForAdmin(80).then(setProRequests);
  }, [refreshing]);

  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

  useEffect(() => {
    if (focusQuery) setQuery(focusQuery);
  }, [focusQuery]);

  useEffect(() => {
    void adminService.listSubscriptionPurchases(120).then(setPurchases);
  }, [refreshing]);

  const stats = useMemo(() => {
    let free = 0;
    let pro = 0;
    let trialing = 0;
    let pastDue = 0;
    let expiring = 0;
    const week = Date.now() + 7 * 24 * 60 * 60 * 1000;
    for (const u of users) {
      const active = isSubscriptionAccessActive(u);
      if (active) {
        pro += 1;
        if (u.subscription_status === 'trialing') trialing += 1;
        if (u.subscription_period_end && u.subscription_period_end.getTime() < week) {
          expiring += 1;
        }
      } else {
        free += 1;
      }
      if (u.subscription_status === 'past_due') pastDue += 1;
    }
    return { free, pro, trialing, pastDue, expiring, total: users.length };
  }, [users]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const week = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return users
      .filter((u) => {
        if (q && ![u.display_name, u.email, u.role, u.subscription_plan_id].some((p) =>
          p?.toLowerCase().includes(q),
        )) {
          return false;
        }
        const active = isSubscriptionAccessActive(u);
        switch (filter) {
          case 'free':
            return !active;
          case 'pro':
            return active;
          case 'trialing':
            return active && u.subscription_status === 'trialing';
          case 'past_due':
            return u.subscription_status === 'past_due';
          case 'expiring':
            return (
              active &&
              !!u.subscription_period_end &&
              u.subscription_period_end.getTime() < week
            );
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const aPro = isSubscriptionAccessActive(a) ? 1 : 0;
        const bPro = isSubscriptionAccessActive(b) ? 1 : 0;
        if (aPro !== bPro) return bPro - aPro;
        return a.display_name.localeCompare(b.display_name, 'fr');
      });
  }, [users, query, filter]);

  useEffect(() => {
    if (!selectedId && rows[0]) setSelectedId(rows[0].uid);
  }, [rows, selectedId]);

  const selected = users.find((u) => u.uid === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    const def = planIdForRole(selected.role);
    const current = selected.subscription_plan_id as SubscriptionPlanId | undefined;
    setPickedPlan(current && SUBSCRIPTION_PLANS[current] ? current : def);
  }, [selected]);

  const actor = {
    uid: profile?.uid ?? '',
    email: firebaseUser?.email ?? profile?.email,
  };

  const run = async (fn: () => Promise<void>, audit: {
    action: 'subscription_granted' | 'subscription_revoked' | 'subscription_changed' | 'subscription_extended';
    summary: string;
  }) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fn();
      await adminAuditService.log({
        action: audit.action,
        actor_uid: actor.uid,
        actor_email: actor.email,
        target_type: 'user_subscription',
        target_id: selected.uid,
        summary: audit.summary,
      });
      await refresh();
      const nextPurchases = await adminService.listSubscriptionPurchases(120);
      setPurchases(nextPurchases);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  const userPurchases = purchases.filter((p) => p.user_uid === selected?.uid);

  const handleApproveProRequest = async (request: SubscriptionUpgradeRequest) => {
    setBusy(true);
    try {
      await adminService.grantProSubscription(
        request.user_uid,
        request.plan_id,
        1,
        'Demande bêta approuvée par admin',
        true,
      );
      const res = await subscriptionUpgradeRequestService.updateRequestStatus(
        request.id,
        'approved',
        'Activé en bêta (essai 1 mois)',
      );
      if (!res.ok) {
        Alert.alert('Demande', 'Pro activé mais mise à jour de la demande impossible.');
      }
      await adminAuditService.log({
        action: 'subscription_granted',
        actor_uid: actor.uid,
        actor_email: actor.email,
        target_type: 'subscription_upgrade_request',
        target_id: request.id,
        summary: `Bêta Pro · ${request.display_name} · ${request.plan_id}`,
      });
      await refresh();
      setProRequests(await subscriptionUpgradeRequestService.listPendingForAdmin(80));
      setSelectedId(request.user_uid);
      setTab('membres');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Approbation impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleRejectProRequest = (request: SubscriptionUpgradeRequest) => {
    Alert.alert(
      'Refuser la demande',
      `Refuser l’accès Pro pour ${request.display_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                const res = await subscriptionUpgradeRequestService.updateRequestStatus(
                  request.id,
                  'rejected',
                  'Refusé en bêta',
                );
                if (!res.ok) {
                  Alert.alert('Demande', 'Refus impossible.');
                  return;
                }
                await adminAuditService.log({
                  action: 'other',
                  actor_uid: actor.uid,
                  actor_email: actor.email,
                  target_type: 'subscription_upgrade_request',
                  target_id: request.id,
                  summary: `Demande Pro refusée · ${request.display_name}`,
                });
                setProRequests(await subscriptionUpgradeRequestService.listPendingForAdmin(80));
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Refus impossible');
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
      <View style={styles.main}>
        <View style={styles.header}>
          <Text style={styles.title}>Abonnements</Text>
          <Text style={styles.sub}>
            Gratuit et payant, formules, essais, transitions — tout se pilote ici.
          </Text>
          <View style={styles.kpiRow}>
            <Kpi label="Comptes" value={stats.total} />
            <Kpi label="Gratuit" value={stats.free} />
            <Kpi label="Payant" value={stats.pro} hot />
            <Kpi label="Essai" value={stats.trialing} />
            <Kpi label="Impayé" value={stats.pastDue} warn={stats.pastDue > 0} />
            <Kpi label="Expire 7j" value={stats.expiring} warn={stats.expiring > 0} />
          </View>
          <View style={styles.tabs}>
            {(
              [
                ['membres', 'Membres'],
                ['demandes', `Demandes bêta${proRequests.length ? ` (${proRequests.length})` : ''}`],
                ['formules', 'Catalogue formules'],
                ['achats', 'Historique achats'],
              ] as const
            ).map(([id, label]) => (
              <PressableSpring
                key={id}
                onPress={() => setTab(id)}
                scaleTo={0.97}
                haptic
                style={[styles.tab, tab === id && styles.tabOn]}
              >
                <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
              </PressableSpring>
            ))}
          </View>
        </View>

        {tab === 'membres' ? (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Chercher un compte, un e-mail, une formule…"
              placeholderTextColor={adminChrome.textMuted}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {ADMIN_SUBSCRIPTION_FILTERS.map((f) => (
                <PressableSpring
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  scaleTo={0.97}
                  haptic
                  style={[styles.filter, filter === f.id && styles.filterOn]}
                >
                  <Text style={[styles.filterText, filter === f.id && styles.filterTextOn]}>
                    {f.label}
                  </Text>
                </PressableSpring>
              ))}
            </ScrollView>
            <FlatList
              data={rows}
              keyExtractor={(u) => u.uid}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={adminChrome.accent}
                />
              }
              ListEmptyComponent={<Text style={styles.empty}>Aucun compte pour ce filtre.</Text>}
              renderItem={({ item }) => {
                const active = isSubscriptionAccessActive(item);
                const plan = item.subscription_plan_id
                  ? SUBSCRIPTION_PLANS[item.subscription_plan_id as SubscriptionPlanId]
                  : null;
                return (
                  <AdminDataRow
                    title={item.display_name}
                    subtitle={`${getRoleLabel(item.role)} · ${item.email}`}
                    trailing={active ? `Payant · ${plan?.label ?? 'Pro'}` : 'Gratuit'}
                    priority={active ? 'high' : undefined}
                    selected={item.uid === selectedId}
                    onPress={() => setSelectedId(item.uid)}
                  />
                );
              }}
            />
          </>
        ) : null}

        {tab === 'demandes' ? (
          <FlatList
            data={proRequests}
            keyExtractor={(r) => r.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={adminChrome.accent}
              />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                Aucune demande Pro en attente. Les testeurs envoient depuis Abonnement → « Demander l’accès Pro (bêta) ».
              </Text>
            }
            renderItem={({ item }) => {
              const plan = SUBSCRIPTION_PLANS[item.plan_id];
              return (
                <View style={styles.requestCard}>
                  <AdminDataRow
                    title={item.display_name}
                    subtitle={`${getRoleLabel(item.role)} · ${item.email}`}
                    trailing={plan?.label ?? item.plan_id}
                    onPress={() => {
                      setSelectedId(item.user_uid);
                      setTab('membres');
                    }}
                  />
                  <Text style={styles.requestMeta}>
                    Demandé le {item.created_at.toLocaleDateString('fr-FR')} · {item.billing === 'yearly' ? 'Annuel' : 'Mensuel'}
                  </Text>
                  {item.message ? (
                    <Text style={styles.requestMessage}>{item.message}</Text>
                  ) : null}
                  <View style={styles.requestActions}>
                    <PressableSpring
                      onPress={() => void handleApproveProRequest(item)}
                      scaleTo={0.97}
                      haptic
                      disabled={busy}
                      style={[styles.requestBtn, styles.requestApprove]}
                    >
                      <Text style={styles.requestApproveText}>Approuver · essai 1 mois</Text>
                    </PressableSpring>
                    <PressableSpring
                      onPress={() => handleRejectProRequest(item)}
                      scaleTo={0.97}
                      haptic
                      disabled={busy}
                      style={[styles.requestBtn, styles.requestReject]}
                    >
                      <Text style={styles.requestRejectText}>Refuser</Text>
                    </PressableSpring>
                  </View>
                </View>
              );
            }}
          />
        ) : null}

        {tab === 'formules' ? (
          <ScrollView contentContainerStyle={styles.catalog}>
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <View key={plan.id} style={styles.planCard}>
                <View style={styles.planHead}>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  <Text style={styles.planPrice}>
                    {plan.pricing.quoteOnly
                      ? 'Sur devis'
                      : `${plan.pricing.monthlyEur.toFixed(2)} € / mois`}
                  </Text>
                </View>
                <Text style={styles.planTag}>{plan.tagline}</Text>
                <Text style={styles.planRole}>Rôle · {getRoleLabel(plan.role)}</Text>
                <View style={styles.planCols}>
                  <View style={styles.planCol}>
                    <Text style={styles.planColTitle}>Inclus en gratuit</Text>
                    {plan.freeIncludes.map((line) => (
                      <Text key={line} style={styles.planBullet}>
                        · {line}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.planCol}>
                    <Text style={[styles.planColTitle, styles.planColPro]}>Inclus en payant</Text>
                    {plan.proIncludes.map((line) => (
                      <Text key={line} style={styles.planBullet}>
                        · {line}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {tab === 'achats' ? (
          <FlatList
            data={purchases}
            keyExtractor={(p) => p.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={adminChrome.accent}
              />
            }
            ListEmptyComponent={<Text style={styles.empty}>Aucun achat enregistré.</Text>}
            renderItem={({ item }) => (
              <AdminDataRow
                title={item.product_id}
                subtitle={`Compte ${item.user_uid.slice(0, 12)}… · ${item.source === 'admin_gift' ? 'Cadeau admin' : item.source ?? 'Achat'}`}
                trailing={`${adminStatusLabel(item.status)}${item.amount_eur != null ? ` · ${item.amount_eur} €` : ''}`}
                onPress={() => {
                  setSelectedId(item.user_uid);
                  setTab('membres');
                }}
              />
            )}
          />
        ) : null}
      </View>

      {wide && tab === 'membres' ? (
        <View style={styles.inspector}>
          {selected ? (
            <SubscriptionInspector
              user={selected}
              busy={busy}
              pickedPlan={pickedPlan}
              grantMonths={grantMonths}
              purchases={userPurchases}
              onPickPlan={setPickedPlan}
              onMonths={setGrantMonths}
              onGrant={(asTrial) => {
                if (!pickedPlan) {
                  Alert.alert('Formule', 'Choisis une formule.');
                  return;
                }
                void run(
                  () =>
                    adminService.grantProSubscription(
                      selected.uid,
                      pickedPlan,
                      grantMonths,
                      asTrial ? 'Essai offert par admin' : 'Passage payant par admin',
                      asTrial,
                    ),
                  {
                    action: 'subscription_granted',
                    summary: asTrial
                      ? `Essai ${pickedPlan} · ${grantMonths} mois`
                      : `Passage payant ${pickedPlan} · ${grantMonths} mois`,
                  },
                );
              }}
              onChangePlan={() => {
                if (!pickedPlan) return;
                void run(
                  () =>
                    adminService.setUserSubscription(selected.uid, {
                      tier: 'pro',
                      planId: pickedPlan,
                      status: (selected.subscription_status as 'active') || 'active',
                      periodEnd: selected.subscription_period_end ?? undefined,
                      reason: `Changement de formule → ${pickedPlan}`,
                    }),
                  {
                    action: 'subscription_changed',
                    summary: `Formule → ${pickedPlan}`,
                  },
                );
              }}
              onExtend={(days) =>
                void run(
                  () =>
                    adminService.extendSubscription(
                      selected.uid,
                      days,
                      `Prolongation +${days} j`,
                    ),
                  {
                    action: 'subscription_extended',
                    summary: `Prolongation +${days} jours`,
                  },
                )
              }
              onSoftCancel={() =>
                void run(
                  () =>
                    adminService.revokeToFreeSubscription(
                      selected.uid,
                      'Résiliation en fin de période',
                      false,
                    ),
                  {
                    action: 'subscription_revoked',
                    summary: 'Résiliation douce (accès jusqu’à la fin de période)',
                  },
                )
              }
              onHardFree={() =>
                Alert.alert(
                  'Passer en gratuit',
                  'Couper immédiatement l’accès payant ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Passer en gratuit',
                      style: 'destructive',
                      onPress: () =>
                        void run(
                          () =>
                            adminService.revokeToFreeSubscription(
                              selected.uid,
                              'Révocation immédiate admin',
                              true,
                            ),
                          {
                            action: 'subscription_revoked',
                            summary: 'Passage immédiat en gratuit',
                          },
                        ),
                    },
                  ],
                )
              }
            />
          ) : (
            <Text style={styles.empty}>Sélectionne un compte pour piloter son offre.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

function Kpi({
  label,
  value,
  hot,
  warn,
}: {
  label: string;
  value: number;
  hot?: boolean;
  warn?: boolean;
}) {
  const styles = useMemo(() => createStyles(true), []);
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text
        style={[
          styles.kpiValue,
          hot && styles.kpiHot,
          warn && styles.kpiWarn,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function SubscriptionInspector({
  user,
  busy,
  pickedPlan,
  grantMonths,
  purchases,
  onPickPlan,
  onMonths,
  onGrant,
  onChangePlan,
  onExtend,
  onSoftCancel,
  onHardFree,
}: {
  user: User;
  busy: boolean;
  pickedPlan: SubscriptionPlanId | null;
  grantMonths: number;
  purchases: { id: string; product_id: string; status: string; source?: string; created_at: Date }[];
  onPickPlan: (id: SubscriptionPlanId) => void;
  onMonths: (n: number) => void;
  onGrant: (asTrial: boolean) => void;
  onChangePlan: () => void;
  onExtend: (days: number) => void;
  onSoftCancel: () => void;
  onHardFree: () => void;
}) {
  const styles = useMemo(() => createStyles(true), []);
  const effective = subscriptionFromUserFields(user);
  const active = effective.tier === 'pro';
  const plan = effective.plan_id ? SUBSCRIPTION_PLANS[effective.plan_id] : null;
  const noStore = ROLES_WITHOUT_STORE_PLAN.includes(user.role);
  const rolePlans = Object.values(SUBSCRIPTION_PLANS).filter((p) => p.role === user.role);

  return (
    <ScrollView contentContainerStyle={styles.inspContent}>
      <Text style={styles.eyebrow}>Offre du compte</Text>
      <Text style={styles.inspTitle}>{user.display_name}</Text>
      <Text style={styles.inspSub}>
        {getRoleLabel(user.role)} · {user.email}
      </Text>

      <View style={[styles.tierBanner, active ? styles.tierPro : styles.tierFree]}>
        <Text style={styles.tierBannerLabel}>{active ? 'PAYANT' : 'GRATUIT'}</Text>
        <Text style={styles.tierBannerDetail}>
          {active
            ? `${plan?.label ?? 'Pro'} · ${adminStatusLabel(user.subscription_status)}`
            : noStore
              ? 'Rôle sans offre store (toujours gratuit)'
              : 'Accès limité aux quotas gratuits'}
        </Text>
        {user.subscription_period_end ? (
          <Text style={styles.tierBannerMeta}>
            Fin de période ·{' '}
            {user.subscription_period_end.toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        ) : null}
      </View>

      {plan ? (
        <View style={styles.compare}>
          <Text style={styles.compareTitle}>Ce que change le passage payant</Text>
          <Text style={styles.compareSub}>Gratuit</Text>
          {plan.freeIncludes.slice(0, 4).map((l) => (
            <Text key={`f-${l}`} style={styles.compareLine}>
              · {l}
            </Text>
          ))}
          <Text style={[styles.compareSub, styles.comparePro]}>Payant</Text>
          {plan.proIncludes.slice(0, 5).map((l) => (
            <Text key={`p-${l}`} style={styles.compareLine}>
              · {l}
            </Text>
          ))}
        </View>
      ) : null}

      {!noStore ? (
        <>
          <Text style={styles.section}>Formule</Text>
          <View style={styles.planPicker}>
            {(rolePlans.length ? rolePlans : Object.values(SUBSCRIPTION_PLANS)).map((p) => {
              const on = pickedPlan === p.id;
              return (
                <PressableSpring
                  key={p.id}
                  onPress={() => onPickPlan(p.id)}
                  scaleTo={0.97}
                  haptic
                  style={[styles.planChip, on && styles.planChipOn]}
                >
                  <Text style={[styles.planChipText, on && styles.planChipTextOn]}>
                    {p.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>

          <Text style={styles.section}>Durée (mois)</Text>
          <View style={styles.monthsRow}>
            {[1, 3, 6, 12].map((n) => (
              <PressableSpring
                key={n}
                onPress={() => onMonths(n)}
                scaleTo={0.97}
                haptic
                style={[styles.monthChip, grantMonths === n && styles.monthChipOn]}
              >
                <Text style={[styles.monthText, grantMonths === n && styles.monthTextOn]}>
                  {n}
                </Text>
              </PressableSpring>
            ))}
          </View>

          <PressableSpring
            onPress={() => onGrant(false)}
            disabled={busy}
            scaleTo={0.98}
            haptic
            style={[styles.actionPrimary, busy && styles.disabled]}
          >
            <Text style={styles.actionPrimaryText}>Passer en payant</Text>
          </PressableSpring>
          <PressableSpring
            onPress={() => onGrant(true)}
            disabled={busy}
            scaleTo={0.98}
            haptic
            style={[styles.action, busy && styles.disabled]}
          >
            <Text style={styles.actionText}>Offrir un essai</Text>
          </PressableSpring>
          {active ? (
            <>
              <PressableSpring
                onPress={onChangePlan}
                disabled={busy}
                scaleTo={0.98}
                haptic
                style={[styles.action, busy && styles.disabled]}
              >
                <Text style={styles.actionText}>Changer de formule</Text>
              </PressableSpring>
              <PressableSpring
                onPress={() => onExtend(7)}
                disabled={busy}
                scaleTo={0.98}
                haptic
                style={[styles.action, busy && styles.disabled]}
              >
                <Text style={styles.actionText}>Prolonger +7 jours</Text>
              </PressableSpring>
              <PressableSpring
                onPress={() => onExtend(30)}
                disabled={busy}
                scaleTo={0.98}
                haptic
                style={[styles.action, busy && styles.disabled]}
              >
                <Text style={styles.actionText}>Prolonger +30 jours</Text>
              </PressableSpring>
              <PressableSpring
                onPress={onSoftCancel}
                disabled={busy}
                scaleTo={0.98}
                haptic
                style={[styles.action, busy && styles.disabled]}
              >
                <Text style={styles.actionText}>Résilier (fin de période)</Text>
              </PressableSpring>
              <PressableSpring
                onPress={onHardFree}
                disabled={busy}
                scaleTo={0.98}
                haptic
                style={[styles.actionDanger, busy && styles.disabled]}
              >
                <Text style={styles.actionDangerText}>Passer en gratuit maintenant</Text>
              </PressableSpring>
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.hint}>
          Ce rôle n’a pas d’offre store. L’accès reste gratuit — aucune transition payante.
        </Text>
      )}

      <Text style={styles.section}>Historique</Text>
      {purchases.length === 0 ? (
        <Text style={styles.hint}>Aucun achat pour ce compte.</Text>
      ) : (
        purchases.slice(0, 8).map((p) => (
          <Text key={p.id} style={styles.purchaseLine}>
            {p.product_id} · {adminStatusLabel(p.status)}
            {p.source === 'admin_gift' ? ' · cadeau admin' : ''} ·{' '}
            {p.created_at.toLocaleDateString('fr-FR')}
          </Text>
        ))
      )}
    </ScrollView>
  );
}

function createStyles(wide: boolean) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: adminChrome.shell },
    main: { flex: 1, minWidth: 0 },
    header: {
      padding: spacing.md,
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    title: {
      color: adminChrome.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    sub: { color: adminChrome.textMuted, fontSize: 13, lineHeight: 18 },
    kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    kpi: {
      minWidth: 72,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
    },
    kpiLabel: {
      fontFamily: adminChrome.mono,
      fontSize: 9,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: adminChrome.textMuted,
    },
    kpiValue: {
      fontFamily: adminChrome.mono,
      fontSize: 18,
      fontWeight: '800',
      color: adminChrome.text,
      marginTop: 2,
    },
    kpiHot: { color: adminChrome.accent },
    kpiWarn: { color: adminChrome.danger },
    tabs: { flexDirection: 'row', gap: 6, marginTop: 4 },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    tabOn: { borderColor: adminChrome.accent, backgroundColor: adminChrome.soft },
    tabText: { color: adminChrome.textMuted, fontWeight: '700', fontSize: 12 },
    tabTextOn: { color: adminChrome.accent },
    search: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
      color: adminChrome.text,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 14,
    },
    filters: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6 },
    filter: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      marginRight: 6,
    },
    filterOn: { borderColor: adminChrome.accent, backgroundColor: adminChrome.soft },
    filterText: { color: adminChrome.textMuted, fontSize: 11, fontWeight: '700' },
    filterTextOn: { color: adminChrome.accent },
    empty: { padding: spacing.lg, color: adminChrome.textMuted, fontSize: 13 },
    catalog: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
    planCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
      padding: spacing.md,
      gap: 8,
    },
    planHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    planLabel: { color: adminChrome.text, fontWeight: '800', fontSize: 15, flex: 1 },
    planPrice: { color: adminChrome.accent, fontWeight: '800', fontFamily: adminChrome.mono },
    planTag: { color: adminChrome.textMuted, fontSize: 12, lineHeight: 17 },
    planRole: {
      fontFamily: adminChrome.mono,
      fontSize: 10,
      color: adminChrome.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    planCols: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
    planCol: { flex: 1, gap: 2 },
    planColTitle: {
      color: adminChrome.textMuted,
      fontWeight: '800',
      fontSize: 11,
      marginBottom: 4,
    },
    planColPro: { color: adminChrome.accent },
    planBullet: { color: adminChrome.textMuted, fontSize: 11, lineHeight: 16 },
    inspector: {
      width: ADMIN_INSPECTOR_WIDTH,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
    },
    inspContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
    eyebrow: {
      fontFamily: adminChrome.mono,
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: adminChrome.accent,
      fontWeight: '700',
    },
    inspTitle: { color: adminChrome.text, fontSize: 20, fontWeight: '800' },
    inspSub: { color: adminChrome.textMuted, fontSize: 12 },
    tierBanner: {
      marginTop: spacing.sm,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
    },
    tierFree: {
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellMid,
    },
    tierPro: {
      borderColor: adminChrome.accent,
      backgroundColor: adminChrome.soft,
    },
    tierBannerLabel: {
      fontFamily: adminChrome.mono,
      fontWeight: '900',
      letterSpacing: 1.6,
      fontSize: 12,
      color: adminChrome.accent,
    },
    tierBannerDetail: { color: adminChrome.text, fontSize: 13, fontWeight: '600' },
    tierBannerMeta: {
      fontFamily: adminChrome.mono,
      fontSize: 10,
      color: adminChrome.textMuted,
    },
    compare: {
      marginTop: spacing.sm,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      gap: 2,
    },
    compareTitle: { color: adminChrome.text, fontWeight: '800', fontSize: 13, marginBottom: 6 },
    compareSub: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: '800',
      color: adminChrome.textMuted,
      textTransform: 'uppercase',
    },
    comparePro: { color: adminChrome.accent },
    compareLine: { color: adminChrome.textMuted, fontSize: 11, lineHeight: 16 },
    section: {
      marginTop: spacing.md,
      fontFamily: adminChrome.mono,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: adminChrome.textMuted,
      fontWeight: '700',
    },
    planPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    planChip: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    planChipOn: { borderColor: adminChrome.accent, backgroundColor: adminChrome.soft },
    planChipText: { color: adminChrome.textMuted, fontSize: 11, fontWeight: '700' },
    planChipTextOn: { color: adminChrome.accent },
    monthsRow: { flexDirection: 'row', gap: 6 },
    monthChip: {
      width: 44,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    monthChipOn: { borderColor: adminChrome.accent, backgroundColor: adminChrome.soft },
    monthText: { color: adminChrome.textMuted, fontWeight: '800' },
    monthTextOn: { color: adminChrome.accent },
    actionPrimary: {
      marginTop: spacing.sm,
      backgroundColor: adminChrome.accent,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    actionPrimaryText: {
      color: '#FFFFFF',
      fontWeight: '800',
      textAlign: 'center',
      fontSize: 13,
    },
    action: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellMid,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    actionText: { color: adminChrome.text, fontWeight: '700', textAlign: 'center', fontSize: 13 },
    actionDanger: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.danger,
      backgroundColor: 'rgba(255,92,92,0.08)',
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    actionDangerText: {
      color: adminChrome.danger,
      fontWeight: '700',
      textAlign: 'center',
      fontSize: 13,
    },
    disabled: { opacity: 0.45 },
    hint: { color: adminChrome.textMuted, fontSize: 12, lineHeight: 17 },
    purchaseLine: {
      fontFamily: adminChrome.mono,
      fontSize: 10,
      color: adminChrome.textMuted,
      lineHeight: 16,
    },
    requestCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shellElevated,
      gap: spacing.sm,
    },
    requestMeta: {
      color: adminChrome.textMuted,
      fontSize: 11,
      fontFamily: adminChrome.mono,
      paddingHorizontal: spacing.xs,
    },
    requestMessage: {
      color: adminChrome.text,
      fontSize: 12,
      lineHeight: 17,
      paddingHorizontal: spacing.xs,
    },
    requestActions: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.xs },
    requestBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
    },
    requestApprove: {
      borderColor: adminChrome.accent,
      backgroundColor: adminChrome.soft,
    },
    requestApproveText: { color: adminChrome.accent, fontWeight: '800', fontSize: 12 },
    requestReject: {
      borderColor: adminChrome.danger,
      backgroundColor: 'rgba(255,92,92,0.06)',
    },
    requestRejectText: { color: adminChrome.danger, fontWeight: '700', fontSize: 12 },
  });
}
