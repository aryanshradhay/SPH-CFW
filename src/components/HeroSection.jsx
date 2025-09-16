import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Decorative hero used on the primary landing experience. Animations are driven
 * by CSS (see styles/components/hero.css) so the structure can stay lightweight
 * while bespoke motion assets are produced later.
 */
export default function HeroSection({ onExplore = () => {}, primaryCta, secondaryCta }) {
  const primaryAction =
    primaryCta || { label: 'Explore SPH functions', onClick: onExplore, variant: 'primary' };
  const secondaryAction = secondaryCta || null;

  const renderAction = (action, fallbackVariant = 'ghost') => {
    if (!action) return null;
    const { label, to, onClick, variant } = action;
    const className = `button button--${variant || fallbackVariant}`;

    if (to) {
      return (
        <Link to={to} className={className}>
          {label}
        </Link>
      );
    }

    return (
      <button type="button" className={className} onClick={onClick || onExplore}>
        {label}
      </button>
    );
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__content">
          <span className="hero__eyebrow">Shape your next move</span>
          <h1 id="hero-title" className="hero__title">
            SPH Career Framework
          </h1>
          <p className="hero__text">
            Discover how every SPH function contributes to the enterprise mission,
            compare skill expectations, and plan your development with the SPH
            career tools.
          </p>
          <div className="hero__actions">
            {renderAction(primaryAction, 'primary')}
            {renderAction(secondaryAction, 'ghost')}
          </div>
        </div>
        <div className="hero__media" aria-hidden="true">
          <div className="hero__animation">
            <div className="hero__orbit" />
            <div className="hero__spark" />
            <div className="hero__orb hero__orb--one" />
            <div className="hero__orb hero__orb--two" />
            <div className="hero__orb hero__orb--three" />
          </div>
        </div>
      </div>
    </section>
  );
}
