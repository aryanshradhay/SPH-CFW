// src/components/GamesHub.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Target, BookOpen, Home, ListChecks } from 'lucide-react';
import './job-skills-matcher.css';

export default function GamesHub() {
  return (
    <div className="page solid-bg">
      {/* Header */}
      <div className="topbar">
        <div className="container">
          <div className="row space-between align-center">
            <div className="row align-center gap-12">
              <Gamepad2 className="icon-md" />
              <div>
                <h1 className="brand-title">Career Games</h1>
                <p className="brand-sub muted">Learn roles, skills, and pathways</p>
              </div>
            </div>
            <div className="row gap-12 align-center">
              <Link to="/" className="btn">
                <Home className="icon-xs mr-6" /> Back to Explorer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container content">
        <div className="card section" style={{ marginBottom: 16 }}>
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
              <Link to="/game" className="btn primary full row center">
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
              <Link to="/games/guess-role" className="btn primary full row center">
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
              <Link to="/games/skill-quiz" className="btn primary full row center">
                Play
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

