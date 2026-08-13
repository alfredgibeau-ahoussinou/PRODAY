"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = { hasError: boolean };

/** Empêche un plantage WebGL/R3F de faire tomber toute la page. */
export class WebGlErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[WebGlErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(76,139,255,0.12),transparent_65%)]"
            aria-hidden
          />
        )
      );
    }
    return this.props.children;
  }
}
