// src/components/JobSkillsMatcher.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, TrendingUp } from 'lucide-react';
import '../styles/main.css';
import '../styles/layouts/career-explorer.css';
import useJobDataset from '../hooks/useJobDataset';
import {
  classifyType,
  computeTransitionSimilarity,
  summarizeTransition,
} from '../utils/jobDataUtils';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import JobInsightCanvas from './JobInsightCanvas';
import FeaturePanel from './FeaturePanel';
import ErrorState from './ErrorState';
import {IMPROVEMENT_FORM_URL } from '../data/feedbackLinks';

/* ------------------------- Main Component (Single Page) ------------------------- */
const JobSkillsMatcher = () => {
  const navigate = useNavigate();
  const { jobs, divisions, skillIDF, ready, error } = useJobDataset();
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const filtersRef = useRef(null);
  const resultsRef = useRef(null);
  const insightRef = useRef(null);

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


  useEffect(() => {
    if (selectedJob && insightRef.current) {
      insightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedJob]);

  useRevealOnScroll(
    selectedJob ? selectedJob.id : 0,
    filteredJobs.length,
    matchingJobsForSelected.length
  );


  const selectedJobSummary = useMemo(() => {
    if (!selectedJob) {
      return { objective: '', cluster: '', clusterDef: '', description: '' };
    }
  
    return {
      objective: (selectedJob.objective || '').trim(),
      cluster: (selectedJob.cluster || '').trim(),
      clusterDef: (selectedJob.clusterDef || '').trim(),
      description: (selectedJob.description || '').trim(),
    };
  }, [selectedJob]);
  
  const handleBrowseRoles = () => {
    if (filtersRef.current) {
      filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const handlePlanRoadmap = React.useCallback(
    (state) => {
      navigate('/roadmap', { state });
    },
    [navigate]
  );
  
  const featureSecondaryActions = useMemo(
    () => [
      {
        label: 'Open roadmap planner',
        onClick: () => handlePlanRoadmap(undefined),
        importance: 'secondary',
        icon: <TrendingUp className="icon-xs" aria-hidden="true" />,
      },
    ],
    [handlePlanRoadmap]
  );

  const missingRoleLink = useMemo(() => {
    const baseUrl = IMPROVEMENT_FORM_URL;
    try {
      const url = new URL(baseUrl);
      const params = new URLSearchParams(url.search);
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        params.set('role', trimmedSearch);
      }
      if (selectedDivision && selectedDivision !== 'all') {
        params.set('division', selectedDivision);
      } else {
        params.delete('division');
      }
      url.search = params.toString();
      return url.toString();
    } catch (err) {
      return baseUrl;
    }
  }, [searchTerm, selectedDivision]);
  
  const handleOpenJob = React.useCallback(
    (job) => {
      if (!job) return;
      setSelectedJob(job);
    },
    []
  );
  
  const handleCloseJob = React.useCallback(() => {
    setSelectedJob(null);
  }, []);
  if (error) {
    return (
      <div className="page solid-bg experience-page experience-page--explorer explorer-page">
        <div className="content experience-content experience-content--wide">
          <ErrorState
            description="We couldn't load the career dataset right now. Please try again."
            onRetry={
              typeof window !== 'undefined'
                ? () => window.location.reload()
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page solid-bg experience-page experience-page--explorer explorer-page">
      <div className="content experience-content experience-content--wide">
        <FeaturePanel
          mode="A"
          personalisationEnabled={false}
          data={{
            jobs,
            divisions,
            ready,
            secondaryActions: featureSecondaryActions,
          }}
          onPrimary={handleBrowseRoles}
        />
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
              <div className="explorer-layout" data-animate="fade-stagger">
                <div className="explorer-results">
                  {Object.keys(groupedJobs).length ? (
                    Object.keys(groupedJobs).map((division) => {
                      const isActiveGroup = selectedJob && selectedJob.division === division;

                      return (
                        <div key={division} className="explorer-group">
                          <div className="explorer-group__header">
                            <h3 className="explorer-group__title">{division}</h3>
                            <span className="explorer-group__count">{groupedJobs[division].length} roles</span>
                          </div>
                          <div className="explorer-card-grid">
                            {groupedJobs[division].map((job) => {
                              const isSelected = selectedJob && selectedJob.id === job.id;
                              const summarySource = (job.description || job.objective || job.clusterDef || '')
                                .replace(/\s+/g, ' ')
                                .trim();
                              const summaryText = summarySource.length > 0
                                ? summarySource.length > 160
                                  ? `${summarySource.slice(0, 157).trimEnd()}...`
                                  : summarySource
                                : '';
                              const clusterLabel = (job.cluster || '').trim();
                              const accessibleLabel = summaryText
                                ? `Open ${job.title}. ${summaryText}`
                                : `Open ${job.title}`;
                              const cardClasses = ['explorer-card'];
                              if (isSelected) cardClasses.push('is-active');

                              return (
                                <button
                                  key={job.id}
                                  type="button"
                                  className={cardClasses.join(' ')}
                                  onClick={() => handleOpenJob(job)}
                                  aria-pressed={isSelected}
                                  title={`Open ${job.title}`}
                                  aria-label={accessibleLabel}
                                >
                                  <span className="explorer-card__title">{job.title}</span>
                                  <span className="explorer-card__meta">{job.division}</span>
                                  {clusterLabel && (
                                    <span className="explorer-card__cluster">{clusterLabel}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {isActiveGroup && selectedJob && (
                            <div className="explorer-insight-row">
                              <JobInsightCanvas
                                ref={insightRef}
                                job={selectedJob}
                                onClose={handleCloseJob}
                                onPlanRoadmap={handlePlanRoadmap}
                                summary={selectedJobSummary}
                                skillsByType={selectedJobSkillsByType}
                                inline
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="explorer-empty">
                      <Users className="icon-xl" />
                      <p>No roles match your filters just yet. Try a different combination.</p>
                      <a
                        className="button button--secondary explorer-empty__cta"
                        href={missingRoleLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Request a role we're missing
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </section>
        </main>
      </div>
    </div>
  );

};

export default JobSkillsMatcher;
