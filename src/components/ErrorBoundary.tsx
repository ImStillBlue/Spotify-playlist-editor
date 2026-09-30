import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// A render-time crash in React unmounts the whole tree and leaves a blank page.
// This catches it and offers a way back, which matters most on a phone where
// there is no dev console and no obvious reload.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-spotify-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-white mb-2">Something broke</h1>
          <p className="text-spotify-subdued text-sm mb-6">
            The app hit an unexpected error. Reloading usually clears it.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-spotify-green hover:bg-spotify-green-dark text-black font-semibold rounded-full px-6 py-3 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
