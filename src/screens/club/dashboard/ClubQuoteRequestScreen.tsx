import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { ProDayScreenCanvas } from '../../../components/ui/ProDayScreenCanvas';
import { ProDaySurface } from '../../../components/ui/ProDaySurface';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useAuth } from '../../../context/AuthContext';
import { clubQuoteService } from '../../../services/clubQuote.service';
import { radius, spacing } from '../../../theme/designTokens';

type ClubQuoteRequestScreenProps = {
  onBack: () => void;
  initialClubName?: string;
};

/**
 * Demande de devis Club (Tout inclus / Pro + Veo).
 */
export const ClubQuoteRequestScreen: React.FC<ClubQuoteRequestScreenProps> = ({
  onBack,
  initialClubName = '',
}) => {
  const { colors } = useAppTheme();
  const { firebaseUser } = useAuth();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clubName, setClubName] = useState(initialClubName);
  const [ownerName, setOwnerName] = useState('');
  const [role, setRole] = useState('');
  const [members, setMembers] = useState('');
  const [teams, setTeams] = useState('');
  const [coaches, setCoaches] = useState('');
  const [categories, setCategories] = useState('');
  const [needs, setNeeds] = useState('');
  const [videoGear, setVideoGear] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const submit = async () => {
    if (!clubName.trim() || !ownerName.trim() || !email.trim()) {
      Alert.alert('Champs requis', 'Indiquez au minimum le club, le responsable et l’email.');
      return;
    }
    setSubmitting(true);
    try {
      await clubQuoteService.submit({
        club_name: clubName,
        owner_name: ownerName,
        role,
        members,
        teams,
        coaches,
        categories,
        needs,
        video_gear: videoGear,
        phone,
        email,
        requester_uid: firebaseUser?.uid,
        offer_hint: 'club_premium',
      });
      setSent(true);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <ProDayScreenCanvas>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <ScreenHeader title="Demande de devis" onBack={onBack} centered />
          <View style={styles.thanks}>
            <ProDayText variant="section">Merci !</ProDayText>
            <ProDayText variant="body" muted style={styles.thanksBody}>
              Demande enregistrée. Tarif sur devis, à partir de 3 € / adhérent selon la formule et
              le nombre d’adhérents. Notre équipe vous recontacte.
            </ProDayText>
            <PressableSpring
              onPress={onBack}
              scaleTo={0.97}
              style={[styles.cta, { backgroundColor: colors.accent }]}
            >
              <ProDayText variant="caption" inverse>
                Retour
              </ProDayText>
            </PressableSpring>
          </View>
        </SafeAreaView>
      </ProDayScreenCanvas>
    );
  }

  const fields: [string, string, (v: string) => void, string?][] = [
    ['Nom du club', clubName, setClubName],
    ['Nom du responsable', ownerName, setOwnerName],
    ['Fonction', role, setRole],
    ['Nombre d’adhérents', members, setMembers, 'number-pad'],
    ['Nombre d’équipes', teams, setTeams, 'number-pad'],
    ['Nombre de coachs', coaches, setCoaches, 'number-pad'],
    ['Catégories concernées', categories, setCategories],
    ['Besoins du club', needs, setNeeds],
    ['Matériel vidéo disponible', videoGear, setVideoGear],
    ['Téléphone', phone, setPhone, 'phone-pad'],
    ['Email', email, setEmail, 'email-address'],
  ];

  return (
    <ProDayScreenCanvas>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScreenHeader title="Demander un devis" onBack={onBack} centered />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.pad}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ProDaySurface variant="module" style={[styles.intro, { borderColor: colors.border }]}>
              <ProDayText variant="caption" muted>
                Offre Tout inclus : sur devis, à partir de 3 € / adhérent. Le montant final dépend
                du nombre d’adhérents et de la formule.
              </ProDayText>
            </ProDaySurface>
            {fields.map(([label, value, setter, keyboard]) => (
              <View key={label} style={styles.field}>
                <ProDayText variant="caption" muted>
                  {label}
                </ProDayText>
                <TextInput
                  value={value}
                  onChangeText={setter}
                  keyboardType={(keyboard as any) || 'default'}
                  autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
                  multiline={label.startsWith('Besoins')}
                />
              </View>
            ))}
            <PressableSpring
              onPress={() => void submit()}
              scaleTo={0.97}
              haptic
              disabled={submitting}
              style={[styles.cta, { backgroundColor: colors.accent, opacity: submitting ? 0.7 : 1 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ProDayText variant="caption" inverse>
                  Envoyer la demande
                </ProDayText>
              )}
            </PressableSpring>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ProDayScreenCanvas>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  intro: { padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm },
  field: { gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  thanks: { padding: spacing.xl, gap: spacing.md },
  thanksBody: { lineHeight: 22 },
});
