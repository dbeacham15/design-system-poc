import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentCard } from './ContentCard';

describe('ContentCard', () => {
  describe('basic rendering', () => {
    it('renders the title', () => {
      render(<ContentCard title="My Card" />);
      expect(screen.getByText('My Card')).toBeTruthy();
    });

    it('renders description when provided', () => {
      render(<ContentCard title="Title" description="A helpful description" />);
      expect(screen.getByText('A helpful description')).toBeTruthy();
    });

    it('does not render description when not provided', () => {
      render(<ContentCard title="No Description" />);
      expect(screen.queryByText('A helpful description')).toBeNull();
    });

    it('renders with data-testid content-card', () => {
      render(<ContentCard title="Test" />);
      expect(screen.getByTestId('content-card')).toBeTruthy();
    });

    it('renders image when imageSrc is provided', () => {
      render(<ContentCard title="Card" imageSrc="/test.jpg" imageAlt="Test image" />);
      const img = screen.getByRole('img', { name: 'Test image' });
      expect(img).toBeTruthy();
    });

    it('does not render image when imageSrc is not provided', () => {
      render(<ContentCard title="Card" />);
      expect(screen.queryByRole('img')).toBeNull();
    });
  });

  describe('variants', () => {
    it('sets data-variant="default" by default', () => {
      render(<ContentCard title="Default" />);
      expect(screen.getByTestId('content-card').getAttribute('data-variant')).toBe('default');
    });

    it('sets data-variant="outlined" for outlined variant', () => {
      render(<ContentCard title="Outlined" variant="outlined" />);
      expect(screen.getByTestId('content-card').getAttribute('data-variant')).toBe('outlined');
    });

    it('sets data-variant="elevated" for elevated variant', () => {
      render(<ContentCard title="Elevated" variant="elevated" />);
      expect(screen.getByTestId('content-card').getAttribute('data-variant')).toBe('elevated');
    });
  });

  describe('sizes', () => {
    it('sets data-size="md" by default', () => {
      render(<ContentCard title="Medium" />);
      expect(screen.getByTestId('content-card').getAttribute('data-size')).toBe('md');
    });

    it('sets data-size="sm" for small size', () => {
      render(<ContentCard title="Small" size="sm" />);
      expect(screen.getByTestId('content-card').getAttribute('data-size')).toBe('sm');
    });

    it('sets data-size="lg" for large size', () => {
      render(<ContentCard title="Large" size="lg" />);
      expect(screen.getByTestId('content-card').getAttribute('data-size')).toBe('lg');
    });
  });

  describe('badge', () => {
    it('renders badge text when provided', () => {
      render(<ContentCard title="Card" badge="New" />);
      expect(screen.getByTestId('card-badge')).toBeTruthy();
      expect(screen.getByText('New')).toBeTruthy();
    });

    it('does not render badge when not provided', () => {
      render(<ContentCard title="Card" />);
      expect(screen.queryByTestId('card-badge')).toBeNull();
    });
  });

  describe('icon', () => {
    it('renders icon when provided', () => {
      render(<ContentCard title="Card" icon={<span data-testid="test-icon">★</span>} />);
      expect(screen.getByTestId('card-icon')).toBeTruthy();
      expect(screen.getByTestId('test-icon')).toBeTruthy();
    });

    it('does not render icon container when icon not provided', () => {
      render(<ContentCard title="Card" />);
      expect(screen.queryByTestId('card-icon')).toBeNull();
    });
  });

  describe('footer', () => {
    it('renders footer when provided', () => {
      render(<ContentCard title="Card" footer={<button>Action</button>} />);
      expect(screen.getByTestId('card-footer')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Action' })).toBeTruthy();
    });

    it('does not render footer when not provided', () => {
      render(<ContentCard title="Card" />);
      expect(screen.queryByTestId('card-footer')).toBeNull();
    });
  });

  describe('loading state', () => {
    it('renders loading spinner when loading is true', () => {
      render(<ContentCard title="Loading Card" loading={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    });

    it('spinner has role="status"', () => {
      render(<ContentCard title="Loading Card" loading={true} />);
      expect(screen.getByRole('status')).toBeTruthy();
    });

    it('spinner has aria-label="Loading"', () => {
      render(<ContentCard title="Loading Card" loading={true} />);
      expect(screen.getByLabelText('Loading')).toBeTruthy();
    });

    it('does not render loading spinner when loading is false', () => {
      render(<ContentCard title="Card" loading={false} />);
      expect(screen.queryByTestId('loading-spinner')).toBeNull();
    });

    it('sets aria-busy when loading', () => {
      render(<ContentCard title="Card" loading={true} />);
      const card = screen.getByTestId('content-card');
      expect(card.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('disabled state', () => {
    it('sets aria-disabled when disabled', () => {
      render(<ContentCard title="Disabled Card" disabled={true} />);
      const card = screen.getByTestId('content-card');
      expect(card.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<ContentCard title="Disabled" onClick={handleClick} disabled={true} />);
      const card = screen.getByTestId('content-card');
      fireEvent.click(card);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('interactive behaviour', () => {
    it('calls onClick when card is clicked', () => {
      const handleClick = vi.fn();
      render(<ContentCard title="Clickable" onClick={handleClick} />);
      const card = screen.getByTestId('content-card');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('has role="button" when onClick is provided', () => {
      render(<ContentCard title="Clickable" onClick={() => {}} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('calls onClick on Enter keypress', () => {
      const handleClick = vi.fn();
      render(<ContentCard title="Keyboard" onClick={handleClick} />);
      const card = screen.getByTestId('content-card');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('calls onClick on Space keypress', () => {
      const handleClick = vi.fn();
      render(<ContentCard title="Keyboard" onClick={handleClick} />);
      const card = screen.getByTestId('content-card');
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('renders as anchor tag when href is provided', () => {
      render(<ContentCard title="Link Card" href="https://example.com" />);
      const card = screen.getByTestId('content-card');
      expect(card.tagName.toLowerCase()).toBe('a');
      expect(card.getAttribute('href')).toBe('https://example.com');
    });

    it('does not have role="button" when no onClick or href', () => {
      render(<ContentCard title="Static" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('fullWidth', () => {
    it('still renders when fullWidth is true', () => {
      render(<ContentCard title="Full Width" fullWidth={true} />);
      expect(screen.getByTestId('content-card')).toBeTruthy();
    });
  });
});
