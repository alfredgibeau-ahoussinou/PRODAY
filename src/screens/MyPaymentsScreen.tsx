import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { User } from '../models/User';
import type { TeamPaymentRequest } from '../models/TeamFinance';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { teamFinanceService } from '../services/teamFinance.service';
import { colors, spacing, radius } from '../theme/designTokens';

interface MyPaymentsScreenProps {
  profile: User;
  onBack: () => void;
}

const STATUS_LABEL: Record<TeamPaymentRequest['status'], string> = {
  pending: 'À payer',
  paid: 'Payé',
  late: 'En retard',
};

export const MyPaymentsScreen: React.FC<MyPaymentsScreenProps> = ({
  profile,
  onBack,
}) => {
  const [payments, setPayments] = useState<TeamPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await teamFinanceService.listByMember(profile.uid);
      setPayments(list);
    } finally {
      setLoading(false);
    }
  }, [profile.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePayOnline = async (payment: TeamPaymentRequest) => {
    setPayingId(payment.id);
    try {
      const { url } = await teamFinanceService.startOnlinePayment(payment.id);
      const result = await WebBrowser.openAuthSessionAsync(url, 'proday://payments');
      if (result.type === 'success' || result.type === 'dismiss') {
        await load();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Paiement impossible';
      Alert.alert(
        'Paiement en ligne',
        msg.includes('Stripe') || msg.includes('failed-precondition')
          ? `${msg}\n\nConfigurez Stripe sur Firebase Functions (voir docs/API_CONTRACTS.md).`
          : msg
      );
    } finally {
      setPayingId(null);
    }
  };

  const totalDue = payments
    .filter((p) => p.status === 'pending' || p.status === 'late')
    .reduce((acc, p) => acc + p.amount_eur, 0);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Mes cotisations" onBack={onBack} centered />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Reste à régler</Text>
            <Text style={styles.summaryValue}>{totalDue.toFixed(0)} €</Text>
          </View>
          <FlatList
            data={payments}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Aucune cotisation pour le moment. Votre club vous notifiera ici.
              </Text>
            }
            renderItem={({ item }) => {
              const canPay = item.status === 'pending' || item.status === 'late';
              const paying = payingId === item.id;
              return (
                <View style={[styles.card, item.status === 'late' && styles.cardLate]}>
                  <View style={styles.cardHead}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text
                      style={[
                        styles.status,
                        item.status === 'paid' && styles.statusPaid,
                        item.status === 'late' && styles.statusLate,
                      ]}
                    >
                      {STATUS_LABEL[item.status]}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{item.amount_eur} €</Text>
                  <Text style={styles.meta}>
                    Échéance : {item.due_at.toLocaleDateString('fr-FR')}
                    {item.paid_at
                      ? ` · Payé le ${item.paid_at.toLocaleDateString('fr-FR')}`
                      : ''}
                    {item.payment_method === 'stripe' ? ' · Carte en ligne' : ''}
                  </Text>
                  {canPay ? (
                    <TouchableOpacity
                      style={[styles.payBtn, paying && styles.payBtnDisabled]}
                      onPress={() => void handlePayOnline(item)}
                      disabled={paying}
                    >
                      {paying ? (
                        <ActivityIndicator color={colors.brandInverse} />
                      ) : (
                        <>
                          <Icon name="calendar" size={18} color={colors.brandInverse} />
                          <Text style={styles.payBtnText}>Payer en ligne (Stripe)</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  summary: {
    margin: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryLabel: { fontSize: 12, color: colors.heroMuted, fontWeight: '600' },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.brandInverse,
    marginTop: spacing.xs,
  },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardLate: { borderColor: colors.warning, backgroundColor: colors.warningBg },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  label: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  status: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  statusPaid: { color: colors.success },
  statusLate: { color: colors.warning },
  amount: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: spacing.sm },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
});
