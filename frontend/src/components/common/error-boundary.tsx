"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

// Aísla piezas visuales (globo 3D, mapa) para que un fallo de WebGL o de red no tumbe la página.
export class ErrorBoundary extends Component<{ fallback: ReactNode; onError?: (error: unknown) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn("[goyn] componente aislado tras un error:", error, info.componentStack);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
