const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

// Replace generic form fields in CoachSectionCard
const oldFormFields = `<CoachSettingsGroup>
              <CoachFormField
                placeholder={t('coach.event.create.titlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                tokens={tokens}
              />
              <View style={coachStyles.dateRow}>
                <CoachFormField
                  placeholder={t('coach.event.create.datePlaceholder')}
                  value={dateStr}
                  onChangeText={setDateStr}
                  tokens={tokens}
                  style={coachStyles.dateField}
                />
                <PressableSpring
                  style={[coachStyles.todayBtn, coachChipContainerStyle(false, tokens)]}
                  onPress={() => setDateStr(formatFrenchDate(new Date()))}
                  scaleTo={0.96}
                  haptic
                >
                  <CoachText variant="caption" muted>
                    {t('coach.event.create.today')}
                  </CoachText>
                </PressableSpring>
              </View>
              <CoachFormField
                placeholder={t('coach.event.create.timePlaceholder')}
                value={timeStr}
                onChangeText={setTimeStr}
                tokens={tokens}
              />
              <CoachFormField
                placeholder={t('coach.event.create.cityPlaceholder')}
                value={city}
                onChangeText={setCity}
                tokens={tokens}
              />
              <CoachFormField
                placeholder={t('coach.event.create.locationPlaceholder')}
                value={locationLabel}
                onChangeText={setLocationLabel}
                tokens={tokens}
              />
              <CoachFormField
                placeholder={t('coach.event.create.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                tokens={tokens}
                multiline
              />
            </CoachSettingsGroup>`;

const newFormFields = `{eventType === 'training' && (
              <CoachSettingsGroup>
                <CoachFormField
                  placeholder="Thème de la séance (ex: Pressing, Tactique...)"
                  value={title}
                  onChangeText={setTitle}
                  tokens={tokens}
                />
                <View style={coachStyles.dateRow}>
                  <CoachFormField
                    placeholder="Date (JJ/MM/AAAA)"
                    value={dateStr}
                    onChangeText={setDateStr}
                    tokens={tokens}
                    style={coachStyles.dateField}
                  />
                  <PressableSpring
                    style={[coachStyles.todayBtn, coachChipContainerStyle(false, tokens)]}
                    onPress={() => setDateStr(formatFrenchDate(new Date()))}
                    scaleTo={0.96}
                    haptic
                  >
                    <CoachText variant="caption" muted>Aujourd'hui</CoachText>
                  </PressableSpring>
                </View>
                <CoachFormField
                  placeholder="Heure de début (ex: 18:00)"
                  value={timeStr}
                  onChangeText={setTimeStr}
                  tokens={tokens}
                />
                <CoachFormField
                  placeholder="Lieu de l'entraînement (Stade, Terrain...)"
                  value={locationLabel}
                  onChangeText={setLocationLabel}
                  tokens={tokens}
                />
              </CoachSettingsGroup>
            )}

            {(eventType === 'friendly' || eventType === 'other') && (
              <CoachSettingsGroup>
                <CoachFormField
                  placeholder={eventType === 'friendly' ? "Adversaire (ex: US Torcy)" : "Nom de l'événement"}
                  value={title}
                  onChangeText={setTitle}
                  tokens={tokens}
                />
                <View style={coachStyles.dateRow}>
                  <CoachFormField
                    placeholder="Date (JJ/MM/AAAA)"
                    value={dateStr}
                    onChangeText={setDateStr}
                    tokens={tokens}
                    style={coachStyles.dateField}
                  />
                  <CoachFormField
                    placeholder="Heure"
                    value={timeStr}
                    onChangeText={setTimeStr}
                    tokens={tokens}
                  />
                </View>
                <CoachFormField
                  placeholder="Ville du match"
                  value={city}
                  onChangeText={setCity}
                  tokens={tokens}
                />
                <CoachFormField
                  placeholder="Adresse du stade"
                  value={locationLabel}
                  onChangeText={setLocationLabel}
                  tokens={tokens}
                />
                <CoachFormField
                  placeholder="Instructions spécifiques (optionnel)"
                  value={description}
                  onChangeText={setDescription}
                  tokens={tokens}
                  multiline
                />
              </CoachSettingsGroup>
            )}

            {eventType === 'detection' && (
              <CoachSettingsGroup>
                <CoachFormField placeholder="Nom de la détection" value={title} onChangeText={setTitle} tokens={tokens} />
                <View style={coachStyles.dateRow}>
                  <CoachFormField placeholder="Date" value={dateStr} onChangeText={setDateStr} tokens={tokens} style={coachStyles.dateField} />
                  <CoachFormField placeholder="Heure" value={timeStr} onChangeText={setTimeStr} tokens={tokens} />
                </View>
                <CoachFormField placeholder="Lieu" value={locationLabel} onChangeText={setLocationLabel} tokens={tokens} />
                <CoachFormField placeholder="Places maximum (ex: 20)" value={maxParticipants} onChangeText={setMaxParticipants} tokens={tokens} />
              </CoachSettingsGroup>
            )}

            {eventType === 'meeting' && (
              <CoachSettingsGroup>
                <CoachFormField placeholder="Sujet de la réunion" value={title} onChangeText={setTitle} tokens={tokens} />
                <View style={coachStyles.dateRow}>
                  <CoachFormField placeholder="Date" value={dateStr} onChangeText={setDateStr} tokens={tokens} style={coachStyles.dateField} />
                  <CoachFormField placeholder="Heure" value={timeStr} onChangeText={setTimeStr} tokens={tokens} />
                </View>
                <CoachFormField placeholder="Lieu ou Lien Visio" value={locationLabel} onChangeText={setLocationLabel} tokens={tokens} />
              </CoachSettingsGroup>
            )}`;

file = file.replace(oldFormFields, newFormFields);

const oldKicker = `kicker={t('coach.event.create.infoKicker')}
            title={t('coach.event.create.infoTitle')}`;

const newKicker = `kicker={eventType === 'training' ? "SÉANCE" : eventType === 'friendly' ? "MATCH" : eventType === 'detection' ? "DÉTECTION" : "RÉUNION"}
            title={eventType === 'training' ? "Détails de l'entraînement" : eventType === 'friendly' ? "Détails du match" : "Détails de l'événement"}`;

file = file.replace(oldKicker, newKicker);

const oldConvTitle = `kicker={t('coach.event.create.convocationKicker')}
            title={t('coach.event.create.convocationTitle')}`;
const newConvTitle = `kicker="PARTICIPANTS"
            title={eventType === 'training' ? "Groupes convoqués" : "Joueurs convoqués"}`;

file = file.replace(oldConvTitle, newConvTitle);

fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);
