import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PressableSpring, SkeletonList } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { ListEmptyPanel } from '../../components/ui/ListEmptyPanel';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { privacyDocumentsService } from '../../services/privacyDocuments.service';
import { privacyGrantsService } from '../../services/privacyGrants.service';
import type { MedicalDocument, PrivacyAccessGrant } from '../../models/Privacy';
import { usersService } from '../../services/users.service';
import { profileService } from '../../services/profile.service';
import {
  DEFAULT_PARENTAL_SETTINGS,
  type ParentalSettings,
} from '../../models/ParentalSettings';
import { useMedicalConfidentialityGate } from '../../components/medical/MedicalConfidentialityNotice';

interface PrivacyMedicalSettingsScreenProps {
  profile: User;
  onBack: () => void;
}

export const PrivacyMedicalSettingsScreen: React.FC<PrivacyMedicalSettingsScreenProps> = ({
  profile,
  onBack,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const gate = useMedicalConfidentialityGate(profile.uid);
  const [docs, setDocs] = useState<MedicalDocument[]>([]);
  const [grants, setGrants] = useState<PrivacyAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [granteeUid, setGranteeUid] = useState('');
  const [parental, setParental] = useState<ParentalSettings>(
    profile.parental_settings ?? DEFAULT_PARENTAL_SETTINGS,
  );
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [d, g] = await Promise.all([
        privacyDocumentsService.listMedicalForPatient(profile.uid),
        privacyGrantsService.listForOwner(profile.uid),
      ]);
      setDocs(d);
      setGrants(g.filter((x) => !x.revoked_at));
      const fresh = await usersService.getById(profile.uid);
      if (fresh?.parental_settings) setParental(fresh.parental_settings);
    } finally {
      setLoading(false);
    }
  }, [profile.uid]);

  useEffect(() => {
    if (gate.gateOpen) void refresh();
  }, [gate.gateOpen, refresh]);

  const toggleParentalMedical = async (value: boolean) => {
    setBusy(true);
    try {
      const next: ParentalSettings = {
        ...parental,
        privacy: {
          ...parental.privacy,
          parent_can_access_medical: value,
        },
      };
      await profileService.updateProfile(profile.uid, { parental_settings: next });
      setParental(next);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible');
    } finally {
      setBusy(false);
    }
  };

  const createGrant = async () => {
    const uid = granteeUid.trim();
    if (!uid) {
      Alert.alert('UID requis', 'Indiquez l’identifiant ProDay du destinataire.');
      return;
    }
    setBusy(true);
    try {
      await privacyGrantsService.create({
        owner_uid: profile.uid,
        grantee_uid: uid,
        resource_type: 'medical_document',
        scope: 'all_medical',
        permissions: ['read', 'download'],
        purpose: 'Partage médical patient',
      });
      setGranteeUid('');
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Autorisation impossible');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (grantId: string) => {
    setBusy(true);
    try {
      await privacyGrantsService.revoke(grantId, profile.uid);
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Révocation impossible');
    } finally {
      setBusy(false);
    }
  };

  if (!gate.ready || gate.needsNotice) {
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader
          label="Confidentialité"
          title="Santé & vie privée"
          onBack={onBack}
        />
        {gate.Notice}
      </View>
    );
  }

  const isMinor = parental.is_minor === true;

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label="Confidentialité"
        title="Santé & vie privée"
        subtitle="Contrôlez qui peut voir vos documents médicaux."
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={c.accent} />
        }
      >
        <View style={styles.card}>
          <ProDayText variant="section" style={styles.sectionTitle}>
            Secret médical
          </ProDayText>
          <ProDayText variant="body" muted>
            Vos documents médicaux ne sont jamais publics. Seuls vous, les soignants autorisés et
            éventuellement votre tuteur (si activé) peuvent y accéder. Chaque consultation est
            journalisée.
          </ProDayText>
        </View>

        {isMinor || parental.parent_uid ? (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <ProDayText variant="section" style={styles.sectionTitle}>
                  Accès parental
                </ProDayText>
                <ProDayText variant="caption" muted>
                  Autoriser le parent/tuteur à consulter le coffre et les RDV médicaux.
                </ProDayText>
              </View>
              <Switch
                value={parental.privacy?.parent_can_access_medical === true}
                onValueChange={(v) => void toggleParentalMedical(v)}
                disabled={busy}
                trackColor={{ false: c.border, true: c.brand }}
              />
            </View>
          </View>
        ) : null}

        <ProDayText variant="section" style={styles.sectionTitle}>
          Autorisations actives
        </ProDayText>
        <View style={styles.card}>
          <ProDayText variant="caption" muted style={{ marginBottom: spacing.sm }}>
            Accorder l’accès médical (UID ProDay)
          </ProDayText>
          <TextInput
            style={styles.input}
            value={granteeUid}
            onChangeText={setGranteeUid}
            placeholder="uid du soignant ou proche"
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
          />
          <PressableSpring
            onPress={() => void createGrant()}
            disabled={busy}
            style={[styles.btn, { opacity: busy ? 0.7 : 1 }]}
          >
            <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
              Accorder l’accès
            </ProDayText>
          </PressableSpring>
        </View>

        {loading ? <SkeletonList count={2} variant="card" /> : null}
        {!loading && grants.length === 0 ? (
          <ListEmptyPanel
            icon="lock"
            title="Aucune autorisation"
            subtitle="Personne d’autre n’a accès à votre coffre médical."
          />
        ) : null}
        {grants.map((g) => (
          <View key={g.id} style={styles.card}>
            <ProDayText variant="body" style={{ fontWeight: '700', color: c.text }}>
              {g.grantee_uid}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {g.scope} · {g.permissions.join(', ')}
              {g.purpose ? ` · ${g.purpose}` : ''}
            </ProDayText>
            <PressableSpring onPress={() => void revoke(g.id)} style={styles.revoke}>
              <ProDayText variant="caption" style={{ fontWeight: '800', color: c.brand }}>
                Révoquer
              </ProDayText>
            </PressableSpring>
          </View>
        ))}

        <ProDayText variant="section" style={[styles.sectionTitle, { marginTop: spacing.md }]}>
          Documents médicaux
        </ProDayText>
        {!loading && docs.length === 0 ? (
          <ListEmptyPanel
            icon="document"
            title="Coffre vide"
            subtitle="Ajoutez des documents depuis un RDV ou votre espace santé."
          />
        ) : null}
        {docs.map((d) => (
          <View key={d.id} style={styles.card}>
            <ProDayText variant="body" style={{ fontWeight: '700', color: c.text }}>
              {d.title}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {d.type} · {d.created_at.toLocaleDateString('fr-FR')}
            </ProDayText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    body: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    sectionTitle: { fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    rowBetween: { flexDirection: 'row', alignItems: 'center' },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: c.text,
      fontSize: 15,
    },
    btn: {
      backgroundColor: c.brand,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    revoke: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  });
}
