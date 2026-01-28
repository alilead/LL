import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '../../../utils/test-utils'
import { ErrorBoundary } from '../ErrorBoundary'

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal Component</div>
}

describe('ErrorBoundary', () => {
  // Prevent console.error from cluttering test output
  const originalConsoleError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders error screen when child throws error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('shows retry button that reloads the page', () => {
    const originalLocation = window.location
    const reloadMock = vi.fn()
    
    // Mock window.location
    delete window.location
    window.location = {
      ...originalLocation,
      reload: reloadMock
    }

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const retryButton = screen.getByText('Try Again')
    retryButton.click()
    
    expect(reloadMock).toHaveBeenCalled()

    // Restore window.location
    window.location = originalLocation
  })

  it('renders normal content after error is cleared', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal Component')).toBeInTheDocument()
  })

  it('logs error information to console', () => {
    const consoleSpy = vi.spyOn(console, 'error')
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalled()
    const errorCalls = consoleSpy.mock.calls
    
    // React 18'de geliştirme modunda birden fazla hata mesajı olabilir
    const hasErrorMessage = errorCalls.some(call => {
      const messageStr = call.join(' ')
      return messageStr.includes('Test error') && 
             (messageStr.includes('ErrorBoundary caught an error') || 
              messageStr.includes('The above error occurred in'))
    })
    
    expect(hasErrorMessage).toBe(true)
  })
})
