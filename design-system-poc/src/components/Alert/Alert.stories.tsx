import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    title: { control: 'text' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: 'info',
    size: 'md',
    title: 'Information',
    children: 'This is an informational alert message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    size: 'md',
    title: 'Success',
    children: 'Your operation completed successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    size: 'md',
    title: 'Warning',
    children: 'Please review this warning before proceeding.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    size: 'md',
    title: 'Error',
    children: 'An error occurred. Please try again later.',
  },
};

export const SmallSize: Story = {
  args: {
    variant: 'info',
    size: 'sm',
    title: 'Small Alert',
    children: 'This is a small alert.',
  },
};

export const LargeSize: Story = {
  args: {
    variant: 'info',
    size: 'lg',
    title: 'Large Alert',
    children: 'This is a large alert.',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'info',
    size: 'md',
    title: 'Alert with Icon',
    icon: '🔔',
    children: 'This alert includes an icon.',
  },
};

export const WithCloseButton: Story = {
  args: {
    variant: 'warning',
    size: 'md',
    title: 'Closable Alert',
    children: 'Click the X button to dismiss this alert.',
    onClose: () => alert('Alert closed!'),
  },
};

export const NoTitle: Story = {
  args: {
    variant: 'info',
    size: 'md',
    children: 'This alert has no title, just the body content.',
  },
};

export const FullWidth: Story = {
  args: {
    variant: 'success',
    size: 'md',
    title: 'Full Width Alert',
    fullWidth: true,
    children: 'This alert spans the full width of its container.',
  },
};

export const AllFeatures: Story = {
  args: {
    variant: 'error',
    size: 'lg',
    title: 'All Features Enabled',
    icon: '🚨',
    fullWidth: true,
    onClose: () => alert('Closed!'),
    children: 'This alert has all features enabled: icon, title, close button, and full width.',
  },
};
