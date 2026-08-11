import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { privacyAuditService } from '../../services/privacyGrants.service';

const STORAGE_KEY = '@proday/medical_confidentiality_ack_session';

export async function hasAcknowledgedMedicalConfidentiality(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function clearMedicalConfidentialityAck(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

interface MedicalConfidentialityNoticeProps {
  visible: boolean;
  actorUid?: string | null;
  onAcknowledge: () => void;
  onCancel?: () => void;
}

/**
 * Notice de confidentialité médicale — obligatoire avant consultation
 * des données de santé (session AsyncStorage).
 */
export const MedicalConfidentialityNotice: React.FC<MedicalConfidentialityNoticeProps> = ({
  visible,
  actorUid,
  onAcknowledge,
  onCancel,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const acknowledge = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    if (actorUid) {
      await privacyAuditService.log({
        actor_uid: actorUid,
        action: 'notice_ack',
        resource_type: 'privacy_notice',
        resource_id: 'medical_confidentiality',
        owner_uid: actorUid,
      });
    }
    onAcknowledge();
  }, [actorUid, onAcknowledge]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ProDayText variant="section" style={styles.title}>
            Confidentialité médicale
          </ProDayText>
          <ProDayText variant="body" muted style={styles.body}>
            Les informations de santé (dossiers, notes de consultation, documents médicaux) sont
            strictement confidentielles. Elles ne sont accessibles qu’au patient, aux professionnels
            de santé autorisés, et éventuellement au parent/tuteur légal si le patient a activé cet
            accès.
          </ProDayText>
          <ProDayText variant="body" muted style={styles.body}>
            Clubs, coachs, recruteurs et agents n’y ont pas accès sans autorisation explicite. Tout
            accès est journalisé. En continuant, vous vous engagez à respecter le secret médical et
            le RGPD.
          </ProDayText>
          <PressableSpring
            onPress={() => void acknowledge()}
            scaleTo={0.98}
            haptic
            style={styles.cta}
          >
            <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
              J’ai compris
            </ProDayText>
          </PressableSpring>
          {onCancel ? (
            <PressableSpring onPress={onCancel} style={styles.cancel}>
              <ProDayText variant="caption" muted style={{ fontWeight: '700' }}>
                Annuler
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

/** Hook : bloque l’UI médicale jusqu’à acknowledgment de session. */
export function useMedicalConfidentialityGate(actorUid?: string | null) {
  const [ready, setReady] = useState(false);
  const [needsNotice, setNeedsNotice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await hasAcknowledgedMedicalConfidentiality();
      if (!cancelled) {
        setNeedsNotice(!ok);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onAcknowledge = useCallback(() => setNeedsNotice(false), []);

  return {
    ready,
    needsNotice,
    gateOpen: ready && !needsNotice,
    Notice: (
      <MedicalConfidentialityNotice
        visible={ready && needsNotice}
        actorUid={actorUid}
        onAcknowledge={onAcknowledge}
      />
    ),
  };
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: { fontWeight: '800', color: c.text },
    body: { lineHeight: 22 },
    cta: {
      backgroundColor: c.brand,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    cancel: { alignItems: 'center', paddingVertical: spacing.sm },
  });
}
