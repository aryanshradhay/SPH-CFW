// src/utils/jobDataUtils.js
import Papa from 'papaparse';

export const CSV_URL = (process.env.PUBLIC_URL || '') + '/positions-skills.csv';

export const normKey = (s) => String(s || '').trim();

export function getCI(row, ...candidates) {
  for (const c of candidates) {
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === c.toLowerCase()) {
        const v = row[k];
        return typeof v === 'string' ? v.trim() : v;
      }
    }
  }
  return '';
}

export const clamp01to5 = (n) => {
  if (n < 0) return 0;
  if (n > 5) return 5;
  return n;
};

export function classifyType(typeRaw) {
  const s = String(typeRaw || '').toLowerCase();
  if (/functional/.test(s)) return 'functional';
  if (/soft/.test(s)) return 'soft';
  return 'unknown';
}

export function inferSeniorityRank(title) {
  const s = String(title || '').toLowerCase();

  if (/(intern|apprentice|fellow)/.test(s)) return 1;
  if (/(junior|assistant|trainee)/.test(s)) return 2;
  if (/(support|coordinator|\bpc\b|administrator)/.test(s)) return 2;
  if (/(associate|analyst|officer)/.test(s)) return 3;

  if (/(vice president|\bvp\b|\bsvp\b|\bevp\b)/.test(s)) return 8;
  if (/(head of|^head\b)/.test(s)) return 8;
  if (/(chief)/.test(s) && !/(manager|director|lead|leader)/.test(s)) return 8;

  if (/(executive director)/.test(s)) return 8;
  if (/(director|medical director|principal)/.test(s)) {
    return /senior/.test(s) ? 8 : 7;
  }

  if (/(senior).*(manager|lead|leader)/.test(s)) return 7;
  if (/(manager|lead|leader)/.test(s)) return 6;
  if (/senior/.test(s)) return 5;
  if (/(specialist|consultant|scientist|advisor|expert)/.test(s)) return 4;

  return 4;
}

