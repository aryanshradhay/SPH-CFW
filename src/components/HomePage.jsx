import React, { useRef } from 'react';
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


      <FrameworkFunctions ref={functionsRef} functions={frameworkFunctions} />
    </div>
  );
}
