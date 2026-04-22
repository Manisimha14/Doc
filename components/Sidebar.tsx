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
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useVault } from '../app/providers';
import { supabase } from '../lib/supabaseClient';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { openUpload, vaultName, user, isSidebarOpen, setIsSidebarOpen } = useVault();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Do not render sidebar on public share pages
  if (pathname?.startsWith('/share')) return null;


  // Load collapse state from local storage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

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

  const sidebarWidth = isCollapsed ? '80px' : '280px';

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="mobile-sidebar-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
            display: 'none' // Controlled by CSS
          }}
        />
      )}

      <aside className={`sidebar-main glass ${isSidebarOpen ? 'mobile-open' : ''}`} style={{
        width: sidebarWidth,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible' // Changed to visible to allow floating button to show
      }}>
        {/* Desktop Collapse Toggle Button - Floating style */}
        <button 
          onClick={toggleCollapse}
          className="sidebar-toggle-btn desktop-only"
          style={{
            position: 'absolute',
            right: '-14px',
            top: '32px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--primary)',
            border: '2px solid var(--bg-dark)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 101,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: `scale(${isCollapsed ? 1.1 : 1})`,
            opacity: 0.4, // Lower initial opacity, boosted by CSS hover
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="sidebar-content-wrapper" style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '2rem 0.75rem' : '2rem 1.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <div style={{ 
              background: 'var(--accent-gradient)', 
              padding: '8px', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={24} color="white" />
            </div>
            {(!isCollapsed || isSidebarOpen) && <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{vaultName}</h2>}
            
            {/* Mobile Close Button */}
            {isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="mobile-only"
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '4px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'none' // Controlled by CSS
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

          <nav style={{ flex: 1 }}>
            <ul style={{ listStyle: 'none' }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                    <Link href={item.href} onClick={() => setIsSidebarOpen(false)} title={isCollapsed ? item.name : ''} style={{
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
                      border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                      justifyContent: (isCollapsed && !isSidebarOpen) ? 'center' : 'flex-start',
                      boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.1)' : 'none'
                    }}>
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                      {(!isCollapsed || isSidebarOpen) && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button 
            className="btn-primary" 
            style={{ 
              marginBottom: '1rem', 
              justifyContent: 'center',
              padding: (isCollapsed && !isSidebarOpen) ? '12px' : '10px 20px',
              minWidth: (isCollapsed && !isSidebarOpen) ? '44px' : 'auto'
            }}
            onClick={() => { openUpload(); setIsSidebarOpen(false); }}
            title={(isCollapsed && !isSidebarOpen) ? 'New Upload' : ''}
          >
            <PlusCircle size={20} style={{ flexShrink: 0 }} />
            {(!isCollapsed || isSidebarOpen) && <span>New Upload</span>}
          </button>

          <div style={{ 
            marginTop: 'auto', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: (isCollapsed && !isSidebarOpen) ? 'center' : 'flex-start' }}>
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
                fontWeight: 700,
                flexShrink: 0
              }}>
                {getInitials(user?.email)}
              </div>
              {(!isCollapsed || isSidebarOpen) && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {user?.email?.split('@')[0] || 'Guest'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin</div>
                </div>
              )}
            </div>

            {(!isCollapsed || isSidebarOpen) && (
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
            )}
            
            <button 
              onClick={handleLogout}
              title={(isCollapsed && !isSidebarOpen) ? 'Sign Out' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '8px 0',
                justifyContent: (isCollapsed && !isSidebarOpen) ? 'center' : 'flex-start',
                transition: 'all 0.2s ease',
                opacity: 0.8
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              <LogOut size={18} style={{ flexShrink: 0 }} />
              {(!isCollapsed || isSidebarOpen) && <span>Sign Out</span>}
            </button>

            {/* Dedicated Collapse Toggle at the bottom (Desktop only) */}
            {!isSidebarOpen && (
              <button 
                onClick={toggleCollapse}
                className="desktop-only"
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: '100%',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s ease'
                }}
              >
                {isCollapsed ? <ChevronRight size={20} /> : (
                  <>
                    <ChevronLeft size={20} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Collapse Sidebar</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </aside>

      <style jsx>{`
        @media (max-width: 768px) {
          .sidebar-main {
            position: fixed !important;
            transform: translateX(-100%);
            width: 280px !important;
            z-index: 999;
          }
          .sidebar-main.mobile-open {
            transform: translateX(0);
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-sidebar-backdrop {
            display: block !important;
          }
          .mobile-only {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
