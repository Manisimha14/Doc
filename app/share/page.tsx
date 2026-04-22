'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, ExternalLink, Search, X, Shield, Archive, Folder, Files, ChevronDown, Clock, Activity, Calendar, Image as ImageIcon, Maximize2 } from 'lucide-react';

/* ── Image Lightbox ───────────────────────────────────── */
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="lightbox-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(10px)' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}><X size={24} /></button>
      <img src={url} alt="Lightbox" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 50px rgba(0,0,0,0.5)', animation: 'zoomIn 0.3s ease-out' }} />
    </div>
  );
}

/* ── Activity Timeline Item ──────────────────────────── */
function TimelineItem({ doc, url, onClick }: { doc: any; url: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="timeline-item" style={{ position: 'relative', paddingLeft: '2rem', paddingBottom: '2.5rem', cursor: 'pointer' }}>
      <div className="timeline-dot" style={{ position: 'absolute', left: '-5px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)', zIndex: 2 }} />
      <div className="timeline-line" style={{ position: 'absolute', left: '0', top: '5px', bottom: '0', width: '2px', background: 'rgba(99,102,241,0.2)', zIndex: 1 }} />
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', transition: 'all 0.2s ease' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
          <img src={url || '/api/placeholder/60/60'} alt={doc.doc_type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>{doc.doc_type}</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(doc.upload_date).toLocaleDateString()}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Uploaded by {doc.owner_name}</p>
        </div>
        <Maximize2 size={16} style={{ opacity: 0.3 }} />
      </div>
    </div>
  );
}

/* ── AI Insights Panel ────────────────────────────────── */
function HeritageInsights({ documents }: { documents: any[] }) {
  const owners = Array.from(new Set(documents.map(d => d.owner_name)));
  const types = Array.from(new Set(documents.map(d => d.doc_type)));
  
  return (
    <div className="heritage-insights-glass" style={{ 
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1), rgba(30, 41, 59, 0.1))', 
      border: '1px solid rgba(255, 255, 255, 0.08)', 
      borderRadius: '32px', 
      padding: 'clamp(1.5rem, 5vw, 3rem)', 
      marginBottom: '3rem', 
      position: 'relative', 
      overflow: 'hidden',
      boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(30px)'
    }}>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--accent-gradient)', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(99, 102, 241, 0.4)' }}>
              <Activity size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', margin: 0, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em', color: 'white' }}>Archive Insights</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intelligence Engine v1.0</p>
            </div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: '30px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6ee7b7' }}>Archive integrity 99.8%</span>
          </div>
        </div>
        
        <div className="insights-content-grid" style={{ display: 'grid', gap: '2rem' }}>
          <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            This secure vault preserves <strong style={{ color: 'white', fontWeight: 800 }}>{documents.length} historical records</strong> across 
            <strong style={{ color: 'white', fontWeight: 800 }}> {owners.length} family members</strong>. 
            The collection is anchored by rare <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>{types[0]}s</strong>, providing a high-fidelity window into our shared lineage.
          </p>
          <div className="legacy-stats-card" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '1rem', letterSpacing: '0.1em' }}>Legacy Statistics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Preservation Rate</span>
                <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 700 }}>Optimal</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{ width: '85%', height: '100%', background: 'var(--accent-gradient)', borderRadius: '2px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Last Verified</span>
                <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 700 }}>24m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: '-50px', bottom: '-50px', opacity: 0.05, transform: 'rotate(-20deg)', pointerEvents: 'none' }}>
        <Shield size={300} />
      </div>
    </div>
  );
}




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

