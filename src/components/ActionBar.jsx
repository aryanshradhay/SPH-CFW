import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

/**
 * Normalises an action configuration to ensure the ActionBar respects
 * the single-primary / two-secondary discipline.
 */
function normaliseActions(actions) {
  const primary = actions.find((action) => action?.importance === 'primary') || null;
  const secondaries = actions
    .filter((action) => action?.importance === 'secondary')
    .slice(0, 2);

  const overflow = actions
    .filter((action) => {
      if (action?.importance === 'primary') return false;
      if (action?.importance === 'secondary') {
        return secondaries.indexOf(action) === -1;
      }
      return true;
    });

  return { primary, secondaries, overflow };
}

export default function ActionBar({ actions = [] }) {
  const { primary, secondaries, overflow } = useMemo(
    () => normaliseActions(actions),
    [actions],
  );
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleOverflowClick = (action) => {
    setOpen(false);
    if (typeof action?.onClick === 'function') {
      action.onClick();
    }
  };

  if (!primary && secondaries.length === 0 && overflow.length === 0) {
    return null;
  }

  return (
    <div className="actionbar" role="region" aria-label="Key actions">
      {primary && (
        <button
          type="button"
          className="button actionbar__button actionbar__button--primary"
          onClick={primary.onClick}
          disabled={primary.disabled}
          aria-label={primary.label}
        >
          {primary.icon && <span className="actionbar__icon" aria-hidden="true">{primary.icon}</span>}
          <span>{primary.label}</span>
        </button>
      )}

      {secondaries.map((action, index) => (
        <button
          type="button"
          key={action.label || index}
          className="button button--secondary actionbar__button actionbar__button--secondary"
          onClick={action.onClick}
          disabled={action.disabled}
          aria-label={action.label}
        >
          {action.icon && <span className="actionbar__icon" aria-hidden="true">{action.icon}</span>}
          <span>{action.label}</span>
        </button>
      ))}

      {overflow.length > 0 && (
        <div className="actionbar__overflow" ref={menuRef}>
          <button
            type="button"
            className="button button--ghost actionbar__button actionbar__button--overflow"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls="actionbar-overflow"
            onClick={() => setOpen((value) => !value)}
          >
            <MoreHorizontal className="actionbar__icon" aria-hidden="true" />
            <span>More</span>
          </button>
          {open && (
            <ul id="actionbar-overflow" role="menu" className="actionbar__menu">
              {overflow.map((action, index) => (
                <li key={action.label || index} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="actionbar__menu-item"
                    onClick={() => handleOverflowClick(action)}
                    disabled={action.disabled}
                  >
                    {action.icon && <span className="actionbar__icon" aria-hidden="true">{action.icon}</span>}
                    <span>{action.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
