import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { T } from './theme.js';
import Nav from './components/Nav.jsx';
import EngineersView from './components/EngineersView.jsx';
import EngineerDetail from './components/EngineerDetail.jsx';
import EngineerForm from './components/EngineerForm.jsx';
import ProjectsView from './components/ProjectsView.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import ProjectForm from './components/ProjectForm.jsx';
import TimelineView from './components/TimelineView.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
        <Nav />
        <main style={{ flex: 1, marginLeft: 240, padding: '32px', overflowY: 'auto', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/engineers" replace />} />
            <Route path="/engineers" element={<EngineersView />} />
            <Route path="/engineers/new" element={<EngineerForm />} />
            <Route path="/engineers/:id" element={<EngineerDetail />} />
            <Route path="/engineers/:id/edit" element={<EngineerForm />} />
            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/edit" element={<ProjectForm />} />
            <Route path="/timeline" element={<TimelineView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
