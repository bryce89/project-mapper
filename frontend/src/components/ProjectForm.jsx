import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { T } from '../theme.js';

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', description: '', start_date: '', end_date: '', total_effort_days: '',
  });
  const [skillRows, setSkillRows] = useState([{ skill_id: '', effort_days: '' }]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSkills().then(setAllSkills).catch(console.error);
    if (isEdit) {
      api.getProject(id)
        .then(proj => {
          setForm({
            name: proj.name || '',
            description: proj.description || '',
            start_date: proj.start_date || '',
            end_date: proj.end_date || '',
            total_effort_days: proj.total_effort_days || '',
          });
          if (proj.skills?.length) {
            setSkillRows(proj.skills.map(s => ({ skill_id: String(s.id), effort_days: s.effort_days || '' })));
          }
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  function addSkillRow() {
    setSkillRows(rows => [...rows, { skill_id: '', effort_days: '' }]);
  }

  function removeSkillRow(idx) {
    setSkillRows(rows => rows.filter((_, i) => i !== idx));
  }

  function updateSkillRow(idx, field, value) {
    setSkillRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');

    const skill_ids = skillRows
      .filter(r => r.skill_id)
      .map(r => ({ id: Number(r.skill_id), effort_days: r.effort_days ? Number(r.effort_days) : null }));

    const payload = {
      ...form,
      total_effort_days: form.total_effort_days ? Number(form.total_effort_days) : null,
      skill_ids,
    };

    try {
      if (isEdit) {
        await api.updateProject(id, payload);
        navigate(`/projects/${id}`);
      } else {
        const proj = await api.createProject(payload);
        navigate(`/projects/${proj.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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

  if (loading) return <div style={{ color: T.muted, fontFamily: T.mono }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: T.serif, fontSize: 26, color: T.text, fontWeight: 600, marginBottom: 24 }}>
        {isEdit ? 'Edit Project' : 'New Project'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <div style={{ color: T.red, fontSize: 13, fontFamily: T.mono }}>{error}</div>}

          <div>
            <label style={labelStyle}>Project Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. API Modernisation" />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does this project involve?"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input style={inputStyle} type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Total Effort (days)</label>
              <input style={inputStyle} type="number" min="0" value={form.total_effort_days} onChange={e => setForm(f => ({ ...f, total_effort_days: e.target.value }))} placeholder="120" />
            </div>
          </div>

          {/* Skills required */}
          <div>
            <label style={labelStyle}>Skills Required</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {skillRows.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={row.skill_id}
                    onChange={e => updateSkillRow(idx, 'skill_id', e.target.value)}
                    style={{ ...inputStyle, flex: 2 }}
                  >
                    <option value="">Select skill...</option>
                    {allSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Effort days"
                    value={row.effort_days}
                    onChange={e => updateSkillRow(idx, 'effort_days', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSkillRow(idx)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.border}`,
                      color: T.red,
                      borderRadius: 6,
                      width: 32,
                      height: 36,
                      cursor: 'pointer',
                      fontFamily: T.mono,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSkillRow}
                style={{
                  background: 'transparent',
                  border: `1px dashed ${T.border}`,
                  color: T.muted,
                  borderRadius: 6,
                  padding: '8px',
                  fontFamily: T.mono,
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >+ Add skill row</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: T.accent,
              color: '#0a0f0a',
              border: 'none',
              borderRadius: 6,
              padding: '10px 22px',
              fontFamily: T.mono,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >{saving ? 'Saving...' : 'Save Project'}</button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}
            style={{
              background: 'transparent',
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 6,
              padding: '10px 22px',
              fontFamily: T.mono,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >Cancel</button>
        </div>
      </form>
    </div>
  );
}
