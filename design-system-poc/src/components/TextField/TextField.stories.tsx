import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    variant: 'outlined',
    size: 'md',
    type: 'text',
    error: false,
    disabled: false,
    loading: false,
    required: false,
    fullWidth: false,
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['outlined', 'filled'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    leftIcon: { control: false },
    rightIcon: { control: false },
    onChange: { action: 'changed' },
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    label: 'Outlined',
    placeholder: 'Outlined input',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Filled',
    placeholder: 'Filled input',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Small',
    placeholder: 'Small input',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Medium',
    placeholder: 'Medium input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large',
    placeholder: 'Large input',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    helperText: 'Must be at least 3 characters.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter email',
    error: true,
    errorText: 'Please enter a valid email address.',
  },
};

export const WithErrorText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    errorText: 'Password is too short.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    placeholder: 'Cannot type here',
    disabled: true,
    value: 'Disabled value',
  },
};

export const Loading: Story = {
  args: {
    label: 'Loading',
    loading: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'This field is required',
    required: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width',
    placeholder: 'Takes full width',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Website',
    type: 'url',
    placeholder: 'https://example.com',
    rightIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'With Both Icons',
    placeholder: 'Type here...',
    leftIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    rightIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true,
    helperText: 'Minimum 8 characters.',
  },
};

export const EmailType: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    required: true,
  },
};
