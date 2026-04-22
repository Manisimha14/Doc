'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import UploadModal from '../components/UploadModal';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheck } from 'lucide-react';

interface VaultContextType {
  openUpload: () => void;
  openUploadBulk: () => void;
  closeUpload: () => void;
  vaultName: string;
  setVaultName: (name: string) => void;
  user: any;
  isAuthReady: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialMode, setUploadInitialMode] = useState<'single' | 'bulk'>('single');
  const [vaultName, setVaultName] = useState('Family Vault');
  const [user, setUser] = useState<any>(null);
  const [profileStatus, setProfileStatus] = useState<'pending' | 'active' | 'rejected'>('active');
  // isAuthReady signals that auth check has completed — children can use this
  // but we NO LONGER block rendering on it. Children render immediately.
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function initAuth() {
      // Kick off session fetch
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Run profile load in background — don't block children rendering
        loadVault(currentUser);
      } else {
        setIsAuthReady(true);
      }
    }

    async function loadVault(currentUser: any) {
      try {
        // Parallel fetch: profile + self-healing update if needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, document_groups(name)')
          .eq('id', currentUser.id)
          .single();

        if (profile) {
          setProfileStatus(profile.status || 'active');

          // Self-Healing: Link unlinked users (fire-and-forget, don't await)
          if (!profile.family_group_id) {
            supabase
              .from('profiles')
              .update({ family_group_id: '00000000-0000-0000-0000-000000000000' })
              .eq('id', currentUser.id)
              .then(() => {}); // non-blocking
          }

          if (profile.document_groups?.name) {
            setVaultName(profile.document_groups.name);
          }
        }
      } catch (err) {
        console.error('Vault load error:', err);
      } finally {
        setIsAuthReady(true);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadVault(currentUser);
      } else {
        setIsAuthReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const openUpload = () => { setUploadInitialMode('single'); setIsUploadOpen(true); };
  const openUploadBulk = () => { setUploadInitialMode('bulk'); setIsUploadOpen(true); };
  const closeUpload = () => setIsUploadOpen(false);

  // Approval gate: only show AFTER auth is confirmed AND status is pending.
  // We don't block on isAuthReady=false — children render optimistically.
  if (isAuthReady && user && profileStatus === 'pending') {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '20px',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
          }}>
            <ShieldCheck size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Approval Pending</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
            Welcome to the family archive! To protect our historical records, a family administrator must approve your access request.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Request Timeline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.875rem' }}>Account Created</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Just now</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', opacity: 0.5 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.875rem' }}>Admin Review</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>In Progress</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              marginTop: '2rem',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <VaultContext.Provider value={{ 
      openUpload, 
      openUploadBulk, 
      closeUpload, 
      vaultName, 
      setVaultName, 
      user, 
      isAuthReady,
      isSidebarOpen,
      setIsSidebarOpen
    }}>
      {children}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={closeUpload}
        groupId="00000000-0000-0000-0000-000000000000"
        initialMode={uploadInitialMode}
      />
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
