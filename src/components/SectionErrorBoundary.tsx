import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  name: string
  fallback?: ReactNode
  children: ReactNode
}

type State = { error: Error | null }

/**
 * Isolate a section crash so one GSAP/layout bug cannot blank the homepage.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[SectionErrorBoundary:${this.props.name}]`, error, info)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
