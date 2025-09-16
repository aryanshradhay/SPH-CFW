import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/main.css';

const navItems = [
  { label: 'Framework', to: '/', isActive: (pathname) => pathname === '/' },
  { label: 'Roadmap', to: '/roadmap', isActive: (pathname) => pathname.startsWith('/roadmap') },
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
      <Link to="/eva-room" className="top-bar__cta">Eva Room</Link>
    </header>
  );
}
