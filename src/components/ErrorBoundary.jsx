import React from "react";

/**
 * Generic React error boundary. If a child throws during render, the boundary
 * renders `fallback` instead, so one broken subtree can never blank the page.
 * Defaults to rendering nothing so a broken section simply disappears while
 * the rest of the page keeps working.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}