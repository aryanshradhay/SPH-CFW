import React from 'react';

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
            these snapshots as a primer before diving into the Career Explorer
            and Roadmap.
          </p>
        </header>
        <div className="framework-functions__list">
          {functions.map((fn) => (
            <article key={fn.id} className="function-showcase" data-animate="fade-slide">
              <div className="function-showcase__layout">
                <div className="function-showcase__copy">
                  <span className="function-showcase__code badge purple">{fn.code}</span>
                  <h3 className="function-showcase__name">{fn.name}</h3>
                  <p className="function-showcase__about">{fn.about}</p>
                  <div className="function-showcase__focus">
                    <h4 className="function-showcase__focus-title">Focus areas</h4>
                    <ul className="function-showcase__focus-list">
                      {fn.focusAreas.map((area) => (
                        <li key={area.title} className="function-showcase__focus-item">
                          <span className="function-showcase__focus-heading">{area.title}</span>
                          <p className="function-showcase__focus-description">{area.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div
                  className={`function-showcase__visual function-showcase__visual--${fn.animation}`}
                  aria-hidden="true"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
});

export default FrameworkFunctions;
