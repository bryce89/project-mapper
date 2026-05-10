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
    <div ref={ref} style={{
      position: 'fixed',
      left: popup.x,
      top: popup.y,
      zIndex: 9999,
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      minWidth: 240,
      maxWidth: 320,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: T.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{popup.month} {popup.year}</div>
          <div style={{ fontFamily: T.serif, fontSize: 14, fontWeight: 600, color: T.text, marginTop: 2 }}>{popup.label}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: '8px 0' }}>
        {popup.hits.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: projectColorMap[h.project_id], flexShrink: 0 }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.project_name}
              </span>
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: projectColorMap[h.project_id], flexShrink: 0 }}>
              {h.allocation_pct}%
            </span>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: isOver ? T.red : T.accent }}>
          {popup.total}% {isOver && '⚠ over'}
        </span>
      </div>
    </div>
  );
}

export default function TimelineView() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('skills');
  const [allProjects, setAllProjects] = useState([]);
  const [year, setYear] = useState(2026);
  const [assignments, setAssignments] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [expandedSkillProjects, setExpandedSkillProjects] = useState(new Set());
  const [expandedEngineers, setExpandedEngineers] = useState(new Set());
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, hits: [], total: 0, label: '', month: '', year: 2026 });

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
      setAllProjects(projs);
      setExpandedProjects(new Set(projs.map(p => p.id)));
      setExpandedSkillProjects(new Set(projs.map(p => p.id)));
      setExpandedEngineers(new Set(engs.map(e => e.id)));
    }).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  const toggleProject = (id) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const projectColorMap = useMemo(() => {
    const map = {};
    projects.forEach((p, i) => { map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length]; });
    return map;
  }, [projects]);

  const engineerRows = useMemo(() => {
    return engineers.map(eng => {
      const engAssignments = assignments.filter(a => a.engineer_id === eng.id);
      const months = MONTHS.map((_, mi) => {
        const hits = engAssignments.filter(a => monthOverlap(a.start_date, a.end_date, year, mi));
        const total = hits.reduce((sum, a) => sum + a.allocation_pct, 0);
        return { hits, total };
      });
      const projectIds = [...new Set(engAssignments.map(a => a.project_id))];
      const projectSubRows = projectIds.map(projId => {
        const projAssignments = engAssignments.filter(a => a.project_id === projId);
        const projName = projAssignments[0]?.project_name || '';
        const projMonths = MONTHS.map((_, mi) => {
          const hits = projAssignments.filter(a => monthOverlap(a.start_date, a.end_date, year, mi));
          const total = hits.reduce((sum, a) => sum + a.allocation_pct, 0);
          return { hits, total };
        });
        return { project_id: projId, project_name: projName, months: projMonths };
      });
      return { ...eng, months, projectSubRows };
    }).filter(eng => eng.months.some(m => m.hits.length > 0));
  }, [engineers, assignments, year]);

  const skillsRows = useMemo(() => {
    return allProjects.map(proj => {
      const projAssignments = assignments.filter(a => a.project_id === proj.id);
      const activeMonths = MONTHS.map((_, mi) => monthOverlap(proj.start_date, proj.end_date, year, mi));

      const skillSubRows = (proj.skills || []).map(s => {
        const monthCoverage = MONTHS.map((_, mi) => {
          if (!activeMonths[mi]) return null;
          const monthAssignments = projAssignments.filter(a => monthOverlap(a.start_date, a.end_date, year, mi));
          const coveredAssignments = monthAssignments.filter(a => {
            const eng = engineers.find(e => e.id === a.engineer_id);
            return eng && (eng.skills || []).some(sk => sk.id === s.id);
          });
          const covered = coveredAssignments.length > 0;
          const daysInMonth = new Date(year, mi + 1, 0).getDate();
          const workingDays = Math.round(daysInMonth * 5 / 7);
          const totalPct = coveredAssignments.reduce((sum, a) => sum + a.allocation_pct, 0);
          const allocatedDays = Math.round(totalPct / 100 * workingDays);
          return { covered, allocatedDays };
        });
        const totalAllocatedDays = monthCoverage.reduce((sum, c) => sum + (c?.allocatedDays ?? 0), 0);
        return { ...s, activeMonths, monthCoverage, totalAllocatedDays };
      });

      // Project-level gap: any active month with at least one uncovered skill
      const monthHasGap = MONTHS.map((_, mi) => {
        if (!activeMonths[mi]) return false;
        return skillSubRows.some(s => s.monthCoverage[mi] && !s.monthCoverage[mi].covered);
      });

      return { ...proj, activeMonths, skillSubRows, monthHasGap };
    }).filter(proj => proj.activeMonths.some(Boolean));
  }, [allProjects, assignments, engineers, year]);

  const projectRows = useMemo(() => {
    return projects.map(proj => {
      const projAssignments = assignments.filter(a => a.project_id === proj.id);

      // Summary months (for the project header row)
      const months = MONTHS.map((_, mi) => {
        const hits = projAssignments.filter(a => monthOverlap(a.start_date, a.end_date, year, mi));
        const total = hits.reduce((sum, a) => sum + a.allocation_pct, 0);
        return { hits, total };
      });

      // Engineer sub-rows
      const engineerIds = [...new Set(projAssignments.map(a => a.engineer_id))];
      const engineerSubRows = engineerIds.map(engId => {
        const engAssignments = projAssignments.filter(a => a.engineer_id === engId);
        const engName = engAssignments[0]?.engineer_name || '';
        const engMonths = MONTHS.map((_, mi) => {
          const hits = engAssignments.filter(a => monthOverlap(a.start_date, a.end_date, year, mi));
          const total = hits.reduce((sum, a) => sum + a.allocation_pct, 0);
          return { hits, total };
        });
        return { engineer_id: engId, engineer_name: engName, months: engMonths };
      });

      return { ...proj, months, engineerSubRows };
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

  function openPopup(e, monthData, label, monthIdx) {
    if (!monthData.hits.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 340);
    const y = rect.bottom + 6;
    setPopup({ visible: true, x, y, hits: monthData.hits, total: monthData.total, label, month: MONTHS[monthIdx], year });
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
      <td key={mi} style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, cursor: 'pointer' }}
        onClick={(e) => openPopup(e, monthData, eng.name, mi)}>
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

  function renderProjectSummaryCell(monthData, mi, color) {
    const { hits } = monthData;
    if (!hits.length) return (
      <td key={mi} style={{ padding: '6px 4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, background: `${color}08` }} />
    );
    return (
      <td key={mi} style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, background: `${color}08` }}>
        <div style={{
          background: `${color}22`,
          border: `1px solid ${color}44`,
          borderRadius: 4,
          padding: '3px 4px',
          textAlign: 'center',
          fontSize: 10,
          fontFamily: T.mono,
          color: color,
          fontWeight: 500,
        }}>
          {hits.length}👤
        </div>
      </td>
    );
  }

  function renderEngineerSubCell(monthData, mi, color) {
    const { total } = monthData;
    if (!total) return (
      <td key={mi} style={{ padding: '6px 4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, background: T.bg }} />
    );
    return (
      <td key={mi} style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, background: T.bg }}>
        <div style={{
          background: `${color}18`,
          border: `1px solid ${color}44`,
          borderRadius: 4,
          padding: '3px 4px',
          textAlign: 'center',
          fontSize: 10,
          fontFamily: T.mono,
          color: color,
        }}>
          {total}%
        </div>
      </td>
    );
  }

  return (
    <div>
      <AllocationPopup popup={popup} onClose={() => setPopup(p => ({ ...p, visible: false }))} projectColorMap={projectColorMap} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 28, color: T.text, fontWeight: 600 }}>Allocation</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setYear(y => y - 1)} style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: '7px 12px', fontFamily: T.mono, fontSize: 13, cursor: 'pointer' }}>←</button>
          <span style={{ fontFamily: T.mono, fontSize: 14, color: T.text, minWidth: 40, textAlign: 'center' }}>{year}</span>
          <button onClick={() => setYear(y => y + 1)} style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: '7px 12px', fontFamily: T.mono, fontSize: 13, cursor: 'pointer' }}>→</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {[['skills', 'Project Skills'], ['project', 'By Project (FTE)'], ['engineer', 'By Engineer']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: 'transparent',
            color: mode === m ? T.accent : T.muted,
            border: 'none',
            borderBottom: mode === m ? `2px solid ${T.accent}` : '2px solid transparent',
            marginBottom: -2,
            padding: '8px 18px',
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: mode === m ? 600 : 400,
            cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {!loading && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(() => {
            const expandAll = () => {
              if (mode === 'engineer') setExpandedEngineers(new Set(engineerRows.map(e => e.id)));
              else if (mode === 'project') setExpandedProjects(new Set(projectRows.map(p => p.id)));
              else setExpandedSkillProjects(new Set(skillsRows.map(p => p.id)));
            };
            const collapseAll = () => {
              if (mode === 'engineer') setExpandedEngineers(new Set());
              else if (mode === 'project') setExpandedProjects(new Set());
              else setExpandedSkillProjects(new Set());
            };
            const btnBase = {
              background: 'transparent',
              border: `1px solid ${T.border}`,
              color: T.muted,
              borderRadius: 5,
              padding: '4px 10px',
              fontFamily: T.mono,
              fontSize: 11,
              cursor: 'pointer',
            };
            return (
              <>
                <button style={btnBase} onClick={expandAll}>Expand all</button>
                <button style={btnBase} onClick={collapseAll}>Collapse all</button>
              </>
            );
          })()}
        </div>
      )}

      {loading ? (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Loading...</div>
      ) : mode === 'skills' ? (
        <>
          <div style={{ overflowX: 'auto', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, textAlign: 'left', padding: '6px 12px', minWidth: 160 }}>Project / Skill</th>
                  <th style={{ ...headerCellStyle, minWidth: 80, whiteSpace: 'nowrap' }}>Total</th>
                  {MONTHS.map(m => <th key={m} style={headerCellStyle}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {skillsRows.length === 0 ? (
                  <tr><td colSpan={14} style={{ padding: 20, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No projects active in {year}</td></tr>
                ) : skillsRows.map(proj => {
                  const color = projectColorMap[proj.id];
                  const isExpanded = expandedSkillProjects.has(proj.id);
                  const projTotalAllocated = proj.skillSubRows.reduce((sum, s) => sum + s.totalAllocatedDays, 0);
                  const projTotalTarget = proj.skillSubRows.reduce((sum, s) => sum + (s.effort_days ?? 0), 0);
                  const projMet = projTotalTarget === 0 || projTotalAllocated >= projTotalTarget;
                  return (
                    <React.Fragment key={proj.id}>
                      {/* Project header row */}
                      <tr style={{ background: `${color}0a` }}>
                        <td
                          style={{ ...rowLabelStyle, cursor: 'pointer', background: `${color}0a` }}
                          onClick={() => setExpandedSkillProjects(prev => {
                            const next = new Set(prev);
                            next.has(proj.id) ? next.delete(proj.id) : next.add(proj.id);
                            return next;
                          })}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, color: color, fontWeight: 700, width: 10, flexShrink: 0 }}>
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</span>
                          </div>
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 2, paddingLeft: 26 }}>
                            {proj.skillSubRows.length} skill{proj.skillSubRows.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        {/* Project total column */}
                        <td style={{ padding: '4px 6px', borderBottom: `1px solid ${T.border}`, background: `${color}08`, textAlign: 'center' }}>
                          {projTotalTarget > 0 && (
                            <div style={{
                              background: projMet ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.15)',
                              border: `1px solid ${projMet ? '#22c55e' : T.red}44`,
                              borderRadius: 4,
                              padding: '3px 5px',
                              fontFamily: T.mono,
                              fontSize: 10,
                              color: projMet ? '#16a34a' : T.red,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}>
                              {projTotalAllocated}d / {projTotalTarget}d
                            </div>
                          )}
                        </td>
                        {proj.activeMonths.map((active, mi) => {
                          const hasGap = proj.monthHasGap[mi];
                          return (
                            <td key={mi} style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, background: active ? `${color}08` : 'transparent' }}>
                              {active && (
                                <div style={{
                                  background: hasGap ? 'rgba(248,113,113,0.15)' : `${color}22`,
                                  border: `1px solid ${hasGap ? T.red : color}44`,
                                  borderRadius: 4,
                                  padding: '3px 4px',
                                  textAlign: 'center',
                                  fontSize: 10,
                                  fontFamily: T.mono,
                                  color: hasGap ? T.red : color,
                                  fontWeight: 500,
                                }}>
                                  {hasGap ? '⚠ gap' : '✓ ok'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Skill sub-rows */}
                      {isExpanded && proj.skillSubRows.map(skill => {
                        const hastarget = skill.effort_days != null;
                        const met = hastarget && skill.totalAllocatedDays >= skill.effort_days;
                        const partial = hastarget && skill.totalAllocatedDays > 0 && skill.totalAllocatedDays < skill.effort_days;
                        const none = hastarget && skill.totalAllocatedDays === 0;
                        const totalColor = met ? '#16a34a' : partial ? '#d97706' : none ? T.red : T.muted;
                        const totalBg = met ? 'rgba(34,197,94,0.12)' : partial ? 'rgba(217,119,6,0.1)' : none ? 'rgba(248,113,113,0.15)' : 'transparent';
                        const totalBorder = met ? '#22c55e' : partial ? '#d97706' : none ? T.red : T.border;
                        return (
                          <tr key={`${proj.id}-${skill.id}`}>
                            <td style={{ ...rowLabelStyle, paddingLeft: 36, background: 'inherit' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 1, height: 14, background: color, opacity: 0.4, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: T.muted }}>{skill.name}</span>
                              </div>
                            </td>
                            {/* Skill total column */}
                            <td style={{ padding: '4px 6px', borderBottom: `1px solid ${T.border}`, background: T.bg, textAlign: 'center' }}>
                              <div style={{
                                background: totalBg,
                                border: `1px solid ${totalBorder}44`,
                                borderRadius: 4,
                                padding: '3px 5px',
                                display: 'inline-block',
                                fontFamily: T.mono,
                                fontSize: 10,
                                color: totalColor,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}>
                                {hastarget
                                  ? `${skill.totalAllocatedDays}d / ${skill.effort_days}d`
                                  : `${skill.totalAllocatedDays}d`}
                              </div>
                            </td>
                            {skill.monthCoverage.map((coverage, mi) => {
                              if (!coverage) return <td key={mi} style={{ borderBottom: `1px solid ${T.border}`, minWidth: 52, background: T.bg }} />;
                              const { covered, allocatedDays } = coverage;
                              return (
                                <td key={mi} style={{ padding: '4px', borderBottom: `1px solid ${T.border}`, minWidth: 52, background: T.bg }}>
                                  <div style={{
                                    background: covered ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.15)',
                                    border: `1px solid ${covered ? '#22c55e' : T.red}44`,
                                    borderRadius: 4,
                                    padding: '3px 4px',
                                    textAlign: 'center',
                                    fontSize: 10,
                                    fontFamily: T.mono,
                                    color: covered ? '#16a34a' : T.red,
                                  }}>
                                    {covered ? `${allocatedDays}d` : '✗'}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: T.mono, fontSize: 11, color: T.muted }}>
            <div>Click a project row to expand / collapse</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 12, background: 'rgba(34,197,94,0.12)', border: '1px solid #22c55e44', borderRadius: 2 }} />
              Skill covered by an assigned engineer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 12, background: 'rgba(248,113,113,0.15)', border: `1px solid ${T.red}44`, borderRadius: 2 }} />
              No assigned engineer with this skill
            </div>
            {allProjects.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: projectColorMap[p.id] }} />
                {p.name}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, textAlign: 'left', padding: '6px 12px', minWidth: 160 }}>
                    {mode === 'engineer' ? 'Engineer' : 'Project / Engineer'}
                  </th>
                  {MONTHS.map(m => <th key={m} style={headerCellStyle}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {mode === 'engineer' ? (
                  engineerRows.length === 0 ? (
                    <tr><td colSpan={13} style={{ padding: 20, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No assignments in {year}</td></tr>
                  ) : (
                    engineerRows.map(eng => {
                      const isExpanded = expandedEngineers.has(eng.id);
                      return (
                        <React.Fragment key={eng.id}>
                          <tr>
                            <td style={{ ...rowLabelStyle, cursor: 'pointer' }}
                              onClick={() => setExpandedEngineers(prev => {
                                const next = new Set(prev);
                                next.has(eng.id) ? next.delete(eng.id) : next.add(eng.id);
                                return next;
                              })}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, color: T.accent, fontWeight: 700, width: 10, flexShrink: 0 }}>
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                                <span
                                  style={{ fontWeight: 500, color: T.accent, overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  onClick={e => { e.stopPropagation(); navigate(`/engineers/${eng.id}`); }}
                                >{eng.name}</span>
                              </div>
                              <div style={{ fontSize: 10, color: T.muted, marginTop: 1, paddingLeft: 18 }}>{eng.role}</div>
                            </td>
                            {eng.months.map((m, mi) => renderEngineerCell(m, eng, mi))}
                          </tr>
                          {isExpanded && eng.projectSubRows.map(proj => {
                            const color = projectColorMap[proj.project_id];
                            return (
                              <tr key={`${eng.id}-${proj.project_id}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/projects/${proj.project_id}`)}
                                onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ ...rowLabelStyle, paddingLeft: 36, background: 'inherit' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 1, height: 14, background: color, opacity: 0.4, flexShrink: 0 }} />
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: T.muted }}>{proj.project_name}</span>
                                  </div>
                                </td>
                                {proj.months.map((m, mi) => renderEngineerSubCell(m, mi, color))}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  )
                ) : (
                  projectRows.length === 0 ? (
                    <tr><td colSpan={13} style={{ padding: 20, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: 13 }}>No assignments in {year}</td></tr>
                  ) : (
                    projectRows.map(proj => {
                      const color = projectColorMap[proj.id];
                      const isExpanded = expandedProjects.has(proj.id);
                      return (
                        <React.Fragment key={proj.id}>
                          <tr style={{ background: `${color}0a` }}>
                            <td
                              style={{ ...rowLabelStyle, cursor: 'pointer', background: `${color}0a` }}
                              onClick={() => toggleProject(proj.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, color: color, fontWeight: 700, width: 10, flexShrink: 0 }}>
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</span>
                              </div>
                              <div style={{ fontSize: 10, color: T.muted, marginTop: 2, paddingLeft: 26 }}>
                                {proj.engineerSubRows.length} engineer{proj.engineerSubRows.length !== 1 ? 's' : ''}
                              </div>
                            </td>
                            {proj.months.map((m, mi) => renderProjectSummaryCell(m, mi, color))}
                          </tr>
                          {isExpanded && proj.engineerSubRows.map(eng => (
                            <tr key={`${proj.id}-${eng.engineer_id}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/engineers/${eng.engineer_id}`)}
                              onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ ...rowLabelStyle, paddingLeft: 36, background: 'inherit' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 1, height: 14, background: color, opacity: 0.4, flexShrink: 0 }} />
                                  <span style={{ fontSize: 12, color: T.muted }}>{eng.engineer_name}</span>
                                </div>
                              </td>
                              {eng.months.map((m, mi) => renderEngineerSubCell(m, mi, color))}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: T.mono, fontSize: 11, color: T.muted }}>
            {mode === 'engineer' ? (
              <>
                <div>Click an engineer row to expand / collapse</div>
                <div>Click an engineer name to open their profile</div>
                <div>Click a project sub-row to open the project</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 12, background: 'rgba(248,113,113,0.15)', border: `1px solid ${T.red}`, borderRadius: 2 }} />
                  Over-allocated (&gt;100%)
                </div>
              </>
            ) : (
              <>
                <div>Click a project row to expand / collapse</div>
                <div>Click an engineer name to open their profile</div>
                {projects.map(p => (
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
