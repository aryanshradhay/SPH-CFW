// src/App.jsx
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import HomePage from './components/HomePage';
import JobSkillsMatcher from './components/JobSkillsMatcher';
import CareerRoadmap from './components/CareerRoadmap';
import JobExplorerGame from './components/JobExplorerGame';
import GamesHub from './components/GamesHub';
import GuessRoleGame from './components/GuessRoleGame';
import SkillDefinitionQuiz from './components/SkillDefinitionQuiz';
import CareerBoardGame from './components/CareerBoardGame';
import PathwayMatrixBoard from './components/PathwayMatrixBoard';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/career-explorer" element={<JobSkillsMatcher />} />
        <Route path="/roadmap" element={<CareerRoadmap />} />
        <Route path="/play-lab" element={<GamesHub />} />
        <Route path="/play-lab/guess-skill" element={<JobExplorerGame />} />
        <Route path="/play-lab/guess-role" element={<GuessRoleGame />} />
        <Route path="/play-lab/skill-quiz" element={<SkillDefinitionQuiz />} />
        <Route path="/play-lab/career-board" element={<CareerBoardGame />} />
        <Route path="/play-lab/pathway-matrix" element={<PathwayMatrixBoard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
