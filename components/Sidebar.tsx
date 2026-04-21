'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Files, 
  Settings, 
  ShieldCheck,
  Search,
  PlusCircle,
  LogOut
} from 'lucide-react';
import { useVault } from '../app/providers';
import { supabase } from '../lib/supabaseClient';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { openUpload, vaultName, user } = useVault();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Documents', icon: Files, href: '/documents' },
    { name: 'Universal Search', icon: Search, href: '/search' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];

  const getInitials = (email: string) => {
    return email ? email.split('@')[0].substring(0, 2).toUpperCase() : '??';
  };

  return (
    <aside className="glass" style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderRight: '1px solid var(--glass-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' }}>
        <div style={{ 
          background: 'var(--accent-gradient)', 
          padding: '8px', 
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={24} color="white" />
        </div>
        <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{vaultName}</h2>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                <Link href={item.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                  fontWeight: isActive ? 600 : 400,
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent'
                }}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button 
        className="btn-primary" 
        style={{ marginBottom: '1rem', justifyContent: 'center' }}
        onClick={openUpload}
      >
        <PlusCircle size={20} />
        <span>New Upload</span>
      </button>

      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '1.5rem', 
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            color: 'white',
            fontWeight: 700
          }}>
            {getInitials(user?.email)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.email?.split('@')[0] || 'Guest'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin</div>
          </div>
        </div>

        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Vault Health</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Elite</span>
          </div>
          <div className="vault-health-bar">
            <div className="vault-health-fill" style={{ width: '78%' }} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Industrial Governance Active
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: '4px 0'
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
