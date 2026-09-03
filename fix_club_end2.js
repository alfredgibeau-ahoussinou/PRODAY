const fs = require('fs');
let club = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

const target = `                </ClubText>
              </PressableSpring>
            ))}
            </>
        )} 
      </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}`;

const replacement = `                </ClubText>
              </PressableSpring>
            ))}
          </ScrollView>
        </View>

        </>
        )}
      </ScrollView>
    </View>
  );
}`;

club = club.replace(target, replacement);
fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', club);
