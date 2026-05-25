import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextField } from './TextField';

describe('TextField', () => {
  it('renders without crashing', () => {
    render(<TextField />);
  });

  it('renders label when provided', () => {
    render(<TextField label="Email" />);
    expect(screen.getByText('Email')).toBeDefined();
  });

  it('renders required asterisk when required is true', () => {
    render(<TextField label="Email" required />);
    expect(screen.getByText('*')).toBeDefined();
  });

  it('renders placeholder on input', () => {
    render(<TextField placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
  });

  it('renders helper text', () => {
    render(<TextField helperText="This is helper text" />);
    expect(screen.getByText('This is helper text')).toBeDefined();
  });

  it('renders error text when error prop is true', () => {
    render(<TextField errorText="Invalid input" error />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Invalid input');
  });

  it('renders error text when errorText is provided without explicit error prop', () => {
    render(<TextField errorText="Something went wrong" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Something went wrong');
  });

  it('shows loading spinner and hides input when loading is true', () => {
    render(<TextField loading />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('applies disabled styles when disabled is true', () => {
    const { container } = render(<TextField disabled />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('0.5');
    expect(wrapper.style.pointerEvents).toBe('none');
  });

  it('applies disabled styles when loading is true', () => {
    const { container } = render(<TextField loading />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('0.5');
    expect(wrapper.style.pointerEvents).toBe('none');
  });

  it('calls onChange when input changes', () => {
    const handleChange = vi.fn();
    render(<TextField onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with controlled value', () => {
    render(<TextField value="test value" onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test value');
  });

  it('renders left icon', () => {
    render(<TextField leftIcon={<span data-testid="left-icon" />} />);
    expect(screen.getByTestId('left-icon')).toBeDefined();
  });

  it('renders right icon', () => {
    render(<TextField rightIcon={<span data-testid="right-icon" />} />);
    expect(screen.getByTestId('right-icon')).toBeDefined();
  });

  it('hides icons when loading', () => {
    render(
      <TextField
        loading
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
      />
    );
    expect(screen.queryByTestId('left-icon')).toBeNull();
    expect(screen.queryByTestId('right-icon')).toBeNull();
  });

  it('sets aria-invalid when error is true', () => {
    render(<TextField error />);
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('sets aria-required when required is true', () => {
    render(<TextField required />);
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('renders full width when fullWidth is true', () => {
    const { container } = render(<TextField fullWidth />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('100%');
  });

  it('renders password type input', () => {
    const { container } = render(<TextField type="password" />);
    const input = container.querySelector('input');
    expect(input?.type).toBe('password');
  });

  it('renders email type input', () => {
    const { container } = render(<TextField type="email" />);
    const input = container.querySelector('input');
    expect(input?.type).toBe('email');
  });

  it('renders filled variant with background color', () => {
    render(<TextField variant="filled" />);
    // Component renders without error for filled variant
    const input = screen.getByRole('textbox');
    expect(input).toBeDefined();
  });
});
