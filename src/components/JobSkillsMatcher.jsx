// src/components/JobSkillsMatcher.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Users,
  X,
  TrendingUp,
  MapPin,
  Briefcase,
  Compass,
  ChevronDown,
} from 'lucide-react';
import '../styles/main.css';
import '../styles/layouts/career-explorer.css';
import useJobDataset from '../hooks/useJobDataset';
import {
  classifyType,
  computeTransitionSimilarity,
  summarizeTransition,
  getSimilarityBadge,
} from '../utils/jobDataUtils';
import SiteHeader from './SiteHeader';
import useRevealOnScroll from '../hooks/useRevealOnScroll';

function getSimilarityTone(sim) {
  if (sim >= 90) return 'tone-green';
  if (sim >= 80) return 'tone-yellow';
  if (sim >= 70) return 'tone-lilac';
  if (sim >= 60) return 'tone-blue';
  return 'tone-neutral';
}

/* ------------------------- Main Component (Single Page) ------------------------- */
const JobSkillsMatcher = () => {
  const navigate = useNavigate();
  const { jobs, divisions, skillIDF } = useJobDataset();
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [myPickerDivision, setMyPickerDivision] = useState('all');
  const [myPickerTitle, setMyPickerTitle] = useState('');
  const filtersRef = useRef(null);
  const recommendationsRef = useRef(null);
  const resultsRef = useRef(null);

  const [myPositionTitle, setMyPositionTitle] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('eva-my-position') || '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (myPositionTitle) {
      window.localStorage.setItem('eva-my-position', myPositionTitle);
    } else {
      window.localStorage.removeItem('eva-my-position');
    }
  }, [myPositionTitle]);
  // Derive job objects
  const myPosition = useMemo(
    () => jobs.find((j) => j.title === myPositionTitle) || null,
    [jobs, myPositionTitle]
  );

  const myPickerJobs = useMemo(() => {
    if (myPickerDivision === 'all') return jobs;
    return jobs.filter((j) => j.division === myPickerDivision);
  }, [jobs, myPickerDivision]);

  const roadmapLinkState = myPosition?.title ? { currentTitle: myPosition.title } : undefined;
  /* ---------- Top list filtering ---------- */
  const filteredJobs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return jobs.filter((job) => {
      const okSearch =
        job.title.toLowerCase().includes(q) ||
        (job.division || '').toLowerCase().includes(q);
      const okDiv = selectedDivision === 'all' || job.division === selectedDivision;
      return okSearch && okDiv;
    });
  }, [jobs, searchTerm, selectedDivision]);

  const groupedJobs = useMemo(() => {
    const grouped = {};
    filteredJobs.forEach((job) => {
      if (!grouped[job.division]) grouped[job.division] = [];
      grouped[job.division].push(job);
    });
    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => a.title.localeCompare(b.title))
    );
    return grouped;
  }, [filteredJobs]);

  // Weighted, directional similarity: current (source) -> target
  const simScore = React.useCallback(
    (currentJob, targetJob) =>
      computeTransitionSimilarity(currentJob, targetJob, skillIDF),
    [skillIDF]
  );

  // Matching against the currently selected job (right panel list)
  const matchingJobsForSelected = useMemo(() => {
    if (!selectedJob) return [];
    return jobs
      .filter((job) => job.id !== selectedJob.id)
      .map((job) => ({
        ...job,
        similarity: simScore(selectedJob, job),
        summary: summarizeTransition(selectedJob, job, 2),
      }))
      .filter((job) => job.similarity >= 65)
      .sort((a, b) => b.similarity - a.similarity);
  }, [selectedJob, jobs, simScore]);

  // Split selected job's skills into functional vs soft for clearer display
  const selectedJobSkillsByType = useMemo(() => {
    if (!selectedJob) return { functional: [], soft: [], unknown: [] };
    const functional = [];
    const soft = [];
    const unknown = [];
    (selectedJob.skillOrder || []).forEach((name) => {
      const t = classifyType(selectedJob.skillTypeByName?.[name] || '');
      if (t === 'functional') functional.push(name);
      else if (t === 'soft') soft.push(name);
      else unknown.push(name);
    });
    return { functional, soft, unknown };
  }, [selectedJob]);

  const recommendationsForMyPosition = useMemo(() => {
    if (!myPosition) return [];
    return jobs
      .filter((job) => job.id !== myPosition.id)
      .map((job) => ({
        ...job,
        similarity: simScore(myPosition, job),
        summary: summarizeTransition(myPosition, job, 2),
      }))
      .filter((job) => job.similarity >= 60)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 6);
  }, [jobs, myPosition, simScore]);

  useEffect(() => {
    if (myPosition && !myPickerTitle) {
      setMyPickerDivision(myPosition.division || 'all');
      setMyPickerTitle(myPosition.title);
    }
  }, [myPosition, myPickerTitle]);

  useEffect(() => {
    if (!myPickerJobs.some((job) => job.title === myPickerTitle)) {
      setMyPickerTitle('');
    }
  }, [myPickerJobs, myPickerTitle]);

  useRevealOnScroll(
    selectedJob ? selectedJob.id : 0,
    filteredJobs.length,
    matchingJobsForSelected.length,
    myPosition ? myPosition.id : 0,
    recommendationsForMyPosition.length
  );

  const handleBrowseRoles = () => {
    if (filtersRef.current) {
      filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewRecommendations = () => {
    if (recommendationsRef.current) {
      recommendationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveMyPosition = React.useCallback(() => {
    if (!myPickerTitle) return;
    setMyPositionTitle(myPickerTitle);
    const job = jobs.find((j) => j.title === myPickerTitle);
    if (job) {
      setSelectedDivision('all');
      setSearchTerm('');
      setSelectedJob(job);
    }
  }, [jobs, myPickerTitle]);

  const handleHeroSubmit = (event) => {
    event.preventDefault();
    handleSaveMyPosition();
  };

  const handleClearMyPosition = () => {
    setMyPositionTitle('');
    setMyPickerTitle('');
    setSelectedJob(null);
  };

  const handleOpenRecommendation = (job) => {
    setSelectedDivision('all');
    setSearchTerm(job.title);
    setSelectedJob(job);
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="page solid-bg experience-page experience-page--explorer explorer-page">
      <SiteHeader />

      <div className="content experience-content experience-content--wide">
        <section className="experience-hero experience-hero--explorer" data-animate="fade-slide">
          <div className="experience-hero__header">
            <div className="experience-hero__icon" aria-hidden="true">
              <Compass className="icon-lg" />
            </div>
            <div>
              <h1 className="experience-hero__title">Discover your next SPH role</h1>
              <p className="experience-hero__subtitle">
                Search the SPH Career Framework, compare role skill DNA, and shortlist your next moves.
              </p>
            </div>
          </div>
          <div className="experience-hero__grid">
            <div className="experience-hero__status-card explorer-hero__status-card">
              <div className="explorer-hero__status-heading">
                <span className="experience-hero__status-label explorer-hero__status-label">
                  Personalise your explorer
                </span>
                {myPosition ? (
                  <>
                    <span className="experience-hero__status-value explorer-hero__status-value">
                      {myPosition.title}
                    </span>
                    <span className="explorer-hero__status-pill">
                      <MapPin className="icon-xs" aria-hidden="true" />
                      {myPosition.division}
                    </span>
                  </>
                ) : (
                  <p className="experience-hero__status-text explorer-hero__status-text">
                    Save your current role to unlock curated recommendations and smarter comparisons.
                  </p>
                )}
              </div>
              <form className="explorer-hero__form" onSubmit={handleHeroSubmit}>
                <div className="explorer-hero__field">
                  <label className="explorer-hero__field-label" htmlFor="explorer-hero-division">
                    Division
                  </label>
                  <div className="explorer-hero__select-wrapper">
                    <select
                      id="explorer-hero-division"
                      className="explorer-hero__select"
                      value={myPickerDivision}
                      onChange={(event) => setMyPickerDivision(event.target.value)}
                    >
                      <option value="all">All divisions</option>
                      {divisions.map((division) => (
                        <option key={division} value={division}>
                          {division}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="explorer-hero__chevron" aria-hidden="true" />
                  </div>
                </div>
                <div className="explorer-hero__field">
                  <label className="explorer-hero__field-label" htmlFor="explorer-hero-role">
                    Role
                  </label>
                  <div className="explorer-hero__select-wrapper">
                    <select
                      id="explorer-hero-role"
                      className="explorer-hero__select"
                      value={myPickerTitle}
                      onChange={(event) => setMyPickerTitle(event.target.value)}
                    >
                      <option value="">Select role...</option>
                      {myPickerJobs.map((job) => (
                        <option key={job.id} value={job.title}>
                          {job.title} – {job.division}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="explorer-hero__chevron" aria-hidden="true" />
                  </div>
                </div>
                <p className="explorer-hero__helper">
                  Saving updates your roadmap baseline and unlocks tailored recommendations below.
                </p>
                <div className="explorer-hero__form-actions">
                  <button
                    type="submit"
                    className="button button--inverse button--small"
                    disabled={!myPickerTitle}
                  >
                    Save my position
                  </button>
                  {myPosition && (
                    <button
                      type="button"
                      className="button button--ghost button--small"
                      onClick={handleClearMyPosition}
                    >
                      Clear saved role
                    </button>
                  )}
                  <Link
                    to="/roadmap"
                    state={roadmapLinkState}
                    className="button button--ghost button--small explorer-hero__roadmap"
                  >
                    Manage in roadmap
                  </Link>
                </div>
              </form>
            </div>
            <div className="experience-hero__status-card explorer-hero__status-card explorer-hero__metrics">
              <div className="explorer-hero__metric">
                <span className="explorer-hero__metric-value">{jobs.length}</span>
                <span className="explorer-hero__metric-label">roles mapped</span>
              </div>
              <div className="explorer-hero__metric">
                <span className="explorer-hero__metric-value">{divisions.length}</span>
                <span className="explorer-hero__metric-label">divisions covered</span>
              </div>
              <div className="explorer-hero__metric">
                <span className="explorer-hero__metric-value">
                  {myPosition ? recommendationsForMyPosition.length : '—'}
                </span>
                <span className="explorer-hero__metric-label">personalised moves</span>
              </div>
            </div>
            <div className="experience-hero__actions explorer-hero__actions">
              <button type="button" className="button button--inverse" onClick={handleBrowseRoles}>
                Browse all roles
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={handleViewRecommendations}
                disabled={!myPosition}
              >
                View recommendations
              </button>
              <Link to="/roadmap" className="button button--ghost">
                Plan my roadmap
              </Link>
            </div>
          </div>
        </section>

        <section ref={recommendationsRef} className="explorer-recommendations" data-animate="fade-up">
          <div className="explorer-recommendations__header">
            <div>
              <h2 className="section-h2">Recommended next moves</h2>
              <p className="muted text-sm">
                {myPosition
                  ? `Based on ${myPosition.title}, explore adjacent roles that build on your strengths and stretch your capabilities.`
                  : 'Save your current role above to unlock personalised role suggestions.'}
              </p>
            </div>
            {myPosition && (
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={handleBrowseRoles}
              >
                Explore all roles
              </button>
            )}
          </div>

          {myPosition ? (
            recommendationsForMyPosition.length > 0 ? (
              <div className="explorer-recommendations__grid">
                {recommendationsForMyPosition.map((job) => {
                  const badge = getSimilarityBadge(job.similarity);
                  const toneClass = getSimilarityTone(job.similarity);
                  const strengths = job.summary.strengths.map((s) => s.name).join(', ');
                  const gaps = job.summary.gaps.map((g) => `${g.name} (+${g.gap})`).join(', ');
                  return (
                    <article key={job.id} className={`explorer-recommendation ${toneClass}`}>
                      <header className="explorer-recommendation__header">
                        <div>
                          <h3>{job.title}</h3>
                          <span className="explorer-recommendation__meta">{job.division}</span>
                        </div>
                        <span className={badge.color}>{badge.label}</span>
                      </header>
                      {(strengths || gaps) && (
                        <div className="explorer-recommendation__summary">
                          {strengths && (
                            <div>
                              <strong>Strengths:</strong> {strengths}
                            </div>
                          )}
                          {gaps && (
                            <div>
                              <strong>Gaps:</strong> {gaps}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="explorer-recommendation__actions">
                        <button
                          type="button"
                          className="button button--inverse button--small"
                          onClick={() => handleOpenRecommendation(job)}
                        >
                          Inspect role
                        </button>
                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() =>
                            navigate('/roadmap', {
                              state: { currentTitle: myPosition.title, targetTitle: job.title },
                            })
                          }
                        >
                          Plan transition
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="explorer-empty explorer-empty--inline">
                <p>We are analysing your saved role for recommendations. Try adjusting the division filter.</p>
              </div>
            )
          ) : (
            <div className="explorer-empty explorer-empty--inline">
              <p>Save your current position to view personalised role recommendations.</p>
            </div>
          )}
        </section>

        <main className="explorer">
          <section ref={filtersRef} id="career-explorer-filters" className="explorer__filters">
            <div className="explorer-panel" data-animate="fade-up">
              <div className="explorer-panel__header">
                <div>
                  <span className="explorer-panel__eyebrow">Search the framework</span>
                  <h2 className="explorer-panel__title">Browse positions</h2>
                  <p className="explorer-panel__subtitle">
                    Use the filters to surface roles across the SPH framework. Open a card to view its skill DNA.
                  </p>
                </div>
                {myPosition && (
                  <span className="explorer-panel__chip">Benchmarking vs {myPosition.title}</span>
                )}
              </div>
              <div className="explorer-panel__controls">
                <div className="explorer-control">
                  <label className="explorer-control__label" htmlFor="explorer-search">
                    Search positions
                  </label>
                  <div className="explorer-control__field">
                    <Search className="explorer-control__icon" />
                    <input
                      id="explorer-search"
                      type="text"
                      placeholder="Search by title or division"
                      className="explorer-control__input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search jobs"
                    />
                  </div>
                </div>
                <div className="explorer-control">
                  <label className="explorer-control__label" htmlFor="explorer-division">
                    Division filter
                  </label>
                  <div className="explorer-control__field explorer-control__field--select">
                    <Filter className="explorer-control__icon" />
                    <select
                      id="explorer-division"
                      className="explorer-control__input explorer-control__input--select"
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      aria-label="Filter by division"
                    >
                      <option value="all">All divisions</option>
                      {divisions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            </div>
          </section>

          <section ref={resultsRef} className="explorer-results-shell">
            <div className={`explorer-layout ${selectedJob ? 'explorer-layout--split' : ''}`} data-animate="fade-stagger">
              <div className="explorer-results">
                {Object.keys(groupedJobs).length ? (
                  Object.keys(groupedJobs).map((division) => (
                    <div key={division} className="explorer-group">
                      <div className="explorer-group__header">
                        <h3 className="explorer-group__title">{division}</h3>
                        <span className="explorer-group__count">{groupedJobs[division].length} roles</span>
                      </div>
                      <div className="explorer-card-grid">
                        {groupedJobs[division].map((job) => {
                          const isSelected = selectedJob && selectedJob.id === job.id;
                          const similarity = myPosition ? simScore(myPosition, job) : null;
                          const toneClass = similarity != null ? getSimilarityTone(similarity) : 'tone-neutral';
                          const badge = similarity != null ? getSimilarityBadge(similarity) : null;

                          return (
                            <button
                              key={job.id}
                              type="button"
                              className={`explorer-card ${toneClass} ${isSelected ? 'is-active' : ''}`}
                              onClick={() => setSelectedJob(job)}
                              aria-pressed={isSelected}
                              title={`Open ${job.title}`}
                            >
                              <span className="explorer-card__title">{job.title}</span>
                              <span className="explorer-card__meta">{job.division}</span>
                              {badge && <span className={`explorer-card__badge ${badge.color}`}>{badge.label}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="explorer-empty">
                    <Users className="icon-xl" />
                    <p>No roles match your filters just yet. Try a different combination.</p>
                  </div>
                )}
              </div>

              {selectedJob && (
                <aside className="explorer-detail" aria-live="polite">
                  <div className="explorer-detail__header">
                    <div className="explorer-detail__icon" aria-hidden="true">
                      <Briefcase className="icon-sm" />
                    </div>
                    <div>
                      <h3 className="explorer-detail__title">{selectedJob.title}</h3>
                      <p className="explorer-detail__subtitle">
                        <MapPin className="icon-xs" />
                        {selectedJob.division}
                      </p>
                    </div>
                    <button className="icon-button" onClick={() => setSelectedJob(null)} aria-label="Close details">
                      <X className="icon-sm" />
                    </button>
                  </div>

                  <div className="explorer-detail__body">
                    <div className="explorer-detail__quick-actions">
                      <button className="chip" onClick={() => setMyPositionTitle(selectedJob.title)}>
                        Save as My Position
                      </button>
                      <button
                        className="chip"
                        onClick={() =>
                          navigate('/roadmap', {
                            state: { currentTitle: selectedJob.title },
                          })
                        }
                      >
                        Set as Current in Roadmap
                      </button>
                      <button
                        className="chip"
                        onClick={() =>
                          navigate('/roadmap', {
                            state: {
                              ...(myPosition?.title ? { currentTitle: myPosition.title } : {}),
                              targetTitle: selectedJob.title,
                            },
                          })
                        }
                      >
                        Plan as Target Role
                      </button>
                    </div>

                    <section className="explorer-detail__section">
                      <h4>Role snapshot</h4>
                      <p>{selectedJob.description}</p>
                    </section>

                    <section className="explorer-detail__section">
                      <h4>Skill profile</h4>
                      <div className="explorer-detail__skills">
                        {selectedJob.skillOrder.length ? (
                          <>
                            {selectedJobSkillsByType.functional.length > 0 && (
                              <div>
                                <h5>Functional</h5>
                                {selectedJobSkillsByType.functional.map((name, i) => {
                                  const val = selectedJob.skillMap[name] ?? 0;
                                  const def = selectedJob.skillDefByName?.[name];
                                  return (
                                    <div key={name + i} className="skill-bar">
                                      <div className="skill-bar__meta">
                                        <span>{name}</span>
                                        <span>{val}/5</span>
                                      </div>
                                      {def && <div className="skill-bar__description">{def}</div>}
                                      <div className="bar">
                                        <div className="bar-fill blue" style={{ width: (val / 5) * 100 + '%' }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {selectedJobSkillsByType.soft.length > 0 && (
                              <div>
                                <h5>Soft</h5>
                                {selectedJobSkillsByType.soft.map((name, i) => {
                                  const val = selectedJob.skillMap[name] ?? 0;
                                  const def = selectedJob.skillDefByName?.[name];
                                  return (
                                    <div key={name + i} className="skill-bar">
                                      <div className="skill-bar__meta">
                                        <span>{name}</span>
                                        <span>{val}/5</span>
                                      </div>
                                      {def && <div className="skill-bar__description">{def}</div>}
                                      <div className="bar">
                                        <div className="bar-fill blue" style={{ width: (val / 5) * 100 + '%' }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {selectedJobSkillsByType.unknown.length > 0 && (
                              <div>
                                <h5>Other</h5>
                                {selectedJobSkillsByType.unknown.map((name, i) => {
                                  const val = selectedJob.skillMap[name] ?? 0;
                                  return (
                                    <div key={name + i} className="skill-bar">
                                      <div className="skill-bar__meta">
                                        <span>{name}</span>
                                        <span>{val}/5</span>
                                      </div>
                                      <div className="bar">
                                        <div className="bar-fill blue" style={{ width: (val / 5) * 100 + '%' }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <p>No skill data available for this title.</p>
                        )}
                      </div>
                    </section>

                    <section className="explorer-detail__section">
                      <h4 className="explorer-detail__section-title">
                        <TrendingUp className="icon-sm" /> Similar pathways
                      </h4>

                      {matchingJobsForSelected.length > 0 ? (
                        <div className="explorer-similar-list">
                          {matchingJobsForSelected.map((job) => {
                            const badge = getSimilarityBadge(job.similarity);
                            const toneClass = getSimilarityTone(job.similarity);
                            const strengths = job.summary.strengths.map((s) => s.name).join(', ');
                            const gaps = job.summary.gaps.map((g) => `${g.name} (+${g.gap})`).join(', ');
                            return (
                              <div key={job.id} className={`explorer-similar ${toneClass}`}>
                                <div className="explorer-similar__header">
                                  <h5>{job.title}</h5>
                                  <span className={badge.color}>{badge.label}</span>
                                </div>
                                <p className="explorer-similar__meta">{job.division}</p>
                                {(strengths || gaps) && (
                                  <div className="explorer-similar__summary">
                                    {strengths && (
                                      <div>
                                        <strong>Strengths:</strong> {strengths}
                                      </div>
                                    )}
                                    {gaps && (
                                      <div>
                                        <strong>Gaps:</strong> {gaps}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <button
                                  className="chip chip--ghost"
                                  onClick={() =>
                                    navigate('/roadmap', {
                                      state: { currentTitle: selectedJob.title, targetTitle: job.title },
                                    })
                                  }
                                >
                                  Plan in Roadmap
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="explorer-empty explorer-empty--inline">
                          <TrendingUp className="icon-md" />
                          <p>No similar positions found yet.</p>
                        </div>
                      )}
                    </section>
                  </div>
                </aside>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );

};

export default JobSkillsMatcher;
