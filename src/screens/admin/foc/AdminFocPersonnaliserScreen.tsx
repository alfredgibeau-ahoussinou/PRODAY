import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  ADMIN_FOC_NAV,
  type AdminFocSectionId,
} from '../../../navigation/adminFocConfig';
import type {
  AdminFocPreferences,
  AdminFocDensity,
} from '../../../services/adminPreferences.service';
import { DEFAULT_FOC_DASHBOARD_ORDER, type FocDashboardBlockId } from '../../../navigation/adminFocConfig';
import { adminChrome, ADMIN_ON_ACCENT } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import { Icon } from '../../../components/ui/Icon';
import { AdminButton } from '../../../components/admin/AdminButton';

const PRIMARY_PRESETS: { color: string; label: string }[] = [
  { color: '#006CFC', label: 'ProDay' },
  { color: '#166534', label: 'Terrain' },
  { color: '#0F172A', label: 'Nuit' },
  { color: '#D97706', label: 'Ambre' },
  { color: '#E11D48', label: 'Rouge' },
];

const SECONDARY_PRESETS: { color: string; label: string }[] = [
  { color: '#166534', label: 'Forêt' },
  { color: '#15803D', label: 'Pelouse' },
  { color: '#16A34A', label: 'Gazon' },
  { color: '#4ADE80', label: 'Herbe' },
  { color: '#22C55E', label: 'Terrain' },
];

const BLOCK_LABELS: Record<FocDashboardBlockId, string> = {
  kpis: 'KPIs & indicateurs',
  queue: 'À traiter aujourd’hui',
  business: 'Abonnements',
  activity: 'Activité récente',
  matchs: 'Matchs amicaux',
};

const DENSITY_OPTIONS: { id: AdminFocDensity; label: string; desc: string }[] = [
  { id: 'comfortable', label: 'Confortable', desc: 'Espacement généreux, lecture facile' },
  { id: 'compact', label: 'Compact', desc: 'Plus d\'informations sur l\'écran' },
];

type Props = {
  prefs: AdminFocPreferences;
  onChange: (p: AdminFocPreferences) => void;
  onSave: () => void;
};

