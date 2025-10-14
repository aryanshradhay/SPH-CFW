import React from 'react';

export default function LoadingState({ message = 'Loading…', inline = false }) {
  const className = inline ? 'explorer-empty explorer-empty--inline' : 'explorer-empty';
  return (
    <div className={className} role="status" aria-live="polite">
      <p>{message}</p>
    </div>
  );
}
