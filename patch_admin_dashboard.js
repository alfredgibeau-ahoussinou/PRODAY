const fs = require('fs');
let file = fs.readFileSync('src/features/admin/panes/AdminDashboardPane.tsx', 'utf8');

const targetHero = `<View style={styles.heroTop}>
          <AdminBrandMark />
          <View style={styles.heroActions}>
            {onOpenCommand ? (
              <AdminButton label="Rechercher" variant="soft" onPress={onOpenCommand} />
            ) : null}
            <AdminBadge label="Directif" tone="accent" />
          </View>
        </View>

        <AdminText variant="h1" style={{ color: t.foreground, lineHeight: 40 }}>
          Centre de
          {'\n'}Commande
        </AdminText>
        <AdminText variant="body" color={t.muted}>
          Mode Directeur : Contrôle absolu sur l'écosystème.
        </AdminText>
      </View>`;

const newHero = `<View style={styles.heroTop}>
          <AdminBrandMark />
          <View style={styles.heroActions}>
            {onOpenCommand ? (
              <AdminButton label="Rechercher" variant="soft" onPress={onOpenCommand} />
            ) : null}
            <AdminBadge label="GOD MODE" tone="accent" />
          </View>
        </View>

        <AdminText variant="h1" style={{ color: t.foreground, lineHeight: 40, letterSpacing: -1 }}>
          Centre de
          {'\n'}Commande
        </AdminText>
        <AdminText variant="body" color={t.muted}>
          Mode Directeur : Contrôle absolu sur l'écosystème.
        </AdminText>
      </View>
      
      {/* GOD MODE ACTIONS */}
      <AdminCard style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: t.accent }}>
        <AdminText variant="h2" style={{ color: t.accent }}>⚡ Actions Divines</AdminText>
        <AdminText variant="caption" muted style={{ marginBottom: 12 }}>
          Les 5 piliers de contrôle absolu
        </AdminText>
        
        <View style={{ gap: 8 }}>
          <Pressable onPress={() => onNavigate('utilisateurs', 'create')} style={styles.godAction}>
            <AdminText style={styles.godIcon}>➕</AdminText>
            <View style={{ flex: 1 }}><AdminText variant="h3">Création d'Entités</AdminText><AdminText variant="caption" muted>Forcer la création de clubs, users, events</AdminText></View>
          </Pressable>
          <Pressable onPress={() => onNavigate('utilisateurs', 'impersonate')} style={styles.godAction}>
            <AdminText style={styles.godIcon}>🎭</AdminText>
            <View style={{ flex: 1 }}><AdminText variant="h3">Prise de Contrôle</AdminText><AdminText variant="caption" muted>Se connecter en tant qu'un utilisateur exact</AdminText></View>
          </Pressable>
          <Pressable onPress={() => onNavigate('securite', 'moderation')} style={styles.godAction}>
            <AdminText style={styles.godIcon}>🛡️</AdminText>
            <View style={{ flex: 1 }}><AdminText variant="h3">Modération de Contenu</AdminText><AdminText variant="caption" muted>Supprimer posts, messages, médias illicites</AdminText></View>
          </Pressable>
          <Pressable onPress={() => onNavigate('ia', 'config')} style={styles.godAction}>
            <AdminText style={styles.godIcon}>🧠</AdminText>
            <View style={{ flex: 1 }}><AdminText variant="h3">Configuration IA Globale</AdminText><AdminText variant="caption" muted>Modifier les prompts système & limites</AdminText></View>
          </Pressable>
          <Pressable onPress={() => onNavigate('systeme', 'push')} style={styles.godAction}>
            <AdminText style={styles.godIcon}>📣</AdminText>
            <View style={{ flex: 1 }}><AdminText variant="h3">Notifications Système</AdminText><AdminText variant="caption" muted>Envoyer des Push Notifications globales</AdminText></View>
          </Pressable>
        </View>
      </AdminCard>`;

file = file.replace(targetHero, newHero);

const targetStyles = `  quickToolBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    gap: 4,
  },
});`;

const newStyles = `  quickToolBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  godAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: ADMIN_TOKENS.surface,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
    gap: 12,
  },
  godIcon: {
    fontSize: 24,
  },
});`;

file = file.replace(targetStyles, newStyles);

fs.writeFileSync('src/features/admin/panes/AdminDashboardPane.tsx', file);
