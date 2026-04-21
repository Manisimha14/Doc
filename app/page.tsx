'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  Grid, 
  Clock,
  Tag,
  Plus,
  Download,
  Files,
  Folder,
  X,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  History,
  ChevronRight,
  Share2,
  Link2,
  Copy,
  CheckCheck,
  SortAsc,
  BarChart3
} from 'lucide-react';
import { useVault } from './providers';
import { getDocumentsByGroup, getDocumentPublicUrl, deleteDocument, getDocumentSignedUrl } from '../services/documentService';
import { DownloadOptionsModal } from '../components/DownloadOptionsModal';
import { supabase } from '../lib/supabaseClient';
import { UI } from '../lib/designSystem';

export default function Dashboard() {
  const { openUpload, openUploadBulk, vaultName, user } = useVault();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'owner' | 'type'>('date');
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([]);
  const [downloadTarget, setDownloadTarget] = useState<any>(null); // doc to show in download modal
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const toast = useCallback((msg: string, ok = true) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share` : '/share';

  useEffect(() => {
    async function loadDocuments() {
      try {
        const data = await getDocumentsByGroup('00000000-0000-0000-0000-000000000000');
        setDocuments(data || []);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDocuments();
  }, []);

  useEffect(() => {
    if (documents.length === 0) return;
    async function fetchSignedUrls() {
      try {
        const paths = documents.map(d => d.file_path);
        const { data: signedData, error: signError } = await supabase.storage
          .from('family_vault')
          .createSignedUrls(paths, 300);
        if (!signError && signedData) {
          const urlMap: Record<string, string> = {};
          signedData.forEach((item: { signedUrl: string | null; path: string | null }) => {
            if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl;
          });
          setSignedUrls(urlMap);
        }
      } catch (err) {
        console.error('Failed to fetch signed URLs:', err);
      }
    }
    fetchSignedUrls();
  }, [documents]);

  const handleDelete = async () => {
    if (!selectedDoc) return;
    
    const confirm = window.confirm(`Are you sure you want to permanently delete this ${selectedDoc.doc_type}? This cannot be undone.`);
    if (!confirm) return;

    try {
      await deleteDocument(selectedDoc.document_id, selectedDoc.file_path);
      setDocuments(prev => prev.filter(d => d.document_id !== selectedDoc.document_id));
      setSelectedDoc(null);
      toast('Document deleted successfully');
    } catch (err: any) {
      toast(`Delete failed: ${err.message}`, false);
    }
  };

  const dynamicOwners = React.useMemo(() => {
    const unique = Array.from(new Set(documents.map(d => d.owner_name?.trim())));
    const grouped = new Set<string>();
    unique.forEach(name => {
      if (!name) return;
      const existing = Array.from(grouped).find(g => g.toLowerCase() === name.toLowerCase());
      if (!existing) grouped.add(name);
    });
    return grouped.size > 0 ? Array.from(grouped) : ['No Owners Yet'];
  }, [documents]);

  const dynamicTypes = React.useMemo(() => {
    const unique = Array.from(new Set(documents.map(d => d.doc_type?.trim())));
    const grouped = new Set<string>();
    unique.forEach(t => {
      if (!t) return;
      const existing = Array.from(grouped).find(g => g.toLowerCase() === t.toLowerCase());
      if (!existing) grouped.add(t);
    });
    return grouped.size > 0 ? Array.from(grouped) : ['No Types Yet'];
  }, [documents]);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (item: string) => {
    setActiveFilters((prev: string[]) => {
      const isAlreadyActive = prev.some(f => f.toLowerCase() === item.toLowerCase());
      if (isAlreadyActive) {
        return prev.filter(f => f.toLowerCase() !== item.toLowerCase());
      } else {
        return [...prev, item];
      }
    });
  };

  const filteredDocs = React.useMemo(() => {
    let result = documents;
    if (searchQuery) {
      result = result.filter(doc =>
        doc.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.doc_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.raw_content_vector && doc.raw_content_vector.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (activeFilters.length > 0) {
      const lowerFilters = activeFilters.map(f => f.toLowerCase());
      result = result.filter(doc =>
        lowerFilters.includes(doc.owner_name?.toLowerCase()) ||
        lowerFilters.includes(doc.doc_type?.toLowerCase())
      );
    }
    return result;
  }, [documents, searchQuery, activeFilters]);

  const groupedDocs = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredDocs.forEach(doc => {
      const owner = doc.owner_name?.trim() || 'Unknown';
      const key = owner.charAt(0).toUpperCase() + owner.slice(1).toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  const sortedDocs = React.useMemo(() => {
    const sorted = [...filteredDocs];
    if (sortBy === 'date') sorted.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());
    else if (sortBy === 'owner') sorted.sort((a, b) => (a.owner_name||'').localeCompare(b.owner_name||''));
    else if (sortBy === 'type') sorted.sort((a, b) => (a.doc_type||'').localeCompare(b.doc_type||''));
    return sorted;
  }, [filteredDocs, sortBy]);

  // ── Vault stats ────────────────────────────────────────────────────────────
  const vaultStats = React.useMemo(() => ({
    total: documents.length,
    owners: new Set(documents.map(d => d.owner_name?.trim()).filter(Boolean)).size,
    types: new Set(documents.map(d => d.doc_type?.trim()).filter(Boolean)).size,
    latestDate: documents.length > 0
      ? new Date(Math.max(...documents.map(d => new Date(d.upload_date).getTime()))).toLocaleDateString()
      : 'None',
    estSizeMb: (documents.length * 0.35).toFixed(1), // rough estimate
  }), [documents]);

  const handleShareWhatsApp = () => {
    if (selectedDoc) {
      const url = getDocumentPublicUrl(selectedDoc.file_path);
      const text = `🏛️ *Family Archive Vault: Secure Record Shared*\n\nA document has been shared with you from our private family vault.\n\n🔗 *Access Link:* ${url}\n\n_(Note: This link is provided for your secure viewing.)_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleViewFull = async () => {
    if (selectedDoc) {
      try {
        const signedUrl = await getDocumentSignedUrl(selectedDoc.file_path);
        window.open(signedUrl, '_blank');
      } catch (err) {
        alert('Could not generate secure view link.');
      }
    }
  };

  const isImageFile = (path: string) =>
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].some(e => path.split('?')[0].toLowerCase().endsWith(e));

  const handleDownload = async () => {
    if (!selectedDoc) return;
    if (isImageFile(selectedDoc.file_path)) {
      setDownloadTarget(selectedDoc);
      return;
    }
    try {
      const signedUrl = await getDocumentSignedUrl(selectedDoc.file_path);
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = selectedDoc.file_path.split('/').pop() || 'document';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast('Download started');
    } catch { toast('Download failed', false); }
  };
  const handleBulkDownload = async () => {
    if (selectedDocs.size === 0) return;
    toast(`Starting download for ${selectedDocs.size} files...`);
    let i = 0;
    for (const id of Array.from(selectedDocs)) {
      const doc = documents.find(d => d.document_id === id);
      if (doc) {
        setTimeout(async () => {
          try {
            const signedUrl = await getDocumentSignedUrl(doc.file_path);
            const link = document.createElement('a');
            link.href = signedUrl;
            link.download = doc.file_path.split('/').pop() || 'document';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
          } catch(e) {}
        }, i * 600);
        i++;
      }
    }
    setSelectedDocs(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    const confirm = window.confirm(`Permanently delete ${selectedDocs.size} selected documents? This cannot be undone.`);
    if (!confirm) return;
    try {
      for (const id of Array.from(selectedDocs)) {
        const doc = documents.find(d => d.document_id === id);
        if (doc) await deleteDocument(doc.document_id, doc.file_path);
      }
      setDocuments(prev => prev.filter(d => !selectedDocs.has(d.document_id)));
      toast(`Deleted ${selectedDocs.size} documents successfully`);
      setSelectedDocs(new Set());
    } catch {
      toast('Failed to delete some documents', false);
    }
  };


  /* ── Keyboard shortcuts ──────────────────────────────────────── */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // '/' = jump to search
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      }
      // Esc = close detail panel
      if (e.key === 'Escape') setSelectedDoc(null);
      
      // Arrow navigation
      if (selectedDoc && !showShareModal && !downloadTarget) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const idx = sortedDocs.findIndex(d => d.document_id === selectedDoc.document_id);
          if (idx !== -1 && idx < sortedDocs.length - 1) setSelectedDoc(sortedDocs[idx + 1]);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const idx = sortedDocs.findIndex(d => d.document_id === selectedDoc.document_id);
          if (idx > 0) setSelectedDoc(sortedDocs[idx - 1]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedDoc, sortedDocs, showShareModal, downloadTarget]);

  /* ── Helpers ─────────────────────────────────────────────────── */
  const DOC_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'birth certificate': { bg: 'rgba(16,185,129,.12)', text: '#6ee7b7', border: 'rgba(16,185,129,.25)' },
    'marriage license':  { bg: 'rgba(236,72,153,.1)',  text: '#f9a8d4', border: 'rgba(236,72,153,.25)' },
    'military record':   { bg: 'rgba(245,158,11,.1)',  text: '#fcd34d', border: 'rgba(245,158,11,.25)' },
    'legal deed':        { bg: 'rgba(99,102,241,.12)', text: '#a5b4fc', border: 'rgba(99,102,241,.25)' },
    'photo':             { bg: 'rgba(6,182,212,.1)',   text: '#67e8f9', border: 'rgba(6,182,212,.25)'  },
    'medical record':    { bg: 'rgba(239,68,68,.1)',   text: '#fca5a5', border: 'rgba(239,68,68,.25)'  },
    'profile-photos':    { bg: 'rgba(6,182,212,.1)',   text: '#67e8f9', border: 'rgba(6,182,212,.25)'  },
  };
  const getDocColor = (type: string) =>
    DOC_COLORS[type?.toLowerCase()] ?? { bg: 'rgba(255,255,255,.05)', text: 'var(--text-muted)', border: 'rgba(255,255,255,.1)' };

  const quickCopy = (doc: any) => {
    const url = getDocumentPublicUrl(doc.file_path);
    navigator.clipboard.writeText(url).then(() => toast('Link copied!'));
  };

  const SkeletonCard = () => (
    <div className="glass-card" style={{ height: '180px', animation: 'pulse 1.5s infinite ease-in-out' }}>
      <div style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px 8px 0 0' }} />
      <div style={{ padding: '12px' }}>
        <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', width: '60%', borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', width: '40%', borderRadius: '4px' }} />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ height: '80px', width: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }} className="animate-pulse" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>

      {/* Share Modal */}
      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-enter" style={{ background: t.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${t.ok ? '#10b981' : '#ef4444'}`, borderRadius: '12px', padding: '12px 16px', color: t.ok ? '#6ee7b7' : '#fca5a5', fontSize: '0.82rem', fontWeight: 600, backdropFilter: 'blur(12px)', maxWidth: '280px' }}>
            {t.ok ? '✓' : '✕'} {t.msg}
          </div>
        ))}
      </div>

      {showShareModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem', maxWidth: '500px', width: '90%', borderRadius: '20px', position: 'relative' }}>
            <button onClick={() => setShowShareModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Share Vault Access</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Anyone with this link can view all records</p>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Share Link</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <code style={{ flex: 1, fontSize: '0.8rem', color: '#a5b4fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }}
                  style={{ padding: '6px 14px', background: shareCopied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${shareCopied ? '#10b981' : 'var(--primary)'}`, borderRadius: '8px', color: shareCopied ? '#10b981' : 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                >
                  {shareCopied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => { const text = `🏛️ *Family Archive Vault — Shared Access*\n\nView all family documents at:\n${shareUrl}`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }}
                style={{ width: '100%', background: '#25D366', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.001.332.005c.109.004.258-.041.404.311.145.352.497 1.214.54 1.301.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/></svg>
                Share via WhatsApp
              </button>
              <button
                onClick={() => window.open(shareUrl, '_blank')}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                <ExternalLink size={16} /> Preview Share Page
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: 'rgba(245,158,11,0.06)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <p style={{ fontSize: '0.75rem', color: '#fbbf24', margin: 0, lineHeight: '1.5' }}>⚠️ This is a read-only view. Recipients can browse and download documents but cannot upload or delete.</p>
            </div>
          </div>
        </div>
      )}

      <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{vaultName}</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}. {documents.length} documents indexed across {vaultStats.owners} members.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 12px 12px 40px', color: 'white', width: '260px', outline: 'none' }} />
            </div>
            {/* Sort dropdown */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 14px', color: 'white', outline: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
              <option value="date">Sort: Latest</option>
              <option value="owner">Sort: Owner</option>
              <option value="type">Sort: Type</option>
            </select>
            <button onClick={() => setShowShareModal(true)}
              style={{ padding: '10px 18px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#a5b4fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
              <Share2 size={17} /> Share Vault
            </button>
            <button className="btn-primary" onClick={openUpload} style={{ background: 'var(--accent-gradient)' }}>
              <Plus size={18} /> New Record
            </button>
            <button onClick={openUploadBulk} id="bulk-upload-trigger"
              style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
              <Files size={18} /> Bulk Upload
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Records', value: vaultStats.total, icon: '🗂', color: '#a5b4fc' },
            { label: 'Members', value: vaultStats.owners, icon: '👥', color: '#6ee7b7' },
            { label: 'Doc Types', value: vaultStats.types, icon: '📋', color: '#fcd34d' },
            { label: 'Est. Storage', value: `${vaultStats.estSizeMb} MB`, icon: '💾', color: '#f9a8d4' },
            { label: 'Latest Upload', value: vaultStats.latestDate, icon: '📅', color: '#67e8f9' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '240px 1fr 350px' : '240px 1fr', gap: '2rem', flex: 1 }}>
        
        <aside className="glass-card" style={{ padding: '1.5rem', alignSelf: 'start', position: 'sticky', top: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Filter size={18} />
            <h3 style={{ fontSize: '1.1rem' }}>Filters</h3>
          </div>

          {/* Keyboard hint */}
          <div style={{ marginBottom: '1.5rem', padding: '0.6rem 0.875rem', background: 'rgba(99,102,241,.06)', borderRadius: '8px', border: '1px solid rgba(99,102,241,.12)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <kbd style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>/</kbd>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>to focus search</span>
            <kbd style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginLeft: '4px' }}>Esc</kbd>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>close</span>
          </div>

          {/* Quick-jump owners */}
          {dynamicOwners[0] !== 'No Owners Yet' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>Jump to Member</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {dynamicOwners.map(owner => {
                  const count = documents.filter(d => d.owner_name?.toLowerCase() === owner.toLowerCase()).length;
                  const color = getDocColor('');
                  return (
                    <a key={owner} href={`#owner-${owner.replace(/\s+/g,'-')}`}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: '8px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', textDecoration: 'none', color: 'rgba(255,255,255,.8)', fontSize: '0.82rem', cursor: 'pointer', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.05)'; }}
                    >
                      <span>👤 {owner}</span>
                      <span style={{ fontSize: '0.7rem', padding: '1px 7px', borderRadius: '20px', background: 'rgba(99,102,241,.15)', color: '#a5b4fc' }}>{count}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <FilterGroup title="Document Types" items={dynamicTypes} activeFilters={activeFilters} onToggle={toggleFilter} />
            <FilterGroup title="Owners" items={dynamicOwners} activeFilters={activeFilters} onToggle={toggleFilter} />
          </div>
        </aside>

        <section style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          minHeight: '80vh', 
          contentVisibility: 'auto',
          containIntrinsicSize: '0 800px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem' }}>
                  {searchQuery ? `Search Results` : 'Documents'}
                </h2>
                {searchQuery && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Found {filteredDocs.length} {filteredDocs.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginLeft: '1rem' }}>
                <button 
                  onClick={() => setViewMode('grid')}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <Grid size={16} /> Grid
                </button>
                <button 
                  onClick={() => setViewMode('timeline')}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    background: viewMode === 'timeline' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'timeline' ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <History size={16} /> Timeline
                </button>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '0.5rem' }}>
                {activeFilters.map(filter => (
                  <div 
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    style={{ 
                      background: 'rgba(99, 102, 241, 0.15)', 
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: 'var(--primary)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {filter}
                    <X size={12} />
                  </div>
                ))}
                <button 
                  onClick={() => setActiveFilters([])}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', marginLeft: '4px' }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: UI.radius.sm, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '150px', height: '24px', borderRadius: UI.radius.sm, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="glass-card" style={{ padding: UI.spacing.md, height: '220px', display: 'flex', flexDirection: 'column', gap: UI.spacing.md, borderRadius: UI.radius.md }}>
                      <div style={{ height: '140px', borderRadius: UI.radius.md, background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ height: '20px', width: '40%', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                         <div style={{ height: '14px', width: '15%', borderRadius: UI.radius.sm, background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
                      </div>
                      <div style={{ height: '14px', width: '30%', borderRadius: UI.radius.sm, background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              Object.entries(groupedDocs).map(([owner, docs]) => (
                <div key={owner} id={`owner-${owner.replace(/\s+/g, '-')}`}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '1.25rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--glass-border)'
                  }}>
                    <Folder size={20} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{owner}'s Records</h3>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '2px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginLeft: 'auto'
                    }}>
                      {docs.length} {docs.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '1.5rem' 
                  }}>
                    {docs.map((doc, i) => (
                          <div 
                            key={doc.document_id} 
                            className="glass-card animate-fade-in" 
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || selectedDocs.size > 0) {
                                const newSet = new Set(selectedDocs);
                                if (newSet.has(doc.document_id)) newSet.delete(doc.document_id);
                                else newSet.add(doc.document_id);
                                setSelectedDocs(newSet);
                              } else {
                                setSelectedDoc(doc);
                              }
                            }}
                            style={{ 
                              padding: UI.spacing.md, 
                              cursor: 'pointer',
                              position: 'relative',
                              border: selectedDocs.has(doc.document_id) ? '2px solid var(--primary)' : selectedDoc?.document_id === doc.document_id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                              background: selectedDocs.has(doc.document_id) ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                              animationDelay: `${i * 0.05}s`,
                              overflow: 'hidden',
                              borderRadius: UI.radius.md,
                              transition: 'all 0.2s ease',
                              userSelect: 'none'
                            }}
                          >
                          <div className="hover-actions" style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            zIndex: 10,
                            display: 'flex',
                            gap: '6px',
                            opacity: 0,
                            transform: 'translateY(-5px)',
                            transition: 'all 0.3s ease'
                          }}>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
                              <ExternalLink size={14} color="white" />
                            </div>
                          </div>
                          <div style={{ 
                            height: '140px', 
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            {['jpg','jpeg','png','webp'].some(ext => doc.file_path.split('?')[0].toLowerCase().endsWith(ext)) ? (
                              <Image
                                src={signedUrls[doc.file_path] || getDocumentPublicUrl(doc.file_path)}
                                alt={doc.doc_type} fill style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, 300px"
                              />
                            ) : doc.file_path.split('?')[0].toLowerCase().endsWith('.pdf') ? (
                              <iframe
                                src={(signedUrls[doc.file_path] || getDocumentPublicUrl(doc.file_path)) + '#toolbar=0&navpanes=0'}
                                style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                                title={doc.doc_type}
                              />
                            ) : (
                              <Files size={40} style={{ opacity: 0.2 }} />
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: UI.spacing.sm }}>
                            <span style={{ fontSize: UI.text.xs, fontWeight: 700, padding: '3px 10px', borderRadius: UI.radius.full, background: getDocColor(doc.doc_type).bg, color: getDocColor(doc.doc_type).text, border: `1px solid ${getDocColor(doc.doc_type).border}` }}>
                              {doc.doc_type}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); quickCopy(doc); }}
                              title="Copy link"
                              style={{ background: 'transparent', border: 'none', color: UI.colors.muted, cursor: 'pointer', padding: '4px', borderRadius: UI.radius.sm, display: 'flex', opacity: 0.6 }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                            >
                              <Copy size={UI.icons.sm} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Clock size={UI.icons.sm} style={{ color: UI.colors.muted }} />
                            <span style={{ fontSize: UI.text.xs, color: UI.colors.muted }}>
                              {new Date(doc.upload_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ position: 'relative', paddingLeft: '40px' }}>
                <div className="timeline-line" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {sortedDocs.map((doc, i) => (
                    <div 
                      key={doc.document_id} 
                      onClick={() => setSelectedDoc(doc)}
                      className="glass-card spatial-slide-in"
                      style={{ 
                        padding: '1.5rem', 
                        display: 'flex', 
                        gap: '1.5rem', 
                        cursor: 'pointer',
                        border: selectedDoc?.document_id === doc.document_id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        animationDelay: `${i * 0.1}s`,
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        position: 'absolute', 
                        left: '-47px', 
                        top: '20px', 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        background: 'var(--primary)',
                        border: '4px solid var(--bg-main)',
                        boxShadow: '0 0 10px var(--primary)'
                      }} />
                      <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {['jpg','jpeg','png','webp'].some(ext => doc.file_path.split('?')[0].toLowerCase().endsWith(ext)) ? (
                          <Image src={signedUrls[doc.file_path] || getDocumentPublicUrl(doc.file_path)} alt={doc.doc_type} fill style={{ objectFit: 'cover' }} />
                        ) : doc.file_path.split('?')[0].toLowerCase().endsWith('.pdf') ? (
                          <iframe src={(signedUrls[doc.file_path] || getDocumentPublicUrl(doc.file_path)) + '#toolbar=0&navpanes=0'} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} title={doc.doc_type} />
                        ) : (
                          <Files size={32} style={{ opacity: 0.2 }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                          {new Date(doc.upload_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{doc.doc_type}</h4>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: getDocColor(doc.doc_type).bg, color: getDocColor(doc.doc_type).text, border: `1px solid ${getDocColor(doc.doc_type).border}` }}>{doc.doc_type}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          Archived for <strong style={{ color: 'rgba(255,255,255,.8)' }}>{doc.owner_name}</strong>
                          {doc.raw_content_vector && !doc.raw_content_vector.startsWith('[') && ` · ${doc.raw_content_vector.substring(0, 80).trim()}…`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Panel 3: Details Panel (Conditional) */}
        {selectedDoc && (
          <aside className="glass-card animate-fade-in" style={{ padding: '1.5rem', position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Details</h3>
              <button 
                onClick={() => setSelectedDoc(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ 
              height: '320px', 
              background: '#000', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid var(--glass-border)',
              position: 'relative'
            }}>
              {selectedDoc.file_path.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={getDocumentPublicUrl(selectedDoc.file_path) + '#toolbar=0&navpanes=0'} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Document Preview"
                />
              ) : (
                <img 
                  src={getDocumentPublicUrl(selectedDoc.file_path)} 
                  alt={selectedDoc.doc_type}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <DetailRow label="Owner" value={selectedDoc.owner_name} />
              <DetailRow label="Type" value={selectedDoc.doc_type} />
              <DetailRow label="Uploaded" value={new Date(selectedDoc.upload_date).toLocaleDateString()} />
              <DetailRow label="Storage Path" value={selectedDoc.file_path} />
            </div>

            {/* AI Intelligence Panel */}
            <AiInsightsPanel doc={selectedDoc} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleViewFull}
                  style={{ ...UI.button.base, ...UI.button.primary, flex: 1 }}
                >
                  View Full
                  <ChevronRight size={UI.icons.md} />
                </button>
                <button 
                  onClick={handleDownload}
                  style={{ ...UI.button.base, ...UI.button.secondary, padding: '12px' }}
                  title="Download Document"
                >
                  <Download size={UI.icons.lg} />
                </button>
              </div>

              <button 
                onClick={handleShareWhatsApp}
                style={{ ...UI.button.base, ...UI.button.whatsapp, width: '100%', marginTop: UI.spacing.sm }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.001.332.005c.109.004.258-.041.404.311.145.352.497 1.214.54 1.301.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
                </svg>
                Share to WhatsApp
              </button>

              <button 
                onClick={handleDelete}
                style={{ ...UI.button.base, ...UI.button.danger, width: '100%', marginTop: UI.spacing.md }}
              >
                <Trash2 size={UI.icons.md} />
                Delete from Vault
              </button>
            </div>
          </aside>
        )}
      </div>

      {downloadTarget && (
        <DownloadOptionsModal
          doc={downloadTarget}
          url={signedUrls[downloadTarget.file_path] || getDocumentPublicUrl(downloadTarget.file_path)}
          onClose={() => setDownloadTarget(null)}
          toast={toast}
        />
      )}

      {/* Floating Bulk Action Bar */}
      {selectedDocs.size > 0 && (
        <div style={{ 
          position: 'fixed', 
          bottom: '2.5rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: 'rgba(15,23,42,0.95)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          padding: '12px 24px', 
          borderRadius: '100px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px', 
          zIndex: 100, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(16px)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
              {selectedDocs.size}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>selected</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleBulkDownload} style={{ ...UI.button.base, ...UI.button.secondary, borderRadius: '100px', padding: '8px 16px', minHeight: '36px' }}>
              <Download size={14} /> Download All
            </button>
            <button onClick={handleBulkDelete} style={{ ...UI.button.base, ...UI.button.danger, borderRadius: '100px', padding: '8px 16px', minHeight: '36px' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <button onClick={() => setSelectedDocs(new Set())} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* UploadModal is now handled globally by VaultProvider */}
    </div>
  );
}

function FilterGroup({ title, items, activeFilters, onToggle }: { 
  title: string, 
  items: string[], 
  activeFilters: string[], 
  onToggle: (item: string) => void 
}) {
  return (
    <div>
      <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map(item => (
          <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.925rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              style={{ accentColor: 'var(--primary)' }} 
              checked={activeFilters.includes(item)}
              onChange={() => onToggle(item)}
            />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function TagItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px', 
      fontSize: '0.75rem', 
      color: 'var(--text-muted)',
      background: 'rgba(255,255,255,0.05)',
      padding: '4px 8px',
      borderRadius: '6px'
    }}>
      <Icon size={12} />
      <span>{text}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{value}</span>
    </div>
  );
}

// ── Client-side NLP extraction helpers ──────────────────────────────────────
// ── NLP Extraction Helpers ─────────────────────────────────────────────────

const NAME_STOP = new Set([
  'The','This','That','With','From','Date','Name','City','State','County',
  'Court','Record','File','Document','Department','Certificate','License',
  'Number','Page','Book','Volume','Office','United','States','Commonwealth',
  'Republic','District','Township','Village','Register','Registrar','Section',
  'Article','Chapter','Hereby','Whereas','Signed','Issued','Certified'
]);

function extractDates(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
    /\b(19|20)\d{2}\b/g,
  ];
  patterns.forEach(p => { const m = text.match(p); if (m) m.slice(0,5).forEach(d => found.add(d.trim())); });
  return Array.from(found).slice(0, 7);
}

function extractNames(text: string, knownOwner: string): string[] {
  const matches = (text.match(/\b([A-Z][a-z]{1,14} [A-Z][a-z]{1,14}(?:\s[A-Z][a-z]{1,14})?)\b/g) || []);
  const unique = Array.from(new Set(matches))
    .filter(n => {
      const parts = n.split(' ');
      return parts.every(p => !NAME_STOP.has(p)) && n.length < 40;
    });
  const result = knownOwner
    ? [knownOwner, ...unique.filter(n => n.toLowerCase() !== knownOwner.toLowerCase())]
    : unique;
  return result.slice(0, 6);
}

function extractPlaces(text: string): string[] {
  const found = new Set<string>();
  const p1 = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(County|City|State|Province|District|Township|Village|Town|Parish|Borough)\b/g;
  const p2 = /\b\d{1,5}\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s+(Street|Avenue|Road|Lane|Drive|Boulevard|Court|Place|Way)\b/g;
  const p3 = /\b([A-Z][a-z]+),\s+([A-Z]{2})\s+\d{5}\b/g; // City, ST 12345
  [p1, p2, p3].forEach(pat => { let m; while ((m = pat.exec(text)) !== null) found.add(m[0].trim()); });
  return Array.from(found).slice(0, 5);
}

function extractKeywords(text: string, docType: string): string[] {
  const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for',
    'of','with','by','from','is','was','are','were','be','been','this','that',
    'which','have','has','had','not','it','its','do','did','will','would','could',
    'should','may','might','shall','can','being','its','than','then','such','each',
    'also','into','over','after','above','said','hereby','thereof','herein']);
  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !stop.has(w));
  const freq: Record<string,number> = {};
  words.forEach(w => { freq[w] = (freq[w]||0)+1; });
  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,10).map(([w])=>w);
}

function extractNumbers(text: string): string[] {
  // ID numbers, case numbers, certificate numbers
  const found: string[] = [];
  const patterns = [
    /\b(?:No\.?|Number|#|Cert\.?|Case|File|Doc\.?)\s*:?\s*([A-Z0-9\-]{4,20})\b/gi,
    /\bSSN:?\s*[\dX*]{3}[-\s][\dX*]{2}[-\s][\dX*]{4}\b/gi,
    /\b[A-Z]{1,3}[-\s]?\d{6,12}\b/g,
  ];
  patterns.forEach(p => { const m = text.match(p); if (m) found.push(...m.slice(0,3)); });
  return Array.from(new Set(found)).slice(0,4);
}

// Document-type-aware field extraction
function extractStructuredFields(text: string, docType: string): Record<string,string> {
  const t = docType.toLowerCase();
  const fields: Record<string,string> = {};

  if (t.includes('birth')) {
    const dob = text.match(/born[:\s]+([A-Za-z]+ \d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dob) fields['Date of Birth'] = dob[1];
    const pob = text.match(/(?:born|birth).*?(?:in|at)\s+([A-Z][a-z]+(?:[,\s]+[A-Z][a-z]+)*)/i);
    if (pob) fields['Place of Birth'] = pob[1];
    const father = text.match(/father[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i);
    if (father) fields['Father'] = father[1];
    const mother = text.match(/mother[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i);
    if (mother) fields['Mother'] = mother[1];
  }

  if (t.includes('marriage') || t.includes('wedding')) {
    const wed = text.match(/married[:\s]+([A-Za-z]+ \d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (wed) fields['Marriage Date'] = wed[1];
    const groom = text.match(/groom[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i);
    if (groom) fields['Groom'] = groom[1];
    const bride = text.match(/bride[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i);
    if (bride) fields['Bride'] = bride[1];
    const venue = text.match(/(?:at|ceremony at|venue)[:\s]+([A-Z][a-z]+(?:[,\s]+[A-Z][a-z]+)*)/i);
    if (venue) fields['Venue'] = venue[1];
  }

  if (t.includes('death') || t.includes('obituary')) {
    const dod = text.match(/died[:\s]+([A-Za-z]+ \d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dod) fields['Date of Death'] = dod[1];
    const cause = text.match(/cause[:\s]+([a-z\s]{3,40})/i);
    if (cause) fields['Cause'] = cause[1].trim();
  }

  if (t.includes('deed') || t.includes('property') || t.includes('land')) {
    const acres = text.match(/(\d+(?:\.\d+)?)\s+acres?/i);
    if (acres) fields['Area'] = acres[0];
    const price = text.match(/\$[\d,]+(?:\.\d{2})?/);
    if (price) fields['Consideration'] = price[0];
  }

  if (t.includes('military') || t.includes('service')) {
    const rank = text.match(/\b(Private|Corporal|Sergeant|Lieutenant|Captain|Major|Colonel|General|Admiral|Ensign|Warrant)\b/i);
    if (rank) fields['Rank'] = rank[0];
    const branch = text.match(/\b(Army|Navy|Marines|Air Force|Coast Guard|Infantry|Artillery|Cavalry)\b/i);
    if (branch) fields['Branch'] = branch[0];
    const discharge = text.match(/discharg\w+[:\s]+([A-Za-z]+ \d{1,2},?\s+\d{4})/i);
    if (discharge) fields['Discharge Date'] = discharge[1];
  }

  return fields;
}

function calcConfidence(text: string, wordCount: number): number {
  if (wordCount === 0) return 0;
  if (wordCount < 20) return 20;
  if (wordCount < 60) return 45;
  // Check ratio of real words vs noise chars
  const realChars = (text.match(/[a-zA-Z\s]/g) || []).length;
  const ratio = realChars / text.length;
  return Math.min(98, Math.round(ratio * 100 * (Math.min(wordCount, 300) / 300) * 1.5 + 30));
}

function AiInsightsPanel({ doc }: { doc: any }) {
  const [tab, setTab] = React.useState<'insights'|'raw'>('insights');
  const [copied, setCopied] = React.useState(false);

  const rawText: string = doc.raw_content_vector || '';
  const isPlaceholder = rawText.startsWith('[SERVER-SIDE OCR RESULT]') || rawText.startsWith('[No readable text');
  const text = isPlaceholder ? '' : rawText;
  const wordCount = text.trim() ? text.split(/\s+/).length : 0;
  const hasContent = wordCount > 10;
  const confidence = React.useMemo(() => calcConfidence(text, wordCount), [text, wordCount]);
  const docAge = new Date().getFullYear() - new Date(doc.upload_date).getFullYear();

  const dates    = React.useMemo(() => extractDates(text), [text]);
  const names    = React.useMemo(() => extractNames(text, doc.owner_name), [text, doc.owner_name]);
  const places   = React.useMemo(() => extractPlaces(text), [text]);
  const keywords = React.useMemo(() => extractKeywords(text, doc.doc_type), [text, doc.doc_type]);
  const numbers  = React.useMemo(() => extractNumbers(text), [text]);
  const structured = React.useMemo(() => extractStructuredFields(text, doc.doc_type), [text, doc.doc_type]);

  const copyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confColor = confidence > 70 ? '#10b981' : confidence > 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ marginTop:'1.5rem', borderRadius:'16px', border:'1px solid rgba(99,102,241,0.25)', background:'rgba(99,102,241,0.03)', overflow:'hidden', marginBottom:'1.5rem', position:'relative' }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'100px', height:'100px', background:'var(--accent-gradient)', filter:'blur(50px)', opacity:0.15, pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <Sparkles size={15} color="var(--primary)" />
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>AI Heritage Insights</span>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {hasContent && <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{wordCount} words</span>}
          {/* Confidence pill */}
          <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:'20px', background:`${confColor}18`, border:`1px solid ${confColor}44`, color:confColor, fontWeight:700 }}>
            {hasContent ? `${confidence}% confident` : 'No text'}
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      {hasContent && (
        <div style={{ display:'flex', borderBottom:'1px solid rgba(99,102,241,0.1)', background:'rgba(0,0,0,0.1)' }}>
          {(['insights','raw'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:'8px', background:'transparent', border:'none', color: tab===t ? 'var(--primary)' : 'var(--text-muted)',
              fontSize:'0.75rem', fontWeight: tab===t ? 700 : 400, cursor:'pointer',
              borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent', transition:'all 0.2s'
            }}>
              {t === 'insights' ? '✨ Insights' : '📄 Raw Text'}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

        {/* No content state */}
        {!hasContent && (
          <div style={{ padding:'1rem', background:'rgba(245,158,11,0.05)', borderRadius:'10px', border:'1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize:'0.82rem', fontWeight:600, color:'#fbbf24', marginBottom:'4px' }}>
              {isPlaceholder ? '⏳ OCR not yet extracted' : '📄 No readable text found'}
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:'1.5' }}>
              {isPlaceholder
                ? 'This document was uploaded before real OCR was enabled. Re-upload it to extract text and unlock AI insights.'
                : 'The file may be a scanned image with no detectable text. Try a higher resolution scan.'}
            </div>
          </div>
        )}

        {/* Raw text tab */}
        {hasContent && tab === 'raw' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Full Extracted Text</span>
              <button onClick={copyText} style={{ background:'transparent', border:`1px solid ${copied?'#10b981':'var(--glass-border)'}`, borderRadius:'6px', padding:'3px 10px', color: copied?'#10b981':'var(--text-muted)', fontSize:'0.7rem', cursor:'pointer', transition:'all 0.2s' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ fontSize:'0.78rem', lineHeight:'1.7', color:'rgba(255,255,255,0.75)', background:'rgba(0,0,0,0.2)', borderRadius:'10px', padding:'1rem', maxHeight:'220px', overflowY:'auto', whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
              {text}
            </div>
          </div>
        )}

        {/* Insights tab */}
        {hasContent && tab === 'insights' && (
          <>
            {/* Confidence bar */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.62rem', color:'var(--text-muted)', marginBottom:'5px' }}>
                <span>Extraction Confidence</span><span style={{ color:confColor }}>{confidence}%</span>
              </div>
              <div style={{ height:'4px', background:'rgba(255,255,255,0.07)', borderRadius:'4px' }}>
                <div style={{ height:'100%', width:`${confidence}%`, background:`linear-gradient(90deg, ${confColor}88, ${confColor})`, borderRadius:'4px', transition:'width 0.6s ease' }} />
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.65rem' }}>
              {[
                { label:'Owner', value: doc.owner_name || '—' },
                { label:'Doc Type', value: doc.doc_type },
                { label:'Vault Age', value: docAge === 0 ? 'Today' : `${docAge}yr` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'10px', padding:'10px', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:'0.58rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>{label}</div>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Structured fields (document-type aware) */}
            {Object.keys(structured).length > 0 && (
              <div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'8px' }}>🗂 Structured Data</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {Object.entries(structured).map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 10px', background:'rgba(99,102,241,0.06)', borderRadius:'8px', border:'1px solid rgba(99,102,241,0.12)' }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#c7d2fe' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            {dates.length > 0 && (
              <div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'8px' }}>📅 Dates Detected</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {dates.map(d => <span key={d} style={{ fontSize:'0.72rem', padding:'3px 10px', borderRadius:'20px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', color:'#a5b4fc' }}>{d}</span>)}
                </div>
              </div>
            )}

            {/* People */}
            {names.length > 0 && (
              <div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'8px' }}>👤 People Mentioned</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {names.map(n => <span key={n} style={{ fontSize:'0.72rem', padding:'3px 10px', borderRadius:'20px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', color:'#6ee7b7' }}>{n}</span>)}
                </div>
              </div>
            )}

            {/* Locations */}
            {places.length > 0 && (
              <div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'8px' }}>📍 Locations Detected</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {places.map(p => <span key={p} style={{ fontSize:'0.72rem', padding:'3px 10px', borderRadius:'20px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', color:'#fcd34d' }}>{p}</span>)}
                </div>
              </div>
            )}

            {/* Reference numbers */}
            {numbers.length > 0 && (
              <div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'8px' }}>🔢 Reference Numbers</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {numbers.map(n => <span key={n} style={{ fontSize:'0.72rem', padding:'3px 10px', borderRadius:'20px', background:'rgba(236,72,153,0.08)', border:'1px solid rgba(236,72,153,0.2)', color:'#f9a8d4', fontFamily:'monospace' }}>{n}</span>)}
                </div>
              </div>
            )}

            {/* Keywords */}
            {keywords.length > 0 && (
              <div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'8px' }}>🔑 Key Terms</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {keywords.map(k => <span key={k} style={{ fontSize:'0.72rem', padding:'3px 10px', borderRadius:'20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.65)' }}>{k}</span>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