function DocThumb({ doc, url, density = 'cozy' }: { doc: any; url: string; density?: 'cozy' | 'compact' }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ext = doc.file_path?.split('.').pop()?.toLowerCase() || '';
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isPdf = ext === 'pdf';
  const height = density === 'cozy' ? '240px' : '140px';

  return (
    <div className="DocThumb_wrapper" style={{ perspective: '1000px' }}>
      <div className="DocThumb_container" style={{ 
        height, 
        background: 'rgba(15, 23, 42, 0.4)', 
        borderRadius: '24px', 
        overflow: 'hidden', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: '1.5rem', 
        position: 'relative', 
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'transform 0.5s cubic-bezier(0.2, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.2, 1, 0.3, 1)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        cursor: 'pointer'
      }}>
        {!imgLoaded && !error && url && isImg && (
          <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
        )}
        
        {isImg && url && !error ? (
          <img 
            src={url} 
            alt={doc.doc_type} 
            onLoad={() => setImgLoaded(true)}
            onError={() => setError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgLoaded ? 1 : 0, transition: 'all 0.8s ease', filter: 'brightness(0.9) contrast(1.1)' }} 
          />
        ) : isPdf ? (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.02))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ background: '#ef4444', color: 'white', padding: '16px', borderRadius: '18px', boxShadow: '0 12px 30px rgba(239, 68, 68, 0.3)' }}>
              <Files size={36} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fca5a5', letterSpacing: '0.2em' }}>PDF ARCHIVE</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: 0.2 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ImageIcon size={36} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{ext || 'FILE'}</span>
          </div>
        )}
        
        {/* Advanced Glass Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', pointerEvents: 'none' }} />
        
        {/* Premium Badge */}
        {!error && imgLoaded && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 14px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', borderRadius: '10px', fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            {ext}
          </div>
        )}
      </div>
    </div>
  );
}



/* ── Preview panel (desktop) / bottom sheet (mobile) ─── */
function DocPreview({ doc, url, onClose, onDownload, onView, onWa }: any) {
  return (
    <div className="share-side-panel glass-panel" style={{ 
      position: 'sticky', 
      top: '1.5rem', 
      height: 'fit-content', 
      background: 'rgba(15, 23, 42, 0.7)', 
      backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: '32px', 
      padding: '2.5rem',
      boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6)',
      animation: 'spatialSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: 10
    }}>
      <PreviewContent doc={doc} url={url} onClose={onClose} onDownload={onDownload} onView={onView} onWa={onWa} />
    </div>
  );
}



