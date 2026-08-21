import React from 'react';

export default function RequesterItemTable({ items = [] }) {
  if (!items.length) {
    return <div className="requester-empty-state">No items available for review.</div>;
  }

  return (
    <div className="requester-table-wrap">
      <table className="requester-items-table compact">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Unit</th>
            <th>Item</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.qty || item.quantity || '-'}</td>
              <td>{item.unit || '-'}</td>
              <td>{item.name || item.particular || item.item || '-'}</td>
              <td>{item.description || '-'}</td>
              <td>{item.status || 'Requested'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
