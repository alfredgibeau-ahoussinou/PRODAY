import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Linking, Alert } from 'react-native';
import type { Application, ApplicationSharedDocument } from '../../models/Player';
import { AnimatedModalShell, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface ApplicationDocsSheetProps {
  visible: boolean;
  onClose: () => void;
  application: Application;
  uploaderUid: string;
  onSave: (docs: ApplicationSharedDocument[]) => Promise<void>;
}

export const ApplicationDocsSheet: React.FC<ApplicationDocsSheetProps> = ({
  visible,
  onClose,
  application,
  uploaderUid,
  onSave,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [docs, setDocs] = useState<ApplicationSharedDocument[]>(
    application.shared_documents ?? []
  );
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState(application.cv_pdf_url ?? '');
  const [busy, setBusy] = useState(false);

  const add = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http')) {
      Alert.alert('URL invalide', 'Utilisez un lien https vers le document.');
      return;
    }
    const next: ApplicationSharedDocument = {
      id: `doc_${Date.now()}`,
      label: label.trim() || 'Document',
      url: trimmedUrl,
      uploaded_by: uploaderUid,
      created_at: new Date(),
      kind: 'other',
    };
    setDocs((prev) => [...prev, next]);
    setLabel('');
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSave(docs);
      onClose();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="compact" handleOnly>
      <View style={styles.header}>
        <ProDayText variant="section">Coffre documents</ProDayText>
        <ProDayText variant="caption" muted>
          Partage sécurisé lié à la candidature
        </ProDayText>
      </View>

      <View style={styles.body}>
        {docs.length === 0 ? (
          <ProDayText variant="caption" muted>
            Aucun document partagé pour l’instant.
          </ProDayText>
        ) : (
          docs.map((doc) => (
            <PressableSpring
              key={doc.id}
              onPress={() => void Linking.openURL(doc.url)}
              style={[styles.docRow, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
              scaleTo={0.98}
            >
              <ProDayText variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
                {doc.label}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={1}>
                {doc.url}
              </ProDayText>
            </PressableSpring>
          ))
        )}

        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
          value={label}
          onChangeText={setLabel}
          placeholder="Libellé (licence, CV…)"
          placeholderTextColor={c.textMuted}
        />
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
          value={url}
          onChangeText={setUrl}
          placeholder="https://…"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
        />

        <View style={styles.actions}>
          <PressableSpring
            style={[styles.btnOutline, { borderColor: c.border }]}
            onPress={add}
            scaleTo={0.97}
          >
            <ProDayText variant="caption" style={{ fontWeight: '800' }}>
              Ajouter
            </ProDayText>
          </PressableSpring>
          <PressableSpring
            style={[styles.btn, { backgroundColor: c.brand }]}
            onPress={() => void save()}
            disabled={busy}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
              Enregistrer
            </ProDayText>
          </PressableSpring>
        </View>
      </View>
    </AnimatedModalShell>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 4 },
    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
    docRow: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: 2,
    },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 14,
    },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    btn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: radius.pill,
    },
    btnOutline: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
  });
}
