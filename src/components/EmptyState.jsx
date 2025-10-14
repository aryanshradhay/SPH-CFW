import React from 'react';

export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="explorer-empty" role="status" aria-live="polite">
      {Icon && <Icon className="icon-xl" aria-hidden="true" />}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
