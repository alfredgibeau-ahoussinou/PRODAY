/**
 * PRODAY — Modal d'identification par étapes lors de la première connexion par code
 * 
 * Refonte alignée fidèlement sur l'onboarding et l'inscription ProDay / Pushr :
 * - Expérience fluide par étapes avec fil de progression discret (progressSegment)
 * - Étape 1 : Identité (« Comment doit-on t’appeler ? » - Prénom & Nom grand format)
 * - Étape 2 : Fonction & Rôle (« Quel est votre rôle ? » - Fonction / Diplôme & Catégorie d'équipe)
 * - Étape 3 : Contact & Sécurité (« Coordonnées de contact » - Téléphone mobile & Email optionnel)
 * - Typographie soignée, fond blanc pur #FFFFFF, boutons solides Pushr
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { radius, spacing } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import type { ResolvedClubAffiliation } from '../../services/partnerClubs.service';

export interface CodeIdentitySubmission {
  firstName: string;
  lastName: string;
  phone?: string;
  functionOrDiploma: string; // Ex: Coach principal U16, Entraîneur adjoint, BEF, BMF...
  category?: string;
  email?: string;
}

interface AuthCodeIdentityModalProps {
  visible: boolean;
  affiliation: ResolvedClubAffiliation;
  onDismiss: () => void;
  onSubmit: (identity: CodeIdentitySubmission) => Promise<void>;
  loading?: boolean;
}

export const AuthCodeIdentityModal: React.FC<AuthCodeIdentityModalProps> = ({
  visible,
  affiliation,
  onDismiss,
  onSubmit,
  loading = false,
}) => {
  const isCoach = affiliation.matchedType === 'coach';
  const club = affiliation.club;

  // Étapes : 1 = Identité (Prénom & Nom), 2 = Rôle & Équipe, 3 = Coordonnées
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const totalSteps = 3;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [functionOrDiploma, setFunctionOrDiploma] = useState(isCoach ? 'Entraîneur / Coach' : 'Dirigeant Club');
  const [selectedCategory, setSelectedCategory] = useState(
    club.defaultCategories && club.defaultCategories.length > 0 ? club.defaultCategories[0] : ''
  );
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const lastNameRef = useRef<TextInput>(null);

  const handleNextFromStep1 = () => {
    if (!firstName.trim()) {
      setError('Veuillez renseigner votre prénom.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (isCoach && !functionOrDiploma.trim()) {
      setError('Veuillez préciser votre fonction ou diplôme.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleFinalSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
      setError('Format d’adresse email invalide.');
      return;
    }
    setError(null);
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      functionOrDiploma: functionOrDiploma.trim(),
      category: selectedCategory || undefined,
      email: cleanEmail || undefined,
    });
  };

  const handleBack = () => {
    setError(null);
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else onDismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.sheet}>
            {/* Barre de navigation haute & Barre de progression inspirée d'OnboardingShell */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.navButton} hitSlop={12}>
                <Icon name={step === 1 ? 'close' : 'arrow-back'} size={18} color="#000000" />
              </TouchableOpacity>

              <View style={styles.progressTrack}>
                {[1, 2, 3].map((s) => (
                  <View
                    key={s}
                    style={[styles.progressSegment, s <= step && styles.progressSegmentActive]}
                  />
                ))}
              </View>

              <View style={styles.clubBadge}>
                <Icon name="shield-checkmark" size={14} color="#000000" />
                <ProDayText style={styles.clubBadgeText} numberOfLines={1}>
                  {club.clubName.split(' ')[0]}
                </ProDayText>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              {/* Message d'erreur */}
              {error ? (
                <View style={styles.errorBox}>
                  <Icon name="alert-circle" size={16} color="#EF4444" />
                  <ProDayText style={styles.errorText}>{error}</ProDayText>
                </View>
              ) : null}

              {/* ÉTAPE 1 : IDENTITÉ (Inspirée de OnboardingIdentityScreen) */}
              {step === 1 ? (
                <View style={styles.stepContainer}>
                  <View style={styles.titleBlock}>
                    <ProDayText variant="title" style={styles.title}>
                      Comment doit-on t’appeler ?
                    </ProDayText>
                    <ProDayText variant="body" style={styles.subtitle}>
                      Faisons connaissance. Renseignez votre identité officielle pour activer le code{' '}
                      <ProDayText style={styles.boldCode}>{affiliation.codeUsed}</ProDayText>.
                    </ProDayText>
                  </View>

                  <View style={styles.fields}>
                    {/* Prénom */}
                    <View style={styles.fieldWrap}>
                      <View style={styles.labelRow}>
                        <ProDayText variant="caption" style={styles.fieldLabel}>
                          Prénom
                        </ProDayText>
                      </View>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="Votre prénom"
                          placeholderTextColor="#A1A1AA"
                          value={firstName}
                          onChangeText={(t) => {
                            setFirstName(t);
                            if (error) setError(null);
                          }}
                          autoCapitalize="words"
                          autoComplete="given-name"
                          textContentType="givenName"
                          returnKeyType="next"
                          onSubmitEditing={() => lastNameRef.current?.focus()}
                          cursorColor="#000000"
                          selectionColor={Platform.OS === 'ios' ? '#000000' : 'rgba(0,0,0,0.2)'}
                        />
                      </View>
                    </View>

                    {/* Nom */}
                    <View style={styles.fieldWrap}>
                      <View style={styles.labelRow}>
                        <ProDayText variant="caption" style={styles.fieldLabel}>
                          Nom
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.optionalHint}>
                          Optionnel
                        </ProDayText>
                      </View>
                      <View style={styles.inputContainer}>
                        <TextInput
                          ref={lastNameRef}
                          style={styles.input}
                          placeholder="Votre nom"
                          placeholderTextColor="#A1A1AA"
                          value={lastName}
                          onChangeText={(t) => {
                            setLastName(t);
                            if (error) setError(null);
                          }}
                          autoCapitalize="characters"
                          autoComplete="family-name"
                          textContentType="familyName"
                          returnKeyType="done"
                          onSubmitEditing={handleNextFromStep1}
                          cursorColor="#000000"
                          selectionColor={Platform.OS === 'ios' ? '#000000' : 'rgba(0,0,0,0.2)'}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Bouton Continuer */}
                  <PressableSpring
                    style={[styles.primaryButton, !firstName.trim() && styles.primaryButtonDisabled]}
                    onPress={handleNextFromStep1}
                    disabled={!firstName.trim()}
                    scaleTo={0.98}
                    haptic
                  >
                    <ProDayText style={styles.primaryButtonText}>Continuer</ProDayText>
                  </PressableSpring>
                </View>
              ) : null}

              {/* ÉTAPE 2 : FONCTION & CATÉGORIE CLUB (Inspirée de SignupRoleSteps) */}
              {step === 2 ? (
                <View style={styles.stepContainer}>
                  <View style={styles.titleBlock}>
                    <ProDayText variant="title" style={styles.title}>
                      {isCoach ? 'Votre fonction au club' : 'Votre rôle dans la structure'}
                    </ProDayText>
                    <ProDayText variant="body" style={styles.subtitle}>
                      {isCoach
                        ? 'Indiquez votre diplôme ou intitulé de poste au sein de ' + club.clubName + '.'
                        : 'Précisez votre responsabilité au sein du club.'}
                    </ProDayText>
                  </View>

                  <View style={styles.fields}>
                    <View style={styles.fieldWrap}>
                      <View style={styles.labelRow}>
                        <ProDayText variant="caption" style={styles.fieldLabel}>
                          {isCoach ? 'Diplôme / Intitulé' : 'Responsabilité'}
                        </ProDayText>
                      </View>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder={
                            isCoach
                              ? 'Ex: Coach principal, BMF, Entraîneur U16, Adjoint...'
                              : 'Ex: Président, Secrétaire Général, Dirigeant...'
                          }
                          placeholderTextColor="#A1A1AA"
                          value={functionOrDiploma}
                          onChangeText={(t) => {
                            setFunctionOrDiploma(t);
                            if (error) setError(null);
                          }}
                          autoCapitalize="sentences"
                          returnKeyType="done"
                          cursorColor="#000000"
                        />
                      </View>
                    </View>

                    {/* Sélection de catégorie / équipe officielle */}
                    {club.defaultCategories && club.defaultCategories.length > 0 ? (
                      <View style={styles.fieldWrap}>
                        <View style={styles.labelRow}>
                          <ProDayText variant="caption" style={styles.fieldLabel}>
                            Équipe / Catégorie rattachée
                          </ProDayText>
                        </View>
                        <View style={styles.chipsGrid}>
                          {club.defaultCategories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                              <TouchableOpacity
                                key={cat}
                                style={[styles.choiceChip, isSelected && styles.choiceChipActive]}
                                onPress={() => setSelectedCategory(cat)}
                              >
                                <ProDayText
                                  style={[
                                    styles.choiceChipText,
                                    isSelected && styles.choiceChipTextActive,
                                  ]}
                                >
                                  {cat}
                                </ProDayText>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Bouton Continuer */}
                  <PressableSpring
                    style={[styles.primaryButton, !functionOrDiploma.trim() && styles.primaryButtonDisabled]}
                    onPress={handleNextFromStep2}
                    disabled={!functionOrDiploma.trim()}
                    scaleTo={0.98}
                    haptic
                  >
                    <ProDayText style={styles.primaryButtonText}>Continuer</ProDayText>
                  </PressableSpring>
                </View>
              ) : null}

              {/* ÉTAPE 3 : CONTACT & VALIDATION FINALE */}
              {step === 3 ? (
                <View style={styles.stepContainer}>
                  <View style={styles.titleBlock}>
                    <ProDayText variant="title" style={styles.title}>
                      Coordonnées de contact
                    </ProDayText>
                    <ProDayText variant="body" style={styles.subtitle}>
                      Renseignez votre téléphone pour reconnaître automatiquement ce terminal lors de vos prochaines connexions.
                    </ProDayText>
                  </View>

                  <View style={styles.fields}>
                    {/* Téléphone mobile */}
                    <View style={styles.fieldWrap}>
                      <View style={styles.labelRow}>
                        <ProDayText variant="caption" style={styles.fieldLabel}>
                          Téléphone mobile
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.optionalHint}>
                          Reconnaissance sécurisée
                        </ProDayText>
                      </View>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="06 12 34 56 78"
                          placeholderTextColor="#A1A1AA"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                          returnKeyType="next"
                          cursorColor="#000000"
                        />
                      </View>
                    </View>

                    {/* Email de contact */}
                    <View style={styles.fieldWrap}>
                      <View style={styles.labelRow}>
                        <ProDayText variant="caption" style={styles.fieldLabel}>
                          Votre email
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.optionalHint}>
                          Optionnel
                        </ProDayText>
                      </View>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="votre.email@exemple.com"
                          placeholderTextColor="#A1A1AA"
                          value={email}
                          onChangeText={(v) => {
                            setEmail(v);
                            if (error) setError(null);
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          cursorColor="#000000"
                        />
                      </View>
                      <ProDayText variant="caption" style={styles.fieldHint}>
                        Votre adresse pour vos notifications et échanges avec le club.
                      </ProDayText>
                    </View>
                  </View>

                  {/* Récapitulatif avant validation */}
                  <View style={styles.recapCard}>
                    <View style={styles.recapRow}>
                      <Icon name="person" size={16} color="#71717A" />
                      <ProDayText style={styles.recapText}>
                        {firstName} {lastName} · {functionOrDiploma}
                      </ProDayText>
                    </View>
                    <View style={styles.recapRow}>
                      <Icon name="shield" size={16} color="#71717A" />
                      <ProDayText style={styles.recapText}>
                        {club.clubName} {selectedCategory ? `(${selectedCategory})` : ''}
                      </ProDayText>
                    </View>
                  </View>

                  {/* Bouton de confirmation finale */}
                  <PressableSpring
                    style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                    onPress={() => void handleFinalSubmit()}
                    disabled={loading}
                    scaleTo={0.98}
                    haptic
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ProDayText style={styles.primaryButtonText}>
                        Valider et accéder à l'espace
                      </ProDayText>
                    )}
                  </PressableSpring>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '92%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    gap: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F4F4F5',
  },
  progressSegmentActive: {
    backgroundColor: '#000000',
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    maxWidth: 120,
  },
  clubBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#000000',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  stepContainer: {
    gap: 16,
  },
  titleBlock: {
    marginBottom: 4,
  },
  title: {
    color: '#000000',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    color: '#71717A',
    fontSize: 14,
    lineHeight: 20,
  },
  boldCode: {
    fontFamily: fontFamily.bold,
    color: '#000000',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  fields: {
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  fieldLabel: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionalHint: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  fieldHint: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    minHeight: 54,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.3,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
  },
  choiceChipActive: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  choiceChipText: {
    fontSize: 13,
    color: '#52525B',
    fontFamily: fontFamily.regular,
  },
  choiceChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
  },
  recapCard: {
    backgroundColor: '#F4F4F5',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recapText: {
    fontSize: 13,
    color: '#3F3F46',
    fontWeight: '600',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#F4F4F5',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
