'use client';
import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { useVault } from '../app/providers';

export function MobileHeader() {
  const { setIsSidebarOpen, vaultName } = useVault();
  return (
    <header className="mobile-header glass" style={{
      display: 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1.25rem',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          background: 'var(--accent-gradient)', 
          padding: '6px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={20} color="white" />
        </div>
        <h2 style={{ fontSize: '1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{vaultName}</h2>
      </div>
      <button 
        onClick={() => setIsSidebarOpen(true)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          padding: '8px',
          borderRadius: '10px',
          cursor: 'pointer'
        }}
      >
        <Menu size={20} />
      </button>
    </header>
  );
}
