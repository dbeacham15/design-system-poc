import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders children content', () => {
    render(<Alert>This is an alert message</Alert>);
    expect(screen.getByText('This is an alert message')).toBeDefined();
  });

  it('has role="alert" for accessibility', () => {
    render(<Alert>Accessible alert</Alert>);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders with default variant "info" as data-variant attribute', () => {
    render(<Alert>Info alert</Alert>);
    const alertEl = screen.getByRole('alert');
    expect(alertEl.getAttribute('data-variant')).toBe('info');
  });

  it('renders with variant "success" as data-variant attribute', () => {
    render(<Alert variant="success">Success alert</Alert>);
    const alertEl = screen.getByRole('alert');
    expect(alertEl.getAttribute('data-variant')).toBe('success');
  });

  it('renders with variant "warning" as data-variant attribute', () => {
    render(<Alert variant="warning">Warning alert</Alert>);
    const alertEl = screen.getByRole('alert');
    expect(alertEl.getAttribute('data-variant')).toBe('warning');
  });

  it('renders with variant "error" as data-variant attribute', () => {
    render(<Alert variant="error">Error alert</Alert>);
    const alertEl = screen.getByRole('alert');
    expect(alertEl.getAttribute('data-variant')).toBe('error');
  });

  it('renders with default size "md" as data-size attribute', () => {
    render(<Alert>Medium alert</Alert>);
    const alertEl = screen.getByRole('alert');
    expect(alertEl.getAttribute('data-size')).toBe('md');
  });

  it('renders with size "sm" as data-size attribute', () => {
    render(<Alert size="sm">Small alert</Alert>);
    const alertEl = screen.getByRole('alert');
    expect(alertEl.getAttribute('data-size')).toBe('sm');
  });

  it('renders with size "lg" as data-size attribute', () => {
    render(<Alert size="lg">Large alert</Alert>);
    const alertEl = screen.getByRole('alert');
    expect(alertEl.getAttribute('data-size')).toBe('lg');
  });

  it('renders title when provided', () => {
    render(<Alert title="Alert Title">Body content</Alert>);
    expect(screen.getByTestId('alert-title')).toBeDefined();
    expect(screen.getByText('Alert Title')).toBeDefined();
  });

  it('does not render title element when title prop is omitted', () => {
    render(<Alert>No title alert</Alert>);
    expect(screen.queryByTestId('alert-title')).toBeNull();
  });

  it('renders icon when provided', () => {
    render(<Alert icon={<span>ℹ️</span>}>With icon</Alert>);
    expect(screen.getByTestId('alert-icon')).toBeDefined();
  });

  it('does not render icon element when icon prop is omitted', () => {
    render(<Alert>No icon</Alert>);
    expect(screen.queryByTestId('alert-icon')).toBeNull();
  });

  it('renders close button when onClose is provided', () => {
    const handleClose = vi.fn();
    render(<Alert onClose={handleClose}>Closable alert</Alert>);
    const closeBtn = screen.getByTestId('alert-close');
    expect(closeBtn).toBeDefined();
    expect(closeBtn.getAttribute('aria-label')).toBe('Close alert');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Alert onClose={handleClose}>Closable alert</Alert>);
    const closeBtn = screen.getByTestId('alert-close');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is omitted', () => {
    render(<Alert>Non-closable alert</Alert>);
    expect(screen.queryByTestId('alert-close')).toBeNull();
  });

  it('renders alert body with children', () => {
    render(<Alert><span data-testid="custom-child">Custom child</span></Alert>);
    expect(screen.getByTestId('alert-body')).toBeDefined();
    expect(screen.getByTestId('custom-child')).toBeDefined();
  });

  it('renders all parts together: icon, title, children, and close button', () => {
    const handleClose = vi.fn();
    render(
      <Alert
        variant="success"
        size="lg"
        title="All Parts"
        icon={<span>✓</span>}
        onClose={handleClose}
      >
        Full alert content
      </Alert>
    );
    expect(screen.getByRole('alert').getAttribute('data-variant')).toBe('success');
    expect(screen.getByTestId('alert-icon')).toBeDefined();
    expect(screen.getByTestId('alert-title')).toBeDefined();
    expect(screen.getByTestId('alert-body')).toBeDefined();
    expect(screen.getByTestId('alert-close')).toBeDefined();
    expect(screen.getByText('Full alert content')).toBeDefined();
  });
});
