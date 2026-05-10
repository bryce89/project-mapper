import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { T } from '../theme.js';
import AssignmentModal from './AssignmentModal.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  async function load() {
    try {
      const proj = await api.getProject(id);
      setProject(proj);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete project "${project.name}"? This will also remove all assignments.`)) return;
    try {
      await api.deleteProject(id);
      navigate('/projects');
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleRemoveAssignment(aId) {
    if (!confirm('Remove this engineer from the project?')) return;
    try {
      await api.deleteAssignment(aId);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (loading) return <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Loading...</div>;
  if (!project) return <div style={{ color: T.red }}>Project not found.</div>;

  const btnStyle = (variant = 'default') => ({
    background: variant === 'danger' ? 'rgba(248,113,113,0.1)' : variant === 'primary' ? T.accent : 'transparent',
    color: variant === 'danger' ? T.red : variant === 'primary' ? '#ffffff' : T.text,
    border: `1px solid ${variant === 'danger' ? T.red : variant === 'primary' ? T.accent : T.border}`,
    borderRadius: 6,
    padding: '7px 14px',
    fontFamily: T.mono,
    fontSize: 12,
    cursor: 'pointer',
  });

  return (
    <div style={{ maxWidth: 920 }}>
      <Link to="/projects" style={{ color: T.muted, fontFamily: T.mono, fontSize: 12, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
        ← Back to Projects
      </Link>

      {/* Header */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: T.serif, fontSize: 30, color: T.text, fontWeight: 700, marginBottom: 10 }}>{project.name}</h1>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: T.mono, fontSize: 12, color: T.muted }}>
              <span>Start: <span style={{ color: T.text }}>{formatDate(project.start_date)}</span></span>
              <span>End: <span style={{ color: T.text }}>{formatDate(project.end_date)}</span></span>
              {project.total_effort_days && (
                <span>Total effort: <span style={{ color: T.accent }}>{project.total_effort_days} days</span></span>
              )}
            </div>
            {project.description && (
              <p style={{ marginTop: 14, fontSize: 13, color: T.muted, fontFamily: T.mono, lineHeight: 1.6, maxWidth: 660 }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 20 }}>
            <button style={btnStyle()} onClick={() => navigate(`/projects/${id}/edit`)}>Edit</button>
            <button style={btnStyle('danger')} onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>

      {/* Skills Required */}
      {project.skills?.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontFamily: T.serif, fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 14 }}>Skills Required</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: '6px 12px', color: T.muted, fontWeight: 400, fontSize: 11 }}>Skill</th>
                <th style={{ textAlign: 'left', padding: '6px 12px', color: T.muted, fontWeight: 400, fontSize: 11 }}>Effort Days</th>
              </tr>
            </thead>
            <tbody>
              {project.skills.map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      background: 'rgba(96,165,250,0.1)',
                      border: `1px solid rgba(96,165,250,0.25)`,
                      color: T.blue,
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                    }}>{s.name}</span>
                  </td>
                  <td style={{ padding: '9px 12px', color: s.effort_days ? T.text : T.muted }}>
                    {s.effort_days ? `${s.effort_days} days` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Squad */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: T.serif, fontSize: 18, color: T.text, fontWeight: 600 }}>Squad</h2>
          <button style={btnStyle('primary')} onClick={() => { setEditingAssignment(null); setModalOpen(true); }}>
            + Add Engineer
          </button>
        </div>

        {!project.assignments?.length ? (
          <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No engineers assigned yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Engineer', 'Portfolio', 'Capability', 'Allocation', 'Start', 'End', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.muted, fontWeight: 400, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.assignments.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 10px', color: T.text, fontWeight: 500 }}>{a.engineer_name}</td>
                  <td style={{ padding: '10px 10px', color: T.muted }}>{a.portfolio || '—'}</td>
                  <td style={{ padding: '10px 10px', color: T.muted }}>{a.capability || '—'}</td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{
                      color: a.allocation_pct === 100 ? T.accent : T.orange,
                      background: a.allocation_pct === 100 ? 'rgba(74,222,128,0.1)' : 'rgba(251,146,60,0.1)',
                      border: `1px solid ${a.allocation_pct === 100 ? 'rgba(74,222,128,0.3)' : 'rgba(251,146,60,0.3)'}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                    }}>{a.allocation_pct}%</span>
                  </td>
                  <td style={{ padding: '10px 10px', color: T.muted }}>{a.start_date}</td>
                  <td style={{ padding: '10px 10px', color: T.muted }}>{a.end_date}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => { setEditingAssignment(a); setModalOpen(true); }}
                      style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 12, fontFamily: T.mono, marginRight: 8 }}>Edit</button>
                    <button onClick={() => handleRemoveAssignment(a.id)}
                      style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12, fontFamily: T.mono }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <AssignmentModal
          prefilledProjectId={id}
          existingAssignment={editingAssignment}
          onClose={() => { setModalOpen(false); setEditingAssignment(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
