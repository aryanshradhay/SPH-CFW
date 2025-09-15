// src/components/SkillDefinitionQuiz.jsx
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import { BookOpen, Trophy, Info, ArrowRight, Home } from 'lucide-react';
import './job-skills-matcher.css';

const CSV_URL = (process.env.PUBLIC_URL || '') + '/positions-skills.csv';

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
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL_ROUNDS = 10;

export default function SkillDefinitionQuiz() {
  const [skillBank, setSkillBank] = useState([]); // [{name, def}]
  const [ready, setReady] = useState(false);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(null); // { question, correct, options }
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

        // Build unique skill -> definition mapping (first non-empty definition wins)
        const map = new Map();
        rows.forEach((row) => {
          const name = getCI(row, 'Skill');
          const def = getCI(row, 'Skill Definition');
          if (!name || !def) return;
          if (!map.has(name)) map.set(name, def);
        });

        const bank = Array.from(map.entries()).map(([name, def]) => ({ name, def }));
        const usable = bank.filter((x) => x.name && x.def && x.def.length > 10);
        setSkillBank(usable);
        setReady(true);
      },
    });
  }, []);

  const nextRound = () => {
    if (!ready || skillBank.length < 4) return;
    if (round >= TOTAL_ROUNDS) return; // game done
    const correctItem = skillBank[Math.floor(Math.random() * skillBank.length)];
    const distractors = shuffle(
      skillBank.filter((s) => s.name !== correctItem.name)
    ).slice(0, 3);
    const options = shuffle([correctItem.name, ...distractors.map((d) => d.name)]);
    setCurrent({ question: correctItem.def, correct: correctItem.name, options });
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

  return (
    <div className="page solid-bg">
      {/* Header */}
      <div className="topbar">
        <div className="container">
          <div className="row space-between align-center wrap">
            <div className="row align-center gap-12">
              <BookOpen className="icon-md" />
              <div>
                <h1 className="brand-title">Skill Definition Quiz</h1>
                <p className="brand-sub muted">Pick the skill that matches the description</p>
              </div>
            </div>
            <div className="row gap-12 align-center">
              <Link to="/games" className="btn">Games Hub</Link>
              <Link to="/" className="btn"><Home className="icon-xs mr-6" /> Explorer</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container content">
        <div className="card section" style={{ marginBottom: 16 }}>
          <div className="row space-between align-center wrap mb-12">
            <div className="row align-center gap-12">
              <Trophy className="icon-sm yellow" />
              <div className="text-sm">Score: <span className="text-600">{score}</span></div>
            </div>
            <div className="text-sm muted">Round {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}</div>
          </div>

          {!ready && <div className="empty">Loading skills…</div>}

          {ready && round > TOTAL_ROUNDS && (
            <div className="column center" style={{ gap: 12 }}>
              <h3 className="title-md">Well done!</h3>
              <p className="muted">Your score: {score} / {TOTAL_ROUNDS}</p>
              <div className="row gap-12">
                <button className="btn primary" onClick={resetGame}>Play Again</button>
                <Link to="/games" className="btn">Games Hub</Link>
              </div>
            </div>
          )}

          {ready && round <= TOTAL_ROUNDS && current && (
            <>
              <div className="panel">
                <div className="row align-center gap-8">
                  <Info className="icon-sm" />
                  <div className="text-sm muted">Definition</div>
                </div>
                <p className="mt-8 text-sm" style={{ lineHeight: 1.5 }}>{current.question}</p>
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

              <div className="row gap-12 mt-12">
                <button
                  className="btn primary row center"
                  onClick={() => {
                    if (!answered) return;
                    if (round >= TOTAL_ROUNDS) {
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
