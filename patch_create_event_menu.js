const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

// Replace state
file = file.replace(/const \[eventType, setEventType\] = useState<TeamEventType>\('training'\);/, `const [eventType, setEventType] = useState<TeamEventType | null>(null);`);

// For the `onBack` logic, if eventType is not null, back should set it to null. Else, call onBack().
file = file.replace(/icon: 'close',\n            onPress: onBack,/, `icon: eventType ? 'arrow-back' : 'close',
            onPress: eventType ? () => setEventType(null) : onBack,`);

// Similarly for the default styles header:
file = file.replace(/<ScreenHeader title="Nouvel événement" onBack={onBack} centered \/>/, `<ScreenHeader title={eventType ? "Détails" : "Nouvel événement"} onBack={eventType ? () => setEventType(null) : onBack} centered />`);

// Replace the render body in coach mode
const coachRenderMatch = `<CoachChapterScroll>
          <CoachSectionCard
            kicker={t('coach.event.create.typeKicker')}
            title={t('coach.event.create.typeTitle')}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={coachStyles.typeChipScroll}
            >
              {EVENT_TYPES.map((item) => {
                const on = eventType === item.id;
                return (
                  <PressableSpring
                    key={item.id}
                    style={[coachStyles.typeChip, coachChipContainerStyle(on, tokens)]}
                    onPress={() => setEventType(item.id)}
                    scaleTo={0.96}
                    haptic
                  >
                    <CoachText variant="caption" {...coachChipTextProps(on, tokens)}>
                      {item.label}
                    </CoachText>
                  </PressableSpring>
                );
              })}
            </ScrollView>
          </CoachSectionCard>`;

const newCoachRender = `<CoachChapterScroll>
          {!eventType ? (
            <View style={{ gap: 12, padding: 16 }}>
              {EVENT_TYPES.map((item) => (
                <PressableSpring
                  key={item.id}
                  style={{
                    backgroundColor: tokens.surface,
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16
                  }}
                  onPress={() => setEventType(item.id)}
                  scaleTo={0.96}
                  haptic
                >
                  <Icon 
                    name={item.id === 'training' ? 'football' : item.id === 'friendly' ? 'trophy' : item.id === 'detection' ? 'search' : item.id === 'meeting' ? 'people' : 'calendar'} 
                    size={28} 
                    color={tokens.accent} 
                  />
                  <View style={{ flex: 1 }}>
                    <CoachText variant="section" style={{ color: tokens.foreground, fontSize: 18 }}>{item.label}</CoachText>
                    <CoachText variant="caption" muted style={{ marginTop: 4 }}>
                      {item.id === 'training' ? "Organiser une séance sur le terrain" : item.id === 'friendly' ? "Programmer un match ou amical" : item.id === 'detection' ? "Créer une journée de recrutement" : item.id === 'meeting' ? "Planifier une réunion tactique" : "Autre événement"}
                    </CoachText>
                  </View>
                  <Icon name="chevron-forward" size={20} color={tokens.muted} />
                </PressableSpring>
              ))}
            </View>
          ) : (
            <>`;

file = file.replace(coachRenderMatch, newCoachRender);

// Replace the closing tags for the form
const coachRenderEndMatch = `<CoachActionRow
            primary={
              submitting ? t('coach.event.create.submitting') : t('coach.event.create.submit')
            }
            onPrimary={handleSubmit}
            primaryDisabled={!formValid || submitting}
          />
          {submitting ? (
            <ActivityIndicator color={tokens.accent} style={coachStyles.loader} />
          ) : null}
        </CoachChapterScroll>`;

const newCoachRenderEnd = `<CoachActionRow
            primary={
              submitting ? t('coach.event.create.submitting') : t('coach.event.create.submit')
            }
            onPrimary={handleSubmit}
            primaryDisabled={!formValid || submitting}
          />
          {submitting ? (
            <ActivityIndicator color={tokens.accent} style={coachStyles.loader} />
          ) : null}
          </>
          )}
        </CoachChapterScroll>`;

file = file.replace(coachRenderEndMatch, newCoachRenderEnd);


// Now for the default user view
const defaultRenderMatch = `<ScrollView contentContainerStyle={defaultStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={defaultStyles.label}>Type</Text>
        <View style={defaultStyles.typeRow}>
          {EVENT_TYPES.map((item) => (
            <PressableSpring
              key={item.id}
              style={[defaultStyles.typeChip, eventType === item.id && defaultStyles.typeChipActive]}
              onPress={() => setEventType(item.id)}
            >
              <Text
                style={[
                  defaultStyles.typeText,
                  eventType === item.id && defaultStyles.typeTextActive,
                ]}
              >
                {item.label}
              </Text>
            </PressableSpring>
          ))}
        </View>`;

const newDefaultRender = `<ScrollView contentContainerStyle={defaultStyles.content} keyboardShouldPersistTaps="handled">
        {!eventType ? (
           <View style={{ gap: 12 }}>
              {EVENT_TYPES.map((item) => (
                <PressableSpring
                  key={item.id}
                  style={{
                    backgroundColor: c.surface,
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onPress={() => setEventType(item.id)}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{item.label}</Text>
                  <Text style={{ color: c.textMuted }}>➔</Text>
                </PressableSpring>
              ))}
            </View>
        ) : (
          <>`;

file = file.replace(defaultRenderMatch, newDefaultRender);

const defaultRenderEndMatch = `<PressableSpring style={defaultStyles.submit} onPress={handleSubmit} disabled={!formValid || submitting}>
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={[defaultStyles.typeText, { color: c.brandInverse, fontSize: 15 }]}>
              {t('coach.event.create.submit')}
            </Text>
          )}
        </PressableSpring>
      </ScrollView>`;

const newDefaultRenderEnd = `<PressableSpring style={defaultStyles.submit} onPress={handleSubmit} disabled={!formValid || submitting}>
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={[defaultStyles.typeText, { color: c.brandInverse, fontSize: 15 }]}>
              {t('coach.event.create.submit')}
            </Text>
          )}
        </PressableSpring>
        </>
        )}
      </ScrollView>`;

file = file.replace(defaultRenderEndMatch, newDefaultRenderEnd);


fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);
