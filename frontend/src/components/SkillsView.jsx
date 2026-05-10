import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api.js';
import { T } from '../theme.js';

function InlineEdit({ skill, onSave, onCancel }) {
  const [value, setValue] = useState(skill.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const handleSave = async () => {
    const name = value.trim();
    if (!name || name === skill.name) { onCancel(); return; }
    setSaving(true);
    setError('');
    try {
      await api.updateSkill(skill.id, name);
      onSave();
    } catch {
      setError('Name already exists.');
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { setValue(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        style={{
          background: T.bg,
          border: `1px solid ${T.accent}`,
          borderRadius: 5,
          color: T.text,
          fontFamily: T.mono,
          fontSize: 12,
          padding: '4px 10px',
          outline: 'none',
          width: 180,
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving || !value.trim()}
        style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 12px', fontFamily: T.mono, fontSize: 12, cursor: 'pointer' }}
      >{saving ? '…' : 'Save'}</button>
      <button
        onClick={onCancel}
        style={{ background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 10px', fontFamily: T.mono, fontSize: 12, cursor: 'pointer' }}
      >Cancel</button>
      {error && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.red }}>{error}</span>}
    </div>
  );
}

export default function SkillsView() {
  const [skills, setSkills] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getSkills(), api.getEngineers()])
      .then(([s, e]) => { setSkills(s); setEngineers(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const engineerCountForSkill = (skillId) =>
    engineers.filter(e => e.skills?.some(s => s.id === skillId)).length;

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newSkill.trim();
    if (!name) return;
    setAdding(true);
    setError('');
    try {
      await api.createSkill(name);
      setNewSkill('');
      load();
    } catch {
      setError('Skill already exists or could not be created.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteSkill(id);
      setDeleteConfirm(null);
      load();
    } catch {
      setError('Could not delete skill.');
    }
  };

  const inputStyle = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    color: T.text,
    fontFamily: T.mono,
    fontSize: 13,
    padding: '9px 12px',
    outline: 'none',
    flex: 1,
  };

  const thStyle = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 11,
    color: T.muted,
    fontFamily: T.mono,
    fontWeight: 500,
    borderBottom: `1px solid ${T.border}`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: `1px solid ${T.border}`,
    fontFamily: T.mono,
    fontSize: 13,
    color: T.text,
    verticalAlign: 'middle',
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 28, color: T.text, fontWeight: 600 }}>Skills</h1>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Manage the shared skill list used across engineers and projects.</p>
      </div>

      {/* Add skill form */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
        <p style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Add New Skill</p>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={newSkill}
            onChange={e => { setNewSkill(e.target.value); setError(''); }}
            placeholder="e.g. Kotlin, Azure, GraphQL..."
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={adding || !newSkill.trim()}
            style={{
              background: newSkill.trim() ? T.accent : T.border,
              color: newSkill.trim() ? '#ffffff' : T.muted,
              border: 'none',
              borderRadius: 6,
              padding: '9px 20px',
              fontFamily: T.mono,
              fontSize: 13,
              fontWeight: 500,
              cursor: newSkill.trim() ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            {adding ? 'Adding…' : '+ Add Skill'}
          </button>
        </form>
        {error && <p style={{ fontFamily: T.mono, fontSize: 12, color: T.red, marginTop: 8 }}>{error}</p>}
      </div>

      {/* Skills table */}
      {loading ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Loading...</div>
      ) : skills.length === 0 ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No skills yet. Add one above.</div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Skill</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Engineers</th>
                <th style={{ ...thStyle, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {skills.map(skill => {
                const count = engineerCountForSkill(skill.id);
                const isConfirming = deleteConfirm === skill.id;
                const isEditing = editingId === skill.id;
                return (
                  <tr
                    key={skill.id}
                    style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = T.cardHover; }}
                    onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={tdStyle}>
                      {isEditing ? (
                        <InlineEdit
                          skill={skill}
                          onSave={() => { setEditingId(null); load(); }}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            onClick={() => { setEditingId(skill.id); setDeleteConfirm(null); }}
                            title="Click to edit"
                            style={{
                              background: `${T.accent}18`,
                              border: `1px solid ${T.accent}44`,
                              color: T.accent,
                              borderRadius: 4,
                              padding: '3px 10px',
                              fontSize: 12,
                              fontFamily: T.mono,
                              cursor: 'pointer',
                              transition: 'background 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${T.accent}30`; e.currentTarget.style.borderColor = T.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${T.accent}18`; e.currentTarget.style.borderColor = `${T.accent}44`; }}
                          >
                            {skill.name}
                          </span>
                          <span style={{ fontSize: 15, color: T.muted, fontFamily: T.mono }}>✎</span>
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {count > 0 ? (
                        <span style={{
                          background: `${T.blue}18`,
                          border: `1px solid ${T.blue}44`,
                          color: T.blue,
                          borderRadius: 4,
                          padding: '2px 10px',
                          fontSize: 12,
                        }}>
                          {count} engineer{count !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: T.muted, fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {!isEditing && (isConfirming ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>Delete?</span>
                          <button
                            onClick={() => handleDelete(skill.id)}
                            style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 12px', fontFamily: T.mono, fontSize: 12, cursor: 'pointer' }}
                          >Yes</button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{ background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 5, padding: '5px 12px', fontFamily: T.mono, fontSize: 12, cursor: 'pointer' }}
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setDeleteConfirm(skill.id); setEditingId(null); }}
                          style={{ background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 5, padding: '5px 12px', fontFamily: T.mono, fontSize: 12, cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = T.red; }}
                          onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
                        >
                          Delete
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11, color: T.muted }}>
            {skills.length} skill{skills.length !== 1 ? 's' : ''} total · Click a skill name to edit
          </div>
        </div>
      )}
    </div>
  );
}
