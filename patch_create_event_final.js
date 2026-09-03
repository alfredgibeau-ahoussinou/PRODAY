const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

// 1. Change title and onBack in CoachPane
const targetPane = `<CoachPane
        title={t('coach.event.create.title')}
        actions={[
          {
            icon: eventType ? 'arrow-back' : 'close',
            onPress: eventType ? () => setEventType(null) : onBack,
            accessibilityLabel: t('common.close'),
          },
        ]}
      >`;

const newPane = `<CoachPane
        title={eventType === 'training' ? "Nouvel Entraînement" : eventType === 'friendly' ? "Nouveau Match" : eventType === 'detection' ? "Nouvelle Détection" : eventType === 'meeting' ? "Nouvelle Réunion" : t('coach.event.create.title')}
        onBack={eventType ? () => setEventType(null) : onBack}
      >`;

file = file.replace(targetPane, newPane);

// 2. Redesign CoachFormField to look like a premium text input
const targetField = `      style={[
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: 15,
          color: tokens.foreground,
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: tokens.border,
        },
        style,
      ]}`;

const newField = `      style={[
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          fontSize: 16,
          fontWeight: '500',
          color: tokens.foreground,
          backgroundColor: tokens.bg,
          minHeight: multiline ? 100 : 56,
          textAlignVertical: multiline ? 'top' : 'center',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: tokens.border,
          marginBottom: spacing.md,
        },
        style,
      ]}`;

file = file.replace(targetField, newField);

// 3. Remove the dateRow layout in the form so it just stacks normally and remove the extra CoachSettingsGroup wrapper since the inputs have margins
// Wait, I will just remove the CoachSettingsGroup tags and flatten the dateRow to be regular fields, OR make dateRow flex-direction row with gap
const targetDateRow = `<View style={coachStyles.dateRow}>`;
const newDateRow = `<View style={{ flexDirection: 'row', gap: spacing.md }}>`;
file = file.replace(/<View style=\{coachStyles.dateRow\}>/g, newDateRow);

// 4. Remove CoachSettingsGroup tags entirely so fields are directly in the card without extra padding that was breaking them
file = file.replace(/<CoachSettingsGroup>/g, `<View style={{ paddingTop: spacing.sm }}>`);
file = file.replace(/<\/CoachSettingsGroup>/g, `<\/View>`);

// 5. In coachStyles, fix dateField flex to just be flex: 1
file = file.replace(/dateField: \{ flex: 1 \},/g, `dateField: { flex: 1, marginBottom: 0 },`); // to prevent double margin inside the row

// 6. Fix the default title from useEffect that overrides my placeholder
const targetEffect = `  useEffect(() => {
    if (eventType === 'training') {
      setTitle(\`\${t('coach.event.types.training')} · \${teamName}\`);
    } else {
      setTitle('');
    }
  }, [eventType, teamName, t]);`;

const newEffect = `  // Removed default title so the placeholders show cleanly
  useEffect(() => {
    if (eventType && !title) {
       // Only clear if switching type and title is empty or generic
    }
  }, [eventType]);`;

file = file.replace(targetEffect, newEffect);

fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);
