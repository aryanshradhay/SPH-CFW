// src/components/CareerBoardGame.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import {
  Route as RouteIcon,
  Trophy,
  Home,
  PlayCircle,
  Flag,
  HelpCircle,
  Shuffle,
} from 'lucide-react';
import './job-skills-matcher.css';

const CSV_URL = (process.env.PUBLIC_URL || '') + '/positions-skills.csv';

// ------------ Utils (kept local for self-containment) ------------
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
function seniorityRank(title) {
  const s = String(title || '').toLowerCase();
  let base = 2;
  if (/intern|assistant|junior/.test(s)) base = 1;
  else if (/associate|analyst|officer|executive/.test(s)) base = 2;
  else base = 3; // default individual contributor
  let bonus = 0;
  if (/senior/.test(s)) bonus += 1;
  if (/lead|manager/.test(s)) bonus += 2;
  if (/principal/.test(s)) bonus += 3;
  if (/director|head/.test(s)) bonus += 4;
  return base + bonus; // ~1..10
}

export default function CareerBoardGame() {
  const [jobs, setJobs] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Filters/config
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [startTitle, setStartTitle] = useState('');
  const [seed, setSeed] = useState(0); // reshuffle tie-breakers

  // Game state
  const [position, setPosition] = useState(0);
  const [turn, setTurn] = useState(0);
  const [lastRoll, setLastRoll] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const MAX_TURNS = 15;

  const scrollerRef = useRef(null);
  const tileRefs = useRef([]);

  // Load and build jobs
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
          const skillName = getCI(row, 'Skill');
          if (!title) return;
          if (!byTitle.has(title)) {
            byTitle.set(title, {
              title,
              division,
              skillOrder: [],
              skillMap: {},
            });
          }
          const job = byTitle.get(title);
          job.division = job.division || division;
          if (skillName) {
            const level = parseProficiency(row);
            if (!job.skillOrder.includes(skillName)) job.skillOrder.push(skillName);
            job.skillMap[skillName] = Math.max(job.skillMap[skillName] || 0, level);
          }
        });

        const jobsArray = Array.from(byTitle.values())
          .filter((j) => (j.skillOrder || []).length > 0)
          .map((j, idx) => ({
            id: idx + 1,
            title: j.title,
            division: j.division || 'Unknown Function',
            skillOrder: j.skillOrder,
            skillMap: j.skillMap,
          }));

        const divs = Array.from(new Set(jobsArray.map((j) => j.division).filter(Boolean))).sort();
        setDivisions(divs);
        setJobs(jobsArray);
      },
    });
  }, []);

  // Build the board list
  const boardJobs = useMemo(() => {
    if (!jobs.length) return [];
    const filtered = divisionFilter === 'all'
      ? jobs
      : jobs.filter((j) => j.division === divisionFilter);

    const withScore = filtered.map((j) => {
      const sum = j.skillOrder.reduce((acc, n) => acc + (j.skillMap[n] || 0), 0);
      const rank = seniorityRank(j.title);
      // slight noise based on seed to break ties (stable per seed)
      const nudge = ((j.title.charCodeAt(0) + seed) % 7) * 0.01;
      return { ...j, levelScore: sum + rank * 5 + nudge };
    });

    withScore.sort((a, b) => a.levelScore - b.levelScore);
    return withScore;
  }, [jobs, divisionFilter, seed]);

  // Where to start on the path
  const startIndex = useMemo(() => {
    if (!startTitle) return 0;
    const idx = boardJobs.findIndex((j) => j.title === startTitle);
    return idx >= 0 ? idx : 0;
  }, [boardJobs, startTitle]);

  // Keep position in range when filters change
  useEffect(() => {
    setPosition(startIndex);
    setTurn(0);
    setLastRoll(0);
    setFinished(false);
    // ensure refs length matches
    tileRefs.current = [];
  }, [startIndex, divisionFilter, seed]);

  // Auto-scroll active tile into view
  useEffect(() => {
    const node = tileRefs.current[position];
    if (node && node.scrollIntoView) {
      node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [position]);

  // Responsive serpentine grid mapping
  const [cols, setCols] = useState(5);
  const [tileMin, setTileMin] = useState(180);
  useEffect(() => {
    const updateCols = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const newCols = w < 480 ? 3 : w < 900 ? 4 : 5;
      setCols(newCols);
      setTileMin(w < 480 ? 150 : 180);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const indexToGrid = (i) => {
    const r = Math.floor(i / cols);
    const cInRow = i % cols;
    const c = r % 2 === 0 ? cInRow : cols - 1 - cInRow;
    return { r, c };
  };

  // Animated movement across tiles
  const onRoll = () => {
    if (finished || boardJobs.length < 2 || isMoving) return;
    const roll = Math.floor(Math.random() * 6) + 1; // 1..6
    setLastRoll(roll);
    setTurn((t) => t + 1);
    setIsMoving(true);
    let steps = roll;
    const stepOnce = () => {
      setPosition((p) => {
        const next = Math.min(p + 1, boardJobs.length - 1);
        return next;
      });
      steps -= 1;
      if (steps > 0) {
        setTimeout(stepOnce, 280);
      } else {
        // finish animation
        const endReached = position + roll >= boardJobs.length - 1;
        const turnsExceeded = turn + 1 >= MAX_TURNS;
        if (endReached || turnsExceeded) setFinished(true);
        setIsMoving(false);
      }
    };
    setTimeout(stepOnce, 150);
  };

  const current = boardJobs[position];
  const previous = boardJobs[Math.max(0, position - 1)];

  const topSkills = useMemo(() => {
    if (!current) return [];
    return (current.skillOrder || [])
      .map((n) => ({ name: n, lvl: current.skillMap[n] || 0 }))
      .sort((a, b) => b.lvl - a.lvl)
      .slice(0, 3)
      .map((x) => x.name);
  }, [current]);

  const newFocusSkills = useMemo(() => {
    if (!current || !previous || current === previous) return [];
    const prevTop = (previous.skillOrder || [])
      .map((n) => ({ name: n, lvl: previous.skillMap[n] || 0 }))
      .sort((a, b) => b.lvl - a.lvl)
      .slice(0, 3)
      .map((x) => x.name);
    return topSkills.filter((s) => !prevTop.includes(s));
  }, [current, previous, topSkills]);

  return (
    <div className="page solid-bg">
      {/* Header */}
      <div className="topbar">
        <div className="container">
          <div className="row space-between align-center wrap">
            <div className="row align-center gap-12">
                <Link to="/" className="brand-wordmark" aria-label="Home">MERCK</Link>
                <RouteIcon className="icon-md" />
                <div>
                  <h1 className="brand-title">Career Path Board</h1>
                  <p className="brand-sub muted">See how roles progress across the pathway</p>
                </div>
              </div>
              <div className="row gap-12 align-center">
                <Link to="/play-lab" className="btn">Games Hub</Link>
                <Link to="/" className="btn">
                  <Home className="icon-xs mr-6" /> Explorer
                </Link>
              </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container content">
        <div className="card section" style={{ marginBottom: 16 }}>
          {/* Controls */}
          <div className="toolbar-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label className="text-sm muted">Filter by Function</label>
              <select
                className="input"
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
              >
                <option value="all">All Functions</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="row gap-12 align-center" style={{ justifyContent: 'flex-end' }}>
              <div className="field" style={{ minWidth: 320 }}>
                <label className="text-sm muted">Start at Role</label>
                <select
                  className="input"
                  value={startTitle}
                  onChange={(e) => setStartTitle(e.target.value)}
                >
                  <option value="">First role on pathway</option>
                  {boardJobs.map((j) => (
                    <option key={j.id} value={j.title}>
                      {j.title} - {j.division}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn" onClick={() => setSeed((s) => s + 1)} title="Reshuffle tie-breakers">
                <Shuffle className="icon-xs mr-6" /> Shuffle Path
              </button>
            </div>
          </div>

          {/* Scoreboard */}
          <div className="row space-between align-center wrap mb-12">
            <div className="row align-center gap-12">
              <Trophy className="icon-sm yellow" />
              <div className="text-sm">
                Progress: <span className="text-600">{Math.min(position + 1, boardJobs.length)} / {boardJobs.length || 0}</span>
              </div>
            </div>
            <div className="text-sm muted">Turn {turn} / {MAX_TURNS}</div>
          </div>

          {/* Board (serpentine grid) */}
          <div className="board" ref={scrollerRef}>
            <div
              className="board-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(${tileMin}px, 1fr))`,
                gap: 16,
                padding: '8px 4px 12px',
              }}
            >
              {boardJobs.map((j, idx) => {
                const active = idx === position;
                const reached = idx <= position;
                const { r, c } = indexToGrid(idx);
                const isStart = idx === 0;
                const isFinish = idx === boardJobs.length - 1;
                return (
                  <div
                    key={j.id}
                    className={`tile grid ${active ? 'active' : ''} ${reached ? 'reached' : ''}`}
                    style={{ gridRow: r + 1, gridColumn: c + 1 }}
                    ref={(el) => (tileRefs.current[idx] = el)}
                    title={j.title}
                  >
                    <div className="row space-between mb-6">
                      <div className="tile-index">{idx + 1}</div>
                      {isStart && (
                        <span className="badge purple" title="Start">Start</span>
                      )}
                      {isFinish && (
                        <span className="badge green" title="Finish"><Flag className="icon-xs mr-6" />Finish</span>
                      )}
                    </div>
                    <div className="tile-title">{j.title}</div>
                    <div className="tile-division text-xs muted">{j.division}</div>
                    {active && <div className="token" aria-hidden />}
                  </div>
                );
              })}
            </div>
            {boardJobs.length === 0 && (
              <div className="empty" style={{ padding: 16 }}>
                No roles available. Try another function.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="row gap-12 mt-12">
            <button className="btn primary row center" onClick={onRoll} disabled={finished || boardJobs.length < 2 || isMoving}>
              <PlayCircle className="icon-xs mr-6 white" /> {finished ? 'Finished' : lastRoll ? `Roll (${lastRoll})` : 'Roll Dice'}
            </button>
            <button
              className="btn"
              onClick={() => {
                setPosition(startIndex);
                setTurn(0);
                setLastRoll(0);
                setFinished(false);
                setIsMoving(false);
              }}
            >
              Reset
            </button>
          </div>

          {/* Current tile details */}
          {current && (
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="row space-between align-center">
                <div>
                  <div className="text-sm muted">Current Role</div>
                  <div className="text-600">{current.title}</div>
                  <div className="text-xs muted">{current.division}</div>
                </div>
                <div className="row align-center text-xs muted">
                  <HelpCircle className="icon-xs mr-6" />
                  Land on each tile to view key skills
                </div>
              </div>
              <div className="row gap-8 mt-8 wrap">
                {topSkills.map((s) => (
                  <span key={s} className="badge">{s}</span>
                ))}
              </div>

              {newFocusSkills.length > 0 && (
                <div className="panel" style={{ marginTop: 12 }}>
                  <div className="panel-title">
                    <Flag className="icon-sm mr-8" /> New focus as you step up
                  </div>
                  <div className="row gap-8 wrap">
                    {newFocusSkills.map((s) => (
                      <span key={s} className="badge yellow">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {finished && (
                <div className="panel" style={{ marginTop: 12 }}>
                  <div className="panel-title">
                    <Trophy className="icon-sm yellow mr-8" /> Path complete
                  </div>
                  <div className="text-sm muted">
                    You reached step {position + 1} of {boardJobs.length}. Explore a different function or shuffle the path to see alternate progressions.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
