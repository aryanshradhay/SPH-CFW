// src/components/CareerRoadmap.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Route as RouteIcon,
  Users,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  BookOpen,
  MapPin,
  TrendingUp,
  Sparkles,
  Compass,
} from 'lucide-react';
import useJobDataset from '../hooks/useJobDataset';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import {
  alignVectors,
  classifyType,
  getTrainingRecommendations,
  computeTransitionSimilarity,
  summarizeTransition,
  getSimilarityBadge,
} from '../utils/jobDataUtils';
import '../styles/main.css';
import '../styles/layouts/career-roadmap.css';
import FeaturePanel from './FeaturePanel';
import ErrorState from './ErrorState';

const RoadmapDetails = ({ currentJob, targetJob }) => {
  const [va, vb, names] = useMemo(
    () => (currentJob && targetJob ? alignVectors(currentJob, targetJob) : [[], [], []]),
    [currentJob, targetJob]
  );

  const typeByName = useMemo(() => {
    const map = {};
    names.forEach((n) => {
      const tRaw = targetJob?.skillTypeByName?.[n] ?? currentJob?.skillTypeByName?.[n] ?? '';
      map[n] = classifyType(tRaw);
    });
    return map;
  }, [names, currentJob, targetJob]);

  const groups = useMemo(() => {
    const g = { similar: [], fair: [], needWork: [] };

    names.forEach((n, i) => {
      const cur = va[i] ?? 0;
      const tar = vb[i] ?? 0;

      if (tar <= cur) {
        g.similar.push({ name: n, current: cur, target: tar, gap: 0 });
        return;
      }

      const posGap = tar - cur;
      const item = { name: n, current: cur, target: tar, gap: posGap };

      if (posGap <= 1) g.similar.push(item);
      else if (posGap <= 2) g.fair.push(item);
      else g.needWork.push(item);
    });

    return g;
  }, [va, vb, names]);

  const groupsByType = useMemo(() => {
    const mk = () => ({ similar: [], fair: [], needWork: [] });
    const out = { functional: mk(), soft: mk(), unknown: mk() };
    const add = (bucket, arr) => {
      arr.forEach((s) => {
        const t = typeByName[s.name] || 'unknown';
        out[t][bucket].push({ ...s, type: t });
      });
    };
    add('similar', groups.similar);
    add('fair', groups.fair);
    add('needWork', groups.needWork);
    return out;
  }, [groups, typeByName]);

  const Group = ({ title, icon, tone, items }) => {
    if (!items.length) return null;
    return (
      <div className={`roadmap-group tone-${tone}`}>
        <div className="roadmap-group__header">
          <div className="roadmap-group__icon">{icon}</div>
          <div className="roadmap-group__title">{title}</div>
          <span className="roadmap-group__count">{items.length}</span>
        </div>
        <div className="roadmap-group__grid">
          {items.map((s, i) => {
            const recs = getTrainingRecommendations(
              s.name,
              s.type || typeByName[s.name] || '',
              Math.abs(s.gap)
            );
            return (
              <div key={i} className="roadmap-card">
                <div className="roadmap-card__header">
                  <h4>{s.name}</h4>
                  <span className="roadmap-card__range">
                    {s.current}/5 -> {s.target}/5
                  </span>
                </div>
                <div className="roadmap-card__body">
                  <div className="roadmap-card__gap">
                    Gap: {s.gap > 0 ? '+' : ''}
                    {s.gap} levels
                  </div>
                  <div
                    className="bar"
                    role="img"
                    aria-label={`Current level ${s.current} out of 5, target level ${s.target} out of 5`}
                  >
                    <div
                      className="bar__segment bar__segment--target"
                      style={{ width: Math.min(100, (s.target / 5) * 100) + '%' }}
                    />
                    <div
                      className="bar__segment bar__segment--current"
                      style={{ width: Math.min(100, (s.current / 5) * 100) + '%' }}
                    />
                  </div>
                </div>
                <div className="roadmap-card__footer">
                  <span className="roadmap-card__label">Recommended training from SPH Academy</span>
                  {recs.map((t, idx) => (
                    <div key={idx} className="roadmap-card__training">
                      <BookOpen className="icon-xs" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!currentJob || !targetJob) return null;

  return (
    <div className="roadmap-insights" data-animate="fade-up">
      <div className="roadmap-insights__header">
        <div className="roadmap-insights__icon">
          <RouteIcon className="icon-sm" />
        </div>
        <div>
          <h2>Career transition roadmap</h2>
          <p>Key skill shifts to move from your current role to the target.</p>
        </div>
      </div>

      <div className="roadmap-insights__meta">
        <div>
          <span className="roadmap-insights__label">Current role</span>
          <span className="roadmap-insights__value">{currentJob.title}</span>
        </div>
        <div className="roadmap-insights__divider" aria-hidden="true" />
        <div>
          <span className="roadmap-insights__label">Target role</span>
          <span className="roadmap-insights__value">{targetJob.title}</span>
        </div>
      </div>

      <Group
        title="Functional strengths"
        icon={<CheckCircle className="icon-sm" />}
        tone="green"
        items={groupsByType.functional.similar}
      />
      <Group
        title="Functional focus areas"
        icon={<AlertCircle className="icon-sm" />}
        tone="yellow"
        items={groupsByType.functional.fair}
      />
      <Group
        title="Critical functional gaps"
        icon={<XCircle className="icon-sm" />}
        tone="red"
        items={groupsByType.functional.needWork}
      />

      <Group
        title="Soft skill strengths"
        icon={<CheckCircle className="icon-sm" />}
        tone="green"
        items={groupsByType.soft.similar}
      />
      <Group
        title="Soft skill focus areas"
        icon={<AlertCircle className="icon-sm" />}
        tone="yellow"
        items={groupsByType.soft.fair}
      />
      <Group
        title="Critical soft skill gaps"
        icon={<XCircle className="icon-sm" />}
        tone="red"
        items={groupsByType.soft.needWork}
      />

      {(groupsByType.unknown.similar.length ||
        groupsByType.unknown.fair.length ||
        groupsByType.unknown.needWork.length) > 0 && (
        <Group
          title="Additional skills"
          icon={<Sparkles className="icon-sm" />}
          tone="lilac"
          items={[
            ...groupsByType.unknown.similar,
            ...groupsByType.unknown.fair,
            ...groupsByType.unknown.needWork,
          ]}
        />
      )}
    </div>
  );
};

export default function CareerRoadmap() {
  const { jobs, divisions, skillIDF, ready, error } = useJobDataset();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTitle: stateCurrentTitle = '', targetTitle: stateTargetTitle = '' } =
    location.state || {};

  const [plannerCurrentDivision, setPlannerCurrentDivision] = useState('all');
  const [plannerTargetDivision, setPlannerTargetDivision] = useState('all');
  const [plannerCurrentTitle, setPlannerCurrentTitle] = useState('');
  const [plannerTargetTitle, setPlannerTargetTitle] = useState('');

  useEffect(() => {
    if (stateCurrentTitle) {
      setPlannerCurrentTitle(stateCurrentTitle);
    }
  }, [stateCurrentTitle]);

  useEffect(() => {
    if (stateTargetTitle) {
      setPlannerTargetTitle(stateTargetTitle);
    }
  }, [stateTargetTitle]);

  const plannerCurrentJobs = useMemo(() => {
    if (plannerCurrentDivision === 'all') return jobs;
    return jobs.filter((j) => j.division === plannerCurrentDivision);
  }, [jobs, plannerCurrentDivision]);

  const plannerTargetJobs = useMemo(() => {
    if (plannerTargetDivision === 'all') return jobs;
    return jobs.filter((j) => j.division === plannerTargetDivision);
  }, [jobs, plannerTargetDivision]);

  const plannerCurrentJob = useMemo(
    () => jobs.find((j) => j.title === plannerCurrentTitle) || null,
    [jobs, plannerCurrentTitle]
  );

  const plannerTargetJob = useMemo(
    () => jobs.find((j) => j.title === plannerTargetTitle) || null,
    [jobs, plannerTargetTitle]
  );

  const simScore = useCallback(
    (currentJob, targetJob) =>
      computeTransitionSimilarity(currentJob, targetJob, skillIDF),
    [skillIDF]
  );

  const recommendationsForCurrentRole = useMemo(() => {
    if (!plannerCurrentJob) return [];
    const myRank = plannerCurrentJob.seniorityRank ?? null;
    return jobs
      .filter((job) => job.id !== plannerCurrentJob.id)
      .map((job) => ({
        ...job,
        similarity: simScore(plannerCurrentJob, job),
        summary: summarizeTransition(plannerCurrentJob, job, 2),
      }))
      .filter((job) => {
        if (myRank == null) return true;
        if (job.seniorityRank == null) return true;
        return job.seniorityRank >= myRank;
      })
      .filter((job) => job.similarity >= 60)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);
  }, [jobs, plannerCurrentJob, simScore]);

  const ensurePlannerCanShowJob = useCallback(
    (jobTitle, type) => {
      if (!jobTitle) return;
      const job = jobs.find((j) => j.title === jobTitle);
      if (!job) return;
      if (type === 'current') {
        const division = job.division || 'all';
        if (plannerCurrentDivision === 'all' && division !== 'all') {
          setPlannerCurrentDivision(division);
        } else if (plannerCurrentDivision !== 'all' && job.division !== plannerCurrentDivision) {
          setPlannerCurrentDivision(division);
        }
      } else if (type === 'target') {
        const division = job.division || 'all';
        if (plannerTargetDivision === 'all' && division !== 'all') {
          setPlannerTargetDivision(division);
        } else if (plannerTargetDivision !== 'all' && job.division !== plannerTargetDivision) {
          setPlannerTargetDivision(division);
        }
      }
    },
    [jobs, plannerCurrentDivision, plannerTargetDivision]
  );

  useEffect(() => {
    ensurePlannerCanShowJob(plannerCurrentTitle, 'current');
  }, [ensurePlannerCanShowJob, plannerCurrentTitle]);

  useEffect(() => {
    ensurePlannerCanShowJob(plannerTargetTitle, 'target');
  }, [ensurePlannerCanShowJob, plannerTargetTitle]);

  const hasSelection = plannerCurrentJob && plannerTargetJob;

  const scrollToPlanner = () => {
    const el = document.getElementById('roadmap-planner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLaunchExplorer = useCallback(() => {
    navigate('/career-explorer');
  }, [navigate]);

  const featureSecondaryActions = useMemo(
    () => [
      {
        label: 'Launch career explorer',
        onClick: handleLaunchExplorer,
        importance: 'secondary',
        icon: <Compass className="icon-xs" aria-hidden="true" />,
      },
    ],
    [handleLaunchExplorer]
  );

  const getToneForScore = (score) => {
    if (score >= 90) return 'tone-green';
    if (score >= 80) return 'tone-yellow';
    if (score >= 70) return 'tone-lilac';
    if (score >= 60) return 'tone-blue';
    return 'tone-neutral';
  };

  useRevealOnScroll(plannerCurrentTitle, plannerTargetTitle, recommendationsForCurrentRole.length, jobs.length);

  if (error) {
    return (
      <div className="page solid-bg experience-page experience-page--roadmap">
        <div className="content experience-content experience-content--wide">
          <ErrorState
            description="We couldn't load the roadmap data right now. Please try again."
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
    <div className="page solid-bg experience-page experience-page--roadmap">
      <div className="content experience-content experience-content--wide">
        <FeaturePanel
          mode="B"
          data={{
            jobs,
            divisions,
            ready,
            metrics: [
              { label: 'Roles mapped', value: jobs?.length ?? '-', tone: 'purple' },
              { label: 'Functions covered', value: divisions?.length ?? '-', tone: 'yellow' },
            ],
            secondaryActions: featureSecondaryActions,
          }}
          permissions={{}}
          personalisationEnabled={false}
          onPrimary={scrollToPlanner}
        />

        <section id="roadmap-planner" className="roadmap-panel" data-animate="fade-up">
          <div className="roadmap-panel__grid">
            <div className="roadmap-card-block">
              <div className="roadmap-card-block__header">
                <RouteIcon className="icon-sm" />
                <div>
                  <h2>Roadmap planner</h2>
                  <p>Select your current and target roles to reveal the skill roadmap.</p>
                </div>
              </div>
              <div className="roadmap-card-block__body roadmap-card-block__body--grid">
                <div className="field field--elevated">
                  <label className="field__label" htmlFor="planner-current-division">
                    Current role function
                  </label>
                  <div className="field__control">
                    <Filter className="icon-sm field__icon" />
                    <select
                      id="planner-current-division"
                      className="input input--elevated"
                      value={plannerCurrentDivision}
                      onChange={(e) => {
                        setPlannerCurrentDivision(e.target.value);
                        setPlannerCurrentTitle('');
                      }}
                    >
                      <option value="all">All functions</option>
                      {divisions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field field--elevated">
                  <label className="field__label" htmlFor="planner-current">
                    Current role
                  </label>
                  <div className="field__control">
                    <MapPin className="icon-sm field__icon" />
                    <select
                      id="planner-current"
                      className="input input--elevated"
                      value={plannerCurrentTitle}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPlannerCurrentTitle(value);
                        ensurePlannerCanShowJob(value, 'current');
                      }}
                    >
                      <option value="">Select current role...</option>
                      {plannerCurrentJobs.map((job) => (
                        <option key={job.id} value={job.title}>
                          {job.title} - {job.division}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field field--elevated">
                  <label className="field__label" htmlFor="planner-target-division">
                    Target role function
                  </label>
                  <div className="field__control">
                    <Filter className="icon-sm field__icon" />
                    <select
                      id="planner-target-division"
                      className="input input--elevated"
                      value={plannerTargetDivision}
                      onChange={(e) => {
                        setPlannerTargetDivision(e.target.value);
                        setPlannerTargetTitle('');
                      }}
                    >
                      <option value="all">All functions</option>
                      {divisions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field field--elevated">
                  <label className="field__label" htmlFor="planner-target">
                    Target role
                  </label>
                  <div className="field__control">
                    <TrendingUp className="icon-sm field__icon" />
                    <select
                      id="planner-target"
                      className="input input--elevated"
                      value={plannerTargetTitle}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPlannerTargetTitle(value);
                        ensurePlannerCanShowJob(value, 'target');
                      }}
                    >
                      <option value="">Select target role...</option>
                      {plannerTargetJobs.map((job) => (
                        <option key={job.id} value={job.title}>
                          {job.title} - {job.division}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="roadmap-card-block__tips">
                <Users className="icon-sm" />
                <p>Tip: experiment with multiple targets to compare effort and skill emphasis.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="roadmap-results" data-animate="fade-stagger">
          {hasSelection ? (
            <RoadmapDetails currentJob={plannerCurrentJob} targetJob={plannerTargetJob} />
          ) : (
            <div className="explorer-empty">
              {ready ? (
                <p>Pick both a current and a target role to reveal the roadmap insights.</p>
              ) : (
                <p>Loading roles from the career framework...</p>
              )}
            </div>
          )}
        </section>

        <section className="roadmap-recommendations" data-animate="fade-up">
          <div className="roadmap-recommendations__header">
            <div>
              <h2 className="section-h2">Personalised recommendations</h2>
              <p className="muted text-sm">
                Discover adjacent roles that build on the strengths of your selected current role.
              </p>
            </div>
          </div>

          {plannerCurrentJob ? (
            recommendationsForCurrentRole.length > 0 ? (
              <div className="roadmap-recommendations__grid">
                {recommendationsForCurrentRole.map((job) => {
                  const badge = getSimilarityBadge(job.similarity);
                  const toneClass = getToneForScore(job.similarity);
                  const strengths = job.summary.strengths.map((s) => s.name).join(', ');
                  const gaps = job.summary.gaps.map((g) => `${g.name} (+${g.gap})`).join(', ');
                  return (
                    <div key={job.id} className={`roadmap-recommendation ${toneClass}`}>
                      <div className="roadmap-recommendation__header">
                        <div>
                          <h3>{job.title}</h3>
                          <span className="muted text-xs">{job.division}</span>
                        </div>
                        <span className={badge.color}>{badge.label}</span>
                      </div>
                      {(strengths || gaps) && (
                        <div className="roadmap-recommendation__summary">
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
                      <div className="roadmap-recommendation__actions">
                        <button
                          type="button"
                          className="button"
                          onClick={() => {
                            ensurePlannerCanShowJob(plannerCurrentJob.title, 'current');
                            ensurePlannerCanShowJob(job.title, 'target');
                            setPlannerCurrentTitle(plannerCurrentJob.title);
                            setPlannerTargetTitle(job.title);
                            scrollToPlanner();
                          }}
                        >
                          Plan this move
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="explorer-empty explorer-empty--inline">
                <p>We're analysing your selected current role for recommendations. Try a different function filter.</p>
              </div>
            )
          ) : (
            <div className="explorer-empty explorer-empty--inline">
              <p>Select a current role above to see tailored transitions.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

