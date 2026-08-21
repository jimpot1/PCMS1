import React from 'react';

export function TableSkeleton({ columns = 6, rows = 5, className = '' }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr className={`table-skeleton-row ${className}`.trim()} key={`skeleton-${rowIndex}`} aria-hidden="true">
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td key={`skeleton-${rowIndex}-${columnIndex}`}>
          <span className={`table-skeleton-line table-skeleton-line-${(columnIndex % 4) + 1}`} />
        </td>
      ))}
    </tr>
  ));
}

export function ListSkeleton({ rows = 5, className = '' }) {
  return (
    <div className={`list-skeleton ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="list-skeleton-row" key={`list-skeleton-${rowIndex}`}>
          <span className="table-skeleton-line table-skeleton-line-1" />
          <span className="table-skeleton-line table-skeleton-line-3" />
          <span className="table-skeleton-line table-skeleton-line-2" />
        </div>
      ))}
    </div>
  );
}
