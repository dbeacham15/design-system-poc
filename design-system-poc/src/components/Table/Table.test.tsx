import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Table } from './Table';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
  { key: 'age', header: 'Age', sortable: true },
];

const data = [
  { name: 'Alice', role: 'Engineer', age: 30 },
  { name: 'Bob', role: 'Designer', age: 25 },
  { name: 'Carol', role: 'Manager', age: 35 },
  { name: 'Dave', role: 'Analyst', age: 28 },
];

describe('Table', () => {
  describe('Basic rendering', () => {
    it('renders column headers', () => {
      render(<Table columns={columns} data={data} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('renders all row data', () => {
      render(<Table columns={columns} data={data} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Carol')).toBeInTheDocument();
      expect(screen.getByText('Dave')).toBeInTheDocument();
    });

    it('renders caption when provided', () => {
      render(<Table columns={columns} data={data} caption="User Table" />);
      expect(screen.getByText('User Table')).toBeInTheDocument();
    });

    it('shows empty state message when data is empty', () => {
      render(<Table columns={columns} data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('has role="table" on the table element', () => {
      render(<Table columns={columns} data={data} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('data-variant attribute', () => {
    it('sets data-variant to default by default', () => {
      render(<Table columns={columns} data={data} />);
      expect(screen.getByTestId('table-container')).toHaveAttribute('data-variant', 'default');
    });

    it('sets data-variant to striped', () => {
      render(<Table columns={columns} data={data} variant="striped" />);
      expect(screen.getByTestId('table-container')).toHaveAttribute('data-variant', 'striped');
    });

    it('sets data-variant to bordered', () => {
      render(<Table columns={columns} data={data} variant="bordered" />);
      expect(screen.getByTestId('table-container')).toHaveAttribute('data-variant', 'bordered');
    });
  });

  describe('data-size attribute', () => {
    it('defaults to md size', () => {
      render(<Table columns={columns} data={data} />);
      expect(screen.getByTestId('table-container')).toHaveAttribute('data-size', 'md');
    });

    it('applies sm size', () => {
      render(<Table columns={columns} data={data} size="sm" />);
      expect(screen.getByTestId('table-container')).toHaveAttribute('data-size', 'sm');
    });

    it('applies lg size', () => {
      render(<Table columns={columns} data={data} size="lg" />);
      expect(screen.getByTestId('table-container')).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('Loading state', () => {
    it('renders spinner when loading is true', () => {
      render(<Table columns={columns} data={data} loading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('does not render table when loading is true', () => {
      render(<Table columns={columns} data={data} loading />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('renders table when loading is false', () => {
      render(<Table columns={columns} data={data} loading={false} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Sortable', () => {
    it('renders sort indicators when sortable is true', () => {
      render(<Table columns={columns} data={data} sortable />);
      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('sorts ascending on first click', () => {
      render(<Table columns={columns} data={data} sortable />);
      const nameHeader = screen.getByText('Name').closest('th') as HTMLElement;
      fireEvent.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    it('sorts descending on second click', () => {
      render(<Table columns={columns} data={data} sortable />);
      const nameHeader = screen.getByText('Name').closest('th') as HTMLElement;
      fireEvent.click(nameHeader);
      fireEvent.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('resets sort on third click', () => {
      render(<Table columns={columns} data={data} sortable />);
      const nameHeader = screen.getByText('Name').closest('th') as HTMLElement;
      fireEvent.click(nameHeader);
      fireEvent.click(nameHeader);
      fireEvent.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('does not make non-sortable columns clickable when sortable is true', () => {
      render(<Table columns={[{ key: 'role', header: 'Role', sortable: false }]} data={data} sortable />);
      const roleHeader = screen.getByText('Role').closest('th') as HTMLElement;
      expect(roleHeader).toHaveAttribute('aria-sort', 'none');
    });
  });

  describe('Selectable', () => {
    it('renders select-all checkbox when selectable', () => {
      render(<Table columns={columns} data={data} selectable />);
      expect(screen.getByLabelText('Select all rows')).toBeInTheDocument();
    });

    it('renders per-row checkboxes when selectable', () => {
      render(<Table columns={columns} data={data} selectable />);
      expect(screen.getByLabelText('Select row 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Select row 2')).toBeInTheDocument();
    });

    it('selects a row on checkbox change', () => {
      render(<Table columns={columns} data={data} selectable />);
      const checkbox = screen.getByLabelText('Select row 1');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('selects all rows with select-all checkbox', () => {
      render(<Table columns={columns} data={data} selectable />);
      const selectAll = screen.getByLabelText('Select all rows');
      fireEvent.click(selectAll);
      expect(screen.getByLabelText('Select row 1')).toBeChecked();
      expect(screen.getByLabelText('Select row 2')).toBeChecked();
    });

    it('deselects all rows when clicking select-all again', () => {
      render(<Table columns={columns} data={data} selectable />);
      const selectAll = screen.getByLabelText('Select all rows');
      fireEvent.click(selectAll);
      fireEvent.click(selectAll);
      expect(screen.getByLabelText('Select row 1')).not.toBeChecked();
    });

    it('rows have aria-selected when selectable', () => {
      render(<Table columns={columns} data={data} selectable />);
      const rows = screen.getAllByRole('row');
      // rows[0] is header, rows[1] is first data row
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Pagination', () => {
    const manyData = Array.from({ length: 12 }, (_, i) => ({
      name: `User ${i + 1}`,
      role: 'Engineer',
      age: 20 + i,
    }));

    it('shows pagination controls when pagination is true and data exceeds page size', () => {
      render(<Table columns={columns} data={manyData} pagination pageSize={5} />);
      expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    });

    it('does not show pagination when data fits in one page', () => {
      render(<Table columns={columns} data={data} pagination pageSize={10} />);
      expect(screen.queryByLabelText('Pagination')).not.toBeInTheDocument();
    });

    it('shows only first page data initially', () => {
      render(<Table columns={columns} data={manyData} pagination pageSize={5} />);
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.queryByText('User 6')).not.toBeInTheDocument();
    });

    it('navigates to next page on Next click', () => {
      render(<Table columns={columns} data={manyData} pagination pageSize={5} />);
      fireEvent.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('User 6')).toBeInTheDocument();
      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
    });

    it('navigates to specific page on page button click', () => {
      render(<Table columns={columns} data={manyData} pagination pageSize={5} />);
      fireEvent.click(screen.getByLabelText('Page 3'));
      expect(screen.getByText('User 11')).toBeInTheDocument();
    });

    it('shows correct page count text', () => {
      render(<Table columns={columns} data={manyData} pagination pageSize={5} />);
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Custom render', () => {
    it('uses custom render function for cell', () => {
      const cols = [
        { key: 'name', header: 'Name', render: (value: unknown) => <strong data-testid="custom-cell">{String(value)}</strong> },
      ];
      render(<Table columns={cols} data={[{ name: 'Alice' }]} />);
      expect(screen.getByTestId('custom-cell')).toBeInTheDocument();
      expect(screen.getByTestId('custom-cell').textContent).toBe('Alice');
    });
  });

  describe('Full width', () => {
    it('renders with full width container', () => {
      render(<Table columns={columns} data={data} fullWidth />);
      const container = screen.getByTestId('table-container');
      expect(container).toBeInTheDocument();
    });
  });
});