// src/components/JobSkillsMatcher.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Users,
  X,
  TrendingUp,
  MapPin,
  Briefcase,
  Route,
} from 'lucide-react';
import '../styles/main.css';
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

  useRevealOnScroll(
    selectedJob ? selectedJob.id : 0,
    filteredJobs.length,
    matchingJobsForSelected.length,
    myPosition ? myPosition.id : 0
  );

  return (
    <div className="page solid-bg experience-page">
      <SiteHeader />

      <div className="container content experience-content">
        <section className="experience-hero experience-hero--explorer" data-animate="fade-slide">
          <div className="experience-hero__header">
            <div className="experience-hero__icon" aria-hidden="true">
              <Route className="icon-lg" />
            </div>
            <div>
              <h1 className="experience-hero__title">SPH Career Explorer</h1>
              <p className="experience-hero__subtitle">
                Explore SPH roles, compare skills, and shortlist next-step opportunities.
              </p>
            </div>
          </div>
          <div className="experience-hero__grid">
            <div className="experience-hero__status-card">
              {myPosition ? (
                <>
                  <span className="experience-hero__status-label">Saved starting role</span>
                  <span className="experience-hero__status-value">{myPosition.title}</span>
                  <Link to="/roadmap" state={roadmapLinkState} className="chip-link">
                    Manage in roadmap
                  </Link>
                </>
              ) : (
                <>
                  <span className="experience-hero__status-label">Personalise your view</span>
                  <p className="experience-hero__status-text">
                    Save your current role in the roadmap planner to unlock tailored comparisons here.
                  </p>
                  <Link to="/roadmap" className="chip-link">
                    Go to roadmap planner
                  </Link>
                </>
              )}
            </div>
            <div className="experience-hero__actions">
              <Link to="/roadmap" state={roadmapLinkState} className="button button--inverse">
                <Route className="icon-xs mr-6" />
                Open roadmap planner
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={() =>
                  document.getElementById('career-explorer-filters')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
              >
                Browse roles
              </button>
            </div>
          </div>
        </section>

        <section id="career-explorer-filters" className="explorer-panel" data-animate="fade-up">
          <div className="explorer-panel__header">
            <div>
              <h2 className="section-h2">Browse positions</h2>
              <p className="muted text-sm">
                Use search and filters to surface roles across the SPH framework. Open a card to view its skill DNA.
              </p>
            </div>
            {myPosition && <span className="chip chip--outline">Benchmarking vs {myPosition.title}</span>}
          </div>
          <div className="explorer-filter-grid">
            <div className="field field--elevated">
              <label className="field__label" htmlFor="explorer-search">
                Search positions
              </label>
              <div className="field__control">
                <Search className="icon-sm field__icon" />
                <input
                  id="explorer-search"
                  type="text"
                  placeholder="Search by title or division..."
                  className="input input--elevated"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search jobs"
                />
              </div>
            </div>
            <div className="field field--elevated">
              <label className="field__label" htmlFor="explorer-division">
                Division filter
              </label>
              <div className="field__control">
                <Filter className="icon-sm field__icon" />
                <select
                  id="explorer-division"
                  className="input input--elevated"
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
        </section>

        <section className="explorer-results-shell" data-animate="fade-stagger">
          <div className={`explorer-layout ${selectedJob ? 'explorer-layout--split' : ''}`}>
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
      </div>
    </div>
  );
};

export default JobSkillsMatcher;


