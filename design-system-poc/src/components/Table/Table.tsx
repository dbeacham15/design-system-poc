import React, { useState, useMemo, useCallback } from 'react';

export interface Column<T = Record<string, unknown>> {
  key: string;
  header: string;
  render?: (value: unknown, row: T, rowIndex: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  fullWidth?: boolean;
  stickyHeader?: boolean;
  pagination?: boolean;
  pageSize?: number;
  caption?: string;
  rowKey?: (row: T, index: number) => string | number;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

const PAGE_SIZE_DEFAULT = 5;

const sizeTokens: Record<string, { padding: string; fontSize: string }> = {
  sm: { padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--font-size-sm)' },
  md: { padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--font-size-md)' },
  lg: { padding: 'var(--space-md) var(--space-lg)', fontSize: 'var(--font-size-md)' },
};

function Spinner(): React.ReactElement {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--space-xl)',
      }}
    >
      <div
        style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-interactive)',
          borderRadius: 'var(--radius-full)',
          animation: 'table-spin 0.75s linear infinite',
        }}
      />
      <style>{`@keyframes table-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  variant = 'default',
  size = 'md',
  loading = false,
  sortable = false,
  selectable = false,
  fullWidth = false,
  stickyHeader = false,
  pagination = false,
  pageSize = PAGE_SIZE_DEFAULT,
  caption,
  rowKey,
}: TableProps<T>): React.ReactElement {
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { padding, fontSize } = sizeTokens[size] ?? sizeTokens.md;

  const sortedData = useMemo<T[]>(() => {
    if (!sortState.key || !sortState.direction) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortState.key as string];
      const bVal = b[sortState.key as string];
      const aStr = aVal == null ? '' : String(aVal);
      const bStr = bVal == null ? '' : String(bVal);
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
      return sortState.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sortState]);

  const totalPages = pagination ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const pagedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = useCallback(
    (colKey: string) => {
      setSortState((prev) => {
        if (prev.key !== colKey) return { key: colKey, direction: 'asc' };
        if (prev.direction === 'asc') return { key: colKey, direction: 'desc' };
        return { key: null, direction: null };
      });
      setCurrentPage(1);
    },
    []
  );

  const handleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === pagedData.length) return new Set();
      return new Set(pagedData.map((_, i) => (currentPage - 1) * pageSize + i));
    });
  }, [pagedData, currentPage, pageSize]);

  const handleSelectRow = useCallback((globalIndex: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(globalIndex)) next.delete(globalIndex);
      else next.add(globalIndex);
      return next;
    });
  }, []);

  const allSelected = pagedData.length > 0 && pagedData.every((_, i) => selectedRows.has((currentPage - 1) * pageSize + i));

  const containerStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    overflowX: 'auto',
    borderRadius: 'var(--radius-md)',
    border: variant === 'bordered' ? '1px solid var(--color-border)' : 'none',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'inherit',
  };

  const tableStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    borderCollapse: 'collapse',
    fontSize,
    color: 'var(--color-text-primary)',
  };

  const theadStyle: React.CSSProperties = stickyHeader
    ? { position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--color-surface-raised)' }
    : { backgroundColor: 'var(--color-surface-raised)' };

  const getRowStyle = (localIndex: number, globalIndex: number): React.CSSProperties => {
    const isSelected = selectedRows.has(globalIndex);
    const isStripe = variant === 'striped' && localIndex % 2 === 1;
    return {
      backgroundColor: isSelected
        ? 'var(--color-surface-overlay)'
        : isStripe
        ? 'var(--color-surface-raised)'
        : 'var(--color-surface)',
      transition: 'background-color 0.15s ease',
      cursor: selectable ? 'pointer' : 'default',
    };
  };

  const thStyle: React.CSSProperties = {
    padding,
    textAlign: 'left',
    fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'],
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    borderBottom: '2px solid var(--color-border)',
    whiteSpace: 'nowrap',
    ...(variant === 'bordered' ? { borderRight: '1px solid var(--color-border)' } : {}),
  };

  const tdBaseStyle: React.CSSProperties = {
    padding,
    borderBottom: '1px solid var(--color-border)',
    verticalAlign: 'middle',
    ...(variant === 'bordered' ? { borderRight: '1px solid var(--color-border)' } : {}),
  };

  const sortIndicator = (colKey: string): string => {
    if (!sortable) return '';
    if (sortState.key !== colKey) return ' ↕';
    if (sortState.direction === 'asc') return ' ↑';
    if (sortState.direction === 'desc') return ' ↓';
    return ' ↕';
  };

  const colIsSortable = (col: Column<T>): boolean => {
    return sortable && col.sortable !== false;
  };

  return (
    <div
      data-variant={variant}
      data-size={size}
      data-testid="table-container"
      style={containerStyle}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          <table style={tableStyle} aria-label={caption ?? 'Data table'} role="table">
            {caption && <caption style={{ padding, color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' as React.CSSProperties['fontWeight'], textAlign: 'left', captionSide: 'top' }}>{caption}</caption>}
            <thead style={theadStyle}>
              <tr>
                {selectable && (
                  <th style={{ ...thStyle, width: '2.5rem' }}>
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', accentColor: 'var(--color-interactive)' }}
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      ...thStyle,
                      width: col.width,
                      cursor: colIsSortable(col) ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={colIsSortable(col) ? () => handleSort(col.key) : undefined}
                    aria-sort={
                      sortState.key === col.key
                        ? sortState.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    scope="col"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      {col.header}
                      {colIsSortable(col) && (
                        <span
                          aria-hidden="true"
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color:
                              sortState.key === col.key
                                ? 'var(--color-interactive)'
                                : 'var(--color-text-disabled)',
                          }}
                        >
                          {sortIndicator(col.key)}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    style={{ ...tdBaseStyle, textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-xl)' }}
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                pagedData.map((row, localIndex) => {
                  const globalIndex = (currentPage - 1) * pageSize + localIndex;
                  const key = rowKey ? rowKey(row, globalIndex) : globalIndex;
                  return (
                    <tr
                      key={key}
                      style={getRowStyle(localIndex, globalIndex)}
                      data-selected={selectedRows.has(globalIndex) ? 'true' : 'false'}
                      aria-selected={selectable ? selectedRows.has(globalIndex) : undefined}
                      onClick={selectable ? () => handleSelectRow(globalIndex) : undefined}
                    >
                      {selectable && (
                        <td style={tdBaseStyle}>
                          <input
                            type="checkbox"
                            aria-label={`Select row ${globalIndex + 1}`}
                            checked={selectedRows.has(globalIndex)}
                            onChange={() => handleSelectRow(globalIndex)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', accentColor: 'var(--color-interactive)' }}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} style={tdBaseStyle}>
                          {col.render
                            ? col.render(row[col.key], row, globalIndex)
                            : row[col.key] != null
                            ? String(row[col.key])
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {pagination && totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-sm) var(--space-md)',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-raised)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
              aria-label="Pagination"
            >
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  style={{
                    padding: 'var(--space-xs) var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: currentPage === 1 ? 'var(--color-interactive-disabled)' : 'var(--color-interactive)',
                    color: 'var(--color-text-on-interactive)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)' as React.CSSProperties['fontWeight'],
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    style={{
                      padding: 'var(--space-xs) var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: currentPage === page ? 'var(--color-interactive)' : 'var(--color-surface)',
                      color: currentPage === page ? 'var(--color-text-on-interactive)' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: (currentPage === page ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)') as React.CSSProperties['fontWeight'],
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  style={{
                    padding: 'var(--space-xs) var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: currentPage === totalPages ? 'var(--color-interactive-disabled)' : 'var(--color-interactive)',
                    color: 'var(--color-text-on-interactive)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)' as React.CSSProperties['fontWeight'],
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}