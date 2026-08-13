import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ADMIN_VIDEO_VEO_DEMO } from '../../content/adminVideoVeoExplainer';
import { AdminSettingsCard } from './AdminSettingsCard';
import { PressableSpring } from '../motion';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type SectionId = 'flow' | 'how' | 'arch' | 'script';

/** Fiche démo — comment ProDay se connecte à Veo / caméras. */
export function AdminVideoVeoExplainer() {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [open, setOpen] = useState<SectionId | null>('flow');
  const copy = ADMIN_VIDEO_VEO_DEMO;

  const toggle = (id: SectionId) => setOpen((prev) => (prev === id ? null : id));

  return (
    <AdminSettingsCard icon="videocam" title={copy.title}>
      <View style={styles.banner}>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.lead}>{copy.lead}</Text>
        <Text style={styles.pitch}>{copy.pitch}</Text>
      </View>

      <Section
        styles={styles}
        title="Chaîne produit"
        open={open === 'flow'}
        onPress={() => toggle('flow')}
      >
        {copy.chain.map((s) => (
          <View key={s.step} style={styles.stepRow}>
            <Text style={styles.stepIndex}>{s.step}</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{s.label}</Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section
        styles={styles}
        title="Comment ça marche (parcours démo)"
        open={open === 'how'}
        onPress={() => toggle('how')}
      >
        {copy.howItWorks.map((s) => (
          <View key={s.title} style={styles.block}>
            <Text style={styles.blockTitle}>{s.title}</Text>
            <Text style={styles.blockBody}>{s.body}</Text>
          </View>
        ))}
      </Section>

      <Section
        styles={styles}
        title="Architecture technique"
        open={open === 'arch'}
        onPress={() => toggle('arch')}
      >
        {copy.architecture.map((s) => (
          <View key={s.title} style={styles.block}>
            <Text style={styles.blockTitle}>{s.title}</Text>
            <Text style={styles.blockBody}>{s.body}</Text>
          </View>
        ))}
      </Section>

      <Section
        styles={styles}
        title="Script démo (2 min)"
        open={open === 'script'}
        onPress={() => toggle('script')}
      >
        {copy.demoScript.map((line, i) => (
          <View key={line} style={styles.scriptRow}>
            <Text style={styles.scriptIndex}>{i + 1}</Text>
            <Text style={styles.scriptBody}>{line}</Text>
          </View>
        ))}
      </Section>
    </AdminSettingsCard>
  );
}

function Section({
  title,
  open,
  onPress,
  children,
  styles,
}: {
  title: string;
  open: boolean;
  onPress: () => void;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <PressableSpring onPress={onPress} scaleTo={0.98} style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
      </PressableSpring>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    banner: {
      gap: 6,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.brandSoft,
    },
    eyebrow: {
      color: c.brand,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
    },
    lead: { color: c.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    pitch: { color: c.textMuted, fontSize: 12, lineHeight: 17 },
    section: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingTop: spacing.sm,
      marginTop: spacing.sm,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: 4,
    },
    sectionTitle: { color: c.text, fontSize: 13, fontWeight: '800', flex: 1 },
    chevron: { color: c.brand, fontSize: 18, fontWeight: '700', width: 20, textAlign: 'center' },
    sectionBody: { gap: spacing.sm, marginTop: spacing.sm },
    stepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    stepIndex: {
      color: c.brand,
      fontWeight: '800',
      fontSize: 12,
      width: 28,
      marginTop: 1,
    },
    stepCopy: { flex: 1, gap: 2 },
    stepTitle: { color: c.text, fontWeight: '800', fontSize: 13 },
    stepBody: { color: c.textMuted, fontSize: 12, lineHeight: 17 },
    block: { gap: 4 },
    blockTitle: { color: c.text, fontWeight: '800', fontSize: 12 },
    blockBody: { color: c.textMuted, fontSize: 12, lineHeight: 17 },
    scriptRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    scriptIndex: {
      width: 20,
      height: 20,
      borderRadius: 10,
      textAlign: 'center',
      overflow: 'hidden',
      color: '#fff',
      backgroundColor: c.brand,
      fontWeight: '800',
      fontSize: 11,
      lineHeight: 20,
    },
    scriptBody: { flex: 1, color: c.text, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  });
}
