import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

const columns = [
  { key: 'name', header: 'Name', sortable: true, width: '180px' },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'department', header: 'Department' },
  { key: 'age', header: 'Age', sortable: true, width: '80px' },
  { key: 'status', header: 'Status', render: (value: unknown) => (
    <span
      style={{
        display: 'inline-block',
        padding: 'var(--space-xs) var(--space-sm)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
        backgroundColor: value === 'Active' ? 'var(--color-status-success)' : 'var(--color-border)',
        color: value === 'Active' ? 'var(--color-text-on-interactive)' : 'var(--color-text-secondary)',
      }}
    >
      {String(value)}
    </span>
  ) },
];

const data = [
  { name: 'Alice Johnson', role: 'Engineer', department: 'Platform', age: 30, status: 'Active' },
  { name: 'Bob Martinez', role: 'Designer', department: 'Product', age: 25, status: 'Active' },
  { name: 'Carol Smith', role: 'Manager', department: 'Operations', age: 35, status: 'Inactive' },
  { name: 'Dave Lee', role: 'Analyst', department: 'Data', age: 28, status: 'Active' },
  { name: 'Eve Turner', role: 'DevOps', department: 'Platform', age: 31, status: 'Active' },
  { name: 'Frank Wright', role: 'QA Engineer', department: 'Quality', age: 27, status: 'Inactive' },
  { name: 'Grace Hall', role: 'Product Manager', department: 'Product', age: 33, status: 'Active' },
  { name: 'Hank Brown', role: 'Data Scientist', department: 'Data', age: 29, status: 'Active' },
];

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'striped', 'bordered'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    sortable: { control: 'boolean' },
    selectable: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    stickyHeader: { control: 'boolean' },
    pagination: { control: 'boolean' },
  },
  args: {
    columns,
    data,
    variant: 'default',
    size: 'md',
    loading: false,
    sortable: false,
    selectable: false,
    fullWidth: true,
    stickyHeader: false,
    pagination: false,
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  name: 'Default',
  args: {
    variant: 'default',
    fullWidth: true,
  },
};

export const Striped: Story = {
  name: 'Striped',
  args: {
    variant: 'striped',
    fullWidth: true,
  },
};

export const Bordered: Story = {
  name: 'Bordered',
  args: {
    variant: 'bordered',
    fullWidth: true,
  },
};

export const SizeSmall: Story = {
  name: 'Size — Small',
  args: {
    size: 'sm',
    fullWidth: true,
  },
};

export const SizeMedium: Story = {
  name: 'Size — Medium',
  args: {
    size: 'md',
    fullWidth: true,
  },
};

export const SizeLarge: Story = {
  name: 'Size — Large',
  args: {
    size: 'lg',
    fullWidth: true,
  },
};

export const Sortable: Story = {
  name: 'Sortable',
  args: {
    sortable: true,
    fullWidth: true,
    caption: 'Click column headers to sort',
  },
};

export const Selectable: Story = {
  name: 'Selectable',
  args: {
    selectable: true,
    fullWidth: true,
  },
};

export const SortableAndSelectable: Story = {
  name: 'Sortable + Selectable',
  args: {
    sortable: true,
    selectable: true,
    fullWidth: true,
    variant: 'striped',
  },
};

export const WithPagination: Story = {
  name: 'With Pagination',
  args: {
    pagination: true,
    pageSize: 3,
    fullWidth: true,
  },
};

export const FullFeatured: Story = {
  name: 'Full Featured',
  args: {
    variant: 'striped',
    size: 'md',
    sortable: true,
    selectable: true,
    pagination: true,
    pageSize: 3,
    fullWidth: true,
    caption: 'Team Members',
  },
};

export const StickyHeader: Story = {
  name: 'Sticky Header',
  args: {
    stickyHeader: true,
    fullWidth: true,
    variant: 'striped',
  },
  decorators: [
    (Story) => (
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    loading: true,
    fullWidth: true,
  },
};

export const EmptyState: Story = {
  name: 'Empty State',
  args: {
    data: [],
    fullWidth: true,
  },
};

export const WithCaption: Story = {
  name: 'With Caption',
  args: {
    caption: 'Team directory — Q4 2024',
    fullWidth: true,
    variant: 'bordered',
  },
};