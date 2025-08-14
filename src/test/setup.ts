// Extend Vitest's expect with jest-dom matchers for DOM-related tests.
import '@testing-library/jest-dom'

// Optional: minimal browser API shims used in components/tests.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