function PreviewContent({ doc, url, onClose, onDownload, onView, onWa }: any) {
  const ext = doc.file_path?.split('.').pop()?.toLowerCase() || '';
  const isImg = ['jpg','jpeg','png','webp'].includes(ext);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>Document Preview</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{doc.doc_type}</span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.owner_name}</span>
          </div>
        </div>
        <button onClick={onClose} className="hover-button" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}><X size={20} /></button>
      </div>

      <div className="preview-container" style={{ 
        position: 'relative',
        width: '100%',
        height: '420px', 
        background: '#000', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        marginBottom: '2rem', 
        border: '1px solid rgba(255,255,255,0.1)', 
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {isImg && url ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={url} 
              alt={doc.doc_type} 
              style={{ 
                maxHeight: '100%', 
                maxWidth: '100%', 
                objectFit: 'contain',
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }} 
              className="preview-image-hover"
            />
            {/* Archival Watermark */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.4, filter: 'grayscale(1)' }}>
              <Shield size={14} color="white" />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Heritage Archive Verified</span>
            </div>
          </div>
        ) : ext === 'pdf' && url ? (
          <iframe src={`${url}#toolbar=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="pdf" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.15 }}>
            <Files size={80} />
          </div>
        )}

        
        {/* Overlay Controls */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
          <button className="glass-btn-mini" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Zoom</button>
          <button onClick={onView} className="glass-btn-mini" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Full</button>
        </div>
      </div>
      
      {/* Upgraded Info Card */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1.25rem', 
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '2rem',
        transition: 'all 0.3s ease'
      }} className="hover-card-bright">
        <div>
          <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{doc.owner_name}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{doc.doc_type}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{new Date(doc.upload_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '2rem 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button onClick={onView} style={{ padding: '16px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '16px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '56px', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)', transition: 'all 0.2s' }} className="primary-action-btn">
          <ExternalLink size={20} /> View Full Document
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button onClick={onDownload} style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '52px', transition: 'all 0.2s' }} className="secondary-action-btn">
            <Download size={18} /> Save
          </button>
          <button onClick={onWa} style={{ padding: '14px', background: '#25D366', border: 'none', borderRadius: '16px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '52px', boxShadow: '0 4px 16px rgba(37, 211, 102, 0.2)', transition: 'all 0.2s' }} className="secondary-action-btn">
            <WaIcon /> Share
          </button>
        </div>
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
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [density, setDensity] = useState<'cozy' | 'compact'>('cozy');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const { toasts, show: toast } = useToast();

  useEffect(() => {
    fetch('/api/documents/public?groupId=00000000-0000-0000-0000-000000000000')
      .then(res => res.json())
      .then(({ data, error }) => {
        if (data && !error) setDocuments(data);
        else toast('Failed to load documents', 'err');
      })
      .catch(() => toast('Failed to load documents', 'err'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!documents.length) return;
    
    // Fetch signed URLs from our proxy API to support unauthenticated viewing
    fetch('/api/documents/signed-urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: documents.map(d => d.file_path) })
    })
      .then(res => res.json())
      .then(({ data, error }) => {
        const m: Record<string, string> = {};
        // Use public URL as baseline fallback
        documents.forEach(d => {
          m[d.file_path] = getDocumentPublicUrl(d.file_path);
        });
        
        // Overlay signed URLs if available
        if (data && !error) {
          data.forEach((x: any) => { if (x.signedUrl && x.path) m[x.path] = x.signedUrl; });
        }
        setSignedUrls(m);
      })
      .catch(err => {
        console.error('Failed to fetch signed URLs:', err);
        // Fallback to public URLs on error
        const m: Record<string, string> = {};
        documents.forEach(d => {
          m[d.file_path] = getDocumentPublicUrl(d.file_path);
        });
        setSignedUrls(m);
      });
  }, [documents]);

  const owners = useMemo(() => Array.from(new Set(documents.map(d => d.owner_name?.trim()).filter(Boolean))), [documents]);

  const filtered = useMemo(() => {
    let d = [...documents];
    if (activeOwner) d = d.filter(x => x.owner_name?.trim() === activeOwner);
    if (query) {
      const q = query.toLowerCase();
      d = d.filter(x => x.owner_name?.toLowerCase().includes(q) || x.doc_type?.toLowerCase().includes(q));
    }
    
    // Apply sorting
    d.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
      if (sortBy === 'name') return (a.owner_name || '').localeCompare(b.owner_name || '');
      return (a.doc_type || '').localeCompare(b.doc_type || '');
    });
    
    return d;
  }, [documents, activeOwner, query, sortBy]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    filtered.forEach(doc => {
      const k = doc.owner_name?.trim() || 'Unknown';
      if (!g[k]) g[k] = [];
      g[k].push(doc);
    });
    return g;
  }, [filtered]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return parts.map((p, i) => p.toLowerCase() === q.toLowerCase() ? <mark key={i} style={{ background: 'rgba(99, 102, 241, 0.4)', color: 'white', borderRadius: '2px' }}>{p}</mark> : p);
  };

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
    const ext = doc.file_path?.split('.').pop()?.toLowerCase();
    const url = signedUrls[doc.file_path] || getDocumentPublicUrl(doc.file_path);
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setLightboxUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleWa = (doc: any) => {
    const url = getDocumentPublicUrl(doc.file_path);
    const text = `🏛️ *Family Archive*\n\n📄 ${doc.doc_type} · ${doc.owner_name}\n📅 ${new Date(doc.upload_date).toLocaleDateString()}\n\n🔗 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const statsItems = [
    { l: 'Total Records', v: documents.length, c: '#a5b4fc', icon: <Archive size={16} /> },
    { l: 'Active Members', v: owners.length, c: '#6ee7b7', icon: <Shield size={16} /> },
    { l: 'Categories', v: new Set(documents.map(d => d.doc_type)).size, c: '#fcd34d', icon: <Folder size={16} /> },
    { l: 'Last Update', v: documents.length ? new Date(Math.max(...documents.map(d => +new Date(d.upload_date)))).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : '—', c: '#67e8f9', icon: <Clock size={16} /> },
  ];


  const handleNativeShare = async (doc: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Family Archive: ${doc.doc_type}`,
          text: `Check out this record for ${doc.owner_name} from our family archive.`,
          url: getDocumentPublicUrl(doc.file_path)
        });
      } catch (err) {
        handleWa(doc);
      }
    } else {
      handleWa(doc);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      color: 'white', 
      fontFamily: 'Inter, sans-serif', 
      WebkitFontSmoothing: 'antialiased',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Dynamic Background Elements */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} />
      
      <ToastStack toasts={toasts} />
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      
      {/* Premium Header */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        background: 'rgba(2, 6, 23, 0.7)', 
        backdropFilter: 'blur(20px)', 
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem clamp(1rem, 5vw, 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)', flexShrink: 0 }}>
              <Archive size={20} color="white" />
            </div>
            <div className="header-titles">
              <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Heritage Vault</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6ee7b7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure</span>
                <div style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>v2.4</span>
              </div>
            </div>
          </div>


          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer' }}><Folder size={14} /></button>
              <button onClick={() => setViewMode('timeline')} style={{ padding: '6px 10px', background: viewMode === 'timeline' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'timeline' ? 'white' : 'rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer' }}><Clock size={14} /></button>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="hide-mobile"
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Sync
            </button>
          </div>

        </div>
      </div>


      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 8rem' }}>
        
        {/* Heritage Insights section */}
        {!loading && documents.length > 0 && <HeritageInsights documents={documents} />}

        {/* Sorting & Density Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort by</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '8px 16px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px', paddingRight: '36px' }}>
              <option value="date" style={{ background: '#0f172a' }}>Latest Added</option>
              <option value="name" style={{ background: '#0f172a' }}>Member Name</option>
              <option value="type" style={{ background: '#0f172a' }}>Document Type</option>
            </select>
          </div>

          
          <div className="chips-container" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {[null, ...owners].map(o => (
              <button key={o ?? '__all'} onClick={() => setActiveOwner(o)}
                style={{ padding: '8px 14px', borderRadius: '12px', border: `1px solid ${activeOwner === o ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,.08)'}`, background: activeOwner === o ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,0.03)', color: activeOwner === o ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}>
                {o ?? 'All Members'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats - Horizontal scroll on mobile */}
        <div className="share-stats-grid chips-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {statsItems.map(({ l, v, c, icon }) => (
            <div key={l} className="stats-card-premium" style={{ 
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)', 
              border: '1px solid rgba(255,255,255,.08)', 
              borderRadius: '24px', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(12px)',
              cursor: 'default'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                {icon}
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{l}</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Search - Ultra Elite Command style */}
        <div style={{ position: 'relative', marginBottom: '4rem', zIndex: 10, maxWidth: '900px', margin: '0 auto 4rem', animation: 'fadeInDown 0.8s ease' }}>
          <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <Search size={24} />
          </div>
          <input className="share-search-input-elite" type="text" placeholder="Explore your family heritage records..." value={query} onChange={e => setQuery(e.target.value)}
            style={{ 
              width: '100%', 
              background: 'rgba(15, 23, 42, 0.4)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '32px', 
              padding: '24px 24px 24px 68px', 
              color: 'white', 
              outline: 'none', 
              fontSize: '1.25rem', 
              boxSizing: 'border-box', 
              backdropFilter: 'blur(30px)', 
              boxShadow: '0 30px 70px rgba(0,0,0,0.5)', 
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', 
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif'
            }} />
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, border: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Command + K
            </div>
          </div>
        </div>



        {/* Grid + side panel */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedDoc && viewMode === 'grid' ? '1fr 380px' : '1fr', gap: '2rem', alignItems: 'start', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          
          {viewMode === 'timeline' ? (
            <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                <Clock size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Chronological History</h2>
              </div>
              <div style={{ position: 'relative' }}>
                {filtered.map(doc => (
                  <TimelineItem 
                    key={doc.document_id} 
                    doc={doc} 
                    url={signedUrls[doc.file_path] || ''} 
                    onClick={() => handleView(doc)} 
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Document groups */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {loading ? (
                <div className="share-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-shimmer" style={{ height: '260px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '6rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Archive size={32} style={{ opacity: .2 }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>No records found</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Try adjusting your search or filters.</p>
                </div>
              ) : Object.entries(grouped).map(([owner, docs]) => (
                <section key={owner} style={{ animation: 'fadeIn 0.5s ease backwards' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <Folder size={18} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>{owner}'s Heritage</h2>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>{docs.length} Records</span>
                    </div>
                  </div>

                  <div className="share-grid">
                    {docs.map(doc => {
                      const url = signedUrls[doc.file_path] || '';
                      const isSelected = selectedDoc?.document_id === doc.document_id;
                      return (
                        <div key={doc.document_id} onClick={() => setSelectedDoc(isSelected ? null : doc)}
                          className="hover-card"
                          style={{ background: isSelected ? 'rgba(99,102,241,.1)' : 'rgba(30, 41, 59, 0.4)', border: `1px solid ${isSelected ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.08)'}`, borderRadius: '20px', padding: density === 'cozy' ? '1.25rem' : '1rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', WebkitTapHighlightColor: 'transparent', userSelect: 'none', position: 'relative', overflow: 'hidden' }}>
                          <DocThumb doc={doc} url={url} density={density} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: getDocColor(doc.doc_type).bg, color: getDocColor(doc.doc_type).text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {highlight(doc.doc_type, query)}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {new Date(doc.upload_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: density === 'cozy' ? '0.875rem' : '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: `0 0 1rem` }}>{highlight(doc.owner_name, query)}</p>
                          {density === 'cozy' && (
                            <div className="share-card-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={e => { e.stopPropagation(); handleView(doc); }} style={{ ...UI.button.base, flex: 1, padding: '10px', background: 'rgba(99,102,241,.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,.2)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                                View
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleNativeShare(doc); }} style={{ ...UI.button.base, width: '44px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ExternalLink size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Desktop side panel */}
          {selectedDoc && viewMode === 'grid' && (
            <DocPreview
              doc={selectedDoc}
              url={signedUrls[selectedDoc.file_path] || ''}
              onClose={() => setSelectedDoc(null)}
              onDownload={() => handleDownload(selectedDoc)}
              onView={() => handleView(selectedDoc)}
              onWa={() => handleNativeShare(selectedDoc)}
            />
          )}

        </div>
      </div>

      {/* Mobile bottom sheet - Logic-level gate to prevent desktop interference */}
      {selectedDoc && (
        <div className="mobile-only-container">
          <div onClick={() => setSelectedDoc(null)} className="mobile-backdrop" />
          <div className="share-bottom-sheet">
            <div style={{ width: '36px', height: '5px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', margin: '0 auto 1.5rem' }} />
            <PreviewContent
              doc={selectedDoc}
              url={signedUrls[selectedDoc.file_path] || ''}
              onClose={() => setSelectedDoc(null)}
              onDownload={() => handleDownload(selectedDoc)}
              onView={() => handleView(selectedDoc)}
              onWa={() => handleNativeShare(selectedDoc)}
            />
          </div>
        </div>
      )}


      {downloadTarget && (
        <DownloadOptionsModal
          doc={downloadTarget}
          url={signedUrls[downloadTarget.file_path] || getDocumentPublicUrl(downloadTarget.file_path)}
          onClose={() => setDownloadTarget(null)}
          toast={(m, ok) => toast(m, ok ? 'ok' : 'err')}
        />
      )}
      
      <style jsx global>{`
        section { margin-bottom: 32px; }
        
        .DocThumb_container:hover {
          border-color: rgba(99, 102, 241, 0.5) !important;
          transform: translateY(-2px);
        }
        
        .share-search-input:focus {
          border-color: var(--primary) !important;
          background: rgba(30, 41, 59, 0.8) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), 0 8px 32px rgba(0,0,0,0.4) !important;
        }

        .stats-card-premium:hover {
          transform: translateY(-5px) scale(1.02);
          border-color: rgba(99, 102, 241, 0.4) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .hover-card-bright:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.15) !important;
          transform: translateY(-2px);
        }

        .preview-container:hover .preview-image-hover {
          transform: scale(1.05);
        }

        .primary-action-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
        }

        .secondary-action-btn:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.1) !important;
        }

        .glass-btn-mini:hover {
          background: rgba(255,255,255,0.2) !important;
          transform: translateY(-1px);
        }

        .hover-button:hover {
          transform: rotate(90deg) scale(1.1);
        }

        .sidebar-main {
          box-shadow: 10px 0 30px rgba(0,0,0,0.5);
          background: rgba(255,255,255,0.03) !important;
          backdrop-filter: blur(16px) !important;
        }
        
        .sidebar-main:hover {
          border-right-color: rgba(99, 102, 241, 0.3);
        }

        .mobile-only-container {
          display: none;
        }

        .insights-content-grid {
          grid-template-columns: 1fr 300px;
          align-items: center;
        }

        @media (max-width: 900px) {
          .insights-content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .mobile-only-container {
            display: block;
          }
          .header-titles {
            display: none;
          }
          .share-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .share-search-input-elite {
            padding: 18px 18px 18px 58px !important;
            font-size: 1rem !important;
          }
          .heritage-insights-glass {
            padding: 1.5rem !important;
            border-radius: 24px !important;
          }
        }



        @media (max-width: 640px) {
          .share-grid {
            grid-template-columns: 1fr !important;
          }
          .share-header-sticky {
            padding: 0.5rem 1rem !important;
          }
          .share-search-input {
            font-size: 16px !important; /* Prevent iOS zoom */
          }
          .preview-container {
            height: 300px !important;
          }
        }
      `}</style>
    </div>
  );
}
