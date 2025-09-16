import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './job-skills-matcher.css';

const navItems = [
  {
    label: 'Career Framework',
    to: '/',
    isActive: (pathname) => pathname === '/',
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
  const location = useLocation();

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-icon" aria-hidden="true">
            SPH
          </span>
          <span className="nav-brand-text">Career Framework</span>
        </Link>
        <nav className="nav-links">
          {navItems.map((item) => {
            const active = item.isActive(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link${active ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
