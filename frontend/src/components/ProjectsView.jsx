import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { T, PROJECT_COLORS } from '../theme.js';

function SkillTag({ name }) {
  return (
    <span style={{
      background: 'rgba(96,165,250,0.1)',
      border: `1px solid rgba(96,165,250,0.25)`,
      color: T.blue,
      borderRadius: 4,
      padding: '2px 7px',
      fontSize: 11,
      fontFamily: T.mono,
    }}>{name}</span>
  );
}

export default function ProjectsView() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', skill: '' });

  useEffect(() => {
    api.getSkills().then(setSkills).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.skill) params.skill = filters.skill;
    api.getProjects(params)
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const inputStyle = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    color: T.text,
    fontFamily: T.mono,
    fontSize: 12,
    padding: '7px 10px',
    outline: 'none',
  };

  function formatDateRange(start, end) {
    if (!start && !end) return '—';
    const fmt = d => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '?';
    return `${fmt(start)} – ${fmt(end)}`;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, color: T.text, fontWeight: 600 }}>Projects</h1>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          style={{
            background: T.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            padding: '9px 18px',
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >+ New Project</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search projects..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          style={{ ...inputStyle, width: 220 }}
        />
        <select value={filters.skill} onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))} style={inputStyle}>
          <option value="">All skills</option>
          {skills.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        {(filters.search || filters.skill) && (
          <button
            onClick={() => setFilters({ search: '', skill: '' })}
            style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: '7px 12px', fontFamily: T.mono, fontSize: 12, cursor: 'pointer' }}
          >Clear filters</button>
        )}
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No projects found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {projects.map((proj, idx) => {
            const color = PROJECT_COLORS[idx % PROJECT_COLORS.length];
            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  borderTop: `3px solid ${color}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = T.cardHover; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: T.serif, fontSize: 17, color: T.text, fontWeight: 600 }}>{proj.name}</h3>
                  <span style={{
                    background: 'rgba(167,139,250,0.1)',
                    border: `1px solid rgba(167,139,250,0.3)`,
                    color: T.purple,
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontFamily: T.mono,
                    whiteSpace: 'nowrap',
                    marginLeft: 8,
                  }}>
                    {proj.engineer_count} eng{proj.engineer_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: T.mono, marginBottom: 6 }}>
                  {formatDateRange(proj.start_date, proj.end_date)}
                </div>
                {proj.total_effort_days && (
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, marginBottom: 12 }}>
                    {proj.total_effort_days} effort days
                  </div>
                )}
                {proj.description && (
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: T.mono, marginBottom: 12, lineHeight: 1.5 }}>
                    {proj.description.length > 100 ? proj.description.slice(0, 100) + '…' : proj.description}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(proj.skills || []).slice(0, 5).map(s => <SkillTag key={s.id} name={s.name} />)}
                  {proj.skills?.length > 5 && <span style={{ fontSize: 11, color: T.muted }}>+{proj.skills.length - 5} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
