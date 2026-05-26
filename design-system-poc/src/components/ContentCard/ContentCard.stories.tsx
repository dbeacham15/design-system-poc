import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ContentCard } from './ContentCard';

const meta: Meta<typeof ContentCard> = {
  title: 'Components/ContentCard',
  component: ContentCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ContentCard>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    title: 'Getting Started',
    description: 'Learn how to set up your account and explore the key features of the platform.',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    size: 'md',
    title: 'Outlined Card',
    description: 'This card uses an outlined style with a visible border and no shadow.',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    size: 'md',
    title: 'Elevated Card',
    description: 'This card uses an elevated style with a prominent shadow.',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    title: 'Small Card',
    description: 'Compact layout for tight spaces.',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    title: 'Large Card',
    description: 'Generous padding for prominent content sections.',
  },
};

export const WithImage: Story = {
  args: {
    title: 'Mountain Retreat',
    description: 'Discover breathtaking views and peaceful surroundings.',
    imageSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=240&fit=crop',
    imageAlt: 'Snow-capped mountain at sunset',
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Premium Feature',
    description: 'Unlock advanced capabilities with a premium subscription.',
    badge: 'New',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Notifications',
    description: 'Stay up to date with the latest activity in your workspace.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Project Alpha',
    description: 'Track progress and collaborate with your team in real time.',
    footer: (
      <div style={{ display: 'flex', gap: 'var(--space-sm)', width: '100%' }}>
        <button
          style={{
            flex: 1,
            padding: 'var(--space-xs) var(--space-sm)',
            background: 'var(--color-interactive)',
            color: 'var(--color-text-on-interactive)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          View Details
        </button>
        <button
          style={{
            flex: 1,
            padding: 'var(--space-xs) var(--space-sm)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Dismiss
        </button>
      </div>
    ),
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading Content',
    description: 'This content is being fetched from the server.',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    title: 'Unavailable Feature',
    description: 'This feature is currently disabled for your account.',
    disabled: true,
    onClick: () => {},
  },
};

export const Clickable: Story = {
  args: {
    title: 'Interactive Card',
    description: 'Click anywhere on this card to trigger an action.',
    onClick: () => alert('Card clicked!'),
    badge: 'Click me',
  },
};

export const AsLink: Story = {
  args: {
    title: 'Documentation',
    description: 'Visit the official documentation to learn more.',
    href: 'https://example.com',
  },
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  args: {
    title: 'Full Width Card',
    description: 'This card stretches to fill its container width.',
    fullWidth: true,
    variant: 'outlined',
  },
};

export const KitchenSink: Story = {
  args: {
    variant: 'elevated',
    size: 'lg',
    title: 'Full Featured Card',
    description: 'This card demonstrates all available features including image, badge, icon, and footer.',
    imageSrc: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=240&fit=crop',
    imageAlt: 'Laptop with code on screen',
    badge: 'Featured',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    footer: (
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        Last updated 2 hours ago
      </span>
    ),
  },
};
