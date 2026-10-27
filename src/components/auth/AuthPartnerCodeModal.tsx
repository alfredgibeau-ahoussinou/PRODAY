import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { colors, radius, spacing } from '../../theme/designTokens';
import {
  partnerClubsService,
  type ResolvedClubAffiliation,
} from '../../services/partnerClubs.service';

interface AuthPartnerCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onCodeResolved: (affiliation: ResolvedClubAffiliation) => void;
}

export const AuthPartnerCodeModal: React.FC<AuthPartnerCodeModalProps> = ({
  visible,
  onClose,
  onCodeResolved,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setCode('');
      setError(null);
      setLoading(false);
    }
  }, [visible]);

  const handleValidate = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Veuillez saisir votre code club ou coach.');
      return;
    }

    setLoading(true);
    setError(null);

    const match = partnerClubsService.resolveAffiliation(trimmed);
    setLoading(false);

    if (!match) {
      setError(
        'Code non reconnu. Utilisez votre code officiel remis par votre club (ex: USO-CLUB-2026, TF-CLUB-2026, VF-CLUB-2026, RU-CLUB-2026...).'
      );
      return;
    }

    onCodeResolved(match);
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    onClose();
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
            <View style={styles.headerTextWrap}>
              <View style={styles.badgeRow}>
                <Ionicons name="shield-checkmark" size={16} color="#E8B923" />
                <ProDayText style={styles.badgeText}>ACCÈS CLUB BÊTA</ProDayText>
              </View>
              <ProDayText style={styles.title}>Connexion Code Club</ProDayText>
              <ProDayText style={styles.subtitle}>
                Accédez instantanément à l'espace de votre club avec votre code officiel d'affiliation.
              </ProDayText>
            </View>
            <PressableSpring
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={12}
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </PressableSpring>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#FF453A" />
              <ProDayText style={styles.errorText}>{error}</ProDayText>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Ionicons name="shield-outline" size={18} color="#A1A1AA" style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Ex: USO-CLUB-2026, TF-CLUB-2026..."
              placeholderTextColor="#71717A"
              value={code}
              onChangeText={(val) => {
                setCode(val);
                if (error) setError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleValidate}
              editable={!loading}
            />
          </View>

          <PressableSpring
            onPress={handleValidate}
            disabled={loading}
            scaleTo={0.97}
            haptic
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={18} color="#000000" />
                <ProDayText style={styles.submitBtnText}>Valider mon accès club</ProDayText>
              </>
            )}
          </PressableSpring>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E8B923',
    letterSpacing: 0.8,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
    color: '#FF453A',
    flex: 1,
    lineHeight: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    height: 52,
    marginBottom: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    height: 50,
    gap: 8,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
