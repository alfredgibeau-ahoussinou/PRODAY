import React from 'react';

type Props = {
  children: React.ReactNode;
  onError: () => void;
};

type State = { hasError: boolean };

/**
 * Filet de sécurité : un crash natif côté lecteur vidéo ne doit pas tuer l’app.
 * Les erreurs JS de l’intro appellent onError pour passer directement à l’app.
 */
export class LaunchVideoErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
