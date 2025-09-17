// src/components/GamesHub.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Target, BookOpen, ListChecks, Route as RouteIcon, Grid3x3 } from 'lucide-react';
import '../styles/main.css';
import SiteHeader from './SiteHeader';

export default function GamesHub() {
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
              <h1 className="page-heading-title">Play Lab</h1>
              <p className="page-heading-subtitle">Prototype missions built with today's data</p>
            </div>
          </div>
        </div>

        <div className="card section">
          <p className="hero-footnote" style={{ marginTop: 0 }}>
            These playful experiments reflect the game concepts we can build with the information available
            today. Expect the Play Lab to grow livelier as the SPH dataset uncovers more insights.
          </p>
          <div className="play-lab-grid">
            {/* Game: Job Explorer (guess a skill) */}
            <article className="match match-good play-lab-card">
              <div className="play-lab-card-icon" aria-hidden="true">
                <ListChecks className="icon-md" />
              </div>
              <div className="play-lab-card-content">
                <div className="play-lab-card-heading">
                  <h3 className="play-lab-card-title">Guess a Skill</h3>
                </div>
                <p className="play-lab-card-description text-xs muted">
                  For the displayed role, pick the correct skill from multiple choices. Quick rounds to build familiarity.
                </p>
              </div>
              <Link to="/play-lab/guess-skill" className="btn primary play-lab-card-cta">
                Play
              </Link>
            </article>

            {/* Game: Guess the Role */}
            <article className="match match-fair play-lab-card">
              <div className="play-lab-card-icon" aria-hidden="true">
                <Target className="icon-md" />
              </div>
              <div className="play-lab-card-content">
                <div className="play-lab-card-heading">
                  <h3 className="play-lab-card-title">Guess the Role</h3>
                </div>
                <p className="play-lab-card-description text-xs muted">
                  See top skills and the function; choose which role they describe. Great for learning role signatures.
                </p>
              </div>
              <Link to="/play-lab/guess-role" className="btn primary play-lab-card-cta">
                Play
              </Link>
            </article>

            {/* Game: Skill Definition Quiz */}
            <article className="match match-excellent play-lab-card">
              <div className="play-lab-card-icon" aria-hidden="true">
                <BookOpen className="icon-md" />
              </div>
              <div className="play-lab-card-content">
                <div className="play-lab-card-heading">
                  <h3 className="play-lab-card-title">Skill Definition Quiz</h3>
                </div>
                <p className="play-lab-card-description text-xs muted">
                  Read a skill definition and pick the correct skill name. Sharpens vocabulary and expectations.
                </p>
              </div>
              <Link to="/play-lab/skill-quiz" className="btn primary play-lab-card-cta">
                Play
              </Link>
            </article>

            {/* Game: Career Path Board */}
            <article className="match match-good play-lab-card">
              <div className="play-lab-card-icon" aria-hidden="true">
                <RouteIcon className="icon-md" />
              </div>
              <div className="play-lab-card-content">
                <div className="play-lab-card-heading">
                  <h3 className="play-lab-card-title">Career Path Board</h3>
                </div>
                <p className="play-lab-card-description text-xs muted">
                  Follow a board-style path of roles to see how careers progress within a function. Roll to advance and view key skills at each step.
                </p>
              </div>
              <Link to="/play-lab/career-board" className="btn primary play-lab-card-cta">
                Play
              </Link>
            </article>

            {/* Game: Pathway Matrix Board */}
            <article className="match match-fair play-lab-card">
              <div className="play-lab-card-icon" aria-hidden="true">
                <Grid3x3 className="icon-md" />
              </div>
              <div className="play-lab-card-content">
                <div className="play-lab-card-heading">
                  <h3 className="play-lab-card-title">Pathway Matrix Board</h3>
                </div>
                <p className="play-lab-card-description text-xs muted">
                  A grid of origin vs landing clusters. Roll or click to explore allowed transitions and see example roles in the destination.
                </p>
              </div>
              <Link to="/play-lab/pathway-matrix" className="btn primary play-lab-card-cta">
                Play
              </Link>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
