const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

const targetTeamsUI = `<ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={isCoach ? coachStyles.teamChipScroll : defaultStyles.typeRow}
          >
            {clubTeams.map((team) => {
              const on = selectedTeamIds.includes(team.id);
              const playerCount = countActivePlayersForTeam(memberships, team.id);
              const chipLabel = teamConvocationChipLabel(team.name, team.category, playerCount);
              return (
                <PressableSpring
                  key={team.id}
                  style={[
                    isCoach ? coachStyles.teamChip : defaultStyles.typeChip,
                    isCoach
                      ? coachChipContainerStyle(on, tokens)
                      : on && defaultStyles.typeChipActive,
                  ]}
                  onPress={() => toggleTeam(team.id)}
                  scaleTo={0.97}
                  haptic
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={chipLabel}
                >
                  {isCoach ? (
                    <CoachText variant="caption" {...coachChipTextProps(on, tokens)} numberOfLines={1}>
                      {chipLabel}
                    </CoachText>
                  ) : (
                    <Text
                      style={[defaultStyles.typeText, on && defaultStyles.typeTextActive]}
                      numberOfLines={1}
                    >
                      {chipLabel}
                    </Text>
                  )}
                </PressableSpring>
              );
            })}
          </ScrollView>`;

const premiumTeamsUI = `          {isCoach ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {clubTeams.map((team) => {
                const on = selectedTeamIds.includes(team.id);
                const playerCount = countActivePlayersForTeam(memberships, team.id);
                return (
                  <PressableSpring
                    key={team.id}
                    onPress={() => toggleTeam(team.id)}
                    scaleTo={0.97}
                    haptic
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: tokens.surface,
                      borderWidth: 1,
                      borderColor: on ? tokens.accent : tokens.border,
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: on ? tokens.accent + '22' : tokens.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Icon name="shield" size={20} color={on ? tokens.accent : tokens.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CoachText variant="section" style={{ color: tokens.foreground, fontSize: 16, marginBottom: 2 }}>{team.name}</CoachText>
                      <CoachText variant="caption" muted>{team.category || 'Catégorie'} • {playerCount} joueurs</CoachText>
                    </View>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? tokens.accent : tokens.muted, justifyContent: 'center', alignItems: 'center', backgroundColor: on ? tokens.accent : 'transparent' }}>
                      {on && <Icon name="checkmark" size={16} color={tokens.onAccent} />}
                    </View>
                  </PressableSpring>
                );
              })}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={defaultStyles.typeRow}
            >
              {clubTeams.map((team) => {
                const on = selectedTeamIds.includes(team.id);
                const playerCount = countActivePlayersForTeam(memberships, team.id);
                const chipLabel = teamConvocationChipLabel(team.name, team.category, playerCount);
                return (
                  <PressableSpring
                    key={team.id}
                    style={[defaultStyles.typeChip, on && defaultStyles.typeChipActive]}
                    onPress={() => toggleTeam(team.id)}
                    scaleTo={0.97}
                    haptic
                  >
                    <Text
                      style={[defaultStyles.typeText, on && defaultStyles.typeTextActive]}
                      numberOfLines={1}
                    >
                      {chipLabel}
                    </Text>
                  </PressableSpring>
                );
              })}
            </ScrollView>
          )}`;

file = file.replace(targetTeamsUI, premiumTeamsUI);

fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);
