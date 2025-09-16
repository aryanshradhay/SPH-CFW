import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Route, Sparkles } from 'lucide-react';
import '../styles/main.css';

const navItems = [
  {
    label: 'Framework',
    to: '/',
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === '/',
  },
  {
    label: 'Roadmap',
    to: '/roadmap',
    icon: Route,
    isActive: (pathname) => pathname.startsWith('/roadmap'),
  },
  {
    label: 'Play Lab',
    to: '/play-lab',
    icon: Sparkles,
    isActive: (pathname) => pathname.startsWith('/play-lab'),
  },
];

export default function SiteHeader() {
  const location = useLocation();

  return (
    <aside className="side-nav" aria-label="Primary navigation">
      <Link to="/" className="side-nav__brand">
        <span>SPH</span>
        <span>Hub</span>
      </Link>
      <nav className="side-nav__menu">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = item.isActive(location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`side-nav__link${active ? ' side-nav__link--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="side-nav__icon" aria-hidden="true">
                <ActiveIcon size={22} strokeWidth={2.25} />
              </span>
              <span className="side-nav__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <Link to="/eva-room" className="side-nav__cta">
        Eva
        <br />
        Room
      </Link>
    </aside>
  );
}
