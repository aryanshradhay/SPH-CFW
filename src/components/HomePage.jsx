import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/main.css';
import SiteHeader from './SiteHeader';
import HeroSection from './HeroSection';
import FrameworkFunctions from './FrameworkFunctions';
import { frameworkFunctions } from '../data/frameworkFunctions';

export default function HomePage() {
  const functionsRef = useRef(null);

  const handleExplore = () => {
    if (functionsRef.current) {
      functionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="page solid-bg">
      <SiteHeader />
      <HeroSection
        onExplore={handleExplore}
        primaryCta={{ label: 'Launch Career Explorer', to: '/career-explorer', variant: 'primary' }}
        secondaryCta={{ label: 'Browse SPH functions', onClick: handleExplore, variant: 'ghost' }}
      />

      <div className="container content">
        <section className="card section">
          <h2 className="section-h2">Plan your next move</h2>
          <p className="muted">
            Use the SPH career tools to understand each function, explore roles, and build transition roadmaps.
          </p>
          <div className="row gap-12 wrap" style={{ marginTop: 12 }}>
            <Link to="/career-explorer" className="btn primary">
              Start exploring roles
            </Link>
            <Link to="/roadmap" className="btn ghost">
              Visit the roadmap
            </Link>
            <Link to="/play-lab" className="btn ghost">
              Enter the Play Lab
            </Link>
          </div>
        </section>
      </div>

      <FrameworkFunctions ref={functionsRef} functions={frameworkFunctions} />
    </div>
  );
}
