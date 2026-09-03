const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

const target = `        <PressableSpring
          style={[defaultStyles.submit, submitting && defaultStyles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={defaultStyles.submitText}>Créer et convoquer</Text>
          )}
        </PressableSpring>
      </ScrollView>`;

const replacement = `        <PressableSpring
          style={[defaultStyles.submit, submitting && defaultStyles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={defaultStyles.submitText}>Créer et convoquer</Text>
          )}
        </PressableSpring>
        </>
        )}
      </ScrollView>`;

file = file.replace(target, replacement);
fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);