export function parseProficiency(row) {
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

export function alignVectors(jobA, jobB) {
  const names = Array.from(
    new Set([...(jobA?.skillOrder || []), ...(jobB?.skillOrder || [])])
  );
  const va = names.map((n) => jobA?.skillMap?.[n] ?? 0);
  const vb = names.map((n) => jobB?.skillMap?.[n] ?? 0);
  return [va, vb, names];
}

export function computeTransitionSimilarity(currentJob, targetJob, skillIDF = {}) {
  if (!currentJob || !targetJob) return 0;
  if (currentJob.id === targetJob.id) return 100;

  const [va, vb, names] = alignVectors(currentJob, targetJob);
  if (!names.length) return 0;

  const weights = names.map((name) => {
    const importance = targetJob.skillMap?.[name] ?? 0;
    const typeRaw = (
      targetJob?.skillTypeByName?.[name] || currentJob?.skillTypeByName?.[name] || ''
    ).toLowerCase();
    const typeWeight = /functional/.test(typeRaw) ? 1.15 : /soft/.test(typeRaw) ? 0.95 : 1.0;
    const base = 0.5 + (Math.max(0, Math.min(5, importance)) / 5) * 0.5;
    const idf = skillIDF?.[name] ?? 1.0;
    return base * typeWeight * idf;
  });

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  let weightSum = 0;

  for (let i = 0; i < names.length; i++) {
    const weight = weights[i] || 1;
    const a = va[i] || 0;
    const b = vb[i] || 0;
    numerator += weight * a * b;
    denomA += weight * a * a;
    denomB += weight * b * b;
    weightSum += weight;
  }

  if (denomA <= 0 || denomB <= 0) return 0;

  const cosine = numerator / (Math.sqrt(denomA) * Math.sqrt(denomB));

  let gapPenalty = 0;
  for (let i = 0; i < names.length; i++) {
    const weight = weights[i] || 1;
    const a = va[i] || 0;
    const b = vb[i] || 0;
    if (b > a) {
      const gap = (b - a) / 5;
      gapPenalty += weight * gap * gap;
    }
  }

  const gapNorm = weightSum > 0 ? Math.min(0.35, gapPenalty / weightSum) : 0;
  const score01 = Math.max(0, Math.min(1, cosine - 0.5 * gapNorm));

  return Math.round(score01 * 100);
}

export function summarizeTransition(currentJob, targetJob, maxItems = 3) {
  if (!currentJob || !targetJob) return { strengths: [], gaps: [] };

  const [va, vb, names] = alignVectors(currentJob, targetJob);
  const diffs = names.map((name, index) => ({
    name,
    current: va[index] || 0,
    target: vb[index] || 0,
    gap: (vb[index] || 0) - (va[index] || 0),
    type: classifyType(
      (targetJob?.skillTypeByName?.[name] ?? currentJob?.skillTypeByName?.[name]) || ''
    ),
  }));

  const strengths = diffs
    .filter((diff) => diff.gap <= 0 && diff.target > 0)
    .sort((a, b) => b.target - a.target)
    .slice(0, maxItems);

  const gaps = diffs
    .filter((diff) => diff.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, maxItems);

  return { strengths, gaps };
}

export function getSimilarityBadge(score) {
  if (score >= 90) return { label: 'Excellent', color: 'badge solid green' };
  if (score >= 80) return { label: 'Great', color: 'badge solid yellow' };
  if (score >= 70) return { label: 'Good', color: 'badge green' };
  if (score >= 60) return { label: 'Emerging', color: 'badge purple' };
  return { label: 'Early Match', color: 'badge yellow' };
}

export function getTrainingRecommendations(skillName, typeOrGuess, gap) {
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
  const prefix = 'SPH Academy • ';
  return pool.slice(0, count).map((item) => `${prefix}${item}`);
}

export function transformRowsToJobs(rows) {
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
  const jobs = Array.from(byTitle.values()).map((job) => {
    const skills = job.skillOrder.map((s) => job.skillMap[s] ?? 0);
    const description = job.objective
      ? job.objective
      : job.clusterDef
      ? job.clusterDef
      : `Responsibilities for ${job.title}.`;

    return {
      id: id++,
      title: job.title,
      division: job.division || 'Unknown Division',
      seniorityRank: inferSeniorityRank(job.title),
      skills,
      skillOrder: job.skillOrder,
      skillMap: job.skillMap,
      skillDefByName: job.skillDefByName,
      skillTypeByName: job.skillTypeByName,
      description,
      requirements: [],
      cluster: job.cluster,
      clusterDef: job.clusterDef,
      objective: job.objective,
    };
  });

  jobs.sort(
    (a, b) =>
      (a.division || '').localeCompare(b.division || '') ||
      a.title.localeCompare(b.title)
  );

  return jobs;
}

export function computeSkillIDF(jobs) {
  const N = jobs.length || 1;
  const df = new Map();

  jobs.forEach((job) => {
    const seen = new Set(job.skillOrder || []);
    seen.forEach((name) => df.set(name, (df.get(name) || 0) + 1));
  });

  const idfObj = {};
  df.forEach((count, name) => {
    const raw = 1 + Math.log((N + 1) / (count + 1));
    idfObj[name] = Math.max(0.85, Math.min(1.35, raw));
  });

  return idfObj;
}

export function parseCsvToJobs() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = (data || []).map((r) =>
          Object.fromEntries(
            Object.entries(r).map(([k, v]) => [
              normKey(k),
              typeof v === 'string' ? v.trim() : v,
            ])
          )
        );
        const jobs = transformRowsToJobs(rows);
        resolve({
          jobs,
          divisions: Array.from(new Set(jobs.map((j) => j.division))),
          skillIDF: computeSkillIDF(jobs),
        });
      },
      error: (err) => reject(err),
    });
  });
}

