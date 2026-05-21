import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

const CONTACTS = [
  { id: '1', name: 'Thomas Leroy', role: 'Coach', approved: true },
  { id: '2', name: 'Caroline Martin', role: 'Recruteur', approved: true },
  { id: '3', name: 'Karim Benali', role: 'Agent', approved: true },
];

interface ParentalControlScreenProps {
  onBack: () => void;
}

export const ParentalControlScreen: React.FC<ParentalControlScreenProps> = ({
  onBack,
}) => {
  const [supervision, setSupervision] = useState(true);
  const [contacts, setContacts] = useState(true);
  const [screenTime, setScreenTime] = useState(true);

  return (
    <View style={styles.root}>
      <ScreenTopBar title="Contrôle parental" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dashboard}>
          <View style={styles.dashboardIcon}>
            <Icon name="shield" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.dashboardTitle}>Tableau de bord</Text>
          <Text style={styles.dashboardSub}>
            Supervisez l&apos;activité et les contacts de votre enfant sur ProDay.
          </Text>
        </View>

        <SettingRow
          title="Supervision"
          subtitle="Activer la supervision du compte"
          value={supervision}
          onValueChange={setSupervision}
        />
        <SettingRow
          title="Contacts"
          subtitle="Gérer les contacts autorisés"
          value={contacts}
          onValueChange={setContacts}
        />
        <SettingRow
          title="Temps d'écran"
          subtitle="Limiter le temps d'utilisation"
          value={screenTime}
          onValueChange={setScreenTime}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contacts autorisés</Text>
          <TouchableOpacity>
            <Text style={styles.addBtn}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {CONTACTS.map((c) => (
          <TouchableOpacity key={c.id} style={[styles.contactRow, shadows.card]}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactLetter}>{c.name.charAt(0)}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactRole}>{c.role}</Text>
            </View>
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>Approuvé</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const SettingRow: React.FC<{
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}> = ({ title, subtitle, value, onValueChange }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingText}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingSub}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.brandSoft }}
      thumbColor={value ? colors.brand : colors.surface}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  dashboard: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  dashboardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dashboardTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  dashboardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  settingSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  addBtn: { fontSize: 14, fontWeight: '700', color: colors.brand },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLetter: { fontSize: 18, fontWeight: '800', color: colors.brand },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '700', color: colors.text },
  contactRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  approvedBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approvedText: { fontSize: 10, fontWeight: '700', color: colors.success },
});
