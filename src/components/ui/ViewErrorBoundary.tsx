import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  viewName: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ViewErrorBoundary] Crash in "${this.props.viewName}":`, error, info);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          {this.props.viewName} ran into a problem
        </h2>
        <p className="text-sm text-gray-500 mb-4 max-w-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={this.reset}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
}
