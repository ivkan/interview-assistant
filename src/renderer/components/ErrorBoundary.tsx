import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
              <p className="text-muted-foreground mb-4">
                The application encountered an error. Please check the console for details.
              </p>
              <details className="text-left">
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                  {this.state.error?.message}
                  {'\n\n'}
                  {this.state.error?.stack}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Reload Application
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}