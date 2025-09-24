// src/components/JobInsightCanvas.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ArrowLeft,
  MapPin,
  Sparkles,
  Target,
  Scales,
  Layers,
  ArrowRight,
  Star,
} from 'lucide-react';
import '../styles/components/job-insight-canvas.css';
import { classifyType, getSimilarityBadge, summarizeTransition } from '../utils/jobDataUtils';

function formatSimilarity(score) {
  if (score == null) return '—';
  return `${score}% match`;
}

function pluralise(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

const typeLabels = {
  functional: 'Functional',
  soft: 'Soft',
  unknown: 'Additional',
};

export default function JobInsightCanvas({
  job,
  onClose,
  onOpenJob,
  onSaveMyPosition,
  onPlanRoadmap,
  summary,
  highlights,
  skillsByType,
  baselineSimilarity,
  matchingJobs,
  recommendations,
  myPosition,
  jobs,
  simScore,
}) {
  const [compareTargetId, setCompareTargetId] = useState('');

  useEffect(() => {
    setCompareTargetId('');
  }, [job?.id]);

  const compareJob = useMemo(() => {
    if (!compareTargetId) return null;
    return jobs.find((candidate) => String(candidate.id) === compareTargetId) || null;
  }, [jobs, compareTargetId]);

  const compareInsights = useMemo(() => {
    if (!compareJob) return null;
    const similarity = simScore(job, compareJob);
    const summaryRows = summarizeTransition(job, compareJob, 6);
    return { similarity, summaryRows };
  }, [job, compareJob, simScore]);

  const skillLadder = useMemo(() => {
    return (job.skillOrder || [])
      .map((name) => ({
        name,
        level: job.skillMap?.[name] ?? 0,
        definition: job.skillDefByName?.[name] || '',
        type: classifyType(job.skillTypeByName?.[name]),
      }))
      .sort((a, b) => {
        if (b.level === a.level) return a.name.localeCompare(b.name);
        return b.level - a.level;
      })
      .slice(0, 8);
  }, [job]);

  const skillMix = useMemo(() => {
    const mix = {
      functional: skillsByType?.functional?.length || 0,
      soft: skillsByType?.soft?.length || 0,
      unknown: skillsByType?.unknown?.length || 0,
    };
    const total = Math.max(1, mix.functional + mix.soft + mix.unknown);
    return {
      mix,
      percentages: {
        functional: Math.round((mix.functional / total) * 100),
        soft: Math.round((mix.soft / total) * 100),
        unknown: Math.round((mix.unknown / total) * 100),
      },
      total,
    };
  }, [skillsByType]);

  const sharedCluster = compareJob && job.cluster && compareJob.cluster && job.cluster === compareJob.cluster;

  const sharedSkills = useMemo(() => {
    if (!compareJob) return [];
    const shared = (job.skillOrder || []).filter((name) => compareJob.skillOrder?.includes(name));
    return shared
      .map((name) => ({
        name,
        current: job.skillMap?.[name] ?? 0,
        target: compareJob.skillMap?.[name] ?? 0,
      }))
      .sort((a, b) => (b.current + b.target) / 2 - (a.current + a.target) / 2)
      .slice(0, 6);
  }, [job, compareJob]);

  const bridgeSkills = useMemo(() => {
    if (!compareInsights) return [];
    return compareInsights.summaryRows.gaps.map((gap) => ({
      ...gap,
      displayType: typeLabels[gap.type] || 'Additional',
    }));
  }, [compareInsights]);

  const strengths = useMemo(() => {
    if (!compareInsights) return [];
    return compareInsights.summaryRows.strengths.map((strength) => ({
      ...strength,
      displayType: typeLabels[strength.type] || 'Additional',
    }));
  }, [compareInsights]);

  const similarityBadge = baselineSimilarity != null ? getSimilarityBadge(baselineSimilarity) : null;

  const handleCompareChange = (event) => {
    setCompareTargetId(event.target.value);
  };

  const handleOpenSimilar = (targetJob) => {
    onOpenJob(targetJob);
  };

  const handleSetAsCurrent = () => {
    onSaveMyPosition(job);
  };

  const handlePlanAsCurrent = () => {
    onPlanRoadmap({ currentTitle: job.title });
  };

  const handlePlanAsTarget = () => {
    const state = myPosition?.title
      ? { currentTitle: myPosition.title, targetTitle: job.title }
      : { targetTitle: job.title };
    onPlanRoadmap(state);
  };

  return (
    <div className="insight-overlay" role="dialog" aria-modal="true" aria-label={`Details for ${job.title}`}>
      <div className="insight-canvas">
        <header className="insight-canvas__hero">
          <button className="insight-canvas__close" onClick={onClose} aria-label="Close job insight">
            <X className="icon-sm" />
          </button>
          <div className="insight-canvas__eyebrow">
            <ArrowLeft className="icon-xs" />
            <button type="button" onClick={onClose} className="insight-link">
              Back to explorer
            </button>
          </div>
          <h2 className="insight-canvas__title">{job.title}</h2>
          <p className="insight-canvas__meta">
            <MapPin className="icon-xs" /> {job.division}
          </p>
          <div className="insight-canvas__hero-actions">
            <button type="button" className="insight-chip" onClick={handleSetAsCurrent}>
              <Sparkles className="icon-xs" /> Save as My Position
            </button>
            <button type="button" className="insight-chip" onClick={handlePlanAsCurrent}>
              <Layers className="icon-xs" /> Roadmap: set current
            </button>
            <button type="button" className="insight-chip" onClick={handlePlanAsTarget}>
              <Target className="icon-xs" /> Roadmap: set target
            </button>
          </div>
          <div className="insight-canvas__summary">
            <div className="insight-summary__item">
              <h3>Purpose</h3>
              <p>{summary.objective || summary.description || 'This role contributes with defined impact areas across the framework.'}</p>
            </div>
            {summary.cluster && (
              <div className="insight-summary__item">
                <h3>Cluster context</h3>
                <p className="insight-summary__cluster">{summary.cluster}</p>
                {summary.clusterDef && <p>{summary.clusterDef}</p>}
              </div>
            )}
            <div className="insight-summary__item">
              <h3>Snapshot</h3>
              <ul>
                <li>{pluralise(job.skillOrder.length, 'mapped skill')}</li>
                {baselineSimilarity != null && <li>{formatSimilarity(baselineSimilarity)}</li>}
                {similarityBadge && <li className={`insight-tag ${similarityBadge.color}`}>My position: {similarityBadge.label}</li>}
              </ul>
            </div>
          </div>
        </header>

        <section className="insight-section">
          <div className="insight-section__header">
            <h3>Skill DNA focus</h3>
            <span className="insight-highlight">{pluralise(skillMix.total, 'skill')}</span>
          </div>
          <div className="insight-mix">
            {Object.keys(skillMix.mix).map((key) => (
              <div key={key} className="insight-mix__item">
                <div className="insight-mix__bar" aria-hidden="true">
                  <div className={`insight-mix__fill insight-mix__fill--${key}`} style={{ width: `${skillMix.percentages[key]}%` }} />
                </div>
                <span className="insight-mix__label">
                  {typeLabels[key]} · {skillMix.mix[key]} ({skillMix.percentages[key]}%)
                </span>
              </div>
            ))}
          </div>
          {highlights.length > 0 && (
            <div className="insight-highlight-grid">
              {highlights.map((name) => {
                const level = job.skillMap?.[name] ?? 0;
                const definition = job.skillDefByName?.[name];
                return (
                  <article key={name} className="insight-card">
                    <header>
                      <h4>{name}</h4>
                      <span className="insight-pill">
                        <Star className="icon-xxs" /> {level}/5
                      </span>
                    </header>
                    {definition && <p>{definition}</p>}
                  </article>
                );
              })}
            </div>
          )}
          <div className="insight-ladder">
            {skillLadder.map((skill) => (
              <div key={skill.name} className="insight-ladder__row">
                <div className="insight-ladder__label">
                  <span>{skill.name}</span>
                  <small>{typeLabels[skill.type] || 'Additional'}</small>
                </div>
                <div className="insight-ladder__bar" aria-label={`${skill.name} requires level ${skill.level} of 5`}>
                  <div className="insight-ladder__fill" style={{ width: `${(skill.level / 5) * 100}%` }} />
                </div>
                <span className="insight-ladder__value">{skill.level}/5</span>
              </div>
            ))}
          </div>
        </section>

        <section className="insight-section">
          <div className="insight-section__header">
            <h3>Compare this role</h3>
            <span className="insight-highlight">Spot gaps & overlaps</span>
          </div>
          <div className="insight-compare">
            <div className="insight-compare__controls">
              <label htmlFor="compare-select">Select another role to compare</label>
              <select id="compare-select" value={compareTargetId} onChange={handleCompareChange}>
                <option value="">Choose a role</option>
                {jobs
                  .filter((candidate) => candidate.id !== job.id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.title} · {candidate.division}
                    </option>
                  ))}
              </select>
              {compareInsights && (
                <p className="insight-compare__score">
                  <Scales className="icon-xs" /> {formatSimilarity(compareInsights.similarity)}
                </p>
              )}
            </div>

            {compareJob ? (
              <div className="insight-compare__panes">
                <div className="insight-compare__pane">
                  <h4>{job.title}</h4>
                  <p>{summary.objective || summary.description}</p>
                </div>
                <div className="insight-compare__delta">
                  <ArrowRight className="icon-sm" />
                  <p>{sharedCluster ? 'Within the same cluster' : 'Cross-cluster transition'}</p>
                </div>
                <div className="insight-compare__pane">
                  <h4>{compareJob.title}</h4>
                  <p>{compareJob.objective || compareJob.description}</p>
                </div>
              </div>
            ) : (
              <p className="insight-compare__placeholder">Pick a role to unlock overlap and gap insights.</p>
            )}

            {compareInsights && (
              <div className="insight-compare__insights">
                {sharedCluster ? (
                  <div className="insight-compare__group">
                    <h5>Shared strengths</h5>
                    {sharedSkills.length ? (
                      <ul>
                        {sharedSkills.map((skill) => (
                          <li key={skill.name}>
                            <span>{skill.name}</span>
                            <span>
                              {skill.current}/5 → {skill.target}/5
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No overlapping skills mapped yet.</p>
                    )}
                    {strengths.length > 0 && (
                      <div className="insight-callout">
                        <h6>Transferable wins</h6>
                        <ul>
                          {strengths.map((item) => (
                            <li key={item.name}>
                              <span className="insight-pill insight-pill--soft">{item.displayType}</span>
                              <span>{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="insight-compare__group">
                    <h5>Bridge the gap</h5>
                    {bridgeSkills.length ? (
                      <ul>
                        {bridgeSkills.map((item) => (
                          <li key={item.name}>
                            <span className="insight-pill insight-pill--soft">{item.displayType}</span>
                            <span>{item.name}</span>
                            <span className="insight-gap">+{item.gap.toFixed(1)} proficiency</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No major gaps detected for this pairing.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="insight-section">
          <div className="insight-section__header">
            <h3>Similar moves to explore</h3>
            <span className="insight-highlight">Powered by proficiency overlap</span>
          </div>
          {matchingJobs.length ? (
            <div className="insight-scroll">
              {matchingJobs.map((candidate) => {
                const badge = getSimilarityBadge(candidate.similarity);
                return (
                  <article key={candidate.id} className="insight-card insight-card--compact">
                    <header>
                      <h4>{candidate.title}</h4>
                      <span className={`insight-tag ${badge.color}`}>{badge.label}</span>
                    </header>
                    <p className="insight-card__meta">{candidate.division}</p>
                    <p>
                      {candidate.summary.strengths.length > 0 && (
                        <span>
                          Strengths: {candidate.summary.strengths.map((item) => item.name).join(', ')}
                        </span>
                      )}
                    </p>
                    <button type="button" className="insight-link" onClick={() => handleOpenSimilar(candidate)}>
                      View insight
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="insight-compare__placeholder">No recommended transitions for this role yet.</p>
          )}
        </section>

        {recommendations.length > 0 && (
          <section className="insight-section">
            <div className="insight-section__header">
              <h3>Because you saved “My Position”</h3>
              <span className="insight-highlight">Suggested next moves</span>
            </div>
            <div className="insight-scroll">
              {recommendations.map((candidate) => {
                const badge = getSimilarityBadge(candidate.similarity);
                return (
                  <article key={candidate.id} className="insight-card insight-card--compact">
                    <header>
                      <h4>{candidate.title}</h4>
                      <span className={`insight-tag ${badge.color}`}>{badge.label}</span>
                    </header>
                    <p className="insight-card__meta">{candidate.division}</p>
                    <button type="button" className="insight-link" onClick={() => handleOpenSimilar(candidate)}>
                      Compare with {job.title}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
