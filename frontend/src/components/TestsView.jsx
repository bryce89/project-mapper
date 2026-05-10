import React, { useState } from 'react';
import { T } from '../theme.js';

function StatusBadge({ status, small }) {
  const passed = status === 'passed';
  return (
    <span style={{
      background: passed ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.15)',
      border: `1px solid ${passed ? '#22c55e' : T.red}44`,
      color: passed ? '#16a34a' : T.red,
      borderRadius: 4,
      padding: small ? '1px 6px' : '2px 8px',
      fontSize: small ? 10 : 11,
      fontFamily: T.mono,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>{passed ? '✓ passed' : '✗ failed'}</span>
  );
}

function SuiteBlock({ suite }) {
  const [open, setOpen] = useState(true);
  const allPassed = suite.tests.every(t => t.status === 'passed');
  return (
    <div style={{ marginBottom: 8, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: allPassed ? 'rgba(34,197,94,0.04)' : 'rgba(248,113,113,0.06)',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 10, color: T.muted, width: 10 }}>{open ? '▼' : '▶'}</span>
        <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.text, flex: 1 }}>{suite.name}</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>
          {suite.tests.length} test{suite.tests.length !== 1 ? 's' : ''}
        </span>
        <StatusBadge status={suite.status} small />
      </div>
      {open && (
        <div>
          {suite.tests.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 14px 8px 34px',
              borderTop: `1px solid ${T.border}`,
              background: t.status === 'passed' ? 'transparent' : 'rgba(248,113,113,0.04)',
            }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: t.status === 'passed' ? '#16a34a' : T.red, flexShrink: 0, marginTop: 1 }}>
                {t.status === 'passed' ? '✓' : '✗'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.text }}>{t.name}</span>
                {t.error && (
                  <pre style={{ marginTop: 6, fontFamily: T.mono, fontSize: 10, color: T.red, background: 'rgba(248,113,113,0.08)', borderRadius: 4, padding: '6px 8px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {t.error}
                  </pre>
                )}
              </div>
              {t.duration != null && (
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, flexShrink: 0, marginTop: 2 }}>
                  {Math.round(t.duration)}ms
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ label, data }) {
  if (!data) return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
      <h2 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 8 }}>{label}</h2>
      <p style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>No results — tests may not be available in this environment.</p>
    </div>
  );
  const { numPassed, numFailed, suites } = data;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.text }}>{label}</h2>
        <div style={{ display: 'flex', gap: 12, fontFamily: T.mono, fontSize: 12 }}>
          <span style={{ color: '#16a34a' }}>✓ {numPassed} passed</span>
          {numFailed > 0 && <span style={{ color: T.red }}>✗ {numFailed} failed</span>}
        </div>
      </div>
      {suites.map((suite, i) => <SuiteBlock key={i} suite={suite} />)}
    </div>
  );
}

export default function TestsView() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runTests() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tests/run');
      if (res.status === 403) {
        setError('Test runner is only available in the local development environment — running tests in production would wipe live data.');
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      setResults(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const totalPassed = (results?.backend?.numPassed ?? 0) + (results?.frontend?.numPassed ?? 0);
  const totalFailed = (results?.backend?.numFailed ?? 0) + (results?.frontend?.numFailed ?? 0);
  const allPassed = results && totalFailed === 0;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, color: T.text, fontWeight: 600 }}>Tests</h1>
          {results && (
            <p style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, marginTop: 4 }}>
              Last run {new Date(results.timestamp).toLocaleTimeString()} · {results.duration}ms
              {' · '}
              <span style={{ color: allPassed ? '#16a34a' : T.red, fontWeight: 600 }}>
                {totalPassed + totalFailed} total — {totalPassed} passed{totalFailed > 0 ? `, ${totalFailed} failed` : ''}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          style={{
            background: loading ? T.border : T.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            padding: '9px 20px',
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Running…' : results ? 'Run again' : 'Run tests'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: `1px solid ${T.red}44`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontFamily: T.mono, fontSize: 12, color: T.red }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 13 }}>Running test suite…</div>
      )}

      {results && !loading && (
        <>
          <Section label="Backend Tests" data={results.backend} />
          <Section label="Frontend Tests" data={results.frontend} />
        </>
      )}

      {!results && !loading && !error && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: 13 }}>
          Click "Run tests" to execute the full regression suite.
        </div>
      )}
    </div>
  );
}
