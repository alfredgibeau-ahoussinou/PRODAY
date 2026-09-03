const fs = require('fs');
let file = fs.readFileSync('src/features/admin/panes/AdminSystemPane.tsx', 'utf8');

const targetProps = `export function AdminSystemPane({ onPreviewUserApp }: { onPreviewUserApp: () => void }) {`;
const newProps = `export function AdminSystemPane({ onPreviewUserApp, focusId }: { onPreviewUserApp: () => void; focusId?: string }) {
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'push' ? 'push' : null
  );
  useEffect(() => {
    if (focusId === 'push') setGodModeContext(focusId);
  }, [focusId]);`;
file = file.replace(targetProps, newProps);

const targetEnd = `    </ScrollView>
  );
}`;
const newEnd = `    </ScrollView>
    {/* GOD MODE: Push Notifications */}
    <AdminModalSheet
        visible={godModeContext === 'push'}
        onDismiss={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>📣 Notifications Système</AdminText>
          <AdminText variant="body" muted style={{ marginBottom: 12 }}>Envoyer un Push à tous les utilisateurs (ou segments)</AdminText>
          <AdminCard>
             <AdminText variant="h3">Nouveau Push Global</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput placeholder="Titre (ex: Mise à jour majeure !)" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground }} placeholderTextColor={t.muted} />
               <TextInput multiline placeholder="Message..." style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground, height: 80 }} placeholderTextColor={t.muted} />
               <AdminButton label="Diffuser à tout le monde" variant="danger" onPress={() => Alert.alert('Envoyé', 'La notification a été diffusée à toute la base de données.')} />
             </View>
          </AdminCard>
          <AdminCard>
             <AdminText variant="h3">Push par Rôle</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <AdminButton label="Envoyer aux Coachs uniquement" onPress={() => {}} />
               <AdminButton label="Envoyer aux Joueurs uniquement" onPress={() => {}} />
             </View>
          </AdminCard>
        </ScrollView>
    </AdminModalSheet>
  );
}`;
file = file.replace(targetEnd, newEnd);

file = file.replace(/import \{ Alert, Linking, ScrollView, StyleSheet, Switch, TextInput, View \} from 'react-native';/, `import { Alert, Linking, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';\nimport { AdminModalSheet } from '../motion';`);

fs.writeFileSync('src/features/admin/panes/AdminSystemPane.tsx', file);
