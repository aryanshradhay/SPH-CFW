// src/components/CareerRoadmap.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Route as RouteIcon,
  MapPin,
  Users,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  BookOpen,
} from 'lucide-react';
import useJobDataset from '../hooks/useJobDataset';
import {
  alignVectors,
  classifyType,
  getTrainingRecommendations,
} from '../utils/jobDataUtils';
import '../styles/main.css';
import SiteHeader from './SiteHeader';

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

  const Group = ({ title, icon, color, items }) => {
    if (!items.length) return null;
    return (
      <div className={`panel panel-${color}`}>
        <h3 className="panel-title">
          {icon}
          {title} ({items.length})
        </h3>
        <div className="grid-two">
          {items.map((s, i) => {
            const recs = getTrainingRecommendations(
              s.name,
              s.type || typeByName[s.name] || '',
              Math.abs(s.gap)
            );
            return (
              <div key={i} className={`card border-${color}`}>
                <div className="row space-between align-center mb-8">
                  <h4 className="text-600">{s.name}</h4>
                  <div className="row gap-8 text-sm">
                    <span className={`text-${color}`}>Current: {s.current}/5</span>
                    <span className="muted" aria-hidden="true">
                      to
                    </span>
                    <span className="text-blue">Target: {s.target}/5</span>
                  </div>
                </div>
                <div className="mb-8">
                  <div className={`text-xs text-${color} mb-4`}>
                    Gap: {s.gap > 0 ? '+' : ''}
                    {s.gap} levels
                  </div>
                  <div className="bar">
                    <div
                      className={`bar-fill ${color}`}
                      style={{ width: (s.current / 5) * 100 + '%' }}
                    >
                      <div
                        className={`bar-planned ${color}`}
                        style={{ width: Math.max(0, ((s.target - s.current) / 5) * 100) + '%' }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm muted mb-8">Recommended training:</div>
                  {recs.map((t, idx) => (
                    <div key={idx} className="row text-xs muted">
                      <BookOpen className={`icon-xs mr-6 text-${color}`} />
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
    <div className="card" style={{ padding: 16 }}>
      <div className="row align-center gap-12 mb-16">
        <RouteIcon className="icon-sm" />
        <h2 className="title-md">Career Transition Roadmap</h2>
      </div>

      <div className="panel">
        <div className="row space-between">
          <div>
            <div className="text-sm muted">Current</div>
            <div className="text-600">{currentJob.title}</div>
          </div>
          <div>
            <div className="text-sm muted">Target</div>
            <div className="text-600">{targetJob.title}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Functional Skills</h3>
        <Group
          title="Already Strong"
          icon={<CheckCircle className="icon-sm mr-8" />}
          color="green"
          items={groupsByType.functional.similar}
        />
        <Group
          title="Needs Some Development"
          icon={<AlertCircle className="icon-sm mr-8" />}
          color="yellow"
          items={groupsByType.functional.fair}
        />
        <Group
          title="Needs Significant Development"
          icon={<XCircle className="icon-sm mr-8" />}
          color="red"
          items={groupsByType.functional.needWork}
        />
      </div>

      <div className="panel">
        <h3 className="panel-title">Soft Skills</h3>
        <Group
          title="Already Strong"
          icon={<CheckCircle className="icon-sm mr-8" />}
          color="green"
          items={groupsByType.soft.similar}
        />
        <Group
          title="Needs Some Development"
          icon={<AlertCircle className="icon-sm mr-8" />}
          color="yellow"
          items={groupsByType.soft.fair}
        />
        <Group
          title="Needs Significant Development"
          icon={<XCircle className="icon-sm mr-8" />}
          color="red"
          items={groupsByType.soft.needWork}
        />
      </div>

      {(groupsByType.unknown.similar.length ||
        groupsByType.unknown.fair.length ||
        groupsByType.unknown.needWork.length) > 0 && (
        <div className="panel">
          <h3 className="panel-title">Other Skills</h3>
          <Group
            title="Already Strong"
            icon={<CheckCircle className="icon-sm mr-8" />}
            color="green"
            items={groupsByType.unknown.similar}
          />
          <Group
            title="Needs Some Development"
            icon={<AlertCircle className="icon-sm mr-8" />}
            color="yellow"
            items={groupsByType.unknown.fair}
          />
          <Group
            title="Needs Significant Development"
            icon={<XCircle className="icon-sm mr-8" />}
            color="red"
            items={groupsByType.unknown.needWork}
          />
        </div>
      )}
    </div>
  );
};

export default function CareerRoadmap() {
  const { jobs, divisions, ready } = useJobDataset();
  const location = useLocation();
  const { currentTitle: stateCurrentTitle = '', targetTitle: stateTargetTitle = '' } =
    location.state || {};

  const [plannerDivision, setPlannerDivision] = useState('all');
  const [plannerCurrentTitle, setPlannerCurrentTitle] = useState('');
  const [plannerTargetTitle, setPlannerTargetTitle] = useState('');
  const [myPositionTitle] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('eva-my-position') || '';
  });

  useEffect(() => {
    if (stateCurrentTitle) {
      setPlannerCurrentTitle(stateCurrentTitle);
    } else if (!plannerCurrentTitle && myPositionTitle) {
      setPlannerCurrentTitle(myPositionTitle);
    }
  }, [stateCurrentTitle, myPositionTitle, plannerCurrentTitle]);

  useEffect(() => {
    if (stateTargetTitle) {
      setPlannerTargetTitle(stateTargetTitle);
    }
  }, [stateTargetTitle]);

  const myPosition = useMemo(
    () => jobs.find((j) => j.title === myPositionTitle) || null,
    [jobs, myPositionTitle]
  );

  const plannerJobsFiltered = useMemo(() => {
    if (plannerDivision === 'all') return jobs;
    return jobs.filter((j) => j.division === plannerDivision);
  }, [jobs, plannerDivision]);

  const plannerCurrentJob = useMemo(
    () => jobs.find((j) => j.title === plannerCurrentTitle) || null,
    [jobs, plannerCurrentTitle]
  );

  const plannerTargetJob = useMemo(
    () => jobs.find((j) => j.title === plannerTargetTitle) || null,
    [jobs, plannerTargetTitle]
  );

  const hasSelection = plannerCurrentJob && plannerTargetJob;

  return (
    <div className="page solid-bg experience-page">
      <SiteHeader />

      <div className="container content experience-content">
        <div className="page-heading">
          <div className="page-heading-main">
            <div className="page-heading-icon" aria-hidden="true">
              <RouteIcon className="icon-md" />
            </div>
            <div>
              <h1 className="page-heading-title">Explorer Roadmap</h1>
              <p className="page-heading-subtitle">Plan your next move across the SPH Career Framework</p>
            </div>
          </div>
        </div>

        <div className="card section">
          <div className="row space-between align-start wrap" style={{ gap: 16 }}>
            <div className="column gap-8" style={{ flex: 1, minWidth: 260 }}>
              <h2 className="section-h2" style={{ marginTop: 0 }}>
                Plot your next move
              </h2>
              <p className="muted text-sm">
                Choose the role you are in today and the role you aspire to. The roadmap highlights the
                functional and soft skill shifts required to make the transition.
              </p>
              {myPosition && (
                <div className="hero-status-card" style={{ marginTop: 12 }}>
                  <div className="status-icon" aria-hidden="true">
                    <MapPin className="icon-sm" />
                  </div>
                  <div>
                    <div className="status-label">Saved starting role</div>
                    <div className="status-value">{myPosition.title}</div>
                  </div>
                  <Link to="/career-explorer" className="btn ghost small">
                    Update
                  </Link>
                </div>
              )}
            </div>
            <div className="column gap-8" style={{ minWidth: 260, maxWidth: 320 }}>
              <div className="panel" style={{ margin: 0 }}>
                <div className="panel-title row align-center">
                  <Users className="icon-sm mr-8" /> Quick tips
                </div>
                <ul className="list text-sm muted" style={{ paddingLeft: 16, margin: 0 }}>
                  <li>Use the function filter to narrow options.</li>
                  <li>Swap targets anytime to compare different missions.</li>
                  <li>
                    Save your current role from the Explore Careers page for faster prefill in the planner.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="card section">
          <div className="toolbar-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label className="text-sm muted">Filter by Function</label>
              <div className="relative">
                <Filter className="icon-sm muted abs-left" />
                <select
                  className="input pl"
                  value={plannerDivision}
                  onChange={(e) => {
                    setPlannerDivision(e.target.value);
                    setPlannerCurrentTitle('');
                    setPlannerTargetTitle('');
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
            </div>
            <div className="field" />
          </div>

          <div className="grid-two">
            <div className="column gap-8">
              <label className="text-sm muted">Current Role</label>
              <select
                className="input"
                value={plannerCurrentTitle}
                onChange={(e) => setPlannerCurrentTitle(e.target.value)}
              >
                <option value="">
                  {myPosition ? `My Position: ${myPosition.title}` : 'Select current role...'}
                </option>
                {plannerJobsFiltered.map((j) => (
                  <option key={j.id} value={j.title}>
                    {j.title} - {j.division}
                  </option>
                ))}
              </select>
            </div>

            <div className="column gap-8">
              <label className="text-sm muted">Target Role</label>
              <select
                className="input"
                value={plannerTargetTitle}
                onChange={(e) => setPlannerTargetTitle(e.target.value)}
              >
                <option value="">Select target role...</option>
                {plannerJobsFiltered.map((j) => (
                  <option key={j.id} value={j.title}>
                    {j.title} - {j.division}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {hasSelection ? (
          <RoadmapDetails currentJob={plannerCurrentJob} targetJob={plannerTargetJob} />
        ) : (
          <div className="empty" style={{ padding: 16 }}>
            {ready ? (
              <p className="muted">
                Pick both a current and a target role to see the roadmap insights.
              </p>
            ) : (
              <p className="muted">Loading roles from the career framework...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

