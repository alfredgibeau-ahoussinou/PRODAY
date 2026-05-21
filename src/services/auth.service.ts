import type { User, UserRole } from '../models/User';
import { profileService } from './profile.service';

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  role: UserRole;
}

export const authService = {
  async signUp(input: SignUpInput): Promise<User> {
    // [FIREBASE] const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
    const uid = `uid_${Date.now()}`;
    return profileService.createProfile(
      uid,
      input.email,
      input.role,
      input.display_name
    );
  },

  async signIn(_email: string, _password: string): Promise<{ uid: string }> {
    // [FIREBASE] const cred = await signInWithEmailAndPassword(auth, email, password);
    return { uid: 'placeholder' };
  },

  async signOut(): Promise<void> {
    // [FIREBASE] await firebaseSignOut(auth);
  },
};
