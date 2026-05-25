import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children content', () => {
    render(
      <Tooltip content="Hello tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeTruthy();
  });

  it('does not show tooltip by default', () => {
    render(
      <Tooltip content="Hidden tooltip">
        <span>Target</span>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip on mouse enter after delay', async () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Target</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain('Tooltip content');
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Goodbye">
        <button>Target</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip on focus', () => {
    render(
      <Tooltip content="Focus tooltip">
        <button>Focus me</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.focus(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('hides tooltip on blur', () => {
    render(
      <Tooltip content="Blur tooltip">
        <button>Focus me</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.focus(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.blur(wrapper);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('does not show tooltip when disabled', () => {
    render(
      <Tooltip content="Disabled tooltip" disabled>
        <button>Target</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('sets data-disabled attribute when disabled', () => {
    render(
      <Tooltip content="Disabled" disabled>
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-disabled')).toBe('true');
  });

  it('sets data-variant attribute for dark variant', () => {
    render(
      <Tooltip content="Dark" variant="dark">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-variant')).toBe('dark');
  });

  it('sets data-variant attribute for light variant', () => {
    render(
      <Tooltip content="Light" variant="light">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-variant')).toBe('light');
  });

  it('sets data-placement attribute', () => {
    render(
      <Tooltip content="Bottom placement" placement="bottom">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-placement')).toBe('bottom');
  });

  it('sets data-size attribute', () => {
    render(
      <Tooltip content="Large size" size="lg">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-size')).toBe('lg');
  });

  it('sets aria-label on tooltip box equal to content', () => {
    render(
      <Tooltip content="Accessible label">
        <button>Target</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.getAttribute('aria-label')).toBe('Accessible label');
  });

  it('renders arrow by default', () => {
    render(
      <Tooltip content="Arrow tooltip">
        <button>Target</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('tooltip-arrow')).toBeTruthy();
  });

  it('does not render arrow when showArrow is false', () => {
    render(
      <Tooltip content="No arrow" showArrow={false}>
        <button>Target</button>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId('tooltip-arrow')).toBeNull();
  });

  it('uses default variant dark when no variant prop provided', () => {
    render(
      <Tooltip content="Default variant">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-variant')).toBe('dark');
  });

  it('uses default placement top when no placement prop provided', () => {
    render(
      <Tooltip content="Default placement">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-placement')).toBe('top');
  });

  it('uses default size md when no size prop provided', () => {
    render(
      <Tooltip content="Default size">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-size')).toBe('md');
  });
});
