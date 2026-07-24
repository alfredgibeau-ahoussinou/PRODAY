import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Empêche un crash JS non géré d’écran noir immédiat.
 * Affiche un message simple + bouton pour réessayer.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap} accessibilityRole="alert">
          <Text style={styles.title}>ProDay a rencontré un problème</Text>
          <Text style={styles.body}>
            L’app n’a pas pu démarrer correctement. Réessayez. Si ça continue, réinstallez
            la dernière version.
          </Text>
          <Text style={styles.detail} numberOfLines={6}>
            {this.state.error.message}
          </Text>
          <Pressable style={styles.btn} onPress={this.retry} accessibilityRole="button">
            <Text style={styles.btnText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
  },
  detail: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 8,
  },
  btn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#0054F0',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
