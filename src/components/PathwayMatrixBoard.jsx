// src/components/PathwayMatrixBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import { Grid3X3, Dice5, Home, Flag, Shuffle, HelpCircle, BookOpen } from 'lucide-react';
import './job-skills-matcher.css';

const CSV_URL = (process.env.PUBLIC_URL || '') + '/positions-skills.csv';
const MATRIX_CSV_URL = (process.env.PUBLIC_URL || '') + '/pathway-matrix.csv';

// ---------------- Utils ----------------
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
    const s = String(rawLevel || '').toLowerCase();
    if (/^none|not required$/.test(s)) return 0;
    if (/^basic|beginner|familiar$/.test(s)) return 1;
    if (/^low$/.test(s)) return 2;
    if (/^intermediate|medium|moderate$/.test(s)) return 3;
    if (/^advanced|high$/.test(s)) return 4;
    if (/^expert|master$/.test(s)) return 5;
  }
  return 0;
}
function alignVectors(aMap, bMap) {
  const names = Array.from(new Set([...(Object.keys(aMap || {})), ...(Object.keys(bMap || {}))]));
  const va = names.map((n) => aMap?.[n] ?? 0);
  const vb = names.map((n) => bMap?.[n] ?? 0);
  return [va, vb, names];
}
function cosineSimilarity(va, vb) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < va.length; i++) {
    const a = va[i] || 0;
    const b = vb[i] || 0;
    dot += a * b;
    na += a * a;
    nb += b * b;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Default clusters list (used only as fallback before CSV loads)
const DEFAULT_CLUSTERS = [
  'Global Program Management',
  'Portfolio Analytics',
  'Program Planning',
  'Resource Management',
  'Strategic Portfolio Management',
  'Clinical Governance Operations',
  'Chief Medical Officer Governance & Operations',
  'Clinical Development China / Japan',
  'R&D',
  'Healthcare',
  'Merck',
];

// Editable mapping table (origin -> landing -> label)
// NOTE: Please verify cells match your latest matrix. You can update labels here directly.
const DEFAULT_PATH_MAP = {
  'Global Program Management': {
    'Global Program Management': 'SPH Sub-Function Path',
    'Portfolio Analytics': 'SPH Path',
    'Program Planning': 'SPH Path',
    'Resource Management': 'SPH Path',
    'Strategic Portfolio Management': 'SPH Path',
    'Clinical Governance Operations': 'SPH Path',
    'R&D': 'R&D Path: GPH Position in RU',
    'Merck': 'Merck Path: Chief of Staff or SRO',
  },
  'Portfolio Analytics': {
    'Global Program Management': 'SPH Sub-Function Path',
    'Program Planning': 'SPH Path',
    'Strategic Portfolio Management': 'SPH Path',
  },
  'Program Planning': {
    'Global Program Management': 'SPH Path',
    'Portfolio Analytics': 'SPH Sub-Function Path',
    'Resource Management': 'SPH Sub-Function Path',
    'Strategic Portfolio Management': 'SPH Path',
  },
  'Resource Management': {
    'Global Program Management': 'SPH Path',
    'Portfolio Analytics': 'SPH Path',
    'Program Planning': 'SPH Path',
    'Resource Management': 'SPH Sub-Function Path',
    'Strategic Portfolio Management': 'SPH Path',
  },
  'Strategic Portfolio Management': {
    'Global Program Management': 'SPH Path',
    'Strategic Portfolio Management': 'SPH Sub-Function Path',
    'Clinical Governance Operations': 'SPH Path',
  },
  'Clinical Governance Operations': {
    'Global Program Management': 'SPH Path',
    'Program Planning': 'SPH Path',
    'Resource Management': 'SPH Path',
    'Clinical Governance Operations': 'SPH Sub-Function Path',
  },
  'Chief Medical Officer Governance & Operations': {
    'Chief Medical Officer Governance & Operations': 'SPH Sub-Function Path',
  },
  'Clinical Development China / Japan': {
    'Global Program Management': 'SPH Path',
    'Chief Medical Officer Governance & Operations': 'SPH Sub-Function Path',
    'R&D': 'R&D Path: DU or GDO',
    'Healthcare': 'Healthcare Path: BD Due Diligence Lead',
  },
  'R&D': {
    'R&D': 'R&D Path: DU or GDO',
  },
  'Healthcare': {
    'Healthcare': 'Healthcare Path: BD Due Diligence Lead',
  },
  'Merck': {
    'Global Program Management': 'Merck Path: Inhouse Consulting',
  },
};

function classify(label) {
  const s = String(label || '').toLowerCase();
  if (!label) return 'empty';
  if (s.startsWith('sph sub-function')) return 'sph-sub';
  if (s.startsWith('sph path')) return 'sph';
  if (s.startsWith('r&d path')) return 'rd';
  if (s.startsWith('healthcare path')) return 'health';
  if (s.startsWith('merck path')) return 'merck';
  return 'other';
}

export default function PathwayMatrixBoard() {
  const [origin, setOrigin] = useState('Global Program Management');
  const [selection, setSelection] = useState(null); // { from, to, label }
  const [lastRoll, setLastRoll] = useState(0);
  const [jobsByCluster, setJobsByCluster] = useState({});
  const [clusterAvg, setClusterAvg] = useState({}); // cluster -> { skillAvg[name] }
  const [allSkills, setAllSkills] = useState([]);
  const [focusSkill, setFocusSkill] = useState('');
  const [seed, setSeed] = useState(0);
  const [pathMap, setPathMap] = useState(DEFAULT_PATH_MAP);
  const [clusters, setClusters] = useState(DEFAULT_CLUSTERS);

  // Load CSV and build cluster-level averages + example roles
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

        // Build per-job structures
        const byTitle = new Map();
        rows.forEach((row) => {
          const title = getCI(row, 'Core Position');
          const division = getCI(row, 'Function');
          const cluster = getCI(row, 'Core Position Cluster');
          const skillName = getCI(row, 'Skill');
          if (!title) return;
          if (!byTitle.has(title)) {
            byTitle.set(title, {
              title,
              division,
              cluster,
              skillMap: {},
              skillOrder: [],
            });
          }
          const job = byTitle.get(title);
          job.division = job.division || division;
          job.cluster = job.cluster || cluster;
          if (skillName) {
            const level = parseProficiency(row);
            if (!job.skillOrder.includes(skillName)) job.skillOrder.push(skillName);
            job.skillMap[skillName] = Math.max(job.skillMap[skillName] || 0, level);
          }
        });

        // Example roles by cluster
        const samples = {};
        byTitle.forEach((j) => {
          const cl = j.cluster || '';
          if (!cl) return;
          if (!samples[cl]) samples[cl] = [];
          if (!samples[cl].some((x) => x.title === j.title)) {
            samples[cl].push({ title: j.title, division: j.division });
          }
        });

        // Cluster averages
        const clAgg = {};
        const skillUniverse = new Set();
        const presentClusters = Array.from(new Set(Array.from(byTitle.values()).map((j) => j.cluster).filter(Boolean)));
        presentClusters.forEach((cl) => {
          const jobs = Array.from(byTitle.values()).filter((j) => j.cluster === cl);
          if (jobs.length === 0) return;
          const sum = {};
          const cnt = {};
          jobs.forEach((j) => {
            Object.entries(j.skillMap).forEach(([name, lvl]) => {
              sum[name] = (sum[name] || 0) + (lvl || 0);
              cnt[name] = (cnt[name] || 0) + 1;
              skillUniverse.add(name);
            });
          });
          const avg = {};
          Object.keys(sum).forEach((name) => {
            avg[name] = (sum[name] || 0) / (cnt[name] || 1);
          });
          clAgg[cl] = avg;
        });

        setJobsByCluster(samples);
        setClusterAvg(clAgg);
        setAllSkills(Array.from(skillUniverse).sort());
      },
    });
  }, []);

  // Load Matrix CSV (origin/destination/label). Falls back to DEFAULT_PATH_MAP
  useEffect(() => {
    Papa.parse(MATRIX_CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        try {
          const rows = (data || []).map((r) =>
            Object.fromEntries(
              Object.entries(r).map(([k, v]) => [normKey(k), typeof v === 'string' ? v.trim() : v])
            )
          );
          const map = {};
          const set = new Set();
          rows.forEach((row) => {
            const from = row['Origin Cluster'] || row['From'] || row['Origin'] || '';
            const to = row['Landing Cluster'] || row['To'] || row['Destination'] || '';
            const label = row['Path Label'] || row['Label'] || '';
            const notes = row['Notes'] || '';
            const freqRaw = row['Frequency'] || row['Weight'] || '';
            const frequency = Math.max(0, Number(freqRaw) || 0);
            if (!from || !to || !label) return;
            if (!map[from]) map[from] = {};
            map[from][to] = { label: String(label), notes: String(notes), frequency };
            set.add(from); set.add(to);
          });
          const hasAny = Object.keys(map).length > 0;
          if (hasAny) {
            setPathMap(map);
            const list = Array.from(set.values());
            if (list.length) {
              list.sort();
              setClusters(list);
              if (!list.includes(origin)) setOrigin(list[0]);
            }
          }
        } catch (e) {
          // keep default map
          console.warn('Failed to parse pathway-matrix.csv, using defaults', e, errors);
        }
      },
      error: (e) => {
        console.warn('Could not load pathway-matrix.csv, using defaults', e);
      }
    });
  }, []);

  const allowed = useMemo(() => {
    const row = pathMap[origin] || {};
    return clusters.filter((c) => !!row[c]);
  }, [origin, pathMap, clusters]);

  const onRoll = () => {
    const options = allowed;
    if (options.length === 0) return;
    // Weighted by frequency if provided
    const weighted = [];
    options.forEach((to) => {
      const meta = pathMap[origin]?.[to];
      const freq = (typeof meta === 'object' && meta?.frequency) ? Number(meta.frequency) : 1;
      const count = Math.max(1, Math.round(freq));
      for (let i = 0; i < count; i++) weighted.push(to);
    });
    const roll = Math.floor(Math.random() * weighted.length);
    setLastRoll(roll + 1);
    const to = weighted[(roll + seed) % weighted.length];
    const meta = pathMap[origin][to];
    const label = typeof meta === 'object' ? meta.label : meta;
    const notes = typeof meta === 'object' ? (meta.notes || '') : '';
    const frequency = typeof meta === 'object' ? (meta.frequency || 0) : 0;
    setSelection({ from: origin, to, label, notes, frequency });
  };

  const sampleRoles = useMemo(() => {
    if (!selection || !selection.to) return [];
    const list = jobsByCluster[selection.to] || [];
    return list.slice(0, 6);
  }, [jobsByCluster, selection]);

  // Compute per-cell metrics
  const getMetrics = (from, to) => {
    const meta = pathMap[from]?.[to];
    const label = typeof meta === 'object' ? meta?.label : meta || '';
    if (!label) return null;
    const a = clusterAvg[from] || {};
    const b = clusterAvg[to] || {};
    const [va, vb, names] = alignVectors(a, b);
    const sim = cosineSimilarity(va, vb);
    const fit = Math.round(sim * 100);
    // Gaps = where dest > origin
    const gaps = names
      .map((n, i) => ({ name: n, from: va[i] || 0, to: vb[i] || 0, gap: (vb[i] || 0) - (va[i] || 0) }))
      .filter((x) => x.gap > 0)
      .sort((x, y) => y.gap - x.gap);
    const strengths = names
      .map((n, i) => ({ name: n, from: va[i] || 0, to: vb[i] || 0, gap: (va[i] || 0) - (vb[i] || 0) }))
      .filter((x) => x.gap >= 0)
      .sort((x, y) => y.gap - x.gap);
    return { label, fit, gaps, strengths };
  };

  const fitColor = (fit) => {
    const h = Math.max(0, Math.min(120, Math.round((fit / 100) * 120))); // 0=red,120=green
    return `hsl(${h} 80% 94%)`;
  };

  return (
    <div className="page solid-bg">
      {/* Header */}
      <div className="topbar">
        <div className="container">
          <div className="row space-between align-center">
            <div className="row align-center gap-12">
              <Grid3X3 className="icon-md" />
              <div>
                <h1 className="brand-title">Pathway Matrix Board</h1>
                <p className="brand-sub muted">From origin cluster to landing cluster</p>
              </div>
            </div>
            <div className="row gap-12 align-center">
              <Link to="/games" className="btn">Games Hub</Link>
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
          <div className="row space-between align-center mb-12">
            <div className="row align-center gap-12">
              <div className="field" style={{ minWidth: 320 }}>
                <label className="text-sm muted">Origin Cluster</label>
                <select className="input" value={origin} onChange={(e) => { setOrigin(e.target.value); setSelection(null); }}>
                  {clusters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button className="btn" onClick={() => setSeed((s) => s + 1)} title="Reshuffle choice on same roll">
                <Shuffle className="icon-xs mr-6" /> Shuffle
              </button>
              <div className="field" style={{ minWidth: 260 }}>
                <label className="text-sm muted">Focus Skill (optional)</label>
                <select className="input" value={focusSkill} onChange={(e) => setFocusSkill(e.target.value)}>
                  <option value="">All skills</option>
                  {allSkills.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row gap-12 align-center">
              <button className="btn primary row center" onClick={onRoll}>
                <Dice5 className="icon-xs mr-6 white" /> Roll
              </button>
              <div className="text-sm muted">Last roll: {lastRoll || '-'}</div>
            </div>
          </div>

          {/* Matrix */}
              <div className="matrix-board">
            <div className="matrix-grid" style={{ gridTemplateColumns: `200px repeat(${clusters.length}, 1fr)` }}>
              {/* Top-left corner */}
              <div className="matrix-cell header"><div>Position Cluster of Origin</div></div>
              {/* Column headers */}
              {clusters.map((col) => (
                <div key={'col-' + col} className="matrix-cell header rotate">
                  <div className="text-xs text-600">{col}</div>
                </div>
              ))}

              {/* Rows */}
              {clusters.map((row) => (
                <React.Fragment key={'row-' + row}>
                  <div className={`matrix-cell header ${row === origin ? 'active' : ''}`}>
                    <div className="text-sm text-600 row align-center">
                      {row === origin && <Flag className="icon-xs mr-6" />}
                      {row}
                    </div>
                  </div>
                  {clusters.map((col) => {
                    const m = getMetrics(row, col);
                    const allowed = !!m;
                    const meta = pathMap[row]?.[col];
                    const pathLabel = typeof meta === 'object' ? meta?.label : meta;
                    const notes = typeof meta === 'object' ? (meta?.notes || '') : '';
                    const freq = typeof meta === 'object' ? (meta?.frequency || 0) : 0;
                    const kind = classify(pathLabel);
                    const isPicked = selection && selection.from === row && selection.to === col;
                    const topGap = m?.gaps?.[0]?.name;
                    const showFocus = focusSkill && allowed && (clusterAvg[col]?.[focusSkill] || 0) > (clusterAvg[row]?.[focusSkill] || 0);
                    const bg = allowed ? fitColor(m.fit) : undefined;
                    return (
                      <button
                        title={allowed ? `${pathLabel}\nFit ${m.fit}%\nTop gap: ${topGap || '—'}${freq ? `\nFrequency ${freq}` : ''}${notes ? `\n${notes}` : ''}` : '—'}
                        key={`cell-${row}-${col}`}
                        className={`matrix-cell ${allowed ? 'allowed' : ''} kind-${kind} ${isPicked ? 'picked' : ''}`}
                        onClick={() => allowed && setSelection({ from: row, to: col, label: pathLabel, notes, frequency: freq, metrics: m })}
                        style={bg ? { background: bg } : undefined}
                      >
                        {allowed ? (
                          <div className="column" style={{ gap: 4 }}>
                            <div className="text-xs text-600">{pathLabel}</div>
                            <div className="text-xs muted">Fit {m.fit}%</div>
                            {!!freq && <div className="text-xs muted">Freq {freq}</div>}
                            {showFocus && (
                              <div className="badge" title={`Improves ${focusSkill}`}>
                                + {focusSkill}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Details */}
          {selection && (
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="row space-between align-center">
                <div>
                  <div className="text-sm muted">Move</div>
                  <div className="text-600">{selection.from} -> {selection.to}</div>
                  <div className="text-xs muted">{selection.label}{selection.frequency ? ` • Freq ${selection.frequency}` : ''}</div>
                  {selection.notes && (
                    <div className="text-xs muted" style={{ marginTop: 4 }}>{selection.notes}</div>
                  )}
                </div>
                <div className="row align-center text-xs muted">
                  <HelpCircle className="icon-xs mr-6" />
                  Click any allowed cell to explore that move
                </div>
              </div>

              {/* Gaps panel */}
              {selection.metrics && selection.metrics.gaps && (
                <div className="panel" style={{ marginTop: 12 }}>
                  <div className="panel-title">Top development areas</div>
                  {(selection.metrics.gaps.slice(0, 5)).map((g) => (
                    <div key={g.name} style={{ marginBottom: 8 }}>
                      <div className="row space-between">
                        <span className="text-sm muted">{g.name}</span>
                        <span className="text-sm text-600">+{g.gap.toFixed(1)}</span>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="bar" style={{ flex: 1 }} title={`Origin: ${g.from.toFixed(1)}/5`}>
                          <div className="bar-fill blue" style={{ width: Math.min(100, (g.from / 5) * 100) + '%' }} />
                        </div>
                        <div className="bar" style={{ flex: 1 }} title={`Destination: ${g.to.toFixed(1)}/5`}>
                          <div className="bar-fill yellow" style={{ width: Math.min(100, (g.to / 5) * 100) + '%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Roles */}
              <div className="panel" style={{ marginTop: 12 }}>
                <div className="panel-title"><BookOpen className="icon-sm mr-8" /> Example roles in {selection.to}</div>
                <div className="grid-cards">
                  {sampleRoles.length ? (
                    sampleRoles.map((r, idx) => (
                      <div key={r.title + idx} className="match">
                        <div className="text-600">{r.title}</div>
                        <div className="text-xs muted">{r.division}</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty small">No roles found in CSV for this cluster.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