export function AdminFocPersonnaliserScreen({ prefs, onChange, onSave }: Props) {
  const [saving, setSaving] = useState(false);

  const update = (partial: Partial<AdminFocPreferences>) => {
    onChange({ ...prefs, ...partial });
  };

  const toggleSection = (id: AdminFocSectionId) => {
    const hidden = prefs.hiddenSections.includes(id)
      ? prefs.hiddenSections.filter((s) => s !== id)
      : [...prefs.hiddenSections, id];
    update({ hiddenSections: hidden });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const order = [...prefs.dashboardOrder];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= order.length) return;
    const tmp = order[index];
    order[index] = order[target];
    order[target] = tmp;
    update({ dashboardOrder: order });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      onSave();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer les préférences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PARAMÈTRES</Text>
        <Text style={styles.pageTitle}>Personnaliser mon espace</Text>
        <Text style={styles.pageSub}>
          Adaptez l'interface du Centre d'Ops à vos préférences.
        </Text>
      </View>

      {/* Aperçu en direct */}
      <PreviewCard prefs={prefs} />

      {/* Identité */}
      <Section title="Identité">
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nom affiché dans la sidebar</Text>
          <TextInput
            style={styles.input}
            value={prefs.clubDisplayName}
            onChangeText={(v) => update({ clubDisplayName: v })}
            placeholder="ProDay"
            placeholderTextColor={adminChrome.textMuted}
            maxLength={30}
          />
        </View>
      </Section>

      {/* Couleur principale */}
      <Section title="Couleur principale">
        <View style={styles.colorRow}>
          {PRIMARY_PRESETS.map((p) => (
            <Pressable
              key={p.color}
              onPress={() => update({ primaryColor: p.color })}
              style={[
                styles.colorDot,
                { backgroundColor: p.color },
                prefs.primaryColor === p.color && styles.colorDotOn,
              ]}
              accessibilityLabel={p.label}
            >
              {prefs.primaryColor === p.color ? (
                <Icon name="checkmark-circle" size={16} color={ADMIN_ON_ACCENT} />
              ) : null}
            </Pressable>
          ))}
        </View>
        <Text style={styles.colorHint}>Sélectionné : {prefs.primaryColor}</Text>
      </Section>

      {/* Couleur secondaire */}
      <Section title="Accent terrain (vert)">
        <View style={styles.colorRow}>
          {SECONDARY_PRESETS.map((p) => (
            <Pressable
              key={p.color}
              onPress={() => update({ secondaryColor: p.color })}
              style={[
                styles.colorDot,
                { backgroundColor: p.color },
                prefs.secondaryColor === p.color && styles.colorDotOn,
              ]}
              accessibilityLabel={p.label}
            />
          ))}
        </View>
        <Text style={styles.colorHint}>Sélectionné : {prefs.secondaryColor}</Text>
      </Section>

      {/* Densité */}
      <Section title="Densité d'affichage">
        <View style={styles.densityRow}>
          {DENSITY_OPTIONS.map((opt) => {
            const on = prefs.density === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => update({ density: opt.id })}
                style={[styles.densityCard, on && { borderColor: prefs.primaryColor, borderWidth: 2 }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <Text style={[styles.densityLabel, on && { color: prefs.primaryColor }]}>
                  {opt.label}
                </Text>
                <Text style={styles.densityDesc}>{opt.desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Sections visibles */}
      <Section title="Sections de la sidebar">
        <Text style={styles.sectionHint}>
          Masquer les sections que vous n'utilisez pas.
        </Text>
        {ADMIN_FOC_NAV.map((nav) => {
          const hidden = prefs.hiddenSections.includes(nav.id);
          const isDashboard = nav.id === 'dashboard';
          return (
            <View key={nav.id} style={styles.toggleRow}>
              <Icon
                name={nav.icon}
                size={16}
                color={hidden ? adminChrome.textMuted : prefs.primaryColor}
              />
              <Text style={[styles.toggleLabel, hidden && { opacity: 0.45 }]}>
                {nav.label}
              </Text>
              {!isDashboard ? (
                <Pressable
                  onPress={() => toggleSection(nav.id)}
                  style={[styles.toggle, !hidden && { backgroundColor: prefs.primaryColor }]}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: !hidden }}
                >
                  <View style={[styles.toggleThumb, !hidden && styles.toggleThumbOn]} />
                </Pressable>
              ) : (
                <View style={[styles.toggle, { backgroundColor: prefs.primaryColor }]}>
                  <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
                </View>
              )}
            </View>
          );
        })}
      </Section>

      {/* Ordre du tableau de bord */}
      <Section title="Ordre des blocs du tableau de bord">
        <Text style={styles.sectionHint}>
          Réorganisez les blocs affichés sur le tableau de bord.
        </Text>
        {prefs.dashboardOrder.map((blockId, i) => (
          <View key={blockId} style={styles.blockRow}>
            <Text style={styles.blockLabel}>{BLOCK_LABELS[blockId] ?? blockId}</Text>
            <View style={styles.blockActions}>
              <AdminButton
                variant="icon"
                size="sm"
                icon="chevron-up"
                onPress={() => moveBlock(i, 'up')}
                disabled={i === 0}
                accessibilityLabel="Monter"
              />
              <AdminButton
                variant="icon"
                size="sm"
                icon="chevron-down"
                onPress={() => moveBlock(i, 'down')}
                disabled={i === prefs.dashboardOrder.length - 1}
                accessibilityLabel="Descendre"
              />
            </View>
          </View>
        ))}
      </Section>

      {/* Enregistrer */}
      <AdminButton
        label={saving ? 'Enregistrement…' : 'Enregistrer les préférences'}
        variant="primary"
        loading={saving}
        disabled={saving}
        onPress={handleSave}
        style={{ marginTop: spacing.md }}
      />

      <View style={{ height: spacing.xl * 2 }} />
    </ScrollView>
  );
}

/* ─── Aperçu en direct ─────────────────────────────────────────────── */

function PreviewCard({ prefs }: { prefs: AdminFocPreferences }) {
  return (
    <View style={previewStyles.card}>
      <Text style={previewStyles.label}>Aperçu console claire</Text>
      <View style={previewStyles.shell}>
        {/* Sidebar mock */}
        <View
          style={[
            previewStyles.sidebar,
            { borderRightColor: adminChrome.shellBorder },
          ]}
        >
          <View style={[previewStyles.signalEdge, { backgroundColor: prefs.primaryColor }]} />
          <Text style={[previewStyles.brand, { color: prefs.primaryColor }]}>
            {prefs.clubDisplayName.slice(0, 8)}
          </Text>
          {(['Accueil', 'Utilisateurs', 'Abos'] as const).map((label, i) => (
            <View
              key={label}
              style={[
                previewStyles.navItem,
                i === 0 && { backgroundColor: adminChrome.rowActive },
              ]}
            >
              <View
                style={[
                  previewStyles.navDot,
                  { backgroundColor: i === 0 ? prefs.primaryColor : prefs.secondaryColor },
                  i !== 0 && { opacity: 0.35 },
                ]}
              />
              <Text
                style={[
                  previewStyles.navLabel,
                  { color: i === 0 ? prefs.primaryColor : adminChrome.textMuted },
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Content area */}
        <View style={previewStyles.content}>
          <View style={previewStyles.topbar}>
            <View
              style={[previewStyles.topbarDot, { backgroundColor: prefs.primaryColor }]}
            />
          </View>
          <View style={previewStyles.body}>
            <View
              style={[previewStyles.kpiBar, { backgroundColor: prefs.primaryColor + '28' }]}
            />
            <View style={previewStyles.kpiBarShort} />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ─── Section wrapper ───────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  body: {
    backgroundColor: adminChrome.shell,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.sm,
  },
});

const previewStyles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  shell: {
    height: 100,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorderStrong,
    backgroundColor: adminChrome.band,
  },
  sidebar: {
    width: 72,
    borderRightWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 3,
    backgroundColor: adminChrome.shell,
    overflow: 'hidden',
  },
  signalEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  brand: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 4,
  },
  navDot: { width: 5, height: 5, borderRadius: 3 },
  navLabel: { fontSize: 5, fontWeight: '700' },
  content: { flex: 1, backgroundColor: adminChrome.band },
  topbar: {
    height: 18,
    backgroundColor: adminChrome.shellElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  topbarDot: { width: 20, height: 5, borderRadius: 3 },
  body: { padding: 6, gap: 4, flex: 1 },
  kpiBar: { height: 12, borderRadius: 3, width: '100%' },
  kpiBarShort: {
    height: 8,
    borderRadius: 3,
    width: '65%',
    backgroundColor: adminChrome.shellMid,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: 4,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: adminChrome.accent,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: adminChrome.text,
    letterSpacing: -0.4,
  },
  pageSub: {
    fontSize: 14,
    color: adminChrome.textMuted,
    lineHeight: 20,
  },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: adminChrome.textMuted,
  },
  input: {
    backgroundColor: adminChrome.shellElevated,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: adminChrome.text,
    fontSize: 15,
    fontWeight: '500',
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotOn: {
    borderColor: adminChrome.text,
  },
  colorHint: {
    fontSize: 11,
    color: adminChrome.textMuted,
    fontFamily: 'Menlo',
  },
  densityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  densityCard: {
    flex: 1,
    borderRadius: 10,
    padding: spacing.md,
    backgroundColor: adminChrome.shellElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    gap: 4,
  },
  densityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: adminChrome.text,
  },
  densityDesc: {
    fontSize: 11,
    color: adminChrome.textMuted,
    lineHeight: 15,
  },
  sectionHint: {
    fontSize: 12,
    color: adminChrome.textMuted,
    lineHeight: 17,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: adminChrome.text,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: adminChrome.shellMid,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ADMIN_ON_ACCENT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  blockLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: adminChrome.text,
  },
  blockActions: {
    flexDirection: 'row',
    gap: 4,
  },
  blockBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: adminChrome.shellElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  blockBtnDisabled: { opacity: 0.35 },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: {
    color: ADMIN_ON_ACCENT,
    fontWeight: '800',
    fontSize: 15,
  },
});
