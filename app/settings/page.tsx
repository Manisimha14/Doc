'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Shield, Database, Bell, Layout } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useVault } from '../providers';

export default function SettingsPage() {
  const { vaultName: globalVaultName, setVaultName: setGlobalVaultName } = useVault();
  const [vaultName, setVaultName] = useState(globalVaultName);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('document_groups')
          .select('name')
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .single();
        
        if (data) {
          setVaultName(data.name);
          setGlobalVaultName(data.name);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('document_groups')
        .update({ name: vaultName })
        .eq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      setGlobalVaultName(vaultName);
      alert('Vault settings updated successfully!');
    } catch (err: any) {
      alert(`Error updating settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading settings...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Vault Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Customize your family archive and security preferences.</p>
      </header>

      <section className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Layout size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Branding & Identity</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Vault Name
            </label>
            <input 
              type="text" 
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              className="glass-card"
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              This name will be visible to all family members in the sidebar.
            </p>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ alignSelf: 'flex-start', marginTop: '1rem' }}
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </section>

      <section className="glass-card" style={{ padding: '2rem', opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Shield size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Advanced Security</h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Multi-factor authentication and audit logs are managed at the organization level.
        </p>
      </section>
    </div>
  );
}
