import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with default variant primary', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button', { name: /primary/i });
    expect(btn).toHaveAttribute('data-variant', 'primary');
  });

  it('renders secondary variant', () => {
    render(<Button variant='secondary'>Secondary</Button>);
    const btn = screen.getByRole('button', { name: /secondary/i });
    expect(btn).toHaveAttribute('data-variant', 'secondary');
  });

  it('renders ghost variant', () => {
    render(<Button variant='ghost'>Ghost</Button>);
    expect(screen.getByRole('button', { name: /ghost/i })).toHaveAttribute('data-variant', 'ghost');
  });

  it('renders destructive variant', () => {
    render(<Button variant='destructive'>Delete</Button>);
    expect(screen.getByRole('button', { name: /delete/i })).toHaveAttribute('data-variant', 'destructive');
  });

  it('renders correct size attribute', () => {
    render(<Button size='lg'>Large</Button>);
    expect(screen.getByRole('button', { name: /large/i })).toHaveAttribute('data-size', 'lg');
  });

  it('applies disabled attribute when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button', { name: /disabled/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows spinner and sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveAttribute('data-loading', 'true');
  });

  it('hides children text when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('does not show spinner when not loading', () => {
    render(<Button>Normal</Button>);
    expect(screen.queryByTestId('button-spinner')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button', { name: /click/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    fireEvent.click(screen.getByRole('button', { name: /disabled/i }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid='left-icon'>L</span>}>With Left</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('button-left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button rightIcon={<span data-testid='right-icon'>R</span>}>With Right</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByTestId('button-right-icon')).toBeInTheDocument();
  });

  it('renders iconOnly mode with data attribute', () => {
    render(<Button iconOnly={<span data-testid='icon-only-content'>X</span>} />);
    expect(screen.getByTestId('icon-only-content')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('data-icon-only', 'true');
  });

  it('does not render left/right icons when iconOnly is set', () => {
    render(<Button iconOnly={<span>X</span>} leftIcon={<span data-testid='left'>L</span>} rightIcon={<span data-testid='right'>R</span>} />);
    expect(screen.queryByTestId('left')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right')).not.toBeInTheDocument();
  });

  it('renders with submit type', () => {
    render(<Button type='submit'>Submit</Button>);
    expect(screen.getByRole('button', { name: /submit/i })).toHaveAttribute('type', 'submit');
  });

  it('renders with default button type', () => {
    render(<Button>Default Type</Button>);
    expect(screen.getByRole('button', { name: /default type/i })).toHaveAttribute('type', 'button');
  });

  it('loading button is disabled', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
