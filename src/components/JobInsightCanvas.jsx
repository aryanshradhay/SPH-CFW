// src/components/JobInsightCanvas.jsx
import React, { useMemo } from 'react';
import {
  X,
  ArrowLeft,
  MapPin,
  Sparkles,
  Star,
  MessageSquarePlus,
  PartyPopper,
} from 'lucide-react';
import '../styles/components/job-insight-canvas.css';
import { getSimilarityBadge } from '../utils/jobDataUtils';
import { FEEDBACK_LINKS } from '../data/feedbackLinks';

function formatSimilarity(score) {
  if (score == null) return 'N/A';
  return `${score}% match`;
}

function pluralise(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

const RadarChart = ({ skills, maxValue = 5 }) => {
  if (!skills || skills.length < 3) {
    return null;
  }
  const size = 320;
  const center = size / 2;
  const padding = 36;
  const radius = center - padding;
  const steps = 5;
  const angleStep = (Math.PI * 2) / skills.length;
  const levelPolygons = Array.from({ length: steps }, (_, index) => {
    const scale = (index + 1) / steps;
    return skills
      .map((_, skillIndex) => {
        const angle = angleStep * skillIndex - Math.PI / 2;
        const r = radius * scale;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  });
  const axisPoints = skills.map((skill, skillIndex) => {
    const angle = angleStep * skillIndex - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });
  const dataPoints = skills
    .map((skill, skillIndex) => {
      const valueRatio = Math.max(0, Math.min(maxValue, skill.level || 0)) / maxValue;
      const angle = angleStep * skillIndex - Math.PI / 2;
      const r = radius * valueRatio;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const dataDots = skills.map((skill, skillIndex) => {
    const valueRatio = Math.max(0, Math.min(maxValue, skill.level || 0)) / maxValue;
    const angle = angleStep * skillIndex - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });
  return (
    <div className="insight-radar__chart" role="img" aria-label="Capability radar">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g className="insight-radar__grid">
          {levelPolygons.map((points, index) => (
            <polygon key={index} points={points} className="insight-radar__grid-ring" />
          ))}
          {axisPoints.map((point, index) => (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              className="insight-radar__axis"
            />
          ))}
        </g>
        <polygon points={dataPoints} className="insight-radar__shape" />
        {dataDots.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={3.5} className="insight-radar__dot" />
        ))}
      </svg>
    </div>
  );
};
const JobInsightCanvas = React.forwardRef(
  (
    {
      job,
      onClose,
      onSaveMyPosition,
      summary,
      skillsByType,
      baselineSimilarity,
      myPosition,
      inline = false,
    },
    ref
  ) => {
    const functionalSkillDetails = useMemo(() => {
      if (!job) return [];
      return [...(skillsByType?.functional || [])]
        .map((name) => ({
          name,
          level: job.skillMap?.[name] ?? 0,
          definition: job.skillDefByName?.[name] || '',
        }))
        .sort((a, b) => {
          if (b.level === a.level) return a.name.localeCompare(b.name);
          return b.level - a.level;
        });
    }, [job, skillsByType]);
    const softSkillDetails = useMemo(() => {
      if (!job) return [];
      return [...(skillsByType?.soft || [])]
        .map((name) => ({
          name,
          level: job.skillMap?.[name] ?? 0,
          definition: job.skillDefByName?.[name] || '',
        }))
        .sort((a, b) => {
          if (b.level === a.level) return a.name.localeCompare(b.name);
          return b.level - a.level;
        });
    }, [job, skillsByType]);
    const topFunctionalSkills = useMemo(() => functionalSkillDetails.slice(0, 8), [functionalSkillDetails]);
    const topSoftSkills = useMemo(() => softSkillDetails.slice(0, 8), [softSkillDetails]);
    const fitBadge = baselineSimilarity != null ? getSimilarityBadge(baselineSimilarity) : null;
    const totalSkills = job?.skillOrder?.length || 0;
    const radarSkills = useMemo(() => {
      if (!job) return [];
      return [...(job.skillOrder || [])]
        .map((name) => ({
          name,
          level: job.skillMap?.[name] ?? 0,
        }))
        .sort((a, b) => {
          if (b.level === a.level) return a.name.localeCompare(b.name);
          return b.level - a.level;
        })
        .slice(0, 6);
    }, [job]);
    const hasRadarData = radarSkills.length >= 3;
    const quickFacts = useMemo(() => {
      if (!job) return [];
      const facts = [
        {
          label: 'Division',
          value: job.division || 'Not specified',
        },
        {
          label: 'Cluster',
          value: summary?.cluster || 'Not specified',
        },
        {
          label: 'Mapped skills',
          value: pluralise(totalSkills, 'skill'),
        },
        {
          label: 'Functional skills',
          value: pluralise(functionalSkillDetails.length, 'skill'),
        },
        {
          label: 'Soft skills',
          value: pluralise(softSkillDetails.length, 'skill'),
        },
      ];
      if (baselineSimilarity != null) {
        const fitToneRaw = fitBadge?.color ? fitBadge.color.split(' ').pop() : '';
        const allowedTones = ['green', 'yellow', 'red'];
        const fitTone = allowedTones.includes(fitToneRaw) ? fitToneRaw : '';
        facts.unshift({
          label: myPosition ? `Match vs ${myPosition.title}` : 'My fit',
          value: formatSimilarity(baselineSimilarity),
          note: fitBadge?.label || '',
          tone: fitTone || '',
        });
      }
      return facts;
    }, [
      job,
      summary?.cluster,
      totalSkills,
      functionalSkillDetails.length,
      softSkillDetails.length,
      baselineSimilarity,
      fitBadge,
      myPosition,
    ]);
    const narrativeCards = useMemo(() => {
      const cards = [];
      if (summary?.objective) {
        cards.push({
          title: 'What you will drive',
          body: summary.objective,
        });
      }
      if (summary?.clusterDef) {
        cards.push({
          title: 'Why it matters',
          body: summary.clusterDef,
        });
      } else if (summary?.cluster) {
        cards.push({
          title: 'Why it matters',
          body: `${summary.cluster} provides the guardrails for how this role creates impact.`,
        });
      }
      if (summary?.description && summary.description !== summary.objective) {
        cards.push({
          title: 'How it shows up day to day',
          body: summary.description,
        });
      }
      if (!cards.length) {
        cards.push({
          title: 'Role overview',
          body: `This role supports the ${job?.division || 'wider'} organisation with clearly defined responsibilities.`,
        });
      }
      return cards;
    }, [summary, job]);
    const improvementFormUrl = useMemo(() => {
      const baseUrl = FEEDBACK_LINKS.improvement;
      if (!baseUrl) return '';
      if (!job) return baseUrl;

      const params = new URLSearchParams();

      if (job.title) {
        params.set('jobTitle', job.title);
      }

      if (job.id != null) {
        params.set('jobId', String(job.id));
      }

      const cluster = summary?.cluster || job.cluster;
      const division = job.division;

      if (cluster) {
        params.set('cluster', cluster);
      } else if (division) {
        params.set('division', division);
      }

      const query = params.toString();

      if (!query) {
        return baseUrl;
      }

      return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`;
    }, [job, summary?.cluster]);
    const handleSetAsCurrent = () => {
      if (typeof onSaveMyPosition === 'function') {
        onSaveMyPosition(job);
      }
    };
    const feedbackFormUrl = useMemo(() => {
      const baseUrl = FEEDBACK_LINKS.feedback;
      if (!baseUrl) return '';
      if (!job) return baseUrl;

      const params = new URLSearchParams();

      if (job.title) {
        params.set('jobTitle', job.title);
      }

      if (job.id != null) {
        params.set('jobId', String(job.id));
      }

      const cluster = summary?.cluster || job.cluster;
      const division = job.division;

      if (cluster) {
        params.set('cluster', cluster);
      } else if (division) {
        params.set('division', division);
      }

      const query = params.toString();

      if (!query) {
        return baseUrl;
      }

      return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`;
    }, [job, summary?.cluster]);
    if (!job) {
      return null;
    }
    const headingId = `job-insight-${job.id}`;
    return (
      <aside ref={ref} className={`insight-panel${inline ? ' insight-panel--inline' : ''}`} aria-labelledby={headingId} aria-label={`Details for ${job.title}`}>
        <div className="insight-canvas">
          <header className="insight-canvas__hero">
            <button className="insight-canvas__close" onClick={onClose} aria-label="Close job insight">
              <X className="icon-sm" />
            </button>
            <div className="insight-canvas__eyebrow">
              <ArrowLeft className="icon-xs" />
              <button type="button" onClick={onClose} className="insight-link">
                Back to explorer
              </button>
            </div>
            <h2 id={headingId} className="insight-canvas__title">
              {job.title}
            </h2>
            <p className="insight-canvas__meta">
              <MapPin className="icon-xs" /> {job.division}
            </p>
            <div className="insight-stats">
              {quickFacts.map((fact) => (
                <div
                  key={`${fact.label}-${fact.value}`}
                  className={`insight-stat${fact.tone ? ` is-${fact.tone}` : ''}`}
                >
                  <span className="insight-stat__label">{fact.label}</span>
                  <span className="insight-stat__value">{fact.value}</span>
                  {fact.note && <span className="insight-stat__note">{fact.note}</span>}
                </div>
              ))}
            </div>
          </header>
          {narrativeCards.length > 0 && (
            <section className="insight-section insight-section--overview">
              <div className="insight-section__header">
                <h3>Role narrative</h3>
                <span className="insight-highlight">Context snapshot</span>
              </div>
              <div className="insight-overview">
                {narrativeCards.map((card) => (
                  <article key={card.title} className="insight-overview__card">
                    <h4>{card.title}</h4>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section className="insight-section insight-section--skills">
            <div className="insight-section__header">
              <h3>Skill DNA focus</h3>
              <span className="insight-highlight">Hands-on strengths</span>
            </div>
            <div className="insight-skill-cards">
              <div className="insight-skill-group">
                <header>
                  <h4>Functional capabilities</h4>
                  <span>{pluralise(functionalSkillDetails.length, 'skill')}</span>
                </header>
                {topFunctionalSkills.length ? (
                  <div className="insight-skill-card-grid">
                    {topFunctionalSkills.map((skill) => (
                      <article key={skill.name} className="insight-skill-card">
                        <header>
                          <h5>{skill.name}</h5>
                          <span className="insight-pill">
                            <Star className="icon-xxs" /> {skill.level}/5
                          </span>
                        </header>
                        {skill.definition && <p>{skill.definition}</p>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="insight-empty">Functional skills not mapped yet.</p>
                )}
              </div>
              <div className="insight-skill-group">
                <header>
                  <h4>Soft skills</h4>
                  <span>{pluralise(softSkillDetails.length, 'skill')}</span>
                </header>
                {topSoftSkills.length ? (
                  <div className="insight-skill-card-grid">
                    {topSoftSkills.map((skill) => (
                      <article key={skill.name} className="insight-skill-card">
                        <header>
                          <h5>{skill.name}</h5>
                          <span className="insight-pill">
                            <Star className="icon-xxs" /> {skill.level}/5
                          </span>
                        </header>
                        {skill.definition && <p>{skill.definition}</p>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="insight-empty">Soft skills not mapped yet.</p>
                )}
              </div>
            </div>
          </section>
          <section className="insight-section insight-section--radar">
            <div className="insight-section__header">
              <h3>Capability radar</h3>
              <span className="insight-highlight">Top mapped skills</span>
            </div>
            {hasRadarData ? (
              <div className="insight-radar">
                <RadarChart skills={radarSkills} />
                <ul className="insight-radar__list">
                  {radarSkills.map((skill) => (
                    <li key={skill.name}>
                      <span>{skill.name}</span>
                      <span>{skill.level}/5</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="insight-empty">Map at least three skills to unlock the capability radar.</p>
            )}
          </section>
          <section className="insight-cta">
            <div className="insight-cta__content">
              <h3>Help us make this sparkle ✨</h3>
              <p>
                We’re co-creating this canvas with you. Tell us what feels magical or what could use an extra
                glow-up!
              </p>
            </div>
            <div className="insight-cta__actions" aria-label="Feedback actions for this role">
              {typeof onSaveMyPosition === 'function' && (
                <button
                  type="button"
                  className="insight-chip insight-cta__action"
                  onClick={handleSetAsCurrent}
                  aria-label={`Save ${job?.title || 'this role'} as My Position`}
                >
                  <Sparkles className="icon-xs" /> Save as My Position
                </button>
              )}
              {feedbackFormUrl && (
                <a
                  className="insight-chip insight-chip--link insight-cta__action insight-cta__action--primary"
                  href={feedbackFormUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Share feedback about ${job?.title || 'this role'}`}
                >
                  <PartyPopper className="icon-xs" /> Add a new Role
                </a>
              )}
              {improvementFormUrl && (
                <a
                  className="insight-chip insight-chip--link insight-cta__action"
                  href={improvementFormUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Share an improvement idea for ${job?.title || 'this role'}`}
                >
                  <MessageSquarePlus className="icon-xs" /> Suggest a glow-up
                </a>
              )}
            </div>
          </section>
        </div>
      </aside>
    );
  }
);
JobInsightCanvas.displayName = 'JobInsightCanvas';
export default JobInsightCanvas;

