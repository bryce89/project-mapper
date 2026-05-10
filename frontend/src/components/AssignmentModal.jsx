import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { T } from '../theme.js';

export default function AssignmentModal({ prefilledEngineerId, prefilledProjectId, existingAssignment, onClose, onSaved }) {
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    engineer_id: prefilledEngineerId || '',
    project_id: prefilledProjectId || '',
    start_date: '',
    end_date: '',
    allocation_pct: 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getEngineers(),
      api.getProjects(),
    ]).then(([engs, projs]) => {
      setEngineers(engs);
      setProjects(projs);
    }).catch(console.error);

    if (existingAssignment) {
      setForm({
        engineer_id: String(existingAssignment.engineer_id),
        project_id: String(existingAssignment.project_id),
        start_date: existingAssignment.start_date || '',
        end_date: existingAssignment.end_date || '',
        allocation_pct: existingAssignment.allocation_pct || 100,
      });
    }
  }, []);

  async function handleSave() {
    if (!form.engineer_id || !form.project_id || !form.start_date || !form.end_date) {
      setError('Engineer, project, start date, and end date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        engineer_id: Number(form.engineer_id),
        project_id: Number(form.project_id),
        start_date: form.start_date,
        end_date: form.end_date,
        allocation_pct: Number(form.allocation_pct),
      };
      if (existingAssignment) {
        await api.updateAssignment(existingAssignment.id, payload);
      } else {
        await api.createAssignment(payload);
      }
      await onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.deleteAssignment(existingAssignment.id);
      await onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    }
  }

  const inputStyle = {
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    color: T.text,
    fontFamily: T.mono,
    fontSize: 13,
    padding: '9px 12px',
    outline: 'none',
    width: '100%',
  };

  const labelStyle = { fontSize: 11, color: T.muted, fontFamily: T.mono, display: 'block', marginBottom: 5 };

  const pct = Number(form.allocation_pct) || 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 32, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: T.serif, fontSize: 22, color: T.text, fontWeight: 600, marginBottom: 22 }}>
          {existingAssignment ? 'Edit Assignment' : 'New Assignment'}
        </h2>

        {error && <div style={{ color: T.red, fontSize: 12, fontFamily: T.mono, marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Engineer</label>
            <select
              value={form.engineer_id}
              onChange={e => setForm(f => ({ ...f, engineer_id: e.target.value }))}
              disabled={Boolean(prefilledEngineerId)}
              style={{ ...inputStyle, opacity: prefilledEngineerId ? 0.7 : 1 }}
            >
              <option value="">Select engineer...</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.name} ({e.capability || e.portfolio || '—'})</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Project</label>
            <select
              value={form.project_id}
              onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
              disabled={Boolean(prefilledProjectId)}
              style={{ ...inputStyle, opacity: prefilledProjectId ? 0.7 : 1 }}
            >
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" style={inputStyle} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" style={inputStyle} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Allocation: <span style={{ color: T.accent, fontWeight: 500 }}>{pct}%</span></label>
            <input
              type="number"
              min="1"
              max="100"
              style={inputStyle}
              value={form.allocation_pct}
              onChange={e => setForm(f => ({ ...f, allocation_pct: Math.min(100, Math.max(1, Number(e.target.value))) }))}
            />
            {/* Visual allocation bar */}
            <div style={{ marginTop: 8, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: pct === 100 ? T.accent : pct >= 75 ? T.orange : T.blue,
                borderRadius: 3,
                transition: 'width 0.2s, background 0.2s',
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: T.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '9px 20px',
                fontFamily: T.mono,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >{saving ? 'Saving...' : 'Save'}</button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.text,
                borderRadius: 6,
                padding: '9px 16px',
                fontFamily: T.mono,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
          {existingAssignment && (
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(248,113,113,0.1)',
                border: `1px solid ${T.red}`,
                color: T.red,
                borderRadius: 6,
                padding: '9px 16px',
                fontFamily: T.mono,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
