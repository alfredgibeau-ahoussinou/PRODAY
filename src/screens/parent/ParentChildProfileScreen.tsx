import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentAlertChip,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { ParentUnlockCard } from '../../components/parent/ParentUnlockCard';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import { useAuth } from '../../context/AuthContext';
import { normalizeGuardianEmail } from '../../utils/guardianEmail';
import { parentalGuardianService } from '../../services/parentalGuardian.service';
import { parentPortalService } from '../../services/parentPortal.service';

/** Profil enfant — stats en lecture seule + contrôles rapides. */
export const ParentChildProfileScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { profile } = useAuth();
  const { selected, reload, setSelectedUid, children } = useParentShell();
  const email = normalizeGuardianEmail(profile?.email);
  const [saving, setSaving] = useState(false);
  if (!selected) {
    return (
      <ParentPageFrame identity={PARENT_PAGES.profil}>
        <View style={styles.center}>
          <ProDayText variant="body" muted>
            Sélectionnez un enfant depuis l’accueil.
          </ProDayText>
        </View>
      </ParentPageFrame>
    );
  }

  const p = selected.profile.profile;
  const stats = p.season_stats;

  const toggle = async (
    label: string,
    run: () => Promise<void>,
  ) => {
    if (!email) return;
    setSaving(true);
    try {
      await run();
      await reload();
    } catch (e) {
      Alert.alert(label, e instanceof Error ? e.message : 'Modification impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ParentPageFrame identity={PARENT_PAGES.profil}>
      <ScrollView contentContainerStyle={styles.content}>
        {children.length > 1 ? (
          <View style={styles.chips}>
            {children.map((child) => {
              const active = child.uid === selected.uid;
              return (
                <ParentActionButton
                  key={child.uid}
                  label={child.display_name}
                  tone={active ? 'primary' : 'ghost'}
                  onPress={() => setSelectedUid(child.uid)}
                />
              );
            })}
          </View>
        ) : null}

        <ParentSectionCard
          title={selected.display_name}
          subtitle="Profil joueur mineur — identité sportive en lecture seule"
        >
          <ProDayText variant="body">
            {p.position ?? 'Poste —'} · {p.category ?? 'Catégorie —'} · {p.level ?? 'Niveau —'}
          </ProDayText>
          {p.age != null ? (
            <ProDayText variant="caption" muted>
              Âge : {p.age} ans
            </ProDayText>
          ) : null}
          {p.bio ? (
            <ProDayText variant="body" muted style={styles.bio}>
              {p.bio}
            </ProDayText>
          ) : null}
        </ParentSectionCard>

        {selected.alerts.map((alert) => (
          <ParentAlertChip key={alert} label={alert} />
        ))}

        {email ? (
          <ParentUnlockCard child={selected} guardianEmail={email} onDone={reload} />
        ) : null}

        <ParentSectionCard title="Statistiques sportives">
          <ProDayText variant="caption" muted style={styles.note}>
            Non modifiables ici (réservé au staff / matchs).
          </ProDayText>
          <View style={[styles.statsRow, { borderColor: c.border }]}>
            <Stat label="Matchs" value={stats?.matches ?? 0} />
            <Stat label="Buts" value={stats?.goals ?? 0} />
            <Stat label="Passes" value={stats?.assists ?? 0} />
          </View>
        </ParentSectionCard>

        <ParentSectionCard
          title="Contrôles rapides"
          subtitle="Touchez un interrupteur pour appliquer"
        >
          <Row
            label="Temps d’écran"
            value={!!selected.settings.screen_time_enabled}
            disabled={saving || !email}
            onChange={(screen_time_enabled) =>
              void toggle('Temps d’écran', () =>
                parentalGuardianService.updateChildScreenTime(selected.uid, email!, {
                  screen_time_enabled,
                }),
              )
            }
            colors={c}
          />
          <Row
            label="Filtre contacts"
            value={selected.settings.contacts_filter_enabled !== false}
            disabled={saving || !email}
            onChange={(contacts_filter_enabled) =>
              void toggle('Filtre contacts', () =>
                parentPortalService.updateContactsFilter(
                  selected.uid,
                  email!,
                  contacts_filter_enabled,
                ),
              )
            }
            colors={c}
          />
          <Row
            label="Lecture messages"
            value={selected.settings.privacy?.parent_can_read_messages !== false}
            disabled={saving || !email}
            onChange={(parent_can_read_messages) =>
              void toggle('Messages', () =>
                parentPortalService.updatePrivacy(selected.uid, email!, {
                  ...selected.settings.privacy,
                  parent_can_read_messages,
                }),
              )
            }
            colors={c}
          />
          <Row
            label="Trajet live"
            value={selected.settings.privacy?.share_live_carpool !== false}
            disabled={saving || !email}
            onChange={(share_live_carpool) =>
              void toggle('Trajet', () =>
                parentPortalService.updatePrivacy(selected.uid, email!, {
                  ...selected.settings.privacy,
                  share_live_carpool,
                }),
              )
            }
            colors={c}
          />
        </ParentSectionCard>
      </ScrollView>
    </ParentPageFrame>
  );
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <ProDayText variant="section">{value}</ProDayText>
      <ProDayText variant="caption" muted>
        {label}
      </ProDayText>
    </View>
  );
}

function Row({
  label,
  value,
  onChange,
  disabled,
  colors: theme,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  colors: { border: string; brandSoft: string; brand: string; surface: string };
}) {
  return (
    <View style={styles.row}>
      <ProDayText variant="body" style={{ flex: 1 }}>
        {label}
      </ProDayText>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: theme.border, true: theme.brandSoft }}
        thumbColor={value ? theme.brand : theme.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  bio: { lineHeight: 22 },
  note: { lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  stat: { alignItems: 'center', gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
