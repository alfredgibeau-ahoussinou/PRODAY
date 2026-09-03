const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

const targetMembersUI = `<View style={isCoach ? coachStyles.chipRow : defaultStyles.typeRow}>
            {clubMembers.map((m) => {
              const on = selectedUids.includes(m.uid);
              return (
                <PressableSpring
                  key={m.uid}
                  style={[
                    isCoach ? coachStyles.memberChip : defaultStyles.memberChip,
                    isCoach ? coachChipContainerStyle(on, tokens) : on && defaultStyles.memberChipOn,
                  ]}
                  onPress={() =>
                    setSelectedUids((prev) =>
                      on ? prev.filter((id) => id !== m.uid) : [...prev, m.uid],
                    )
                  }
                >
                  {isCoach ? (
                    <CoachText variant="caption" {...coachChipTextProps(on, tokens)}>
                      {m.name}
                    </CoachText>
                  ) : (
                    <Text
                      style={[
                        defaultStyles.memberChipText,
                        on && defaultStyles.memberChipTextOn,
                      ]}
                    >
                      {m.name}
                    </Text>
                  )}
                </PressableSpring>
              );
            })}
          </View>`;

const premiumMembersUI = `          {isCoach ? (
            <View style={{ gap: 8, marginTop: spacing.sm }}>
              {clubMembers.map((m) => {
                const on = selectedUids.includes(m.uid);
                return (
                  <PressableSpring
                    key={m.uid}
                    onPress={() =>
                      setSelectedUids((prev) =>
                        on ? prev.filter((id) => id !== m.uid) : [...prev, m.uid],
                      )
                    }
                    scaleTo={0.98}
                    haptic
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: tokens.surface,
                      borderWidth: 1,
                      borderColor: on ? tokens.accent : tokens.border,
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: on ? tokens.accent + '22' : tokens.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      {m.photo_url ? (
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.muted, overflow: 'hidden' }} />
                      ) : (
                        <CoachText variant="caption" style={{ color: on ? tokens.accent : tokens.muted, fontWeight: '700' }}>
                          {m.name.charAt(0).toUpperCase()}
                        </CoachText>
                      )}
                    </View>
                    <CoachText variant="body" style={{ flex: 1, color: tokens.foreground, fontWeight: on ? '700' : '400' }}>
                      {m.name}
                    </CoachText>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? tokens.accent : tokens.muted, justifyContent: 'center', alignItems: 'center', backgroundColor: on ? tokens.accent : 'transparent' }}>
                      {on && <Icon name="checkmark" size={14} color={tokens.onAccent} />}
                    </View>
                  </PressableSpring>
                );
              })}
            </View>
          ) : (
            <View style={defaultStyles.typeRow}>
              {clubMembers.map((m) => {
                const on = selectedUids.includes(m.uid);
                return (
                  <PressableSpring
                    key={m.uid}
                    style={[defaultStyles.memberChip, on && defaultStyles.memberChipOn]}
                    onPress={() =>
                      setSelectedUids((prev) =>
                        on ? prev.filter((id) => id !== m.uid) : [...prev, m.uid],
                      )
                    }
                  >
                    <Text
                      style={[
                        defaultStyles.memberChipText,
                        on && defaultStyles.memberChipTextOn,
                      ]}
                    >
                      {m.name}
                    </Text>
                  </PressableSpring>
                );
              })}
            </View>
          )}`;

file = file.replace(targetMembersUI, premiumMembersUI);
fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);
