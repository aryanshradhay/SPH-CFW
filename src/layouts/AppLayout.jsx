import React from 'react';
import { Outlet } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import '../styles/main.css';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main id="main-content" className="app-shell__main" role="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
