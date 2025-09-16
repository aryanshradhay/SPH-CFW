// src/components/JobSkillsMatcher.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  Search,
  Filter,
  Users,
  X,
  TrendingUp,
  MapPin,
  Briefcase,
  Route,
  CheckCircle,
  AlertCircle,
  XCircle,
  BookOpen,
  Sparkles,
  Star,
  Mail,
  GraduationCap,
} from 'lucide-react';
import './job-skills-matcher.css';

/** CSV location (served from /public)
 * Use PUBLIC_URL so it works in dev and GitHub Pages subpath.
 */
const CSV_URL = (process.env.PUBLIC_URL || '') + '/positions-skills.csv';

/* ------------------------- Utils ------------------------- */
const normKey = (s) => String(s || '').trim();
const getCI = (row, ...candidates) => {
  for (const c of candidates) {
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === c.toLowerCase()) {
        const v = row[k];
        return typeof v === 'string' ? v.trim() : v;
      }
    }
  }
  return '';
};
const clamp01to5 = (n) => (n < 0 ? 0 : n > 5 ? 5 : n);

// Normalize skill type labels from CSV
function classifyType(typeRaw) {
  const s = String(typeRaw || '').toLowerCase();
  if (/functional/.test(s)) return 'functional';
  if (/soft/.test(s)) return 'soft';
  return 'unknown';
}

function parseProficiency(row) {
  const rawValue = getCI(row, 'Proficiency Value');
  const rawLevel = getCI(row, 'Required Proficiency Level');

  if (rawValue !== '') {
    const n = Number(rawValue);
    if (Number.isFinite(n)) return clamp01to5(n);
  }
  if (rawLevel !== '') {
    const n = Number(rawLevel);
    if (Number.isFinite(n)) return clamp01to5(n);
    const s = rawLevel.toLowerCase();
    if (/^none|not required$/.test(s)) return 0;
    if (/^basic|beginner|familiar$/.test(s)) return 1;
    if (/^low$/.test(s)) return 2;
    if (/^intermediate|medium|moderate$/.test(s)) return 3;
    if (/^advanced|high$/.test(s)) return 4;
    if (/^expert|master$/.test(s)) return 5;
  }
  return 0;
}

function alignVectors(jobA, jobB) {
  const names = Array.from(new Set([...(jobA.skillOrder || []), ...(jobB.skillOrder || [])]));
  const va = names.map((n) => jobA.skillMap?.[n] ?? 0);
  const vb = names.map((n) => jobB.skillMap?.[n] ?? 0);
  return [va, vb, names];
}
// Similarity helpers (coloring/badges)
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
function getTrainingRecommendations(skillName, typeOrGuess, gap) {
  const soft = [
    'Executive communication workshop',
    'Stakeholder influence & negotiation',
    'Cross-cultural collaboration',
  ];
  const functional = [
    'Advanced domain certification',
    'Tools & systems deep-dive',
    'Mentored project-based learning',
  ];
  const pool = /soft/i.test(typeOrGuess) ? soft : functional;
  const count = Math.min(3, Math.max(1, Math.ceil(gap || 1)));
  return pool.slice(0, count);
}

