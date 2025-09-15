// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import JobSkillsMatcher from './components/JobSkillsMatcher';
import JobExplorerGame from './components/JobExplorerGame';
import GamesHub from './components/GamesHub';
import GuessRoleGame from './components/GuessRoleGame';
import SkillDefinitionQuiz from './components/SkillDefinitionQuiz';
import CareerBoardGame from './components/CareerBoardGame';

export default function App(){
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<JobSkillsMatcher/>} />
        <Route path="/game" element={<JobExplorerGame/>} />
        <Route path="/games" element={<GamesHub/>} />
        <Route path="/games/guess-role" element={<GuessRoleGame/>} />
        <Route path="/games/skill-quiz" element={<SkillDefinitionQuiz/>} />
        <Route path="/games/career-board" element={<CareerBoardGame/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
