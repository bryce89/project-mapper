import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { T } from '../theme.js';

export default function EngineerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', email: '', portfolio: '', capability: '', role_description: '', skill_ids: [],
  });
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSkills().then(setSkills).catch(console.error);
    if (isEdit) {
      api.getEngineer(id)
        .then(eng => {
          setForm({
            name: eng.name || '',
            email: eng.email || '',
            portfolio: eng.portfolio || '',
            capability: eng.capability || '',
            role_description: eng.role_description || '',
            skill_ids: eng.skills.map(s => s.id),
          });
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  function toggleSkill(skillId) {
    setForm(f => ({
      ...f,
      skill_ids: f.skill_ids.includes(skillId)
        ? f.skill_ids.filter(s => s !== skillId)
        : [...f.skill_ids, skillId],
    }));
  }

  async function addNewSkill() {
    if (!newSkillName.trim()) return;
    try {
      const skill = await api.createSkill(newSkillName.trim());
      setSkills(prev => [...prev, skill].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(f => ({ ...f, skill_ids: [...f.skill_ids, skill.id] }));
      setNewSkillName('');
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.updateEngineer(id, form);
        navigate(`/engineers/${id}`);
      } else {
        const eng = await api.createEngineer(form);
        navigate(`/engineers/${eng.id}`);
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
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontFamily: T.serif, fontSize: 26, color: T.text, fontWeight: 600, marginBottom: 24 }}>
        {isEdit ? 'Edit Engineer' : 'New Engineer'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <div style={{ color: T.red, fontSize: 13, fontFamily: T.mono }}>{error}</div>}

          <div>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Portfolio</label>
              <input style={inputStyle} value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} placeholder="e.g. Payments, Platform" />
            </div>
            <div>
              <label style={labelStyle}>Capability</label>
              <input style={inputStyle} value={form.capability} onChange={e => setForm(f => ({ ...f, capability: e.target.value }))} placeholder="e.g. Senior Engineer" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Role Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              value={form.role_description}
              onChange={e => setForm(f => ({ ...f, role_description: e.target.value }))}
              placeholder="Brief description of this engineer's focus and expertise..."
            />
          </div>

          {/* Skills */}
          <div>
            <label style={labelStyle}>Skills</label>
            <div style={{
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {skills.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: T.mono, fontSize: 12, color: form.skill_ids.includes(s.id) ? T.accent : T.text }}>
                  <input
                    type="checkbox"
                    checked={form.skill_ids.includes(s.id)}
                    onChange={() => toggleSkill(s.id)}
                    style={{ accentColor: T.accent }}
                  />
                  {s.name}
                </label>
              ))}
            </div>

            {/* Add new skill */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Add new skill..."
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewSkill())}
              />
              <button
                type="button"
                onClick={addNewSkill}
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  borderRadius: 6,
                  padding: '9px 14px',
                  fontFamily: T.mono,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >+ Add Skill</button>
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
          >{saving ? 'Saving...' : 'Save Engineer'}</button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/engineers/${id}` : '/engineers')}
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
