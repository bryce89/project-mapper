import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { T, PROJECT_COLORS } from '../theme.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthOverlap(startDate, endDate, year, monthIdx) {
  if (!startDate || !endDate) return false;
  const cellStart = new Date(year, monthIdx, 1);
  const cellEnd = new Date(year, monthIdx + 1, 0);
  const aStart = new Date(startDate);
  const aEnd = new Date(endDate);
  return aStart <= cellEnd && aEnd >= cellStart;
}

function AllocationPopup({ popup, onClose, projectColorMap }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!popup.visible) return null;

  const isOver = popup.total > 100;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: popup.x,
        top: popup.y,
        zIndex: 9999,
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minWidth: 220,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{popup.month} {popup.year}</div>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 600, color: T.text, marginTop: 2 }}>{popup.engName}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>

      {/* Project rows */}
      <div style={{ padding: '8px 0' }}>
        {popup.hits.map((h, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 14px',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: projectColorMap[h.project_id], flexShrink: 0 }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.project_name}
              </span>
            </div>
            <span style={{
              fontFamily: T.mono,
              fontSize: 12,
              fontWeight: 600,
              color: projectColorMap[h.project_id],
              flexShrink: 0,
            }}>
              {h.allocation_pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        padding: '8px 14px',
        borderTop: `1px solid ${T.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: T.bg,
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
        <span style={{
          fontFamily: T.mono,
          fontSize: 13,
          fontWeight: 700,
          color: isOver ? T.red : T.accent,
        }}>
          {popup.total}% {isOver && '⚠ over'}
        </span>
      </div>
    </div>
  );
}

export default function TimelineView() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('engineer');
  const [year, setYear] = useState(2026);
  const [assignments, setAssignments] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, hits: [], total: 0, engName: '', month: '', year: 2026 });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAssignments({ year: String(year) }),
      api.getEngineers(),
      api.getProjects(),
    ]).then(([asgns, engs, projs]) => {
      setAssignments(asgns);
      setEngineers(engs);
      setProjects(projs);
    }).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  const projectColorMap = useMemo(() => {
    const map = {};
    projects.forEach((p, i) => { map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length]; });
    return map;
  }, [projects]);

  const engineerRows = useMemo(() => {
    return engineers.map(eng => {
      const months = MONTHS.map((_, mi) => {
        const hits = assignments.filter(a =>
          a.engineer_id === eng.id && monthOverlap(a.start_date, a.end_date, year, mi)
        );
        const total = hits.reduce((sum, a) => sum + a.allocation_pct, 0);
        return { hits, total };
      });
      return { ...eng, months };
    }).filter(eng => eng.months.some(m => m.hits.length > 0));
  }, [engineers, assignments, year]);

  const projectRows = useMemo(() => {
    return projects.map(proj => {
      const months = MONTHS.map((_, mi) => {
        const hits = assignments.filter(a =>
          a.project_id === proj.id && monthOverlap(a.start_date, a.end_date, year, mi)
        );
        const total = hits.reduce((sum, a) => sum + a.allocation_pct, 0);
        return { hits, total };
      });
      return { ...proj, months };
    }).filter(proj => proj.months.some(m => m.hits.length > 0));
  }, [projects, assignments, year]);

  const headerCellStyle = {
    padding: '6px 4px',
    textAlign: 'center',
    fontSize: 11,
    color: T.muted,
    fontFamily: T.mono,
    borderBottom: `1px solid ${T.border}`,
    minWidth: 52,
  };

  const rowLabelStyle = {
    padding: '8px 12px',
    fontFamily: T.mono,
    fontSize: 12,
    color: T.text,
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
    minWidth: 160,
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  function handleCellClick(e, monthData, engName, monthIdx) {
    if (!monthData.hits.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 250);
    const y = rect.bottom + 6;
    setPopup({ visible: true, x, y, hits: monthData.hits, total: monthData.total, engName, month: MONTHS[monthIdx], year });
  }

  function renderEngineerCell(monthData, eng, mi) {
    const { hits, total } = monthData;
    if (!hits.length) return (
      <td key={mi} style={{ padding: '6px 4px', borderBottom: `1px solid ${T.border}`, minWidth: 52 }} />
    );

    const isOver = total > 100;
    const bg = isOver ? 'rgba(248,113,113,0.15)' : hits.length === 1
      ? `${projectColorMap[hits[0].project_id]}22`
      : `${T.accent}18`;
    const textColor = isOver ? T.red : hits.length === 1 ? projectColorMap[hits[0].project_id] : T.accent;
    const borderColor = isOver ? T.red : hits.length === 1 ? projectColorMap[hits[0].project_id] : T.accent;

    return (
      <td
        key={mi}
        style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, cursor: 'pointer' }}
        onClick={(e) => handleCellClick(e, monthData, eng.name, mi)}
      >
        <div style={{
          background: bg,
          border: `1px solid ${borderColor}44`,
          borderRadius: 4,
          padding: '3px 4px',
          textAlign: 'center',
          fontSize: 10,
          fontFamily: T.mono,
          color: textColor,
          fontWeight: isOver ? 600 : 400,
          transition: 'filter 0.1s',
        }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.9)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          {total}%
        </div>
      </td>
    );
  }

  function renderProjectCell(monthData, mi) {
    const { hits, total } = monthData;
    if (!hits.length) return (
      <td key={mi} style={{ padding: '6px 4px', borderBottom: `1px solid ${T.border}`, minWidth: 52 }} />
    );
    const intensity = Math.min(total / 300, 1);
    const bg = `rgba(96,165,250,${0.05 + intensity * 0.25})`;
    return (
      <td key={mi} style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52 }}>
        <div style={{
          background: bg,
          border: `1px solid rgba(96,165,250,${0.2 + intensity * 0.3})`,
          borderRadius: 4,
          padding: '3px 4px',
          textAlign: 'center',
          fontSize: 10,
          fontFamily: T.mono,
          color: T.blue,
        }}>
          {hits.length}👤
        </div>
      </td>
    );
  }

  return (
    <div>
      <AllocationPopup popup={popup} onClose={() => setPopup(p => ({ ...p, visible: false }))} projectColorMap={projectColorMap} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 28, color: T.text, fontWeight: 600 }}>Timeline</h1>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
            {['engineer', 'project'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  background: mode === m ? T.accent : 'transparent',
                  color: mode === m ? '#ffffff' : T.muted,
                  border: 'none',
                  padding: '7px 14px',
                  fontFamily: T.mono,
                  fontSize: 12,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >{m === 'engineer' ? 'By Engineer' : 'By Project'}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setYear(y => y - 1)}
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: '7px 12px', fontFamily: T.mono, fontSize: 13, cursor: 'pointer' }}
            >←</button>
            <span style={{ fontFamily: T.mono, fontSize: 14, color: T.text, minWidth: 40, textAlign: 'center' }}>{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: '7px 12px', fontFamily: T.mono, fontSize: 13, cursor: 'pointer' }}
            >→</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Loading...</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, textAlign: 'left', padding: '6px 12px', minWidth: 160 }}>
                    {mode === 'engineer' ? 'Engineer' : 'Project'}
                  </th>
                  {MONTHS.map(m => <th key={m} style={headerCellStyle}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {mode === 'engineer' ? (
                  engineerRows.length === 0 ? (
                    <tr><td colSpan={13} style={{ padding: 20, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No assignments in {year}</td></tr>
                  ) : (
                    engineerRows.map(eng => (
                      <tr key={eng.id}>
                        <td
                          style={{ ...rowLabelStyle, cursor: 'pointer' }}
                          onClick={() => navigate(`/engineers/${eng.id}`)}
                          onMouseEnter={e => e.currentTarget.style.color = T.accent}
                          onMouseLeave={e => e.currentTarget.style.color = T.text}
                        >
                          <div style={{ fontWeight: 500 }}>{eng.name}</div>
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{eng.capability}</div>
                        </td>
                        {eng.months.map((m, mi) => renderEngineerCell(m, eng, mi))}
                      </tr>
                    ))
                  )
                ) : (
                  projectRows.length === 0 ? (
                    <tr><td colSpan={13} style={{ padding: 20, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No assignments in {year}</td></tr>
                  ) : (
                    projectRows.map((proj, idx) => (
                      <tr key={proj.id}>
                        <td style={rowLabelStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: projectColorMap[proj.id], flexShrink: 0 }} />
                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</span>
                          </div>
                        </td>
                        {proj.months.map((m, mi) => renderProjectCell(m, mi))}
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: T.mono, fontSize: 11, color: T.muted }}>
            {mode === 'engineer' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 12, background: `${T.accent}18`, border: `1px solid ${T.accent}44`, borderRadius: 2 }} />
                  Single project
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 12, background: `${T.accent}18`, border: `1px solid ${T.accent}44`, borderRadius: 2 }} />
                  Multiple projects
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 12, background: 'rgba(248,113,113,0.15)', border: `1px solid ${T.red}`, borderRadius: 2 }} />
                  Over-allocated (&gt;100%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Click any cell to see project breakdown
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Cell shows engineer count for that month
                </div>
                {projects.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: projectColorMap[p.id] }} />
                    {p.name}
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
