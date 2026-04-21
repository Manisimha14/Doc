'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Automatically create the profile and link to the global group
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            family_group_id: '00000000-0000-0000-0000-000000000000',
            role: 'Viewer',
            name: fullName, // Fixed: Database uses 'name', not 'full_name'
          })
          .eq('id', data.user.id);
        
        // If update fails (profile might not exist yet if trigger didn't fire), try insert
        if (profileError) {
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name: fullName,
              email: email,
              role: 'Viewer',
              family_group_id: '00000000-0000-0000-0000-000000000000'
            });
          if (insertError) console.error('Profile enrollment failed:', insertError);
        }
        // Log the join request for the timeline
        await supabase
          .from('vault_audit_logs')
          .insert({
            group_id: '00000000-0000-0000-0000-000000000000',
            actor_id: data.user.id,
            event_type: 'join_request',
            description: `${fullName || email} requested access to the family vault.`
          });
      }
      
      router.push('/login?message=Account created! Waiting for Admin approval.');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Gradients */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        zIndex: -1
      }} />

      <div className="glass-card animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '3rem 2.5rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          background: 'var(--accent-gradient)', 
          padding: '12px', 
          borderRadius: '16px',
          marginBottom: '1.5rem'
        }}>
          <ShieldCheck size={32} color="white" />
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Join the Vault</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Secure your family legacy starting today.</p>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: '#ef4444', 
            padding: '12px', 
            borderRadius: '10px', 
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '12px 12px 12px 40px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@family.com"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '12px 12px 12px 40px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '12px 12px 12px 40px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', height: '48px' }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
