import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion';
import { colors, spacing, radius } from '../../theme/designTokens';
import {
  phoneAuthService,
  formatPhoneNumberE164,
  isValidPhoneNumber,
} from '../../services/phoneAuth.service';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { phoneAuthErrorMessage } from '../../utils/phoneAuthErrors';
import {
  CountryCodePicker,
  POPULAR_COUNTRIES,
  type CountryCode,
} from './CountryCodePicker';

interface AuthPhoneModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
  accent?: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

export const AuthPhoneModal: React.FC<AuthPhoneModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  accent = colors.accent,
}) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [country, setCountry] = useState<CountryCode>(POPULAR_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const resetState = () => {
    setStep('phone');
    setPhoneNumber('');
    setCode('');
    setVerificationId(null);
    setLoading(false);
    setErrorMsg(null);
    setResendCooldown(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getFullE164Number = () => {
    const raw = phoneNumber.trim();
    if (raw.startsWith('+')) return formatPhoneNumberE164(raw);
    if (raw.startsWith('0')) {
      return `${country.dialCode}${raw.slice(1)}`;
    }
    return `${country.dialCode}${raw}`;
  };

  const handleSendCode = async (isResend = false) => {
    setErrorMsg(null);
    const formatted = getFullE164Number();
    if (!isValidPhoneNumber(formatted)) {
      setErrorMsg(`Numéro invalide pour l'indicatif ${country.dialCode}.`);
      prodayHaptics.error();
      return;
    }

    setLoading(true);
    try {
      let appVerifier: any;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const { RecaptchaVerifier } = await import('firebase/auth');
        const { getFirebaseAuth } = await import('../../lib/firebase');
        const auth = getFirebaseAuth();
        if (auth) {
          const w = window as any;
          if (!w.recaptchaVerifier) {
            let container = document.getElementById('recaptcha-container');
            if (!container) {
              container = document.createElement('div');
              container.id = 'recaptcha-container';
              document.body.appendChild(container);
            }
            w.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
            });
          }
          appVerifier = w.recaptchaVerifier;
        }
      }

      if (!appVerifier) {
        appVerifier = {
          type: 'recaptcha',
          verify: async () => 'mock_token',
        };
      }

      const vId = await phoneAuthService.requestVerificationCode(formatted, appVerifier);
      setVerificationId(vId);
      setStep('code');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      prodayHaptics.confirm();
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (e) {
      const msg =
        phoneAuthErrorMessage(e) ??
        (e instanceof Error && e.message
          ? e.message
          : 'Erreur lors de l’envoi du SMS. Réessayez.');
      setErrorMsg(msg);
      prodayHaptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId) return;
    setErrorMsg(null);
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setErrorMsg('Le code de vérification doit comporter 6 chiffres.');
      prodayHaptics.error();
      return;
    }

    setLoading(true);
    try {
      await phoneAuthService.confirmCode(verificationId, cleanCode);
      prodayHaptics.confirm();
      handleClose();
      await onSuccess();
    } catch (e) {
      const msg =
        phoneAuthErrorMessage(e) ??
        (e instanceof Error && e.message ? e.message : 'Code invalide ou expiré.');
      setErrorMsg(msg);
      prodayHaptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>
                  {step === 'phone' ? 'Connexion par Téléphone' : 'Code de confirmation'}
                </Text>
                <Text style={styles.subtitle}>
                  {step === 'phone'
                    ? 'Recevez un code à 6 chiffres par SMS pour vous identifier.'
                    : `Saisissez le code envoyé au ${getFullE164Number()}`}
                </Text>
              </View>
              <PressableSpring onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text} />
              </PressableSpring>
            </View>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF453A" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {step === 'phone' ? (
              <View style={styles.formBody}>
                <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
                <View style={styles.phoneInputRow}>
                  {/* Country Selector Button */}
                  <TouchableOpacity
                    style={styles.countryBtn}
                    onPress={() => setShowCountryPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Number Input */}
                  <TextInput
                    ref={phoneInputRef}
                    style={styles.phoneInput}
                    placeholder="6 12 34 56 78"
                    placeholderTextColor={colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={(val) => {
                      setPhoneNumber(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => void handleSendCode()}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (!phoneNumber.trim() || loading) && styles.btnDisabled]}
                  onPress={() => void handleSendCode()}
                  disabled={!phoneNumber.trim() || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane-outline" size={18} color="#000000" />
                      <Text style={styles.primaryBtnText}>Recevoir mon code par SMS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formBody}>
                <Text style={styles.fieldLabel}>Code de vérification (6 chiffres)</Text>
                <TextInput
                  ref={codeInputRef}
                  style={styles.codeInput}
                  placeholder="123456"
                  placeholderTextColor={colors.textSecondary}
                  value={code}
                  onChangeText={(val) => {
                    setCode(val);
                    if (errorMsg) setErrorMsg(null);
                    if (val.trim().length === 6) {
                      setTimeout(() => {
                        void handleVerifyCode();
                      }, 100);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, (code.trim().length !== 6 || loading) && styles.btnDisabled]}
                  onPress={() => void handleVerifyCode()}
                  disabled={code.trim().length !== 6 || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#000000" />
                      <Text style={styles.primaryBtnText}>Confirmer et continuer</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.codeHelperRow}>
                  <TouchableOpacity
                    style={styles.textLinkBtn}
                    onPress={() => {
                      setStep('phone');
                      setErrorMsg(null);
                    }}
                  >
                    <Ionicons name="pencil" size={14} color={colors.accent} />
                    <Text style={styles.textLink}>Modifier le numéro</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.textLinkBtn, resendCooldown > 0 && styles.linkDisabled]}
                    onPress={() => {
                      if (resendCooldown === 0) void handleSendCode(true);
                    }}
                    disabled={resendCooldown > 0 || loading}
                  >
                    <Ionicons
                      name="refresh"
                      size={14}
                      color={resendCooldown > 0 ? colors.textSecondary : colors.accent}
                    />
                    <Text style={[styles.textLink, resendCooldown > 0 && styles.linkTextMuted]}>
                      {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CountryCodePicker
        visible={showCountryPicker}
        selected={country}
        onSelect={setCountry}
        onClose={() => setShowCountryPicker(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#161922',
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.35)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF453A',
    fontWeight: '600',
  },
  formBody: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 48,
    gap: 6,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryDialCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: 16,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    color: colors.accent,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 48,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  codeHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  textLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  linkDisabled: {
    opacity: 0.6,
  },
  textLink: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  linkTextMuted: {
    color: colors.textSecondary,
  },
});
