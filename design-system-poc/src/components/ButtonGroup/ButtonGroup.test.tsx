import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonGroup } from './ButtonGroup';

const options = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

const optionsWithIcons = [
  { label: 'Day', value: 'day', icon: <span data-testid='icon-node'>D</span> },
  { label: 'Week', value: 'week' },
];

describe('ButtonGroup', () => {
  it('renders all option labels', () => {
    render(<ButtonGroup options={options} />);
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Week')).toBeTruthy();
    expect(screen.getByText('Month')).toBeTruthy();
  });

  it('renders a group role with aria-label', () => {
    render(<ButtonGroup options={options} />);
    const group = screen.getByRole('group');
    expect(group).toBeTruthy();
    expect(group.getAttribute('aria-label')).toBe('button group');
  });

  it('renders the correct number of buttons', () => {
    render(<ButtonGroup options={options} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('sets data-active=true on the selected value', () => {
    render(<ButtonGroup options={options} value='week' />);
    const weekButton = screen.getByText('Week').closest('button');
    expect(weekButton?.getAttribute('data-active')).toBe('true');
  });

  it('sets data-active=false on non-selected values', () => {
    render(<ButtonGroup options={options} value='week' />);
    const dayButton = screen.getByText('Day').closest('button');
    expect(dayButton?.getAttribute('data-active')).toBe('false');
  });

  it('sets aria-pressed on the active button', () => {
    render(<ButtonGroup options={options} value='day' />);
    const dayButton = screen.getByText('Day').closest('button');
    expect(dayButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onChange with the correct value when a button is clicked', () => {
    const handleChange = vi.fn();
    render(<ButtonGroup options={options} onChange={handleChange} />);
    fireEvent.click(screen.getByText('Month'));
    expect(handleChange).toHaveBeenCalledWith('month');
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<ButtonGroup options={options} onChange={handleChange} disabled />);
    fireEvent.click(screen.getByText('Day'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies disabled attribute to buttons when disabled prop is true', () => {
    render(<ButtonGroup options={options} disabled />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('sets data-variant attribute based on variant prop', () => {
    const { rerender } = render(<ButtonGroup options={options} variant='outlined' />);
    expect(screen.getByTestId('button-group').getAttribute('data-variant')).toBe('outlined');
    rerender(<ButtonGroup options={options} variant='filled' />);
    expect(screen.getByTestId('button-group').getAttribute('data-variant')).toBe('filled');
  });

  it('defaults data-variant to outlined', () => {
    render(<ButtonGroup options={options} />);
    expect(screen.getByTestId('button-group').getAttribute('data-variant')).toBe('outlined');
  });

  it('sets data-size attribute based on size prop', () => {
    render(<ButtonGroup options={options} size='lg' />);
    expect(screen.getByTestId('button-group').getAttribute('data-size')).toBe('lg');
  });

  it('defaults data-size to md', () => {
    render(<ButtonGroup options={options} />);
    expect(screen.getByTestId('button-group').getAttribute('data-size')).toBe('md');
  });

  it('renders icons when provided', () => {
    render(<ButtonGroup options={optionsWithIcons} />);
    expect(screen.getByTestId('icon-node')).toBeTruthy();
  });

  it('does not render icon wrapper when no icon is provided', () => {
    render(<ButtonGroup options={options} />);
    expect(screen.queryByTestId('icon-day')).toBeNull();
  });

  it('sets data-value on each button matching option value', () => {
    render(<ButtonGroup options={options} />);
    const dayButton = screen.getByText('Day').closest('button');
    expect(dayButton?.getAttribute('data-value')).toBe('day');
  });

  it('renders with fullWidth prop without crashing', () => {
    render(<ButtonGroup options={options} fullWidth />);
    expect(screen.getByTestId('button-group')).toBeTruthy();
  });
});
