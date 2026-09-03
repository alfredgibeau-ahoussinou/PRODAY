const fs = require('fs');
let file = fs.readFileSync('src/features/admin/panes/AdminAiPane.tsx', 'utf8');

const targetProps = `export function AdminAiPane({ onNavigate }: Props) {`;
const newProps = `export function AdminAiPane({ onNavigate, focusId }: Props & { focusId?: string }) {
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'config' ? 'config' : null
  );
  React.useEffect(() => {
    if (focusId === 'config') setGodModeContext(focusId);
  }, [focusId]);`;
file = file.replace(targetProps, newProps);

const targetEnd = `    </ScrollView>
  );
}`;
const newEnd = `    </ScrollView>

    {/* GOD MODE: AI Config */}
    <AdminModalSheet
        visible={godModeContext === 'config'}
        onDismiss={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>🧠 Configuration IA Globale</AdminText>
          <AdminText variant="body" muted style={{ marginBottom: 12 }}>Règles et limites des modèles Gemini Flash & Pro</AdminText>
          <AdminCard>
             <AdminText variant="h3">Prompt Système Global (Coach AI)</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput multiline value="Tu es l'assistant de coaching tactique PRODAY. Ton rôle est d'analyser les matchs et de..." style={{ borderWidth: 1, borderColor: ADMIN_TOKENS.border, padding: 12, borderRadius: 8, color: ADMIN_TOKENS.foreground, height: 100 }} />
               <AdminButton label="Déployer ce prompt" onPress={() => Alert.alert('Déployé', 'Le nouveau comportement IA est actif pour tous les coachs.')} />
             </View>
          </AdminCard>
          <AdminCard>
             <AdminText variant="h3">Limites de tokens / Appels IA</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput placeholder="Max appels / jour / user (ex: 50)" style={{ borderWidth: 1, borderColor: ADMIN_TOKENS.border, padding: 12, borderRadius: 8, color: ADMIN_TOKENS.foreground }} placeholderTextColor={ADMIN_TOKENS.muted} />
               <AdminButton label="Mettre à jour les quotas" onPress={() => Alert.alert('Sauvegardé', 'Quotas mis à jour.')} />
             </View>
          </AdminCard>
        </ScrollView>
    </AdminModalSheet>
  );
}`;
file = file.replace(targetEnd, newEnd);

file = file.replace(/import \{ Alert, Pressable, ScrollView, StyleSheet, TextInput, View \} from 'react-native';/, `import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';\nimport { AdminModalSheet } from '../motion';`);

fs.writeFileSync('src/features/admin/panes/AdminAiPane.tsx', file);
