'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, ExternalLink, Search, X, Shield, Archive, Folder, Files, ChevronDown } from 'lucide-react';
import { getDocumentsByGroup, getDocumentPublicUrl, getDocumentSignedUrl } from '../../services/documentService';
import { supabase } from '../../lib/supabaseClient';
import { DownloadOptionsModal } from '../../components/DownloadOptionsModal';
import { UI } from '../../lib/designSystem';

/* ── Tiny toast system ─────────────────────────────────── */
type Toast = { id: number; msg: string; type: 'ok' | 'err' };
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((msg: string, type: Toast['type'] = 'ok') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, show };
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} className="toast-enter" style={{ background: t.type === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${t.type === 'ok' ? '#10b981' : '#ef4444'}`, borderRadius: '12px', padding: '12px 16px', color: t.type === 'ok' ? '#6ee7b7' : '#fca5a5', fontSize: '0.82rem', fontWeight: 600, backdropFilter: 'blur(12px)', maxWidth: '280px' }}>
          {t.type === 'ok' ? '✓' : '✕'} {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── WhatsApp SVG ─────────────────────────────────────── */
const WaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.005c.109.004.258-.041.404.311l.54 1.301c.043.087.072.188.014.304l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.274.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087l1.184.564c.173.087.289.13.332.202.045.072.045.419-.1.824zM12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
  </svg>
);

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

function DocThumb({ doc, url }: { doc: any; url: string }) {
  const ext = doc.file_path?.split('.').pop()?.toLowerCase() || '';
  const isImg = ['jpg','jpeg','png','webp','gif'].includes(ext);
  const isPdf = ext === 'pdf';
  return (
    <div style={{ height: '140px', background: UI.colors.card, borderRadius: UI.radius.md, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: UI.spacing.sm, position: 'relative' }}>
      {isImg && url ? <img src={url} alt={doc.doc_type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
       isPdf && url ? <iframe src={`${url}#toolbar=0&navpanes=0`} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} title="pdf" /> :
       <Files size={40} style={{ opacity: 0.2 }} />}
    </div>
  );
}

