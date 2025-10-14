import React from 'react';

export default function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="explorer-empty explorer-empty--inline" role="alert">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
