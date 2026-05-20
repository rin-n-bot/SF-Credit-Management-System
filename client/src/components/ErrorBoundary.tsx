import { Component, type ErrorInfo, type ReactNode } from 'react';


// A React error boundary component to catch and display errors 
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}


// Main component that will catch JavaScript errors anywhere
export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Client error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-shell">
          <section className="auth-card">
            <h1>Something went wrong</h1>
            <p>{this.state.message || 'The app encountered an unexpected error.'}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}