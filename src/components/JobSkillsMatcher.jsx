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
  Route,
  Sparkles,
} from 'lucide-react';
import '../styles/main.css';
import useJobDataset from '../hooks/useJobDataset';
import { alignVectors, classifyType } from '../utils/jobDataUtils';
import SiteHeader from './SiteHeader';

function getSimilarityColor(sim) {
  if (sim >= 70) return 'match match-excellent';
  if (sim >= 60) return 'match match-good';
  if (sim >= 50) return 'match match-fair';
  return 'match match-low';
}

function getSimilarityBadge(sim) {
  if (sim >= 90) return { label: 'Excellent', color: 'badge solid green' };
  if (sim >= 80) return { label: 'Good', color: 'badge solid yellow' };
  if (sim >= 70) return { label: 'Fair', color: 'badge solid orange' };
  return { label: 'Low', color: 'badge solid gray' };
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

  const [myPickerDivision, setMyPickerDivision] = useState('all');
  const [myPickerTitle, setMyPickerTitle] = useState('');

  const myPositionRef = useRef(null);
  const scrollToMyPosition = () => {
    if (myPositionRef.current) {
      myPositionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
  const selectedJobRoadmapState = selectedJob
    ? {
        ...(myPosition?.title ? { currentTitle: myPosition.title } : {}),
        targetTitle: selectedJob.title,
      }
    : undefined;

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
    (currentJob, targetJob) => {
      if (!currentJob || !targetJob || currentJob.id === targetJob.id) return 100;
      const [va, vb, names] = alignVectors(currentJob, targetJob);
      if (!names.length) return 0;

      // Per-skill weights using target's importance, type, and global IDF
      const weights = names.map((n) => {
        const importance = targetJob.skillMap?.[n] ?? 0; // target requirement (0..5)
        const typeRaw = (targetJob.skillTypeByName?.[n] || currentJob.skillTypeByName?.[n] || '').toLowerCase();
        const typeWeight = /functional/.test(typeRaw) ? 1.15 : /soft/.test(typeRaw) ? 0.95 : 1.0;
        const base = 0.5 + (Math.max(0, Math.min(5, importance)) / 5) * 0.5; // 0.5 .. 1.0
        const idf = skillIDF[n] ?? 1.0; // ~0.85 .. 1.35 typically
        return base * typeWeight * idf;
      });

      // Weighted cosine similarity
      let num = 0, denA = 0, denB = 0, wsum = 0;
      for (let i = 0; i < names.length; i++) {
        const w = weights[i] || 1;
        const a = va[i] || 0;
        const b = vb[i] || 0;
        num += w * a * b;
        denA += w * a * a;
        denB += w * b * b;
        wsum += w;
      }
      if (denA <= 0 || denB <= 0) return 0;
      let cosine = num / (Math.sqrt(denA) * Math.sqrt(denB)); // 0..1

      // Penalize large positive gaps on high-importance skills in target
      let gapAccum = 0;
      for (let i = 0; i < names.length; i++) {
        const w = weights[i] || 1;
        const a = va[i] || 0;
        const b = vb[i] || 0;
        if (b > a) {
          const g = (b - a) / 5; // 0..1
          gapAccum += w * g * g; // quadratic penalty
        }
      }
      const gapNorm = wsum > 0 ? Math.min(0.35, gapAccum / (wsum || 1)) : 0; // cap penalty influence
      const score01 = Math.max(0, Math.min(1, cosine - 0.5 * gapNorm));
      return Math.round(score01 * 100);
    },
    [skillIDF]
  );

  // Brief explanation: top strengths and gaps for a transition
  const explainMatch = React.useCallback((currentJob, targetJob, max = 3) => {
    const [va, vb, names] = alignVectors(currentJob, targetJob);
    const diffs = names.map((n, i) => ({
      name: n,
      current: va[i] || 0,
      target: vb[i] || 0,
      gap: (vb[i] || 0) - (va[i] || 0),
      type: classifyType((targetJob?.skillTypeByName?.[n] ?? currentJob?.skillTypeByName?.[n]) || ''),
    }));
    const strengths = diffs
      .filter((d) => d.gap <= 0 && d.target > 0)
      .sort((a, b) => b.target - a.target)
      .slice(0, max);
    const gaps = diffs
      .filter((d) => d.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, max);
    return { strengths, gaps };
  }, []);

  // Matching against the currently selected job (right panel list)
  const matchingJobsForSelected = useMemo(() => {
    if (!selectedJob) return [];
    return jobs
      .filter((job) => job.id !== selectedJob.id)
      .map((job) => ({ ...job, similarity: simScore(selectedJob, job) }))
      .filter((job) => job.similarity >= 70)
      .sort((a, b) => b.similarity - a.similarity);
  }, [selectedJob, jobs, simScore]);

  // Global recommendations for "My Position"
  const recommendationsForMyPosition = useMemo(() => {
    if (!myPosition) return [];
    return jobs
      .filter((job) => job.id !== myPosition.id)
      .map((job) => ({ ...job, similarity: simScore(myPosition, job) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);
  }, [myPosition, jobs, simScore]);

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

  /* ---------- My Position Picker (separate section) ---------- */
  const myPickerJobs = useMemo(() => {
    if (myPickerDivision === 'all') return jobs;
    return jobs.filter((j) => j.division === myPickerDivision);
  }, [jobs, myPickerDivision]);

  const setMyPositionFromPicker = () => {
    if (!myPickerTitle) return;
    setMyPositionTitle(myPickerTitle);
  };

  const startingRoleMessage = myPosition
    ? myPosition.title
    : 'Set a home position in “My Position” to personalise your roadmap.';

  return (
    <div className="page solid-bg">
      <SiteHeader />

      {/* Content */}
      <div className="container content">
        <div className="page-heading">
          <div className="page-heading-main">
            <div className="page-heading-icon" aria-hidden="true">
              <Route className="icon-md" />
            </div>
            <div>
              <h1 className="page-heading-title">SPH Career Explorer</h1>
              <p className="page-heading-subtitle">
                Explore SPH roles, compare skills, and shortlist next-step opportunities.
              </p>
            </div>
          </div>
        </div>

        

        {/* ========== SECTION: My Position ========== */}
        <section ref={myPositionRef}>
          <h2 className="section-h2">My Position</h2>
          <div className="card section" style={{ marginBottom: 16 }}>
            <div className="toolbar-grid">
              <div className="field">
                <label className="text-sm muted">Function</label>
                <select
                  className="input"
                  value={myPickerDivision}
                  onChange={(e) => {
                    setMyPickerDivision(e.target.value);
                    setMyPickerTitle('');
                  }}
                >
                  <option value="all">All Functions</option>
                  {divisions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="text-sm muted">Position</label>
                <select
                  className="input"
                  value={myPickerTitle}
                  onChange={(e) => setMyPickerTitle(e.target.value)}
                >
                  <option value="">Select your position...</option>
                  {myPickerJobs.map((j) => (
                    <option key={j.id} value={j.title}>
                      {j.title} - {j.division}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row gap-12" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={setMyPositionFromPicker} disabled={!myPickerTitle}>
                Set as My Position
              </button>
              {myPosition && (
                <button
                  className="btn"
                  onClick={() =>
                    navigate('/roadmap', {
                      state: { currentTitle: myPosition.title },
                    })
                  }
                >
                  Plan from My Position
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Filters for browsing */}
        <div className="toolbar card">
          <div className="toolbar-grid">
            <div className="field">
              <Search className="icon-sm muted abs-left" />
              <input
                type="text"
                placeholder="Search jobs by title or division..."
                className="input pl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search jobs"
              />
            </div>
            <div className="field">
              <Filter className="icon-sm muted abs-left" />
              <select
                className="input pl"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                aria-label="Filter by division"
              >
                <option value="all">All Divisions</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ========== SECTION: Recommendations for My Position ========== */}
        {myPosition && (
          <>
            <h2 className="section-h2">Recommendations</h2>
            {recommendationsForMyPosition.length > 0 ? (
              <div className="card section" style={{ marginBottom: 16 }}>
                <div className="grid-cards">
                  {recommendationsForMyPosition.map((job) => {
                    const badge = getSimilarityBadge(job.similarity);
                    const exp = explainMatch(myPosition, job);
                    const sFunc = exp.strengths.filter((s) => s.type === 'functional').map((s) => s.name).join(', ');
                    const sSoft = exp.strengths.filter((s) => s.type === 'soft').map((s) => s.name).join(', ');
                    const gFunc = exp.gaps.filter((g) => g.type === 'functional').map((g) => `${g.name} (+${g.gap})`).join(', ');
                    const gSoft = exp.gaps.filter((g) => g.type === 'soft').map((g) => `${g.name} (+${g.gap})`).join(', ');
                    return (
                      <div key={job.id} className={getSimilarityColor(job.similarity)}>
                        <div className="row space-between mb-6">
                          <h4 className="text-sm text-600">{job.title}</h4>
                          <span className={badge.color}>{badge.label}</span>
                        </div>
                        <p className="text-xs muted mb-8">{job.division}</p>
                        {(exp.strengths.length > 0 || exp.gaps.length > 0) && (
                          <div className="text-xs muted mb-8">
                            {sFunc && <div>Strengths (Functional): {sFunc}</div>}
                            {sSoft && <div>Strengths (Soft): {sSoft}</div>}
                            {gFunc && <div>Gaps (Functional): {gFunc}</div>}
                            {gSoft && <div>Gaps (Soft): {gSoft}</div>}
                          </div>
                        )}
                        <button
                          className="btn primary full row center"
                          onClick={() =>
                            navigate('/roadmap', {
                              state: { currentTitle: myPosition.title, targetTitle: job.title },
                            })
                          }
                          title="Plan this move in the roadmap"
                        >
                          <Route className="icon-xs mr-6 white" />
                          Plan in Roadmap
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty">No recommendations yet.</div>
            )}
          </>
        )}

        {/* ========== SECTION: Browse Positions ========== */}
        <h2 className="section-h2" id="browse">Browse Positions</h2>
        <div className="layout">
          {/* Left: groups */}
          <div className={selectedJob ? 'col main half' : 'col main full'}>
            {Object.keys(groupedJobs).map((division) => (
              <div key={division} className="card section">
                <h3 className="title-md mb-16">{division}</h3>
                <div className="grid-cards">
                  {groupedJobs[division].map((job) => {
                    const isSelected = selectedJob && selectedJob.id === job.id;

                    // Compatibility vs My Position
                    let compatBadge = null;
                    let borderStyle = {};
                    if (myPosition) {
                      const sim = simScore(myPosition, job);
                      const badge = getSimilarityBadge(sim);
                      compatBadge = <span className={badge.color}>{badge.label}</span>;
                      if (sim >= 90) borderStyle = { borderColor: 'var(--green)' };
                      else if (sim >= 80) borderStyle = { borderColor: 'var(--yellow)' };
                      else if (sim >= 70) borderStyle = { borderColor: 'var(--orange)' };
                      else borderStyle = { borderColor: '#d1d5db' };
                    }

                    return (
                      <button
                        key={job.id}
                        className={'job-pill ' + (isSelected ? 'selected' : '')}
                        style={borderStyle}
                        onClick={() => setSelectedJob(job)}
                        aria-pressed={isSelected}
                        title={`Open ${job.title}`}
                      >
                        <div className="text-600 row space-between align-center">
                          <span>{job.title}</span>
                          {myPosition && compatBadge}
                        </div>
                        <div className="muted text-xs mt-4">
                          {(job.division || '').split(' ')[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {Object.keys(groupedJobs).length === 0 && (
              <div className="empty">
                <Users className="icon-xl muted mb-12" />
                <h3>No jobs found</h3>
                <p className="muted">Try adjusting your search criteria</p>
              </div>
            )}
          </div>

          {/* Right: details */}
          {selectedJob && (
            <aside className="col side sticky">
              <div className="card">
                <div className="row space-between align-center solid-bg header-pad">
                  <div className="row align-center gap-12">
                    <div className="header-icon">
                      <Briefcase className="icon-sm white" />
                    </div>
                    <div>
                      <h3 className="title-md">{selectedJob.title}</h3>
                      <p className="muted row align-center">
                        <MapPin className="icon-xs mr-6" />
                        {selectedJob.division}
                      </p>
                    </div>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => setSelectedJob(null)}
                    aria-label="Close details"
                  >
                    <X className="icon-sm" />
                  </button>
                </div>

                <div className="pad scroll-300">
                  {/* Save as My Position + quick planner */}
                  <div className="row gap-12 mb-16">
                    <button
                      className="btn"
                      onClick={() => setMyPositionTitle(selectedJob.title)}
                      title="Save this as My Position"
                    >
                      Set as My Position
                    </button>
                    <button
                      className="btn"
                      onClick={() =>
                        navigate('/roadmap', {
                          state: { currentTitle: selectedJob.title },
                        })
                      }
                      title="Use this as your Current job in roadmap"
                    >
                      Use as Current
                    </button>
                    <button
                      className="btn"
                      onClick={() =>
                        navigate('/roadmap', {
                          state: {
                            ...(myPosition?.title ? { currentTitle: myPosition.title } : {}),
                            targetTitle: selectedJob.title,
                          },
                        })
                      }
                      title="Use this as your Target job in roadmap"
                    >
                      Use as Target
                    </button>
                  </div>

                  {/* Description */}
                  <section className="mb-16">
                    <h4 className="text-600 mb-8">Job Description</h4>
                    <p className="muted text-sm lh">{selectedJob.description}</p>
                  </section>

                  {/* Skills (split by type) */}
                  <section className="mb-16">
                    <h4 className="text-600 mb-8">Skills Profile</h4>
                    <div className="column gap-8">
                      {selectedJob.skillOrder.length ? (
                        <>
                          {selectedJobSkillsByType.functional.length > 0 && (
                            <div>
                              <h5 className="text-sm text-600 mb-6">Functional</h5>
                              {selectedJobSkillsByType.functional.map((name, i) => {
                                const val = selectedJob.skillMap[name] ?? 0;
                                const def = selectedJob.skillDefByName?.[name];
                                return (
                                  <div key={name + i}>
                                    <div className="row space-between">
                                      <span className="muted text-sm"><strong>{name}</strong></span>
                                      <span className="text-sm text-600">{val}/5</span>
                                    </div>
                                    {def && <div className="text-xs muted mb-4">{def}</div>}
                                    <div className="bar">
                                      <div
                                        className="bar-fill blue"
                                        style={{ width: (val / 5) * 100 + '%' }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {selectedJobSkillsByType.soft.length > 0 && (
                            <div>
                              <h5 className="text-sm text-600 mb-6">Soft</h5>
                              {selectedJobSkillsByType.soft.map((name, i) => {
                                const val = selectedJob.skillMap[name] ?? 0;
                                const def = selectedJob.skillDefByName?.[name];
                                return (
                                  <div key={name + i}>
                                    <div className="row space-between">
                                      <span className="muted text-sm"><strong>{name}</strong></span>
                                      <span className="text-sm text-600">{val}/5</span>
                                    </div>
                                    {def && <div className="text-xs muted mb-4">{def}</div>}
                                    <div className="bar">
                                      <div
                                        className="bar-fill blue"
                                        style={{ width: (val / 5) * 100 + '%' }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="muted text-sm">No skill data available for this title.</p>
                      )}
                    </div>
                  </section>

                  {/* Similar (to the selected job) */}
                  <section>
                    <h4 className="text-600 mb-8 row align-center">
                      <TrendingUp className="icon-sm mr-8 green" />
                      Similar Career Opportunities
                    </h4>

                    {matchingJobsForSelected.length > 0 ? (
                      <div className="column gap-8 scroll-180">
                        {matchingJobsForSelected.map((job) => {
                          const badge = getSimilarityBadge(job.similarity);
                          const exp = explainMatch(selectedJob, job);
                          const sFunc = exp.strengths.filter((s) => s.type === 'functional').map((s) => s.name).join(', ');
                          const sSoft = exp.strengths.filter((s) => s.type === 'soft').map((s) => s.name).join(', ');
                          const gFunc = exp.gaps.filter((g) => g.type === 'functional').map((g) => `${g.name} (+${g.gap})`).join(', ');
                          const gSoft = exp.gaps.filter((g) => g.type === 'soft').map((g) => `${g.name} (+${g.gap})`).join(', ');
                          return (
                            <div
                              key={job.id}
                              className={getSimilarityColor(job.similarity)}
                            >
                              <div className="row space-between mb-6">
                                <h5 className="text-sm text-600">{job.title}</h5>
                                <span className={badge.color}>{badge.label}</span>
                              </div>
                              <p className="text-xs muted mb-8">{job.division}</p>
                              {(exp.strengths.length > 0 || exp.gaps.length > 0) && (
                                <div className="text-xs muted mb-8">
                                  {sFunc && <div>Strengths (Functional): {sFunc}</div>}
                                  {sSoft && <div>Strengths (Soft): {sSoft}</div>}
                                  {gFunc && <div>Gaps (Functional): {gFunc}</div>}
                                  {gSoft && <div>Gaps (Soft): {gSoft}</div>}
                                </div>
                              )}
                              <div className="row gap-12">
                                <button
                                  className="btn primary full row center"
                                  onClick={() =>
                                    navigate('/roadmap', {
                                      state: { currentTitle: selectedJob.title, targetTitle: job.title },
                                    })
                                  }
                                  title="Open roadmap with these roles"
                                >
                                  <Route className="icon-xs mr-6 white" />
                                  Plan in Roadmap
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty small">
                        <TrendingUp className="icon-md muted" />
                        <p className="text-sm muted mt-6">No similar positions found</p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Roadmap call-to-action */}
        <h2 className="section-h2">Explorer Roadmap Planner</h2>
        <div className="card section" style={{ marginTop: 8 }}>
          <p className="muted text-sm">
            Build your transition plan on the dedicated roadmap page. We'll carry over your saved starting role
            and any selected targets so you can see the full skill story.
          </p>
          <div className="row gap-12 wrap" style={{ marginTop: 12 }}>
            <Link to="/roadmap" state={roadmapLinkState} className="btn primary">
              <Route className="icon-xs mr-6 white" />
              Open roadmap planner
            </Link>
            {selectedJob && (
              <Link
                to="/roadmap"
                state={selectedJobRoadmapState}
                className="btn ghost"
              >
                <Route className="icon-xs mr-6" />
                Plan with {selectedJob.title}
              </Link>
            )}
          </div>
          {!myPosition && (
            <p className="muted text-xs" style={{ marginTop: 12 }}>
              Tip: Save your current role in the My Position section above to prefill the planner automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSkillsMatcher;


