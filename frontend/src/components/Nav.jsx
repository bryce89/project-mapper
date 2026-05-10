import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { T } from '../theme.js';

const links = [
  { to: '/timeline', label: 'Timeline', icon: '📅' },
  { to: '/engineers', label: 'Engineers', icon: '👥' },
  { to: '/projects', label: 'Projects', icon: '📋' },
];

export default function Nav({ isMobile, menuOpen, onToggle, onClose }) {
  const sidebarStyle = {
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
    zIndex: 200,
    transition: 'transform 0.25s ease',
    transform: isMobile && !menuOpen ? 'translateX(-240px)' : 'translateX(0)',
  };

  return (
    <>
      {/* Hamburger button — mobile only */}
      {isMobile && (
        <button
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 300,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 18,
            color: T.text,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Backdrop — mobile only when open */}
      {isMobile && menuOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 150,
          }}
        />
      )}

      {/* Sidebar */}
      <nav style={sidebarStyle}>
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
              onClick={isMobile ? onClose : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 24px',
                textDecoration: 'none',
                fontFamily: T.mono,
                fontSize: 13,
                color: isActive ? T.accent : T.text,
                background: isActive ? `${T.accent}12` : 'transparent',
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
    </>
  );
}
