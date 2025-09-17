import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Decorative hero used on the primary landing experience. Animations are driven
 * by CSS (see styles/components/hero.css) so the structure can stay lightweight
 * while bespoke motion assets are produced later.
 */
export default function HeroSection({
  onExplore = () => {},
  primaryCta,
  secondaryCta,
  eyebrow = 'Shape your next move',
  title = 'SPH Career Framework',
  description =
    'Discover how every SPH function contributes to the enterprise mission, compare skill expectations, and plan your development with the SPH career tools.',
  media,
  children,
}) {
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

  const renderMedia = () => {
    if (media) {
      return media;
    }

    return (
      <div className="hero__animation">
        <div className="hero__orbit" />
        <div className="hero__spark" />
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />
        <div className="hero__orb hero__orb--three" />
      </div>
    );
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__content" data-animate="fade-slide">
          {eyebrow && <span className="hero__eyebrow">{eyebrow}</span>}
          <h1 id="hero-title" className="hero__title">
            {title}
          </h1>
          <p className="hero__text">{description}</p>
          <div className="hero__actions">
            {renderAction(primaryAction, 'primary')}
            {renderAction(secondaryAction, 'ghost')}
          </div>
          {children}
        </div>
        <div className="hero__media" aria-hidden="true" data-animate="fade-up">
          {renderMedia()}
        </div>
      </div>
    </section>
  );
}
