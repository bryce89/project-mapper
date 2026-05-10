import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { T } from '../theme.js';
import AssignmentModal from './AssignmentModal.jsx';

function SkillTag({ name }) {
  return (
    <span style={{
      background: 'rgba(74,222,128,0.1)',
      border: `1px solid rgba(74,222,128,0.25)`,
      color: T.accent,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontFamily: T.mono,
    }}>{name}</span>
  );
}

export default function EngineerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engineer, setEngineer] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  async function load() {
    try {
      const [eng, asgns] = await Promise.all([
        api.getEngineer(id),
        api.getAssignments({ engineer_id: id }),
      ]);
      setEngineer(eng);
      setAssignments(asgns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete engineer "${engineer.name}"? This will also remove all their assignments.`)) return;
    try {
      await api.deleteEngineer(id);
      navigate('/engineers');
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleRemoveAssignment(aId) {
    if (!confirm('Remove this assignment?')) return;
    try {
      await api.deleteAssignment(aId);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Loading...</div>;
  if (!engineer) return <div style={{ color: T.red }}>Engineer not found.</div>;

  const btnStyle = (variant = 'default') => ({
    background: variant === 'danger' ? 'rgba(248,113,113,0.1)' : variant === 'primary' ? T.accent : 'transparent',
    color: variant === 'danger' ? T.red : variant === 'primary' ? '#0a0f0a' : T.text,
    border: `1px solid ${variant === 'danger' ? T.red : variant === 'primary' ? T.accent : T.border}`,
    borderRadius: 6,
    padding: '7px 14px',
    fontFamily: T.mono,
    fontSize: 12,
    cursor: 'pointer',
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <Link to="/engineers" style={{ color: T.muted, fontFamily: T.mono, fontSize: 12, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
        ← Back to Engineers
      </Link>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: T.serif, fontSize: 30, color: T.text, fontWeight: 700 }}>{engineer.name}</h1>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {engineer.portfolio && (
                <span style={{ fontSize: 13, color: T.muted, fontFamily: T.mono }}>
                  Portfolio: <span style={{ color: T.text }}>{engineer.portfolio}</span>
                </span>
              )}
              {engineer.capability && (
                <span style={{ fontSize: 13, color: T.muted, fontFamily: T.mono }}>
                  Capability: <span style={{ color: T.accent }}>{engineer.capability}</span>
                </span>
              )}
              {engineer.email && (
                <span style={{ fontSize: 13, color: T.muted, fontFamily: T.mono }}>
                  <a href={`mailto:${engineer.email}`} style={{ color: T.blue }}>{engineer.email}</a>
                </span>
              )}
            </div>
            {engineer.role_description && (
              <p style={{ marginTop: 14, fontSize: 13, color: T.muted, fontFamily: T.mono, lineHeight: 1.6, maxWidth: 640 }}>
                {engineer.role_description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 20 }}>
            <button style={btnStyle()} onClick={() => navigate(`/engineers/${id}/edit`)}>Edit</button>
            <button style={btnStyle('danger')} onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {engineer.skills?.length > 0 && (
          <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {engineer.skills.map(s => <SkillTag key={s.id} name={s.name} />)}
          </div>
        )}
      </div>

      {/* Assignments */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontFamily: T.serif, fontSize: 20, color: T.text, fontWeight: 600 }}>Assignments</h2>
          <button
            style={btnStyle('primary')}
            onClick={() => { setEditingAssignment(null); setModalOpen(true); }}
          >+ Add Assignment</button>
        </div>

        {assignments.length === 0 ? (
          <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No assignments yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Project', 'Start Date', 'End Date', 'Allocation', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.muted, fontWeight: 400, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 12px', color: T.text }}>{a.project_name}</td>
                  <td style={{ padding: '10px 12px', color: T.muted }}>{a.start_date}</td>
                  <td style={{ padding: '10px 12px', color: T.muted }}>{a.end_date}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      color: a.allocation_pct === 100 ? T.accent : T.orange,
                      background: a.allocation_pct === 100 ? 'rgba(74,222,128,0.1)' : 'rgba(251,146,60,0.1)',
                      border: `1px solid ${a.allocation_pct === 100 ? 'rgba(74,222,128,0.3)' : 'rgba(251,146,60,0.3)'}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                    }}>{a.allocation_pct}%</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => { setEditingAssignment(a); setModalOpen(true); }}
                      style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', marginRight: 8, fontSize: 12, fontFamily: T.mono }}
                    >Edit</button>
                    <button
                      onClick={() => handleRemoveAssignment(a.id)}
                      style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12, fontFamily: T.mono }}
                    >Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <AssignmentModal
          prefilledEngineerId={id}
          existingAssignment={editingAssignment}
          onClose={() => { setModalOpen(false); setEditingAssignment(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
