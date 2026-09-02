import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { ClubText } from '../../features/club/ui/clubUi';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { radius, spacing } from '../../theme/designTokens';
import { greetingForHour } from '../../features/club/ui/clubHomeAccueilModel';

export function ClubHomeScreen() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();

  if (!ws.club || !ws.teams) return null;

  const totalMembers = ws.teams.length * 20;
  const totalEvents = ws.events.length;
  
  const stats = [
    { id: 'teams', value: ws.teams.length, label: 'Équipes', icon: 'shield-half' },
    { id: 'members', value: totalMembers, label: 'Licenciés', icon: 'people' },
    { id: 'events', value: totalEvents, label: 'Événements', icon: 'calendar' },
  ] as const;

  const todos = [
    { id: 'licenses', title: '5 licences en attente', subtitle: 'Documents à valider', color: 'tomato' },
    { id: 'convocations', title: 'Relancer convocations', subtitle: 'Pour le match U16 de dimanche', color: tokens.accent },
  ];

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header Hero */}
        <View style={styles.header}>
          <View>
            <ClubText style={[styles.greeting, { color: tokens.muted }]}>
              {greetingForHour(new Date().getHours())}, {profile?.display_name?.split(" ")[0]}
            </ClubText>
            <ClubText style={[styles.clubName, { color: tokens.foreground }]}>
              {ws.club.name}
            </ClubText>
          </View>
          <View style={[styles.avatarBadge, { backgroundColor: tokens.accent + '22' }]}>
            <Icon name="person" size={24} color={tokens.accent} />
          </View>
        </View>

        {/* Global KPIs (Metrics) */}
        <View style={styles.statsRow}>
          {stats.map(s => (
            <View key={s.id} style={[styles.statBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <Icon name={s.icon as any} size={20} color={tokens.muted} />
              <ClubText style={[styles.statValue, { color: tokens.foreground }]}>{s.value}</ClubText>
              <ClubText style={[styles.statLabel, { color: tokens.muted }]}>{s.label}</ClubText>
            </View>
          ))}
        </View>

        {/* Action Center / ToDo */}
        <View style={styles.section}>
          <ClubText style={[styles.sectionTitle, { color: tokens.foreground }]}>Centre d'actions</ClubText>
          <View style={styles.todoList}>
            {todos.map(todo => (
              <PressableSpring key={todo.id} style={[styles.todoCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={[styles.todoIndicator, { backgroundColor: todo.color }]} />
                <View style={{ flex: 1, paddingLeft: spacing.md }}>
                  <ClubText style={[styles.todoTitle, { color: tokens.foreground }]}>{todo.title}</ClubText>
                  <ClubText style={[styles.todoSub, { color: tokens.muted }]}>{todo.subtitle}</ClubText>
                </View>
                <Icon name="chevron-forward" size={16} color={tokens.muted} />
              </PressableSpring>
            ))}
          </View>
        </View>

        {/* Teams Quick Access */}
        <View style={styles.section}>
          <ClubText style={[styles.sectionTitle, { color: tokens.foreground }]}>Vos Équipes</ClubText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamsScroll}>
            {ws.teams.map(team => (
              <PressableSpring 
                key={team.id}
                style={[styles.teamCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                onPress={() => {
                  shellNav?.setSelectedTeamId?.(team.id);
                  shellNav?.requestNav('teams');
                }}
              >
                <View style={[styles.teamIconWrap, { backgroundColor: tokens.bg, borderColor: tokens.border }]}>
                  <Icon name="shield" size={24} color={tokens.accent} />
                </View>
                <ClubText style={[styles.teamName, { color: tokens.foreground }]}>{team.name}</ClubText>
                <ClubText style={[styles.teamMeta, { color: tokens.muted }]}>
                  {0 /* todo */} joueurs
                </ClubText>
              </PressableSpring>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.sm },
  greeting: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  clubName: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  avatarBadge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statBox: { flex: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: spacing.sm, marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  
  todoList: { gap: spacing.sm },
  todoCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  todoIndicator: { width: 4, height: '100%', borderRadius: 2, position: 'absolute', left: 0 },
  todoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  todoSub: { fontSize: 13 },

  teamsScroll: { gap: spacing.md, paddingRight: spacing.xl },
  teamCard: { width: 140, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center' },
  teamIconWrap: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  teamName: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  teamMeta: { fontSize: 12 },
});
