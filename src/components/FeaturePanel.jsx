import React, { useEffect, useMemo, useState } from 'react';
import { Compass, MapPin, Sparkles, Target, TrendingUp } from 'lucide-react';
import ActionBar from './ActionBar';

const MODE_COPY = {
  A: {
    eyebrow: 'Career Explorer',
    title: 'Discover your next role',
    subtitle: 'Spot adjacent SPH roles, compare skill overlap, and explore detailed insights.',
    helper: 'Saving your current role sharpens similarity scores and unlocks richer suggestions.',
    primaryLabel: 'Browse matches',
    secondaryLabel: 'Open roadmap planner',
    primaryIcon: <Compass className="icon-sm" aria-hidden="true" />,
    secondaryIcon: <Sparkles className="icon-sm" aria-hidden="true" />,
    emptyStatusTitle: 'Personalise your explorer',
    emptyStatusBody: 'Save a starting role to unlock curated moves, filtered lists, and roadmap shortcuts.',
  },
  B: {
    eyebrow: 'Roadmap Planner',
    title: 'Plan your next move',
    subtitle: 'Compare target roles, expose skill gaps, and build a confident growth path.',
    helper: 'Lock in a starting role so the planner can prefill skills, benchmarks, and recommendations.',
    primaryLabel: 'Start planning',
    secondaryLabel: 'Review saved role',
    primaryIcon: <TrendingUp className="icon-sm" aria-hidden="true" />,
    secondaryIcon: <MapPin className="icon-sm" aria-hidden="true" />,
    emptyStatusTitle: 'Ready to personalise?',
    emptyStatusBody: 'Choose the role you hold today so we can highlight the fastest, most relevant moves.',
  },
};

function buildMetrics({ mode, jobs, divisions, recommendationsCount, personalisationEnabled }) {
  if (!jobs?.length && !divisions?.length) return [];

  const metrics = [
    { label: 'Roles mapped', value: jobs?.length ?? '-', tone: 'purple' },
    { label: 'Functions covered', value: divisions?.length ?? '-', tone: 'yellow' },
  ];

  if (mode === 'A' && personalisationEnabled) {
    metrics.push({
      label: 'Personalised moves',
      value: typeof recommendationsCount === 'number' ? recommendationsCount : '-',
      tone: 'green',
    });
  } else if (mode === 'B') {
    metrics.push({
      label: 'Planner-ready roles',
      value: typeof recommendationsCount === 'number' ? recommendationsCount : '-',
      tone: 'green',
    });
  }

  return metrics;
}

const DEFAULT_PERMISSIONS = {
  allowRecommendations: true,
  allowPlanner: true,
};

