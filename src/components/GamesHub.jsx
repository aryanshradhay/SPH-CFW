// src/components/GamesHub.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Target, BookOpen, ListChecks, Route as RouteIcon, Grid3x3 } from 'lucide-react';
import '../styles/main.css';
import SiteHeader from './SiteHeader';

export default function GamesHub() {
  return (
    <div className="page solid-bg">
      <SiteHeader />

      <div className="container content">
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

        <div className="card section" style={{ marginBottom: 16 }}>
          <p className="hero-footnote" style={{ marginTop: 0 }}>
            These playful experiments reflect the game concepts we can build with the information available
            today. Expect the Play Lab to grow livelier as the SPH dataset uncovers more insights.
          </p>
          <div className="grid-cards">
            {/* Game: Job Explorer (guess a skill) */}
            <div className="match match-good">
              <div className="row space-between mb-6">
                <h4 className="text-sm text-600 row align-center">
                  <ListChecks className="icon-sm mr-8" /> Guess a Skill
                </h4>
                <span className="badge">Beginner</span>
              </div>
              <p className="text-xs muted mb-8">
                For the displayed role, pick the correct skill from multiple choices. Quick rounds to build familiarity.
              </p>
              <Link to="/play-lab/guess-skill" className="btn primary full row center">
                Play
              </Link>
            </div>

            {/* Game: Guess the Role */}
            <div className="match match-fair">
              <div className="row space-between mb-6">
                <h4 className="text-sm text-600 row align-center">
                  <Target className="icon-sm mr-8" /> Guess the Role
                </h4>
                <span className="badge solid yellow">Intermediate</span>
              </div>
              <p className="text-xs muted mb-8">
                See top skills and the function; choose which role they describe. Great for learning role signatures.
              </p>
              <Link to="/play-lab/guess-role" className="btn primary full row center">
                Play
              </Link>
            </div>

            {/* Game: Skill Definition Quiz */}
            <div className="match match-excellent">
              <div className="row space-between mb-6">
                <h4 className="text-sm text-600 row align-center">
                  <BookOpen className="icon-sm mr-8" /> Skill Definition Quiz
                </h4>
                <span className="badge solid green">Knowledge</span>
              </div>
              <p className="text-xs muted mb-8">
                Read a skill definition and pick the correct skill name. Sharpens vocabulary and expectations.
              </p>
              <Link to="/play-lab/skill-quiz" className="btn primary full row center">
                Play
              </Link>
            </div>

            {/* Game: Career Path Board */}
            <div className="match match-good">
              <div className="row space-between mb-6">
                <h4 className="text-sm text-600 row align-center">
                  <RouteIcon className="icon-sm mr-8" /> Career Path Board
                </h4>
                <span className="badge">Pathway</span>
              </div>
              <p className="text-xs muted mb-8">
                Follow a board-style path of roles to see how careers progress within a function. Roll to advance and view key skills at each step.
              </p>
              <Link to="/play-lab/career-board" className="btn primary full row center">
                Play
              </Link>
            </div>

            {/* Game: Pathway Matrix Board */}
            <div className="match match-fair">
              <div className="row space-between mb-6">
                <h4 className="text-sm text-600 row align-center">
                  <Grid3x3 className="icon-sm mr-8" /> Pathway Matrix Board
                </h4>
                <span className="badge">Matrix</span>
              </div>
              <p className="text-xs muted mb-8">
                A grid of origin vs landing clusters. Roll or click to explore allowed transitions and see example roles in the destination.
              </p>
              <Link to="/play-lab/pathway-matrix" className="btn primary full row center">
                Play
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
