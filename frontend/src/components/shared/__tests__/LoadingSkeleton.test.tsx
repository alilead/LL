import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../utils/test-utils'
import { Skeleton, TableRowSkeleton, CardSkeleton } from '../LoadingSkeleton'

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default props', () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('bg-gray-200')
      expect(skeleton).toHaveClass('animate-pulse')
      expect(skeleton).toHaveClass('rounded')
    })

    it('renders with circular variant', () => {
      render(<Skeleton variant="circular" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('rounded-full')
    })

    it('renders with text variant', () => {
      render(<Skeleton variant="text" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('rounded')
      expect(skeleton).toHaveClass('h-4')
    })

    it('applies custom width and height', () => {
      render(<Skeleton width={100} height={50} />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveStyle({ width: '100px', height: '50px' })
    })

    it('applies wave animation', () => {
      render(<Skeleton animation="wave" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('animate-shimmer')
    })

    it('applies no animation when specified', () => {
      render(<Skeleton animation="none" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).not.toHaveClass('animate-pulse')
      expect(skeleton).not.toHaveClass('animate-shimmer')
    })

    it('includes loading text for screen readers', () => {
      render(<Skeleton />)
      expect(screen.getByText('Loading...')).toHaveClass('sr-only')
    })
  })

  describe('TableRowSkeleton', () => {
    it('renders correct number of columns', () => {
      render(<TableRowSkeleton columns={3} />)
      const row = screen.getByTestId('table-row-skeleton')
      expect(row.children).toHaveLength(3)
    })

    it('applies flex layout', () => {
      render(<TableRowSkeleton columns={2} />)
      const row = screen.getByTestId('table-row-skeleton')
      expect(row).toHaveClass('flex')
      expect(row).toHaveClass('space-x-4')
    })
  })

  describe('CardSkeleton', () => {
    it('renders with proper structure', () => {
      render(<CardSkeleton />)
      const card = screen.getByTestId('card-skeleton')
      expect(card).toHaveClass('p-4')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('rounded-lg')
      expect(card.children).toHaveLength(3)
    })

    it('renders skeleton lines with different widths', () => {
      render(<CardSkeleton />)
      const card = screen.getByTestId('card-skeleton')
      const [line1, line2, line3] = Array.from(card.children)
      
      expect(line1).toHaveClass('w-3/4')
      expect(line2).toHaveClass('w-1/2')
      expect(line3).toHaveClass('w-1/4')
    })
  })
})
