import React from 'react';

/**
 * Grid summarising SPH functions with placeholder animations. Animations use
 * CSS classes so future bespoke artwork can drop in without touching markup.
 */
const FrameworkFunctions = React.forwardRef(function FrameworkFunctions(
  { functions = [] },
  ref,
) {
  return (
    <section
      ref={ref}
      id="sph-functions"
      className="framework-functions"
      aria-labelledby="framework-functions-title"
    >
      <div className="container">
        <header className="framework-functions__header">
          <span className="framework-functions__eyebrow">SPH functions</span>
          <h2 id="framework-functions-title" className="framework-functions__title">
            A connected framework for every skill path
          </h2>
          <p className="framework-functions__subtitle">
            Each function pairs strategic intent with targeted capabilities. Use
            these snapshots as a primer while EVA Room deep-dives give you
            personalised recommendations.
          </p>
        </header>
        <div className="framework-functions__grid">
          {functions.map((fn) => (
            <article key={fn.id} className="framework-functions__card">
              <div
                className={`framework-functions__animation framework-functions__animation--${fn.animation}`}
                aria-hidden="true"
              />
              <div className="framework-functions__name">{fn.name}</div>
              <p className="framework-functions__description">{fn.description}</p>
              <div className="framework-functions__meta">
                <span className="badge purple">{fn.code}</span>
                <span>{fn.focus}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
});

export default FrameworkFunctions;
