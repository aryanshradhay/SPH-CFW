import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/main.css';

const navItems = [
  {
    label: 'Explorer',
    to: '/career-explorer',
    isActive: (pathname) => pathname.startsWith('/career-explorer'),
  },
  {
    label: 'Roadmap',
    to: '/roadmap',
    isActive: (pathname) => pathname.startsWith('/roadmap'),
  },
  {
    label: 'Play Lab',
    to: '/play-lab',
    isActive: (pathname) => pathname.startsWith('/play-lab'),
  },
];

export default function SiteHeader() {
  const { pathname } = useLocation();

  return (
    <header className="top-bar" aria-label="Primary navigation">
      <Link to="/" className="top-bar__brand">
        Merck
      </Link>
      <nav className="top-bar__menu">
        {navItems.map(({ label, to, isActive }) => {
          const className = ['top-bar__link'];
          if (isActive(pathname)) className.push('top-bar__link--active');

          return (
            <Link
              key={to}
              to={to}
              className={className.join(' ')}
              aria-current={className.length > 1 ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
