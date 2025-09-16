// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import JobSkillsMatcher from './components/JobSkillsMatcher';
import CareerRoadmap from './components/CareerRoadmap';
import JobExplorerGame from './components/JobExplorerGame';
import GamesHub from './components/GamesHub';
import GuessRoleGame from './components/GuessRoleGame';
import SkillDefinitionQuiz from './components/SkillDefinitionQuiz';
import CareerBoardGame from './components/CareerBoardGame';
import PathwayMatrixBoard from './components/PathwayMatrixBoard';
import EvaRoomLanding from './components/EvaRoomLanding';

export default function App(){
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<JobSkillsMatcher/>} />
        <Route path="/roadmap" element={<CareerRoadmap/>} />
        <Route path="/play-lab" element={<GamesHub/>} />
        <Route path="/play-lab/guess-skill" element={<JobExplorerGame/>} />
        <Route path="/play-lab/guess-role" element={<GuessRoleGame/>} />
        <Route path="/play-lab/skill-quiz" element={<SkillDefinitionQuiz/>} />
        <Route path="/play-lab/career-board" element={<CareerBoardGame/>} />
        <Route path="/play-lab/pathway-matrix" element={<PathwayMatrixBoard/>} />
        <Route path="/eva-room" element={<EvaRoomLanding />} />
        <Route path="/game" element={<Navigate to="/play-lab/guess-skill" replace />} />
        <Route path="/games" element={<Navigate to="/play-lab" replace />} />
        <Route path="/games/guess-role" element={<Navigate to="/play-lab/guess-role" replace />} />
        <Route path="/games/skill-quiz" element={<Navigate to="/play-lab/skill-quiz" replace />} />
        <Route path="/games/career-board" element={<Navigate to="/play-lab/career-board" replace />} />
        <Route path="/games/pathway-matrix" element={<Navigate to="/play-lab/pathway-matrix" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
