import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from './ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ToggleSwitch checked={false} onChange={() => {}} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with role="switch"', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('reflects aria-checked=false when unchecked', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects aria-checked=true when checked', () => {
    render(<ToggleSwitch checked={true} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value on click', () => {
    const handleChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked and clicked', () => {
    const handleChange = vi.fn();
    render(<ToggleSwitch checked={true} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={handleChange} disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when loading', () => {
    const handleChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={handleChange} loading />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders label text when provided', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} label="Enable notifications" />);
    expect(screen.getByText('Enable notifications')).toBeTruthy();
  });

  it('does not render label when not provided', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.queryByText('Enable notifications')).toBeNull();
  });

  it('uses aria-label for accessibility when label prop is provided', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} label="Dark mode" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Dark mode');
  });

  it('sets data-variant attribute correctly', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} variant="success" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-variant', 'success');
  });

  it('defaults to data-variant="primary"', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-variant', 'primary');
  });

  it('sets data-size attribute correctly', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} size="lg" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'lg');
  });

  it('defaults to data-size="md"', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'md');
  });

  it('sets data-checked attribute when checked', () => {
    render(<ToggleSwitch checked={true} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-checked', 'true');
  });

  it('sets data-disabled attribute when disabled', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} disabled />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-disabled', 'true');
  });

  it('does not set data-disabled when not disabled', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).not.toHaveAttribute('data-disabled');
  });

  it('shows spinner when loading', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} loading />);
    expect(screen.getByTestId('toggle-spinner')).toBeTruthy();
  });

  it('does not show spinner when not loading', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.queryByTestId('toggle-spinner')).toBeNull();
  });

  it('sets data-loading attribute when loading', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} loading />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-loading', 'true');
  });

  it('toggles on Space key press', () => {
    const handleChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={handleChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('toggles on Enter key press', () => {
    const handleChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={handleChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle on other key presses', () => {
    const handleChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={handleChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { key: 'Tab' });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('sets aria-disabled when disabled', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} disabled />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders danger variant with correct data-variant', () => {
    render(<ToggleSwitch checked={true} onChange={() => {}} variant="danger" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-variant', 'danger');
  });
});
