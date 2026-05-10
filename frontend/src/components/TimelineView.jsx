import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api.js';
import { T, PROJECT_COLORS } from '../theme.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthOverlap(startDate, endDate, year, monthIdx) {
  if (!startDate || !endDate) return false;
  const cellStart = new Date(year, monthIdx, 1);
  const cellEnd = new Date(year, monthIdx + 1, 0); // last day of month
  const aStart = new Date(startDate);
  const aEnd = new Date(endDate);
  return aStart <= cellEnd && aEnd >= cellStart;
}

export default function TimelineView() {
  const [mode, setMode] = useState('engineer'); // 'engineer' | 'project'
  const [year, setYear] = useState(2026);
  const [assignments, setAssignments] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Map project id → color
  const projectColorMap = useMemo(() => {
    const map = {};
    projects.forEach((p, i) => { map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length]; });
    return map;
  }, [projects]);

  // By Engineer: for each engineer, for each month, compute allocations per project
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

  // By Project: for each project, for each month, compute engineers and total allocation
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

  function renderEngineerCell(monthData, eng) {
    const { hits, total } = monthData;
    if (!hits.length) return (
      <td style={{ padding: '6px 4px', borderBottom: `1px solid ${T.border}`, minWidth: 52 }} />
    );

    const isOver = total > 100;
    const bg = isOver ? 'rgba(248,113,113,0.15)' : hits.length === 1
      ? `${projectColorMap[hits[0].project_id]}22`
      : 'rgba(74,222,128,0.1)';
    const textColor = isOver ? T.red : hits.length === 1 ? projectColorMap[hits[0].project_id] : T.accent;
    const borderColor = isOver ? T.red : hits.length === 1 ? projectColorMap[hits[0].project_id] : T.accent;

    return (
      <td style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52 }}>
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
          title: hits.map(h => `${h.project_name}: ${h.allocation_pct}%`).join('\n'),
        }}>
          {total}%
        </div>
      </td>
    );
  }

  function renderProjectCell(monthData) {
    const { hits, total } = monthData;
    if (!hits.length) return (
      <td style={{ padding: '6px 4px', borderBottom: `1px solid ${T.border}`, minWidth: 52 }} />
    );
    const intensity = Math.min(total / 300, 1);
    const bg = `rgba(96,165,250,${0.05 + intensity * 0.25})`;
    return (
      <td style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 28, color: T.text, fontWeight: 600 }}>Timeline</h1>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Mode toggle */}
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

          {/* Year selector */}
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
                        <td style={rowLabelStyle}>
                          <div style={{ fontWeight: 500 }}>{eng.name}</div>
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{eng.capability}</div>
                        </td>
                        {eng.months.map((m, mi) => renderEngineerCell(m, eng))}
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
                        {proj.months.map((m, mi) => renderProjectCell(m))}
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: T.mono, fontSize: 11, color: T.muted }}>
            {mode === 'engineer' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 12, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 2 }} />
                  Single project
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 12, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 2 }} />
                  Multiple projects
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 12, background: 'rgba(248,113,113,0.15)', border: `1px solid ${T.red}`, borderRadius: 2 }} />
                  Over-allocated (&gt;100%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Numbers show total allocation %
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Cell shows engineer count for that month
                </div>
                {projects.map((p, i) => (
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
