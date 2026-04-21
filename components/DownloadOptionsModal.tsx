import React from 'react';
import { Download, X } from 'lucide-react';

export function DownloadOptionsModal({ doc, url, onClose, toast }: { doc: any, url: string, onClose: () => void, toast: (m: string, ok?: boolean) => void }) {
  const [scale, setScale] = React.useState(100);
  const [format, setFormat] = React.useState('image/jpeg');
  const [loading, setLoading] = React.useState(false);

  const processAndDownload = () => {
    setLoading(true);
    const img = new window.Image();
    img.crossOrigin = 'anonymous'; // Important for canvas taint
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * (scale / 100));
      canvas.height = Math.round(img.height * (scale / 100));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast('Processing failed (no canvas)', false);
        setLoading(false);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
      try {
        const outUrl = canvas.toDataURL(format, 0.9);
        const a = document.createElement('a');
        a.href = outUrl;
        
        // Remove old extension, add new
        const baseName = doc.file_path.split('/').pop()?.split('.')[0] || 'image';
        a.download = `${baseName}_${scale}pct.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast('Download successful!');
        onClose();
      } catch (err) {
        // Tainted canvas (CORS issue) -> fallback to direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_path.split('/').pop() || 'image';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('Direct download used (CORS restricted resizing)');
        onClose();
      }
      setLoading(false);
    };
    img.onerror = () => {
      // Fallback
      toast('Resizing unavailable for this file, downloading original...', false);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_path.split('/').pop() || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setLoading(false);
      onClose();
    };
    img.src = url;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ padding: '2rem', maxWidth: '400px', width: '90%', borderRadius: '20px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Download size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Download Options</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Resize and convert image</p>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Format</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'image/jpeg', label: 'JPG' },
              { id: 'image/png', label: 'PNG' },
              { id: 'image/webp', label: 'WEBP' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                style={{ flex: 1, padding: '10px', background: format === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: format === f.id ? 'white' : 'var(--text-muted)', border: `1px solid ${format === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Image Size</label>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{scale}%</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="100" 
            step="10" 
            value={scale} 
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Small</span>
            <span>Original</span>
          </div>
        </div>

        <button 
          onClick={processAndDownload}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Processing...' : 'Save Image'}
        </button>
      </div>
    </div>
  );
}
