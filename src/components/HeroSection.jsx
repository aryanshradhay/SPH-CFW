import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Decorative hero used on the primary landing experience. Animations are driven
 * by CSS (see styles/components/hero.css) so the structure can stay lightweight
 * while bespoke motion assets are produced later.
 */
export default function HeroSection({ onExplore = () => {} }) {
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
            compare skill expectations, and tee up personalised EVA Room insights
            that keep your development momentum going.
          </p>
          <div className="hero__actions">
            <Link to="/eva-room" className="button button--primary">
              Enter the Eva Room
            </Link>
            <button
              type="button"
              className="button button--ghost"
              onClick={onExplore}
            >
              Explore SPH functions
            </button>
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
