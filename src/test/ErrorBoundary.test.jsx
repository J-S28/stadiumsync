import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabErrorBoundary } from '../shared/ErrorBoundary.jsx';

function Bomb() {
  throw new Error('boom');
}

describe('TabErrorBoundary', () => {
  it('renders a fallback instead of crashing when a child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <TabErrorBoundary resetKey="a">
          <Bomb />
        </TabErrorBoundary>,
      );
      expect(screen.getByRole('alert')).toHaveTextContent(/unexpected error/i);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('renders children normally when there is no error', () => {
    render(
      <TabErrorBoundary resetKey="a">
        <div>All good</div>
      </TabErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('recovers once the active tab changes after a crash', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { rerender } = render(
        <TabErrorBoundary resetKey="a">
          <Bomb />
        </TabErrorBoundary>,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();

      rerender(
        <TabErrorBoundary resetKey="b">
          <div>Recovered</div>
        </TabErrorBoundary>,
      );
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
