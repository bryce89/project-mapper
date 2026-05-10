import React from 'react';
import { NavLink } from 'react-router-dom';
import { T } from '../theme.js';

const links = [
  { to: '/engineers', label: 'Engineers', icon: '👥' },
  { to: '/projects', label: 'Projects', icon: '📋' },
  { to: '/timeline', label: 'Timeline', icon: '📅' },
];

export default function Nav() {
  return (
    <nav style={{
      width: 240,
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      background: T.card,
      borderRight: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      zIndex: 100,
    }}>
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{
          fontFamily: T.serif,
          fontSize: 22,
          fontWeight: 600,
          color: T.accent,
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
        }}>
          Project<br />Mapper
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontFamily: T.mono }}>
          Engineer &amp; project tracking
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 24px',
              textDecoration: 'none',
              fontFamily: T.mono,
              fontSize: 13,
              color: isActive ? T.accent : T.text,
              background: isActive ? 'rgba(74,222,128,0.07)' : 'transparent',
              borderLeft: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '0 24px', borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        <div style={{ fontSize: 10, color: T.muted, fontFamily: T.mono }}>v1.0.0</div>
      </div>
    </nav>
  );
}
