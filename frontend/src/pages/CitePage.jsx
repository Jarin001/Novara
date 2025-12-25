import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const mockFallback = {
  id: 0,
  title: 'Example Paper Title',
  authors: ['First Author', 'Second Author'],
  venue: 'Journal Example',
  date: 2023,
  url: ''
};

const getCitationText = (item, format) => {
  if (!item) return '';
  const authors = (item.authors || []).join(' and ');
  const year = typeof item.date === 'number' ? item.date : (new Date(item.date).getFullYear() || 'n.d.');

  if (format === 'BibTeX') {
    const key = `${(item.authors && item.authors[0] || 'author').replace(/\s+/g,'')}${year}`;
    return `@inproceedings{${key},\n  title={${item.title}},\n  author={${authors}},\n  booktitle={${item.venue}},\n  year={${year}},\n}`;
  }

  if (format === 'MLA') {
    return `${(item.authors || []).join(', ')}. "${item.title}." ${item.venue}, ${year}.`;
  }

  if (format === 'APA') {
    return `${(item.authors || []).join(', ')} (${year}). ${item.title}. ${item.venue}.`;
  }

  if (format === 'Chicago') {
    return `${(item.authors || []).join(', ')}. "${item.title}." ${item.venue} (${year}).`;
  }

  return '';
};

const sanitizeFilename = (s = '') => {
  return s.replace(/[^a-z0-9\.\-\_]/gi, '-').slice(0, 120);
};

const downloadFile = (filename, content, mime = 'text/plain') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const downloadBibTeX = (item) => {
  const content = getCitationText(item, 'BibTeX');
  const name = sanitizeFilename((item && item.title) || 'citation') + '.bib';
  downloadFile(name, content, 'application/x-bibtex');
};

const downloadEndNote = (item) => {
  if (!item) return;
  const year = typeof item.date === 'number' ? item.date : (new Date(item.date).getFullYear() || '');
  const lines = [];
  lines.push('%0 Journal Article');
  lines.push('%T ' + item.title);
  (item.authors || []).forEach(a => lines.push('%A ' + a));
  if (item.venue) lines.push('%J ' + item.venue);
  if (year) lines.push('%D ' + year);
  if (item.url) lines.push('%U ' + item.url);
  const content = lines.join('\n');
  const name = sanitizeFilename((item && item.title) || 'citation') + '.enw';
  downloadFile(name, content, 'application/x-endnote-refer');
};

const CitePage = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const item = (loc.state && loc.state.item) || mockFallback;
  const [format, setFormat] = useState('BibTeX');
  const [copied, setCopied] = useState(false);

  const copyCitation = async () => {
    const txt = getCitationText(item, format);
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(()=>setCopied(false), 1600);
    } catch (e) {
      const el = document.getElementById('cite-textarea');
      if (el) {
        el.select();
        try { document.execCommand('copy'); setCopied(true); setTimeout(()=>setCopied(false),1600); } catch(_){}
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '580px', maxWidth: '90vw', background: '#fff', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>Cite Paper</h2>
          <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: '#1a73e8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Format tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 20 }}>
            {['BibTeX', 'MLA', 'APA', 'Chicago'].map(fmt => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: format === fmt ? '3px solid #1a73e8' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: format === fmt ? 600 : 500,
                  color: format === fmt ? '#1a73e8' : '#666'
                }}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Citation text box */}
          <div style={{ marginBottom: 20 }}>
            <textarea
              id="cite-textarea"
              readOnly
              value={getCitationText(item, format)}
              style={{
                width: '100%',
                height: 200,
                padding: 12,
                fontFamily: 'monospace',
                fontSize: 12,
                border: '1px solid #d0d0d0',
                borderRadius: 4,
                resize: 'none',
                background: '#fafafa'
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e0e0e0', marginBottom: 20 }} />

          {/* Copy and Export */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <button
                onClick={copyCitation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  color: '#1a73e8',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 16
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 1H4a2 2 0 00-2 2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="8" y="5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copy
              </button>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 8 }}>Export</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => downloadBibTeX(item)}
                    style={{
                      padding: '8px 16px',
                      background: '#1a73e8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    BibTeX
                  </button>
                  <button
                    onClick={() => downloadEndNote(item)}
                    style={{
                      padding: '8px 16px',
                      background: '#fff',
                      color: '#1a73e8',
                      border: '1px solid #1a73e8',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    EndNote
                  </button>
                </div>
              </div>
            </div>

            {copied && <span style={{ color: '#0b8043', fontWeight: 600, fontSize: 13 }}>Copied!</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitePage;
