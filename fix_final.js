const fs = require('fs');
let file = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');

// I will just wipe out the entire section and rewrite it simply without checking kind.
const heroTopOld = `<View style={styles.heroTop}>
              <View style={[styles.eventTypeBadge, { backgroundColor: nextEvent.kind === 'match' ? '#F5C51822' : tokens.accent + '22' }]}>
                <Icon name={nextEvent.kind === 'match' ? 'trophy' : 'football'} size={14} color={nextEvent.kind === 'match' ? '#F5C518' : tokens.accent} />
                <CoachText style={[styles.eventTypeText, { color: nextEvent.kind === 'match' ? '#F5C518' : tokens.accent }]}>
                  {nextEvent.kind === 'match' ? 'Match' : 'Entraînement'}
                </CoachText>
              </View>
              <CoachText style={[styles.heroDate, { color: tokens.muted }]}>
                {formatCalendarDate(nextEvent.starts_at)}
              </CoachText>
            </View>`;

const heroTopNew = `<View style={styles.heroTop}>
              <View style={[styles.eventTypeBadge, { backgroundColor: tokens.accent + '22' }]}>
                <Icon name="calendar" size={14} color={tokens.accent} />
                <CoachText style={[styles.eventTypeText, { color: tokens.accent }]}>
                  Prochain Événement
                </CoachText>
              </View>
              <CoachText style={[styles.heroDate, { color: tokens.muted }]}>
                {formatCalendarDate(nextEvent.starts_at)}
              </CoachText>
            </View>`;

file = file.replace(heroTopOld, heroTopNew);

// And for the secondary button
const btnOld = `{nextEvent.kind === 'match' && (
                <Pressable style={[styles.heroBtnSecondary, { borderColor: tokens.border }]}>
                  <CoachText style={[styles.heroBtnText, { color: tokens.foreground }]}>Composition</CoachText>
                </Pressable>
              )}`;

const btnNew = `{nextEvent.title?.toLowerCase().includes('match') && (
                <Pressable style={[styles.heroBtnSecondary, { borderColor: tokens.border }]}>
                  <CoachText style={[styles.heroBtnText, { color: tokens.foreground }]}>Composition</CoachText>
                </Pressable>
              )}`;
              
file = file.replace(btnOld, btnNew);

// Just in case I missed any .kind
file = file.replace(/nextEvent\.kind/g, 'false');

fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', file);
