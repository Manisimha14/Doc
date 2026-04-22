'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
  Search as SearchIcon, 
  FileText, 
  Calendar, 
  Tag, 
  ExternalLink,
  ChevronRight,
  Filter,
  Download,
  X,
  Folder,
  Loader2,
  Files,
  Trash2,
  Sparkles
} from 'lucide-react';
import { searchDocuments } from '../../services/searchService';
import { getDocumentPublicUrl, deleteDocument } from '../../services/documentService';
import { supabase } from '../../lib/supabaseClient';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeOwners, setActiveOwners] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Searching specifically in our global demo group
      const data = await searchDocuments(searchTerm, '00000000-0000-0000-0000-000000000000');
      setResults(data);
      
      // Bulk Sign URLs for Search Results
      if (data && data.length > 0) {
        const paths = data.map(d => d.file_path);
        const { data: signedData, error: signError } = await supabase.storage
          .from('family_vault')
          .createSignedUrls(paths, 300); // 5 mins
        
        if (!signError && signedData) {
          const urlMap: Record<string, string> = {};
          signedData.forEach((item: { signedUrl: string | null; path: string | null }) => {
            if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl;
          });
          setSignedUrls(urlMap);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (query) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        handleSearch(query);
      }, 300);
    }
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query]);


  const allTypes = useMemo(() => Array.from(new Set(results.map(r => r.doc_type).filter(Boolean))), [results]);
  const allOwners = useMemo(() => Array.from(new Set(results.map(r => r.owner_name).filter(Boolean))), [results]);

  const groupedResults = useMemo(() => {
    const filtered = results.filter(r => {
      const typeOk = activeTypes.length === 0 || activeTypes.includes(r.doc_type);
      const ownerOk = activeOwners.length === 0 || activeOwners.includes(r.owner_name);
      return typeOk && ownerOk;
    });
    const groups: Record<string, any[]> = {};
    filtered.forEach(res => {
      const owner = res.owner_name?.trim() || 'Unknown';
      const key = owner.charAt(0).toUpperCase() + owner.slice(1).toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(res);
    });
    return groups;
  }, [results, activeTypes, activeOwners]);

  const filteredCount = useMemo(() => Object.values(groupedResults).flat().length, [groupedResults]);
  const toggleType = (t: string) => setActiveTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleOwner = (o: string) => setActiveOwners(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedResult(null);
  };

  const handleViewOriginal = () => {
    if (selectedResult) {
      window.open(getDocumentPublicUrl(selectedResult.file_path), '_blank');
    }
  };

  const handleDownload = async () => {
    if (selectedResult) {
      const url = getDocumentPublicUrl(selectedResult.file_path);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = selectedResult.file_path.split('/').pop() || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  const handleShareWhatsApp = () => {
    if (selectedResult) {
      const url = getDocumentPublicUrl(selectedResult.file_path);
      const text = `🏛️ *Family Archive Vault: Secure Record Shared*\n\nA document has been shared with you from our private family vault.\n\n🔗 *Access Link:* ${url}\n\n_(Note: This link is provided for your secure viewing.)_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!selectedResult) return;
    const confirm = window.confirm(`Permanently delete this record? This action cannot be undone.`);
    if (!confirm) return;

    try {
      await deleteDocument(selectedResult.document_id, selectedResult.file_path);
      setResults(prev => prev.filter(r => r.document_id !== selectedResult.document_id));
      setSelectedResult(null);
      alert('Record deleted successfully.');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Universal Search</h1>
        <div style={{ position: 'relative', maxWidth: '800px' }}>
          <SearchIcon 
            size={24} 
            style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
          />
          <input 
            type="text" 
            placeholder="Search across all family history..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '20px 60px 20px 60px',
              color: 'white',
              fontSize: '1.25rem',
              outline: 'none',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
            }}
          />
          {query && (
            <button 
              onClick={clearSearch}
              style={{ 
                position: 'absolute', 
                right: '20px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer' 
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 380px', gap: '2rem', minHeight: '60vh' }}>
        {/* Filters Panel */}
        <aside className="glass-card" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Filter size={18} />
            <h3 style={{ fontSize: '1.1rem' }}>Filters</h3>
            {(activeTypes.length > 0 || activeOwners.length > 0) && (
              <button onClick={() => { setActiveTypes([]); setActiveOwners([]); }} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}>Clear all</button>
            )}
          </div>
          {allTypes.length > 0 ? (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document Type</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {allTypes.map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={activeTypes.includes(t)} onChange={() => toggleType(t)} style={{ accentColor: 'var(--primary)' }} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {allOwners.map(o => (
                    <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={activeOwners.includes(o)} onChange={() => toggleOwner(o)} style={{ accentColor: 'var(--primary)' }} />
                      {o}
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Filters appear after a search.</p>
          )}
        </aside>

        {/* Results List */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
              {isSearching ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Searching the vault...</span>
                </div>
              ) : query ? (
                <span>
                  <strong style={{ color: 'white' }}>{filteredCount}</strong> of {results.length} results for{' '}
                  <em style={{ color: 'var(--primary)' }}>"{query}"</em>
                  {(activeTypes.length > 0 || activeOwners.length > 0) && (
                    <span style={{ fontSize: '0.75rem', marginLeft: '10px', padding: '2px 8px', background: 'rgba(99,102,241,0.15)', borderRadius: '20px', color: 'var(--primary)' }}>filtered</span>
                  )}
                </span>
              ) : 'Enter a search term to begin'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {isSearching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card animate-pulse" style={{ height: '150px', marginBottom: '1rem' }} />
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {Object.entries(groupedResults).map(([owner, docs]) => (
                  <div key={owner}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '1.25rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--glass-border)'
                    }}>
                      <Folder size={18} style={{ color: 'var(--primary)' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{owner}'s Records</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {docs.map((res) => (
                        <div 
                          key={res.document_id}
                          className="glass-card animate-fade-in"
                          onClick={() => setSelectedResult(res)}
                          style={{ 
                            padding: '1.25rem', 
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '1rem',
                            border: selectedResult?.document_id === res.document_id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease',
                            background: selectedResult?.document_id === res.document_id ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                          }}
                        >
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '10px', 
                            background: 'rgba(255,255,255,0.05)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            position: 'relative',
                            flexShrink: 0
                          }}>
                            {['jpg', 'jpeg', 'png', 'webp'].some(ext => res.file_path.toLowerCase().endsWith(ext)) ? (
                              <Image 
                                src={signedUrls[res.file_path] || getDocumentPublicUrl(res.file_path)} 
                                alt={res.doc_type}
                                fill
                                sizes="48px"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <Files size={24} style={{ opacity: 0.2 }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{res.doc_type}</h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(res.upload_date).toLocaleDateString()}</span>
                            </div>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: 'rgba(255, 255, 255, 0.7)', 
                              lineHeight: '1.6',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              marginBottom: '1rem',
                              fontStyle: 'italic'
                            }}>
                              "...{res.raw_content_vector?.substring(0, 200)}..."
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <ResultMeta icon={Calendar} text={new Date(res.upload_date).toLocaleDateString()} />
                              <ResultMeta icon={Tag} text={res.doc_type} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && !isSearching && query && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <SearchIcon size={48} style={{ opacity: 0.1, marginBottom: '1rem', margin: '0 auto' }} />
                <p>No documents found matching your search.</p>
              </div>
            )}
          </div>
        </section>

        {/* Preview Panel */}
        <aside>
          {selectedResult ? (
            <div className="glass-card animate-fade-in" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Document Analysis</h3>
              <div style={{ 
                height: '300px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '12px', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  overflow: 'hidden'
                }}>
                  {selectedResult.file_path.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={(signedUrls[selectedResult.file_path] || getDocumentPublicUrl(selectedResult.file_path)) + '#toolbar=0'} 
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  ) : (
                    <img 
                      src={signedUrls[selectedResult.file_path] || getDocumentPublicUrl(selectedResult.file_path)} 
                      alt={selectedResult.doc_type}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}
                </div>
              </div>
              
              <SearchAiPanel result={selectedResult} query={query} />


               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn-primary" 
                    onClick={handleViewOriginal}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    View Full
                    <ChevronRight size={18} />
                  </button>
                  <button 
                    onClick={handleDownload}
                    style={{ 
                      padding: '12px', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: 'white', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Download Document"
                  >
                    <Download size={20} />
                  </button>
                </div>

                <button 
                  onClick={handleShareWhatsApp}
                  style={{ 
                    width: '100%', 
                    background: '#25D366', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    padding: '12px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.001.332.005c.109.004.258-.041.404.311.145.352.497 1.214.54 1.301.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
                  </svg>
                  Share to WhatsApp
                </button>

                <button 
                  onClick={handleDelete}
                  style={{ 
                    marginTop: '1rem',
                    width: '100%', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    borderRadius: '12px', 
                    padding: '12px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  <Trash2 size={16} />
                  Delete Record
                </button>
               </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Select a result to view full extracted content and metadata.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FilterSection({ title, items }: { title: string, items: string[] }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map(item => (
          <label key={item} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function ResultMeta({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
      <Icon size={14} />
      <span>{text}</span>
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: 'rgba(99,102,241,0.4)', color: 'white', borderRadius: '3px', padding: '0 2px' }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function SearchAiPanel({ result, query }: { result: any; query: string }) {
  const rawText: string = result.raw_content_vector || '';
  const isPlaceholder = rawText.startsWith('[SERVER-SIDE OCR RESULT]') || rawText.startsWith('[No readable text');
  const text = isPlaceholder ? '' : rawText;
  const wordCount = text.trim() ? text.split(/\s+/).length : 0;
  const hasContent = wordCount > 10;
  const dates = (text.match(/\b(\d{4})\b/g) || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
  const names = (text.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g) || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

  return (
    <div style={{ borderRadius: '12px', border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.03)', overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Analysis</span>
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{wordCount} words</span>
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {[
            { l: 'Owner', v: result.owner_name || '—' },
            { l: 'Type', v: result.doc_type },
            { l: 'Uploaded', v: new Date(result.upload_date).toLocaleDateString() },
            { l: 'Doc ID', v: (result.document_id || '').substring(0, 10) + '…' },
          ].map(({ l, v }) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>{l}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
            </div>
          ))}
        </div>
        {hasContent && (
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Content Preview</div>
            <div style={{ fontSize: '0.8rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', maxHeight: '90px', overflow: 'hidden' }}>
              <HighlightedText text={text.substring(0, 250).trim() + '…'} query={query} />
            </div>
          </div>
        )}
        {dates.length > 0 && (
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>📅 Dates Found</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {dates.map(d => <span key={d} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{d}</span>)}
            </div>
          </div>
        )}
        {names.length > 0 && (
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>👤 People Mentioned</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {names.map(n => <span key={n} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>{n}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={32} /></div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
