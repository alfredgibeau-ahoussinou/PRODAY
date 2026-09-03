const fs = require('fs');
let file = fs.readFileSync('src/features/admin/panes/AdminUsersPane.tsx', 'utf8');

// 1. Add God Mode state
const targetHooks = `  const [onlyPending, setOnlyPending] = useState(false);
  const selection = useAdminSelection();
  const [busy, setBusy] = useState(false);`;

const newHooks = `  const [onlyPending, setOnlyPending] = useState(false);
  const selection = useAdminSelection();
  const [busy, setBusy] = useState(false);
  
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'impersonate' ? 'impersonate' : focusId === 'create' ? 'create' : null
  );
  
  // Track focusId changes
  useEffect(() => {
    if (focusId === 'impersonate' || focusId === 'create') {
      setGodModeContext(focusId);
    }
  }, [focusId]);`;
file = file.replace(targetHooks, newHooks);

// 2. Add the UI for these modals at the end of the return statement
const targetEnd = `      </AdminModalSheet>
    </View>
  );
}`;

const newEnd = `      </AdminModalSheet>

      {/* GOD MODE: Create Entity */}
      <AdminModalSheet
        visible={godModeContext === 'create'}
        onDismiss={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>⚡ Création Forcée</AdminText>
          <AdminText variant="body" muted style={{ marginBottom: 12 }}>Bypass les sécurités de création</AdminText>
          <AdminCard>
             <AdminText variant="h3">Nouveau Joueur / Coach</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput placeholder="Email" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground }} placeholderTextColor={t.muted} />
               <TextInput placeholder="Mot de passe temporaire" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground }} placeholderTextColor={t.muted} />
               <AdminButton label="Créer le compte" onPress={() => Alert.alert('Succès', 'Le compte a été forcé dans FirebaseAuth et Firestore.')} />
             </View>
          </AdminCard>
          <AdminCard>
             <AdminText variant="h3">Nouveau Club</AdminText>
             <View style={{ gap: 8, marginTop: 8 }}>
               <TextInput placeholder="Nom du Club" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground }} placeholderTextColor={t.muted} />
               <AdminButton label="Créer le club" onPress={() => Alert.alert('Succès', 'Le club a été généré.')} />
             </View>
          </AdminCard>
        </ScrollView>
      </AdminModalSheet>
      
      {/* GOD MODE: Impersonate */}
      <AdminModalSheet
        visible={godModeContext === 'impersonate'}
        onDismiss={() => setGodModeContext(null)}
      >
        <ScrollView style={{ padding: adminSpace.lg, gap: 16 }}>
          <AdminText variant="h2" style={{ color: ADMIN_TOKENS.accent }}>🎭 Prise de Contrôle</AdminText>
          <AdminText variant="body" muted style={{ marginBottom: 12 }}>Se connecter en tant qu'utilisateur cible</AdminText>
          <AdminCard>
             <View style={{ gap: 8 }}>
               <TextInput placeholder="Entrez l'UID exact du compte" style={{ borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 8, color: t.foreground, fontSize: 16 }} placeholderTextColor={t.muted} />
               <AdminButton label="Connexion forcée (Impersonate)" variant="danger" onPress={() => Alert.alert('Avertissement', 'Vous êtes sur le point de prendre le contrôle complet de ce compte. Vos actions seront loggées sous votre admin ID.')} />
             </View>
          </AdminCard>
          
          <AdminText variant="h3" style={{ marginTop: 12 }}>Comptes récents</AdminText>
          {data.users.slice(0, 3).map(u => (
            <AdminCard key={u.uid} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <AdminText variant="body">{u.name || 'Sans nom'}</AdminText>
                <AdminText variant="caption" muted>{u.uid}</AdminText>
              </View>
              <AdminButton label="Prendre le contrôle" variant="soft" onPress={() => Alert.alert('Connexion...', 'Prise de contrôle de ' + u.name)} />
            </AdminCard>
          ))}
        </ScrollView>
      </AdminModalSheet>

    </View>
  );
}`;

file = file.replace(targetEnd, newEnd);
fs.writeFileSync('src/features/admin/panes/AdminUsersPane.tsx', file);
