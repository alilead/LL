import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../utils/test-utils'
import { ErrorScreen } from '../ErrorScreen'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ErrorScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders error message', () => {
    render(<ErrorScreen message="Test error message" />)
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('renders error details when provided', () => {
    render(
      <ErrorScreen
        message="Test error message"
        details="Additional error details"
      />
    )
    expect(screen.getByText('Additional error details')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorScreen message="Test error" onRetry={onRetry} />)
    
    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)
    
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders different icons based on error type', () => {
    const { rerender } = render(
      <ErrorScreen message="Network error" errorType="network" />
    )
    expect(screen.getByTestId('error-icon')).toHaveClass('text-orange-500')

    rerender(<ErrorScreen message="Auth error" errorType="auth" />)
    expect(screen.getByTestId('error-icon')).toHaveClass('text-yellow-500')

    rerender(<ErrorScreen message="Not found error" errorType="notFound" />)
    expect(screen.getByTestId('error-icon')).toHaveClass('text-blue-500')

    rerender(<ErrorScreen message="Server error" errorType="server" />)
    expect(screen.getByTestId('error-icon')).toHaveClass('text-red-500')
  })

  it('has proper accessibility attributes', () => {
    render(<ErrorScreen message="Test error" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('navigates correctly when buttons are clicked', () => {
    render(<ErrorScreen message="Test error" />)
    
    // Test back button
    fireEvent.click(screen.getByText('Back'))
    expect(mockNavigate).toHaveBeenCalledWith(-1)

    // Test search leads button
    fireEvent.click(screen.getByText('Search New Leads'))
    expect(mockNavigate).toHaveBeenCalledWith('/leads/search')

    // Test help button
    fireEvent.click(screen.getByText('Get Help'))
    expect(mockNavigate).toHaveBeenCalledWith('/help')
  })
})