/* ── Preview panel (desktop) / bottom sheet (mobile) ─── */
function DocPreview({ doc, url, onClose, onDownload, onView, onWa }: any) {
  return (
    <>
      {/* Backdrop on mobile */}
      <div onClick={onClose} style={{ display: 'none' }} className="mobile-backdrop" />
      <div className="share-side-panel" style={{ position: 'sticky', top: '1rem', height: 'fit-content', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
        <PreviewContent doc={doc} url={url} onClose={onClose} onDownload={onDownload} onView={onView} onWa={onWa} />
      </div>
      {/* Bottom sheet on mobile */}
      <div className="share-bottom-sheet">
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0 auto 1.25rem' }} />
        <PreviewContent doc={doc} url={url} onClose={onClose} onDownload={onDownload} onView={onView} onWa={onWa} />
      </div>
    </>
  );
}

function PreviewContent({ doc, url, onClose, onDownload, onView, onWa }: any) {
  const ext = doc.file_path?.split('.').pop()?.toLowerCase() || '';
  const isImg = ['jpg','jpeg','png','webp'].includes(ext);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Preview</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
      </div>
      <div style={{ height: '200px', background: '#000', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
        {isImg && url ? <img src={url} alt={doc.doc_type} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> :
         ext === 'pdf' && url ? <iframe src={`${url}#toolbar=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="pdf" /> :
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Files size={48} style={{ opacity: 0.1 }} /></div>}
      </div>
      {[{ l: 'Owner', v: doc.owner_name }, { l: 'Type', v: doc.doc_type }, { l: 'Date', v: new Date(doc.upload_date).toLocaleDateString() }].map(({ l, v }) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{l}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
        <button onClick={onView} style={{ padding: '13px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
          <ExternalLink size={15} /> View Document
        </button>
        <button onClick={onDownload} style={{ padding: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
          <Download size={15} /> Download
        </button>
        <button onClick={onWa} style={{ padding: '13px', background: '#25D366', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
          <WaIcon /> Share on WhatsApp
        </button>
      </div>
    </>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function SharePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [activeOwner, setActiveOwner] = useState<string | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<any>(null);
  const { toasts, show: toast } = useToast();

  useEffect(() => {
    getDocumentsByGroup('00000000-0000-0000-0000-000000000000')
      .then(d => setDocuments(d || []))
      .catch(() => toast('Failed to load documents', 'err'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!documents.length) return;
    supabase.storage.from('family_vault')
      .createSignedUrls(documents.map(d => d.file_path), 3600)
      .then(({ data }) => {
        if (data) {
          const m: Record<string, string> = {};
          data.forEach((x: any) => { if (x.signedUrl && x.path) m[x.path] = x.signedUrl; });
          setSignedUrls(m);
        }
      });
  }, [documents]);

  const owners = useMemo(() => Array.from(new Set(documents.map(d => d.owner_name?.trim()).filter(Boolean))), [documents]);

  const filtered = useMemo(() => {
    let d = documents;
    if (activeOwner) d = d.filter(x => x.owner_name?.trim() === activeOwner);
    if (query) d = d.filter(x => x.owner_name?.toLowerCase().includes(query.toLowerCase()) || x.doc_type?.toLowerCase().includes(query.toLowerCase()));
    return d;
  }, [documents, activeOwner, query]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    filtered.forEach(doc => {
      const k = doc.owner_name?.trim() || 'Unknown';
      if (!g[k]) g[k] = [];
      g[k].push(doc);
    });
    return g;
  }, [filtered]);

  const isImageFile = (path: string) =>
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].some(e => path?.split('?')[0].toLowerCase().endsWith(e));

  const handleDownload = async (doc: any) => {
    if (isImageFile(doc.file_path)) {
      setDownloadTarget(doc);
      return;
    }
    try {
      const url = await getDocumentSignedUrl(doc.file_path);
      const a = document.createElement('a');
      a.href = url; a.download = doc.file_path.split('/').pop() || 'doc';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('Download started');
    } catch { toast('Download failed', 'err'); }
  };

  const handleView = async (doc: any) => {
    try { window.open(await getDocumentSignedUrl(doc.file_path), '_blank'); }
    catch { window.open(getDocumentPublicUrl(doc.file_path), '_blank'); }
  };

  const handleWa = (doc: any) => {
    const url = getDocumentPublicUrl(doc.file_path);
    const text = `🏛️ *Family Archive*\n\n📄 ${doc.doc_type} · ${doc.owner_name}\n📅 ${new Date(doc.upload_date).toLocaleDateString()}\n\n🔗 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const statsItems = [
    { l: 'Records', v: documents.length, c: '#a5b4fc' },
    { l: 'Members', v: owners.length, c: '#6ee7b7' },
    { l: 'Doc Types', v: new Set(documents.map(d => d.doc_type)).size, c: '#fcd34d' },
    { l: 'Last Added', v: documents.length ? new Date(Math.max(...documents.map(d => +new Date(d.upload_date)))).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : '—', c: '#67e8f9' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <ToastStack toasts={toasts} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.18),rgba(168,85,247,.08))', borderBottom: '1px solid rgba(99,102,241,.2)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Archive size={20} color="white" />
          </div>
          <div>
            <h1 className="share-banner-title" style={{ fontSize: '1.15rem', margin: 0, WebkitTextFillColor: 'white', background: 'none' }}>Family Archive Vault</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{documents.length} records · shared view</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', borderRadius: '20px' }}>
          <Shield size={13} color="#10b981" />
          <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 600, whiteSpace: 'nowrap' }}>Read-only</span>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 6rem' }}>

        {/* Stats */}
        <div className="share-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {statsItems.map(({ l, v, c }) => (
            <div key={l} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: c }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="share-search-input" type="text" placeholder="Search by name or document type…" value={query} onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px', padding: '12px 12px 12px 38px', color: 'white', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>

        {/* Owner chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
          {[null, ...owners].map(o => (
            <button key={o ?? '__all'} onClick={() => setActiveOwner(o)}
              style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${activeOwner === o ? 'var(--primary)' : 'rgba(255,255,255,.1)'}`, background: activeOwner === o ? 'rgba(99,102,241,.15)' : 'transparent', color: activeOwner === o ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', minHeight: '38px' }}>
              {o ?? 'All Members'}
            </button>
          ))}
        </div>

        {/* Grid + side panel */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '1fr 360px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Document groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: '100px', background: 'rgba(255,255,255,.02)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : Object.keys(grouped).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
                <Archive size={44} style={{ opacity: .1, display: 'block', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '0.9rem' }}>No records found</p>
              </div>
            ) : Object.entries(grouped).map(([owner, docs]) => (
              <section key={owner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <Folder size={17} color="var(--primary)" />
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{owner}'s Records</h2>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(99,102,241,.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,.2)' }}>{docs.length}</span>
                </div>
                <div className="share-grid">
                  {docs.map(doc => {
                    const url = signedUrls[doc.file_path] || '';
                    const isSelected = selectedDoc?.document_id === doc.document_id;
                    return (
                      <div key={doc.document_id} onClick={() => setSelectedDoc(isSelected ? null : doc)}
                        className="hover-card"
                        style={{ background: isSelected ? 'rgba(99,102,241,.08)' : UI.colors.card, border: `1px solid ${isSelected ? 'rgba(99,102,241,.4)' : UI.colors.border}`, borderRadius: UI.radius.md, padding: UI.spacing.md, cursor: 'pointer', transition: 'all .2s ease', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
                        <DocThumb doc={doc} url={url} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: UI.spacing.sm }}>
                          <span style={{ fontSize: UI.text.md, fontWeight: 600, padding: '3px 10px', borderRadius: UI.radius.full, background: getDocColor(doc.doc_type).bg, color: getDocColor(doc.doc_type).text, border: `1px solid ${getDocColor(doc.doc_type).border}` }}>
                            {doc.doc_type}
                          </span>
                          <span style={{ fontSize: UI.text.xs, color: UI.colors.muted, whiteSpace: 'nowrap' }}>
                            {new Date(doc.upload_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: UI.text.sm, color: UI.colors.muted, margin: `0 0 ${UI.spacing.md}` }}>{doc.owner_name}</p>
                        <div className="share-card-actions" style={{ display: 'flex', gap: UI.spacing.sm }}>
                          <button onClick={e => { e.stopPropagation(); handleView(doc); }} style={{ ...UI.button.base, ...UI.button.secondary, flex: 1, color: '#a5b4fc', background: 'rgba(99,102,241,.12)', borderColor: 'rgba(99,102,241,.2)' }}>
                            <ExternalLink size={UI.icons.sm} /> View
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDownload(doc); }} style={{ ...UI.button.base, ...UI.button.secondary, flex: 1 }}>
                            <Download size={UI.icons.sm} /> Save
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleWa(doc); }} style={{ ...UI.button.base, ...UI.button.whatsapp, padding: '10px' }}>
                            <WaIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Desktop side panel */}
          {selectedDoc && (
            <div className="share-side-panel">
              <DocPreview
                doc={selectedDoc}
                url={signedUrls[selectedDoc.file_path] || ''}
                onClose={() => setSelectedDoc(null)}
                onDownload={() => handleDownload(selectedDoc)}
                onView={() => handleView(selectedDoc)}
                onWa={() => handleWa(selectedDoc)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {selectedDoc && (
        <>
          <div onClick={() => setSelectedDoc(null)} className="mobile-backdrop" />
          <div className="share-bottom-sheet">
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,.2)', borderRadius: '4px', margin: '0 auto 1.25rem' }} />
            <PreviewContent
              doc={selectedDoc}
              url={signedUrls[selectedDoc.file_path] || ''}
              onClose={() => setSelectedDoc(null)}
              onDownload={() => handleDownload(selectedDoc)}
              onView={() => handleView(selectedDoc)}
              onWa={() => handleWa(selectedDoc)}
            />
          </div>
        </>
      )}

      {downloadTarget && (
        <DownloadOptionsModal
          doc={downloadTarget}
          url={signedUrls[downloadTarget.file_path] || getDocumentPublicUrl(downloadTarget.file_path)}
          onClose={() => setDownloadTarget(null)}
          toast={(m, ok) => toast(m, ok ? 'ok' : 'err')}
        />
      )}
    </div>
  );
}
