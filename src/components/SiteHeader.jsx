import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/main.css';

const navItems = [
  { label: 'Home', to: '/', isActive: (pathname) => pathname === '/' },
  {
    label: 'SPH Career Explorer',
    to: '/career-explorer',
    isActive: (pathname) => pathname.startsWith('/career-explorer'),
  },
  {
    label: 'SPH Career Roadmap',
    to: '/roadmap',
    isActive: (pathname) => pathname.startsWith('/roadmap'),
  },
  { label: 'Play Lab', to: '/play-lab', isActive: (pathname) => pathname.startsWith('/play-lab') },
];

export default function SiteHeader() {
  const location = useLocation();

  return (
    <header className="top-bar" aria-label="Primary navigation">
      <Link to="/" className="top-bar__brand">Merck</Link>
      <nav className="top-bar__menu">
        {navItems.map((item) => {
          const active = item.isActive(location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`top-bar__link${active ? ' top-bar__link--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
