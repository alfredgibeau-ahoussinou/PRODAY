import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { AuthTextField } from './AuthTextField';
import { AuthPrimaryButton } from './AuthPrimaryButton';
import { authService } from '../../services/auth.service';
import type { AuthLinkPasswordRequiredError } from '../../utils/authErrors';
import { oauthProviderLabel } from '../../utils/authOAuthLink';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

interface AuthOAuthLinkModalProps {
  request: AuthLinkPasswordRequiredError | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
}

export const AuthOAuthLinkModal: React.FC<AuthOAuthLinkModalProps> = ({
  request,
  onClose,
  onSuccess,
  onError,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const handleLink = async () => {
    if (!request) return;
    if (!password) {
      onError('Mot de passe requis.');
      return;
    }
    setLoading(true);
    try {
      await authService.linkOAuthWithPassword(
        request.email,
        password,
        request.pendingCredential
      );
      setPassword('');
      await onSuccess();
    } catch (e) {
      onError(authService.getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const providerLabel = request ? oauthProviderLabel(request.provider) : '';

  return (
    <AnimatedModalShell
      visible={request != null}
      onClose={handleClose}
      closeLabel="Annuler"
      variant="compact"
    >
      <View style={styles.content}>
        <Text style={styles.title}>Lier {providerLabel}</Text>
        <Text style={styles.body}>
          Un compte ProDay existe déjà avec{' '}
          <Text style={styles.email}>{request?.email}</Text>. Entrez votre mot de passe pour
          lier {providerLabel} à ce compte.
        </Text>
        <AuthTextField
          label="Mot de passe ProDay"
          icon="lock"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureToggle
          autoComplete="password"
          returnKeyType="go"
          onSubmitEditing={() => void handleLink()}
        />
        <AuthPrimaryButton
          label={`Lier ${providerLabel}`}
          onPress={() => void handleLink()}
          loading={loading}
        />
      </View>
    </AnimatedModalShell>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    content: { gap: spacing.md, paddingBottom: spacing.sm },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textMuted,
      textAlign: 'center',
    },
    email: {
      fontWeight: '700',
      color: c.text,
    },
  });
}