/* ------------------------- Roadmap inline block ------------------------- */
const RoadmapInline = ({ currentJob, targetJob }) => {
  const [va, vb, names] = useMemo(
    () => (currentJob && targetJob ? alignVectors(currentJob, targetJob) : [[], [], []]),
    [currentJob, targetJob]
  );

  // Build a quick type lookup for each skill name using target > current fallback
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

    // Only consider POSITIVE gaps for development buckets
    if (tar <= cur) {
      // Already meets or exceeds target â€” treat as similar/strong
      g.similar.push({ name: n, current: cur, target: tar, gap: 0 });
      return;
    }

    const posGap = tar - cur; // strictly positive here
    const item = { name: n, current: cur, target: tar, gap: posGap };

    if (posGap <= 1) g.similar.push(item);
    else if (posGap <= 2) g.fair.push(item);
    else g.needWork.push(item);
  });

  return g;
}, [va, vb, names]);

  // Split groups into functional vs soft vs unknown
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
        <h3 className="panel-title">{icon}{title} ({items.length})</h3>
        <div className="grid-two">
          {items.map((s, i) => {
            const recs = getTrainingRecommendations(s.name, s.type || typeByName[s.name] || '', Math.abs(s.gap));
            return (
              <div key={i} className={`card border-${color}`}>
                <div className="row space-between align-center mb-8">
                  <h4 className="text-600">{s.name}</h4>
                  <div className="row gap-8 text-sm">
                    <span className={`text-${color}`}>Current: {s.current}/5</span>
                    <span className="muted" aria-hidden="true">to</span>
                    <span className="text-blue">Target: {s.target}/5</span>
                  </div>
                </div>
                <div className="mb-8">
                  <div className={`text-xs text-${color} mb-4`}>
                    Gap: {s.gap > 0 ? '+' : ''}{s.gap} levels
                  </div>
                  <div className="bar">
                    <div className={`bar-fill ${color}`} style={{ width: (s.current / 5) * 100 + '%' }}>
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
        <Route className="icon-sm" />
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

      {/* Functional skills buckets */}
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

      {/* Soft skills buckets */}
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

      {/* Unknown/Other skills (if any) */}
      {(groupsByType.unknown.similar.length || groupsByType.unknown.fair.length || groupsByType.unknown.needWork.length) > 0 && (
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

/* ------------------------- Main Component (Single Page) ------------------------- */
const JobSkillsMatcher = () => {
  const [jobs, setJobs] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [skillIDF, setSkillIDF] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');

  // Saved "My Position" (one of the existing positions)
  const [myPositionTitle, setMyPositionTitle] = useState('');

  // "My Position" picker (separate section)
  const [myPickerDivision, setMyPickerDivision] = useState('all');
  const [myPickerTitle, setMyPickerTitle] = useState('');

  // Planner state (bottom section)
  const [plannerDivision, setPlannerDivision] = useState('all');
  const [plannerCurrentTitle, setPlannerCurrentTitle] = useState('');
  const [plannerTargetTitle, setPlannerTargetTitle] = useState('');

  const plannerRef = useRef(null);
  const myPositionRef = useRef(null);
  const scrollToPlanner = () => {
    if (plannerRef.current) {
      plannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const scrollToMyPosition = () => {
    if (myPositionRef.current) {
      myPositionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Load CSV â†’ build jobs
  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = (data || []).map((r) =>
          Object.fromEntries(
            Object.entries(r).map(([k, v]) => [normKey(k), typeof v === 'string' ? v.trim() : v])
          )
        );

        const byTitle = new Map();
        rows.forEach((row) => {
          const title = getCI(row, 'Core Position');
          const division = getCI(row, 'Function');
          const cluster = getCI(row, 'Core Position Cluster');
          const clusterDef = getCI(row, 'Core Position Cluster Definition');
          const objective = getCI(row, 'Core Position Main Objective');
          const skillName = getCI(row, 'Skill');
          const skillDef = getCI(row, 'Skill Definition');
          const skillType = getCI(
            row,
            'Functional / Soft Skill',
            'Functional/Soft Skill',
            'Functional or Softskill?'
          );
          if (!title) return;

          if (!byTitle.has(title)) {
            byTitle.set(title, {
              title,
              division,
              cluster,
              clusterDef,
              objective,
              skillOrder: [],
              skillMap: {},
              skillDefByName: {},
              skillTypeByName: {},
            });
          }
          const job = byTitle.get(title);
          job.division = job.division || division;
          job.cluster = job.cluster || cluster;
          job.clusterDef = job.clusterDef || clusterDef;
          job.objective = job.objective || objective;

          if (skillName) {
            const level = parseProficiency(row);
            if (!job.skillOrder.includes(skillName)) job.skillOrder.push(skillName);
            job.skillMap[skillName] = Math.max(job.skillMap[skillName] || 0, level);
            if (skillDef) job.skillDefByName[skillName] = skillDef;
            if (skillType) job.skillTypeByName[skillName] = skillType;
          }
        });

        let id = 1;
        const jobsArray = Array.from(byTitle.values()).map((j) => {
          const skills = j.skillOrder.map((s) => j.skillMap[s] ?? 0);
          const description = j.objective
            ? j.objective
            : j.clusterDef
            ? j.clusterDef
            : `Responsibilities for ${j.title}.`;
          return {
            id: id++,
            title: j.title,
            division: j.division || 'Unknown Division',
            skills,
            skillOrder: j.skillOrder,
            skillMap: j.skillMap,
            skillDefByName: j.skillDefByName,
            skillTypeByName: j.skillTypeByName,
            description,
            requirements: [
              'Bachelorâ€™s degree in relevant field',
              'Experience in pharma/healthcare industry',
              'Strong stakeholder and project management skills',
              'Excellent communication',
            ],
          };
        });

        jobsArray.sort(
          (a, b) =>
            (a.division || '').localeCompare(b.division || '') ||
            a.title.localeCompare(b.title)
        );

        // Compute global skill IDF (rarer skills weigh slightly more)
        const N = jobsArray.length || 1;
        const df = new Map();
        jobsArray.forEach((job) => {
          const seen = new Set(job.skillOrder || []);
          seen.forEach((name) => df.set(name, (df.get(name) || 0) + 1));
        });
        const idfObj = {};
        df.forEach((count, name) => {
          // 1 + ln((N+1)/(df+1)) keeps it ~[1,2]; clamp to avoid extremes
          const raw = 1 + Math.log((N + 1) / (count + 1));
          idfObj[name] = Math.max(0.85, Math.min(1.35, raw));
        });

        setJobs(jobsArray);
        setSkillIDF(idfObj);
        setDivisions(Array.from(new Set(jobsArray.map((j) => j.division))));
      },
    });
  }, []);

  // Derive job objects
  const myPosition = useMemo(
    () => jobs.find((j) => j.title === myPositionTitle) || null,
    [jobs, myPositionTitle]
  );

  // When user sets "My Position", default the planner's Current to it
  useEffect(() => {
    if (myPosition?.title) {
      setPlannerCurrentTitle(myPosition.title);
    }
  }, [myPosition?.title]);

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

  /* ---------- Planner section (bottom) ---------- */
  const plannerJobsFiltered = useMemo(() => {
    if (plannerDivision === 'all') return jobs;
    return jobs.filter((j) => j.division === plannerDivision);
  }, [jobs, plannerDivision]);

  const plannerCurrentJob = useMemo(
    () => jobs.find((j) => j.title === plannerCurrentTitle),
    [jobs, plannerCurrentTitle]
  );
  const plannerTargetJob = useMemo(
    () => jobs.find((j) => j.title === plannerTargetTitle),
    [jobs, plannerTargetTitle]
  );

  const heroFeatureCards = [
    {
      title: 'Who We Are',
      description: 'Celebrate the people powering SPH career growth.',
      icon: Users,
      accent: 'intro',
    },
    {
      title: 'SPH D&D Roadmap',
      description: 'Trace playful routes through core roles and skills.',
      icon: Route,
      accent: 'roadmap',
    },
    {
      title: 'SPH Academy',
      description: 'Level-up with guided quests and mentor moments.',
      icon: GraduationCap,
      accent: 'academy',
    },
    {
      title: 'Newsletter',
      description: 'Catch wins and highlights from across the crew.',
      icon: Mail,
      accent: 'newsletter',
    },
    {
      title: 'Growth Assignment Spotlight',
      description: 'Discover missions that stretch, shine, and delight.',
      icon: Sparkles,
      accent: 'spotlight',
    },
  ];

  const avatarPlaceholders = [
    { icon: Users, label: 'Crew avatar placeholder' },
    { icon: Sparkles, label: 'Mentor avatar placeholder' },
    { icon: Star, label: 'Future teammate avatar placeholder' },
  ];

  const primaryPlannerLabel = myPosition ? 'Continue my roadmap' : 'Start my roadmap';
  const savedRoleCopy = myPosition
    ? myPosition.title
    : 'Choose a position in “My Position” below.';

  return (
    <div className="page solid-bg">
      {/* Header */}

      <div className="topbar hero-banner">
        <div className="container hero-container">
          <div className="hero-grid">
            <div className="hero-left">
              <div className="hero-brand row align-center gap-12">
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Brand" className="brand-logo" />
                <div>
                  <h1 className="brand-title">SPH Career Roadmap</h1>
                  <p className="brand-sub muted">Explore roles, skills & roadmaps</p>
                </div>

              </div>
              <div className="hero-main-card">
                <span className="hero-chip">Who we are</span>
                <h2 className="hero-heading">SPH Career Quest Hub</h2>
                <p className="hero-text">
                  Make career planning feel like a vibrant adventure board filled with bright quests,
                  friendly faces, and highlights to explore.
                </p>
                <div className="hero-avatar-shelf" aria-hidden="true">
                  {avatarPlaceholders.map(({ icon: Icon, label }, idx) => (
                    <span key={label} className={`avatar-bubble avatar-${idx + 1}`} title={label}>
                      <Icon className="icon-sm" />
                    </span>
                  ))}
                  <span className="avatar-bubble avatar-open" title="Add your avatar">
                    <span className="avatar-plus">+</span>
                  </span>
                </div>
                <p className="hero-avatar-caption">
                  Reserve these spaces for teammates and mentors as you explore together.
                </p>
                <div className="hero-main-actions">
                  <button className="btn primary" onClick={scrollToPlanner}>
                    <Route className="icon-xs mr-6" aria-hidden="true" />
                    {primaryPlannerLabel}
                  </button>
                  <button className="btn ghost" type="button" onClick={scrollToMyPosition}>
                    <Users className="icon-xs mr-6" aria-hidden="true" />
                    Save my role
                  </button>
                </div>
                <div className="hero-status-card">
                  <div className="status-icon" aria-hidden="true">
                    <MapPin className="icon-sm" />
                  </div>
                  <div>
                    <div className="status-label">My saved role</div>
                    <div className="status-value">{savedRoleCopy}</div>
                  </div>
                  {myPosition && (
                    <button className="btn ghost small" onClick={() => setMyPositionTitle('')}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-feature-stack">
                {heroFeatureCards.map(({ title, description, icon: Icon, accent }, idx) => (
                  <div key={title} className={`feature-card feature-${accent}`}>
                    <div className="feature-card-body">
                      <div className="feature-icon" aria-hidden="true">
                        <Icon className="icon-sm" />
                      </div>
                      <div>
                        <div className="feature-title">{title}</div>
                        {description && <p className="feature-subtitle">{description}</p>}
                      </div>
                    </div>
                    <div className="feature-number">{String(idx + 1).padStart(2, '0')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container content">
        <div className="fun-banner">
          <div className="fun-banner-icon" aria-hidden="true">
            <Sparkles className="icon-sm" />
          </div>
          <div className="fun-banner-copy">
            <div className="fun-banner-title">Today's Skill Quest</div>
            <p className="fun-banner-text">
              Pick a target role, line up the skills you want to spotlight, and invite teammates to fill
              those avatar bubbles.
            </p>
          </div>
          <button className="btn secondary" onClick={scrollToPlanner}>
            Start quest
          </button>
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
                  onClick={() => {
                    setPlannerCurrentTitle(myPosition.title);
                    scrollToPlanner();
                  }}
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
                          onClick={() => {
                            setPlannerCurrentTitle(myPosition.title);
                            setPlannerTargetTitle(job.title);
                            scrollToPlanner();
                          }}
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
                      onClick={() => {
                        setPlannerCurrentTitle(selectedJob.title);
                        scrollToPlanner();
                      }}
                      title="Use this as your Current job in roadmap"
                    >
                      Use as Current
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setPlannerTargetTitle(selectedJob.title);
                        scrollToPlanner();
                      }}
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
                                      <span className="muted text-sm">{name}</span>
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
                                      <span className="muted text-sm">{name}</span>
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
                                  onClick={() => {
                                    setPlannerCurrentTitle(selectedJob.title);
                                    setPlannerTargetTitle(job.title);
                                    scrollToPlanner();
                                  }}
                                  title="Scroll to bottom planner and prefill current/target"
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

        {/* ========== SECTION: Roadmap Planner ========== */}
        <h2 className="section-h2">Roadmap Planner</h2>
        <div ref={plannerRef} className="card section" style={{ marginTop: 8 }}>
          <div className="toolbar-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label className="text-sm muted">Filter by Function</label>
              <select
                className="input"
                value={plannerDivision}
                onChange={(e) => {
                  setPlannerDivision(e.target.value);
                  setPlannerCurrentTitle(myPosition?.title || '');
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

            <div className="field" />
          </div>

          <div className="grid-two">
            <div className="column gap-8">
              <label className="text-sm muted">Current Job</label>
              <select
                className="input"
                value={plannerCurrentTitle}
                onChange={(e) => setPlannerCurrentTitle(e.target.value)}
              >
                <option value="">
                  {myPosition ? `My Position: ${myPosition.title}` : 'Select current job...'}
                </option>
                {plannerJobsFiltered.map((j) => (
                  <option key={j.id} value={j.title}>
                    {j.title} - {j.division}
                  </option>
                ))}
              </select>
            </div>

            <div className="column gap-8">
              <label className="text-sm muted">Target Job</label>
              <select
                className="input"
                value={plannerTargetTitle}
                onChange={(e) => setPlannerTargetTitle(e.target.value)}
              >
                <option value="">Select target job...</option>
                {plannerJobsFiltered.map((j) => (
                  <option key={j.id} value={j.title}>
                    {j.title} - {j.division}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {plannerCurrentJob && plannerTargetJob ? (
            <div style={{ marginTop: 16 }}>
              <RoadmapInline
                currentJob={plannerCurrentJob}
                targetJob={plannerTargetJob}
              />
            </div>
          ) : (
            <div className="empty" style={{ padding: 16 }}>
              <p className="muted">
                Pick both a current and a target job to view the roadmap.
              </p>
            </div>
          )}
        </div>
        {/* ========== /Roadmap Planner ========== */}
      </div>
    </div>
  );
};

export default JobSkillsMatcher;


