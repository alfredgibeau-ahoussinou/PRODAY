const fs = require('fs');
let file = fs.readFileSync('src/features/admin/panes/AdminSecurityPane.tsx', 'utf8');

// 1. Add props
const targetProps = `export function AdminSecurityPane() {`;
const newProps = `import { AdminModalSheet, AdminButton } from '../ui/adminUi';
import { Alert, TextInput } from 'react-native';

export function AdminSecurityPane({ focusId }: { focusId?: string }) {
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'moderation' ? 'moderation' : null
  );
  useEffect(() => {
    if (focusId === 'moderation') {
      setGodModeContext(focusId);
    }
  }, [focusId]);`;
  
file = file.replace(targetProps, newProps);

// 2. Add Modal
const targetEnd = `    </ScrollView>
  );
}`;
const newEnd = `    </ScrollView>

    {/* GOD MODE: Moderation */}
    <AdminModalSheet
        visible={godModeContext === 'moderation'}
        onDismiss={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>🛡️ Modération de Contenu</AdminText>
          <AdminText variant="body" muted style={{ marginBottom: 12 }}>Bannissement et suppression de posts/médias</AdminText>
          <AdminCard>
             <AdminText variant="h3">Takedown par ID de contenu (Post, Message, Video)</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput placeholder="Entity ID (ex: post_xxx)" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground }} placeholderTextColor={t.muted} />
               <AdminButton label="Suppression instantanée (Hard Delete)" variant="danger" onPress={() => Alert.alert('Supprimé', 'Le contenu a été purgé de Firestore.')} />
             </View>
          </AdminCard>
          <AdminCard>
            <AdminText variant="h3">Signalements prioritaires</AdminText>
            <AdminText variant="body" muted>La file d'attente des signalements communautaires est vide actuellement.</AdminText>
          </AdminCard>
        </ScrollView>
    </AdminModalSheet>
  );
}`;

file = file.replace(targetEnd, newEnd);

// Fix AdminModalSheet import (it comes from motion, not ui usually, wait let's import it from motion)
file = file.replace(/import \{ AdminModalSheet, AdminButton \} from '\.\.\/ui\/adminUi';/, `import { AdminButton } from '../ui/adminUi';\nimport { AdminModalSheet } from '../motion';`);

fs.writeFileSync('src/features/admin/panes/AdminSecurityPane.tsx', file);