export default function FeaturePanel({
  mode = 'A',
  data = {},
  permissions = DEFAULT_PERMISSIONS,
  onPrimary,
  onSecondary,
  personalisationEnabled = true,
}) {
  const {
    jobs = [],
    divisions = [],
    ready = false,
    myPosition = null,
    recommendationsCount = null,
    onSaveMyPosition,
    secondaryActions = [],
    overflowActions = [],
  } = data;

  const copy = MODE_COPY[mode] ?? MODE_COPY.A;
  const [division, setDivision] = useState(myPosition?.division || 'all');
  const [roleTitle, setRoleTitle] = useState(myPosition?.title || '');

  useEffect(() => {
    if (!personalisationEnabled) return;
    if (myPosition) {
      setDivision(myPosition.division || 'all');
      setRoleTitle(myPosition.title || '');
    } else {
      setRoleTitle('');
    }
  }, [personalisationEnabled, myPosition]);

  const sortedDivisions = useMemo(
    () => (personalisationEnabled ? ['all', ...divisions].filter(Boolean) : []),
    [personalisationEnabled, divisions],
  );

  const availableRoles = useMemo(() => {
    if (!personalisationEnabled) return [];
    const scoped =
      division === 'all'
        ? jobs
        : jobs.filter((job) => job.division === division);
    return [...scoped].sort((a, b) => a.title.localeCompare(b.title));
  }, [personalisationEnabled, division, jobs]);

  useEffect(() => {
    if (!personalisationEnabled) return;
    if (!availableRoles.find((role) => role.title === roleTitle)) {
      setRoleTitle('');
    }
  }, [personalisationEnabled, availableRoles, roleTitle]);

  const metrics = useMemo(
    () =>
      data.metrics ||
      buildMetrics({ mode, jobs, divisions, recommendationsCount, personalisationEnabled }),
    [data.metrics, mode, jobs, divisions, recommendationsCount, personalisationEnabled],
  );

  const actionItems = useMemo(() => {
    const items = [];
    if (onPrimary) {
      items.push({
        label: copy.primaryLabel,
        onClick: onPrimary,
        importance: 'primary',
        icon: copy.primaryIcon,
      });
    }

    if (onSecondary) {
      items.push({
        label: copy.secondaryLabel,
        onClick: onSecondary,
        importance: 'secondary',
        icon: copy.secondaryIcon,
        disabled: permissions?.allowRecommendations === false || (!ready && mode === 'A'),
      });
    }

    secondaryActions.forEach((action) => {
      if (!action) return;
      items.push({
        ...action,
        importance: action.importance || 'secondary',
      });
    });

    overflowActions.forEach((action) => {
      if (!action) return;
      items.push({
        ...action,
        importance: action.importance || 'overflow',
      });
    });

    return items;
  }, [copy, onPrimary, onSecondary, secondaryActions, overflowActions, ready, mode, permissions]);

  const handleSaveRole = (event) => {
    event.preventDefault();
    if (!personalisationEnabled || !roleTitle || typeof onSaveMyPosition !== 'function') return;
    onSaveMyPosition(roleTitle);
  };

  const canSave =
    personalisationEnabled &&
    Boolean(onSaveMyPosition && roleTitle && (!myPosition || myPosition.title !== roleTitle));

  return (
    <section className={`feature-panel feature-panel--${mode === 'A' ? 'explore' : 'plan'}`} data-mode={mode}>
      <header className="feature-panel__header">
        <div className="feature-panel__heading">
          <span className="feature-panel__eyebrow">{copy.eyebrow}</span>
          <h1 className="feature-panel__title">{copy.title}</h1>
          <p className="feature-panel__subtitle">{copy.subtitle}</p>
        </div>
        {metrics.length > 0 && (
          <div className="feature-panel__metrics" role="presentation">
            {metrics.map((metric) => (
              <div key={metric.label} className="feature-panel__metric">
                <span className={`feature-panel__metric-label ${metric.tone || ''}`}>{metric.label}</span>
                <span className="feature-panel__metric-value">{metric.value}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      <ActionBar actions={actionItems} />

      <div className="feature-panel__grid">
        {mode === 'B' ? (
          <div className="feature-panel__card feature-panel__card--message">
            <div className="feature-panel__status">
              <span className="feature-panel__status-label">Roadmap planner</span>
              <p className="feature-panel__status-value feature-panel__status-value--muted">
                Configure the planner below to compare roles and surface your transition roadmap.
              </p>
            </div>
          </div>
        ) : personalisationEnabled ? (
          <div className="feature-panel__card">
            <div className="feature-panel__status">
              {myPosition ? (
                <>
                  <span className="feature-panel__status-label">Saved starting role</span>
                  <p className="feature-panel__status-value">{myPosition.title}</p>
                  {myPosition.division && (
                    <span className="feature-panel__status-meta">
                      <MapPin className="icon-xs" aria-hidden="true" />
                      {myPosition.division}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="feature-panel__status-label">{copy.emptyStatusTitle}</span>
                  <p className="feature-panel__status-value feature-panel__status-value--muted">
                    {copy.emptyStatusBody}
                  </p>
                </>
              )}
            </div>

            <form className="feature-panel__form" onSubmit={handleSaveRole}>
              <div className="feature-panel__field">
                <label className="feature-panel__label" htmlFor={`feature-panel-division-${mode}`}>
                  Function
                </label>
                <div className="feature-panel__select-wrapper">
                  <select
                    id={`feature-panel-division-${mode}`}
                    className="feature-panel__select"
                    value={division}
                    onChange={(event) => setDivision(event.target.value)}
                  >
                    {sortedDivisions.map((item) => (
                      <option key={item} value={item}>
                        {item === 'all' ? 'All functions' : item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="feature-panel__field">
                <label className="feature-panel__label" htmlFor={`feature-panel-role-${mode}`}>
                  Role
                </label>
                <div className="feature-panel__select-wrapper">
                  <select
                    id={`feature-panel-role-${mode}`}
                    className="feature-panel__select"
                    value={roleTitle}
                    onChange={(event) => setRoleTitle(event.target.value)}
                    disabled={!availableRoles.length}
                  >
                    <option value="">Select role...</option>
                    {availableRoles.map((role) => (
                      <option key={role.id || role.title} value={role.title}>
                        {role.title} {role.division ? `— ${role.division}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="feature-panel__helper">
                {copy.helper}
              </p>

              <div className="feature-panel__actions">
                <button type="submit" className="button button--secondary" disabled={!canSave}>
                  <Target className="icon-xs" aria-hidden="true" />
                  <span>Save as my role</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="feature-panel__card feature-panel__card--message">
            <div className="feature-panel__status">
              <span className="feature-panel__status-label">Dive straight into exploration</span>
              <p className="feature-panel__status-value feature-panel__status-value--muted">
                Use the filters below to browse roles and open full insights without saving a baseline role.
              </p>
            </div>
          </div>
        )}

        {mode !== 'B' && (
          <aside className="feature-panel__aside">
            <div className="feature-panel__aside-content">
              <Sparkles className="icon-sm feature-panel__aside-icon" aria-hidden="true" />
              <p className="feature-panel__aside-text">
                {personalisationEnabled
                  ? 'Navigate with confidence—recommendations update instantly as you tweak your baseline role.'
                  : 'Open any role to explore its skill DNA and compare opportunities side by side.'}
              </p>
            </div>
          </aside>
        )}
      </div>

      {!ready && (
        <div className="feature-panel__loading-hint" role="status" aria-live="polite">
          Loading SPH career dataset…
        </div>
      )}
    </section>
  );
}
