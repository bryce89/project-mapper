import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { T } from '../theme.js';

function SkillTag({ name }) {
  return (
    <span style={{
      background: 'rgba(74,222,128,0.1)',
      border: `1px solid rgba(74,222,128,0.25)`,
      color: T.accent,
      borderRadius: 4,
      padding: '2px 7px',
      fontSize: 11,
      fontFamily: T.mono,
    }}>{name}</span>
  );
}

export default function EngineersView() {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', portfolio: '', capability: '', skill: '' });

  const portfolios = [...new Set(engineers.map(e => e.portfolio).filter(Boolean))].sort();
  const capabilities = [...new Set(engineers.map(e => e.capability).filter(Boolean))].sort();

  useEffect(() => {
    api.getSkills().then(setSkills).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.portfolio) params.portfolio = filters.portfolio;
    if (filters.capability) params.capability = filters.capability;
    if (filters.skill) params.skill = filters.skill;
    api.getEngineers(params)
      .then(setEngineers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const hasFilters = filters.search || filters.portfolio || filters.capability || filters.skill;

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, color: T.text, fontWeight: 600 }}>Engineers</h1>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{engineers.length} engineer{engineers.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={() => navigate('/engineers/new')}
          style={{
            background: T.accent,
            color: '#0a0f0a',
            border: 'none',
            borderRadius: 6,
            padding: '9px 18px',
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >+ New Engineer</button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search name, email, portfolio..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          style={{ ...inputStyle, width: 220 }}
        />
        <select value={filters.portfolio} onChange={e => setFilters(f => ({ ...f, portfolio: e.target.value }))} style={inputStyle}>
          <option value="">All portfolios</option>
          {portfolios.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.capability} onChange={e => setFilters(f => ({ ...f, capability: e.target.value }))} style={inputStyle}>
          <option value="">All capabilities</option>
          {capabilities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.skill} onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))} style={inputStyle}>
          <option value="">All skills</option>
          {skills.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => setFilters({ search: '', portfolio: '', capability: '', skill: '' })}
            style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: '7px 12px', fontFamily: T.mono, fontSize: 12, cursor: 'pointer' }}
          >Clear filters</button>
        )}
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Loading...</div>
      ) : engineers.length === 0 ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No engineers found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {engineers.map(eng => (
            <div
              key={eng.id}
              onClick={() => navigate(`/engineers/${eng.id}`)}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: 20,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = T.cardHover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; }}
            >
              <div style={{ fontFamily: T.serif, fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 4 }}>{eng.name}</div>
              <div style={{ fontSize: 12, color: T.muted, fontFamily: T.mono, marginBottom: 2 }}>{eng.portfolio || '—'}</div>
              <div style={{ fontSize: 12, color: T.accent, fontFamily: T.mono, marginBottom: 12 }}>{eng.capability || '—'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {(eng.skills || []).slice(0, 5).map(s => <SkillTag key={s.id} name={s.name} />)}
                {eng.skills?.length > 5 && <span style={{ fontSize: 11, color: T.muted }}>+{eng.skills.length - 5} more</span>}
              </div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                {eng.project_count > 0
                  ? `On ${eng.project_count} project${eng.project_count !== 1 ? 's' : ''} · ${eng.total_allocation_pct}% allocated`
                  : 'No active assignments'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
