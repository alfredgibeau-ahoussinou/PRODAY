import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { AUTH_XP } from '../../features/auth/experience/tokens';
import {
  phoneAuthService,
  formatPhoneNumberE164,
  isValidPhoneNumber,
} from '../../services/phoneAuth.service';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface AuthPhoneModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
  accent?: string;
}

export const AuthPhoneModal: React.FC<AuthPhoneModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  accent = AUTH_XP.goldBright,
}) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const codeInputRef = useRef<TextInput>(null);

  const resetState = () => {
    setStep('phone');
    setPhoneNumber('');
    setCode('');
    setVerificationId(null);
    setLoading(false);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendCode = async () => {
    setErrorMsg(null);
    const formatted = formatPhoneNumberE164(phoneNumber);
    if (!isValidPhoneNumber(formatted)) {
      setErrorMsg('Numéro invalide. Format : 06 12 34 56 78 ou +33 6 12 34 56 78');
      prodayHaptics.error();
      return;
    }

    setLoading(true);
    try {
      // Pour une authentification sans Captcha lourd en environnement mobile
      const fakeVerifier: any = {
        type: 'recaptcha',
        verify: async () => 'mock_token',
      };
      const vId = await phoneAuthService.requestVerificationCode(formatted, fakeVerifier);
      setVerificationId(vId);
      setStep('code');
      prodayHaptics.confirm();
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de l’envoi du SMS.';
      setErrorMsg(msg);
      prodayHaptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId) return;
    setErrorMsg(null);
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('Le code doit comporter 6 chiffres.');
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
      const msg = e instanceof Error ? e.message : 'Code invalide ou expiré.';
      setErrorMsg(msg);
      prodayHaptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'phone' ? 'Connexion par Téléphone' : 'Code de confirmation'}
            </Text>
            <PressableSpring onPress={handleClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#FFFFFF" />
            </PressableSpring>
          </View>

          <Text style={styles.subtitle}>
            {step === 'phone'
              ? 'Entrez votre numéro de mobile. Nous vous enverrons un code de confirmation par SMS.'
              : `Entrez le code à 6 chiffres envoyé au ${phoneNumber}.`}
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {step === 'phone' ? (
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icon name="call" size={18} color="rgba(255,255,255,0.4)" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="06 12 34 56 78"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="phone-pad"
                autoFocus
                value={phoneNumber}
                onChangeText={(v) => {
                  setPhoneNumber(v);
                  if (errorMsg) setErrorMsg(null);
                }}
                editable={!loading}
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icon name="lock" size={18} color="rgba(255,255,255,0.4)" />
              </View>
              <TextInput
                ref={codeInputRef}
                style={[styles.input, styles.codeInput]}
                placeholder="123456"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  if (errorMsg) setErrorMsg(null);
                }}
                editable={!loading}
              />
            </View>
          )}

          <PressableSpring
            style={[styles.cta, { backgroundColor: accent }]}
            onPress={step === 'phone' ? handleSendCode : handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.ctaText}>
                {step === 'phone' ? 'Envoyer le code' : 'Vérifier & Se connecter'}
              </Text>
            )}
          </PressableSpring>

          {step === 'code' ? (
            <PressableSpring
              onPress={() => {
                setStep('phone');
                setCode('');
                setErrorMsg(null);
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>Modifier le numéro</Text>
            </PressableSpring>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#161618',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 13,
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  codeInput: {
    fontSize: 20,
    letterSpacing: 6,
    fontWeight: '700',
  },
  cta: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  backText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
});
