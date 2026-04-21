'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, CheckCircle2, Loader2, Files, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import { uploadAndIndexDocument } from '../services/documentService';
import { triggerServerSideOCR } from '../services/ocrService';
import { supabase } from '../lib/supabaseClient';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  initialMode?: 'single' | 'bulk';
}

type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

interface QueuedFile {
  id: string;
  file: File;
  ownerName: string;
  docType: string;
  status: FileStatus;
  progress: number; // 0–100
  error?: string;
}

const DEFAULT_TYPES = [
  'Birth Certificate', 'Marriage License', 'Military Record',
  'Legal Deed', 'Photo', 'Medical Record'
];

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  padding: '10px 12px',
  color: 'white',
  outline: 'none',
  width: '100%',
  fontSize: '0.875rem',
};

const UploadModal = ({ isOpen, onClose, groupId, initialMode = 'single' }: UploadModalProps) => {
  const [mode, setMode] = useState<'single' | 'bulk'>(initialMode);

  // Sync mode when initialMode changes (e.g. opened via Bulk button)
  useEffect(() => { setMode(initialMode); }, [initialMode]);

  // ── single upload state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('Birth Certificate');
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  // ── bulk upload state ─────────────────────────────────────────────────────
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [bulkOwner, setBulkOwner] = useState('');   // shared default
  const [bulkType, setBulkType] = useState('Birth Certificate'); // shared default
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  // ── shared data ───────────────────────────────────────────────────────────
  const [suggestedOwners, setSuggestedOwners] = useState<string[]>([]);
  const [existingTypes, setExistingTypes] = useState<string[]>(DEFAULT_TYPES);

  useEffect(() => {
    async function fetchMeta() {
      if (!isOpen) return;
      const { data: profiles } = await supabase.from('profiles').select('full_name, email').eq('family_group_id', '00000000-0000-0000-0000-000000000000');
      const memberNames = profiles?.map(p => p.full_name || p.email.split('@')[0]) || [];
      const { data: docs } = await supabase.from('documents').select('doc_type, owner_name');
      if (docs) {
        setExistingTypes(Array.from(new Set([...DEFAULT_TYPES, ...docs.map(d => d.doc_type).filter(Boolean)])));
        setSuggestedOwners(Array.from(new Set([...memberNames, ...docs.map(d => d.owner_name).filter(Boolean)])));
      } else {
        setSuggestedOwners(memberNames);
      }
    }
    fetchMeta();
  }, [isOpen]);

  // Reset on close
  const handleClose = () => {
    setFile(null); setLabel(''); setType('Birth Certificate');
    setIsUploading(false); setIsSuccess(false); setOcrProgress(0);
    setQueue([]); setBulkOwner(''); setBulkType('Birth Certificate');
    setIsBulkRunning(false); setBulkDone(false);
    onClose();
  };

  if (!isOpen) return null;

  // ── Single Upload ─────────────────────────────────────────────────────────
  const handleSingleUpload = async () => {
    if (!file || !label) return;
    setIsUploading(true); setOcrProgress(0);
    try {
      // Step 1: Store file + metadata (critical — fail loudly if this fails)
      const savedDoc = await uploadAndIndexDocument(file, { owner_name: label, doc_type: type, group_id: groupId }, 'Processing document...');
      setOcrProgress(50);

      // Step 2: OCR (non-critical — run silently, never fail the upload)
      try {
        await triggerServerSideOCR(savedDoc.file_path, savedDoc.document_id);
      } catch (ocrErr) {
        console.warn('[OCR] Background extraction failed (upload still succeeded):', ocrErr);
      }

      setOcrProgress(100);
      setIsSuccess(true);
      setTimeout(handleClose, 2000);
    } catch (error) {
      alert('Upload failed: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Bulk: add files to queue ──────────────────────────────────────────────
  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: QueuedFile[] = Array.from(files).map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      ownerName: bulkOwner,
      docType: bulkType,
      status: 'pending',
      progress: 0,
    }));
    setQueue(prev => [...prev, ...newItems]);
  };

  const removeFromQueue = (id: string) => {
    if (isBulkRunning) return;
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const updateQueueItem = (id: string, patch: Partial<QueuedFile>) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  // ── Bulk: run all uploads sequentially ───────────────────────────────────
  const handleBulkUpload = async () => {
    if (queue.length === 0 || isBulkRunning) return;
    setIsBulkRunning(true);
    for (const item of queue) {
      if (item.status === 'success') continue;
      updateQueueItem(item.id, { status: 'uploading', progress: 10 });
      try {
        const savedDoc = await uploadAndIndexDocument(item.file, {
          owner_name: item.ownerName || bulkOwner || 'Unknown',
          doc_type: item.docType || bulkType,
          group_id: groupId,
        }, 'Processing document...');
        updateQueueItem(item.id, { progress: 60 });

        // OCR is non-critical — silently skip if it fails
        try {
          await triggerServerSideOCR(savedDoc.file_path, savedDoc.document_id);
        } catch (ocrErr) {
          console.warn('[OCR] Bulk extraction failed for', item.file.name, ocrErr);
        }

        updateQueueItem(item.id, { status: 'success', progress: 100 });
      } catch (err: any) {
        updateQueueItem(item.id, { status: 'error', progress: 0, error: err.message });
      }
    }
    setIsBulkRunning(false);
    setBulkDone(true);
  };

  const successCount = queue.filter(q => q.status === 'success').length;
  const errorCount = queue.filter(q => q.status === 'error').length;
  const pendingCount = queue.filter(q => q.status === 'pending').length;

  // ── Drag and drop ─────────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (mode === 'bulk') addFilesToQueue(files);
    else if (files[0]) setFile(files[0]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      <div
        className="glass-card animate-fade-in"
        style={{ width: mode === 'bulk' ? '680px' : '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.75rem 2rem 1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {mode === 'single' ? 'Upload Document' : 'Bulk Upload'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {mode === 'single' ? 'Add one document to the vault' : `${queue.length} file${queue.length !== 1 ? 's' : ''} queued`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--glass-border)', padding: '3px' }}>
              {(['single', 'bulk'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    background: mode === m ? 'var(--primary)' : 'transparent',
                    color: mode === m ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {m === 'single' ? 'Single' : 'Bulk'}
                </button>
              ))}
            </div>
            <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem' }}>

          {/* ── SINGLE MODE ─────────────────────────────────────────────────── */}
          {mode === 'single' && (
            <>
              {isSuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
                  <h3>Upload Successful!</h3>
                  <p style={{ color: 'var(--text-muted)' }}>The document is being indexed for search.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div
                    style={{ border: '2px dashed var(--glass-border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                    onClick={() => document.getElementById('singleFileInput')?.click()}
                  >
                    <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.9rem' }}>{file ? file.name : 'Click or drag a file here'}</p>
                    {file && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{(file.size / 1024).toFixed(1)} KB</p>}
                    <input id="singleFileInput" type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Owner Name</label>
                    <input list="ownerSuggestions1" type="text" placeholder="e.g., Albert Smith" value={label} onChange={e => setLabel(e.target.value)} style={inputStyle} />
                    <datalist id="ownerSuggestions1">{suggestedOwners.map(n => <option key={n} value={n} />)}</datalist>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Document Type</label>
                    <input list="docTypes1" value={type} onChange={e => setType(e.target.value)} placeholder="Select or type..." style={inputStyle} />
                    <datalist id="docTypes1">{existingTypes.map(t => <option key={t} value={t} />)}</datalist>
                  </div>

                  {isUploading && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <span>{ocrProgress < 50 ? 'Uploading to vault...' : ocrProgress < 100 ? 'Analysing with OCR...' : 'Finalising...'}</span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${ocrProgress}%`, background: 'var(--accent-gradient)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    onClick={handleSingleUpload}
                    disabled={!file || !label || isUploading}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: (!file || !label) ? 0.5 : 1 }}
                  >
                    {isUploading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : 'Process & Secure'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── BULK MODE ───────────────────────────────────────────────────── */}
          {mode === 'bulk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Global defaults */}
              <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Default metadata — applied to all new files
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default Owner</label>
                    <input list="ownerSuggestions2" value={bulkOwner} onChange={e => setBulkOwner(e.target.value)} placeholder="e.g., Albert Smith" style={inputStyle} />
                    <datalist id="ownerSuggestions2">{suggestedOwners.map(n => <option key={n} value={n} />)}</datalist>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default Type</label>
                    <input list="docTypes2" value={bulkType} onChange={e => setBulkType(e.target.value)} placeholder="Document type..." style={inputStyle} />
                    <datalist id="docTypes2">{existingTypes.map(t => <option key={t} value={t} />)}</datalist>
                  </div>
                </div>
              </div>

              {/* Dropzone */}
              {!bulkDone && (
                <div
                  style={{ border: '2px dashed var(--glass-border)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                  onClick={() => document.getElementById('bulkFileInput')?.click()}
                >
                  <Files size={28} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Click or drag files here</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select multiple files at once — each gets its own row below</p>
                  <input id="bulkFileInput" type="file" multiple hidden onChange={e => e.target.files && addFilesToQueue(e.target.files)} />
                </div>
              )}

              {/* Queue */}
              {queue.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Summary bar when running/done */}
                  {(isBulkRunning || bulkDone) && (
                    <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                      <span style={{ color: '#10b981' }}>✓ {successCount} done</span>
                      {errorCount > 0 && <span style={{ color: '#ef4444' }}>✗ {errorCount} failed</span>}
                      {pendingCount > 0 && <span style={{ color: 'var(--text-muted)' }}>⏳ {pendingCount} pending</span>}
                    </div>
                  )}

                  {/* File rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {queue.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '0.875rem 1rem',
                          borderRadius: '10px',
                          border: `1px solid ${item.status === 'success' ? 'rgba(16,185,129,0.3)' : item.status === 'error' ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}`,
                          background: item.status === 'success' ? 'rgba(16,185,129,0.05)' : item.status === 'error' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Top row: filename + status icon */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            {item.status === 'success' && <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />}
                            {item.status === 'error' && <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />}
                            {item.status === 'uploading' && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                            {item.status === 'pending' && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />}
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.file.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                              {(item.file.size / 1024).toFixed(0)}KB
                            </span>
                          </div>
                          {!isBulkRunning && item.status !== 'success' && (
                            <button onClick={() => removeFromQueue(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', marginLeft: '8px' }}>
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Per-file metadata (editable only when pending) */}
                        {item.status !== 'success' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <input
                              list="ownerSuggestions2"
                              value={item.ownerName}
                              onChange={e => !isBulkRunning && updateQueueItem(item.id, { ownerName: e.target.value })}
                              placeholder="Owner name"
                              disabled={isBulkRunning}
                              style={{ ...inputStyle, fontSize: '0.78rem', padding: '7px 10px', opacity: isBulkRunning ? 0.6 : 1 }}
                            />
                            <input
                              list="docTypes2"
                              value={item.docType}
                              onChange={e => !isBulkRunning && updateQueueItem(item.id, { docType: e.target.value })}
                              placeholder="Doc type"
                              disabled={isBulkRunning}
                              style={{ ...inputStyle, fontSize: '0.78rem', padding: '7px 10px', opacity: isBulkRunning ? 0.6 : 1 }}
                            />
                          </div>
                        )}

                        {/* Progress bar */}
                        {(item.status === 'uploading' || item.status === 'success') && (
                          <div style={{ marginTop: '0.5rem', height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: `${item.progress}%`, background: item.status === 'success' ? '#10b981' : 'var(--accent-gradient)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                          </div>
                        )}

                        {/* Error message */}
                        {item.status === 'error' && item.error && (
                          <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.4rem' }}>{item.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk done success */}
              {bulkDone && errorCount === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ marginBottom: '0.25rem' }}>All {successCount} documents uploaded!</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>They are being indexed for search in the background.</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {!bulkDone && (
                  <>
                    {queue.length > 0 && !isBulkRunning && (
                      <button
                        onClick={() => setQueue([])}
                        style={{ padding: '11px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      className="btn-primary"
                      onClick={handleBulkUpload}
                      disabled={queue.length === 0 || isBulkRunning || queue.every(q => q.status === 'success')}
                      style={{ flex: 1, justifyContent: 'center', opacity: queue.length === 0 ? 0.5 : 1 }}
                    >
                      {isBulkRunning
                        ? <><Loader2 className="animate-spin" size={18} /> Uploading {queue.filter(q => q.status === 'uploading')[0]?.file.name ?? '...'}...</>
                        : <><Upload size={18} /> Upload {queue.length > 0 ? `${queue.filter(q => q.status !== 'success').length} File${queue.filter(q => q.status !== 'success').length !== 1 ? 's' : ''}` : 'Files'}</>
                      }
                    </button>
                  </>
                )}
                {bulkDone && (
                  <button className="btn-primary" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>
                    <CheckCircle2 size={18} /> Done
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
