import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

interface RenderOptions {
  route?: string;
  initialEntries?: string[];
}

function render(
  ui: React.ReactElement,
  { route = '/', initialEntries = ['/'] }: RenderOptions = {}
) {
  window.history.pushState({}, 'Test page', route)

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// re-export everything
export * from '@testing-library/react'
// override render method
export { render }
