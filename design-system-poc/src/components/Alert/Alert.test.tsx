import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders with default props', () => {
    render(<Alert />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.getByTestId('alert-title').textContent).toBe('Alert');
    expect(screen.getByTestId('alert-byline').textContent).toBe(
      'This is a secondary line of supporting text.'
    );
  });

  it('renders with a custom title', () => {
    render(<Alert title="Custom Title" />);
    expect(screen.getByTestId('alert-title').textContent).toBe('Custom Title');
  });

  it('renders with a custom byline', () => {
    render(<Alert byline="Custom byline text" />);
    expect(screen.getByTestId('alert-byline').textContent).toBe('Custom byline text');
  });

  it('does not render byline when byline is empty string', () => {
    render(<Alert byline="" />);
    expect(screen.queryByTestId('alert-byline')).toBeNull();
  });

  it('sets data-variant attribute correctly for info', () => {
    render(<Alert variant="info" />);
    expect(screen.getByRole('alert').getAttribute('data-variant')).toBe('info');
  });

  it('sets data-variant attribute correctly for success', () => {
    render(<Alert variant="success" />);
    expect(screen.getByRole('alert').getAttribute('data-variant')).toBe('success');
  });

  it('sets data-variant attribute correctly for warning', () => {
    render(<Alert variant="warning" />);
    expect(screen.getByRole('alert').getAttribute('data-variant')).toBe('warning');
  });

  it('sets data-variant attribute correctly for error', () => {
    render(<Alert variant="error" />);
    expect(screen.getByRole('alert').getAttribute('data-variant')).toBe('error');
  });

  it('sets data-size attribute correctly', () => {
    render(<Alert size="lg" />);
    expect(screen.getByRole('alert').getAttribute('data-size')).toBe('lg');
  });

  it('sets data-size attribute to md by default', () => {
    render(<Alert />);
    expect(screen.getByRole('alert').getAttribute('data-size')).toBe('md');
  });

  it('renders the close button when onClose is provided', () => {
    const handleClose = vi.fn();
    render(<Alert onClose={handleClose} />);
    const closeBtn = screen.getByTestId('alert-close');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe('Close alert');
  });

  it('does not render close button when onClose is not provided', () => {
    render(<Alert />);
    expect(screen.queryByTestId('alert-close')).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Alert onClose={handleClose} />);
    fireEvent.click(screen.getByTestId('alert-close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders the icon when provided', () => {
    render(<Alert icon={<span data-testid="custom-icon">!</span>} />);
    expect(screen.getByTestId('alert-icon')).toBeTruthy();
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('does not render icon wrapper when icon is not provided', () => {
    render(<Alert />);
    expect(screen.queryByTestId('alert-icon')).toBeNull();
  });

  it('has role="alert" for accessibility', () => {
    render(<Alert />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('renders fullWidth without error', () => {
    render(<Alert fullWidth />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
