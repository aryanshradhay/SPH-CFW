// src/components/JobExplorerGame.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Lightbulb, ArrowRight, HelpCircle } from 'lucide-react';
import '../styles/main.css';
import SiteHeader from './SiteHeader';

const CSV_URL = (process.env.PUBLIC_URL || '') + '/positions-skills.csv';

// Helpers (duplicated minimal parsing to stay self-contained)
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
function classifyType(typeRaw) {
  const s = String(typeRaw || '').toLowerCase();
  if (/functional/.test(s)) return 'functional';
  if (/soft/.test(s)) return 'soft';
  return 'unknown';
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL_ROUNDS = 10;

export default function JobExplorerGame() {
  const [jobs, setJobs] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [ready, setReady] = useState(false);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(null); // { job, correct, options: [skills] }
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState('');

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
              skillOrder: [],
              skillMap: {},
              skillTypeByName: {},
            });
          }
          const job = byTitle.get(title);
          job.division = job.division || division;
          if (skillName) {
            const level = parseProficiency(row);
            if (!job.skillOrder.includes(skillName)) job.skillOrder.push(skillName);
            job.skillMap[skillName] = Math.max(job.skillMap[skillName] || 0, level);
            if (skillType) job.skillTypeByName[skillName] = classifyType(skillType);
          }
        });

        const jobsArray = Array.from(byTitle.values()).map((j, idx) => ({
          id: idx + 1,
          title: j.title,
          division: j.division || 'Unknown Division',
          skillOrder: j.skillOrder,
          skillMap: j.skillMap,
          skillTypeByName: j.skillTypeByName,
        }));

        const usable = jobsArray.filter((j) => j.skillOrder.length >= 4);
        const skills = Array.from(new Set(usable.flatMap((j) => j.skillOrder)));
        setJobs(usable);
        setAllSkills(skills);
        setReady(true);
      },
    });
  }, []);

  const nextRound = () => {
    if (!ready || jobs.length === 0) return;
    if (round >= TOTAL_ROUNDS) return; // game done
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const correct = job.skillOrder[Math.floor(Math.random() * job.skillOrder.length)];
    const distractorPool = allSkills.filter((s) => !job.skillOrder.includes(s));
    const distractors = shuffle(distractorPool).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    setCurrent({ job, correct, options });
    setAnswered(false);
    setPicked('');
    setRound((r) => r + 1);
  };

  const pickOption = (opt) => {
    if (!current || answered) return;
    setPicked(opt);
    setAnswered(true);
    if (opt === current.correct) setScore((s) => s + 1);
  };

  const resetGame = () => {
    setRound(0);
    setScore(0);
    setCurrent(null);
    setAnswered(false);
    setPicked('');
  };

  useEffect(() => {
    if (ready && round === 0) nextRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const hintSkills = useMemo(() => {
    if (!current?.job) return [];
    const top = current.job.skillOrder
      .map((n) => ({ name: n, lvl: current.job.skillMap[n] || 0 }))
      .sort((a, b) => b.lvl - a.lvl)
      .slice(0, 3)
      .map((x) => x.name);
    return top;
  }, [current]);

  return (
    <div className="page solid-bg experience-page">
      <SiteHeader />

      <div className="container content experience-content">
        <div className="page-heading">
          <div className="page-heading-main">
            <div className="page-heading-icon" aria-hidden="true">
              <Gamepad2 className="icon-md" />
            </div>
            <div>
              <h1 className="page-heading-title">Job Explorer Game</h1>
              <p className="page-heading-subtitle">Learn roles through quick challenges</p>
            </div>
          </div>
          <div className="page-heading-actions">
            <Link to="/play-lab" className="btn ghost small">
              Games Hub
            </Link>
          </div>
        </div>

        <div className="card section">
          <div className="stat-strip">
            <div className="stat-strip__item">
              <span className="stat-icon stat-icon--gold">
                <Trophy className="icon-sm" />
              </span>
              <div>
                <div className="stat-label">Score</div>
                <div className="stat-value">{score}</div>
              </div>
            </div>
            <div className="stat-strip__item stat-strip__item--muted">
              <div>
                <div className="stat-label">Round</div>
                <div className="stat-value">
                  {Math.min(round, TOTAL_ROUNDS)}
                  <span className="stat-divider">/</span>
                  <span className="stat-total">{TOTAL_ROUNDS}</span>
                </div>
              </div>
            </div>
          </div>

          {!ready && <div className="empty">Loading game data…</div>}

          {ready && round > TOTAL_ROUNDS && (
            <div className="column center" style={{ gap: 12 }}>
              <h3 className="title-md">Great job!</h3>
              <p className="muted">Your score: {score} / {TOTAL_ROUNDS}</p>
              <div className="row gap-12">
                <button className="btn primary" onClick={resetGame}>Play Again</button>
                <Link to="/" className="btn">Explore Roles</Link>
              </div>
            </div>
          )}

          {ready && round <= TOTAL_ROUNDS && current && (
            <>
              <div className="panel">
                <div className="row space-between">
                  <div>
                    <div className="text-sm muted">Guess a skill for</div>
                    <div className="text-600">{current.job.title}</div>
                    <div className="muted text-xs">{current.job.division}</div>
                  </div>
                  <div className="row align-center text-xs muted">
                    <HelpCircle className="icon-xs mr-6" />
                    Choose the correct skill
                  </div>
                </div>
              </div>

              <div className="grid-cards">
                {current.options.map((opt) => {
                  const isPicked = picked === opt;
                  const isRight = answered && opt === current.correct;
                  const isWrong = answered && isPicked && opt !== current.correct;
                  let cls = 'match';
                  if (isRight) cls = 'match match-excellent';
                  else if (isWrong) cls = 'match match-low';
                  return (
                    <button
                      key={opt}
                      className={cls}
                      onClick={() => pickOption(opt)}
                      disabled={answered}
                      title={answered ? (isRight ? 'Correct' : 'Incorrect') : 'Pick this skill'}
                    >
                      <div className="text-600">{opt}</div>
                      {answered && isRight && <div className="text-xs green mt-6">Correct!</div>}
                      {answered && isWrong && <div className="text-xs muted mt-6">Not this one</div>}
                    </button>
                  );
                })}
              </div>

              <div className="panel">
                <div className="row space-between align-center">
                  <div className="row align-center gap-8">
                    <Lightbulb className="icon-sm yellow" />
                    <div className="text-sm">Hints</div>
                  </div>
                  <div className="text-xs muted">Top skills for this job</div>
                </div>
                <div className="row gap-8 mt-8 wrap">
                  {hintSkills.map((h) => (
                    <span key={h} className="badge">{h}</span>
                  ))}
                </div>
              </div>

              <div className="row gap-12 mt-12">
                <button
                  className="btn primary row center"
                  onClick={() => {
                    if (!answered) return; // must answer to proceed
                    if (round >= TOTAL_ROUNDS) {
                      // finalize
                      setRound((r) => r + 1);
                    } else {
                      nextRound();
                    }
                  }}
                  disabled={!answered}
                >
                  <ArrowRight className="icon-xs mr-6 white" />
                  {round >= TOTAL_ROUNDS ? 'Finish' : 'Next'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
