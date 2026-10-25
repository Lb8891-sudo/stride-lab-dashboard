import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { buildReportHtml } from './reportHtml.js';

// Full-screen view of one horse's live report, in Jane's master layout.
export default function ReportViewer({ horse, onClose }) {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const frame = useRef(null);
  const [frameH, setFrameH] = useState(800);

  // The report tells us its height, so the page (not the frame) scrolls: smooth on phones, no sticking.
  useEffect(() => {
    const onMsg = (e) => { const h = e.data && e.data.strideReportHeight; if (h && e.source === (frame.current && frame.current.contentWindow)) setFrameH(h); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    let live = true;
    setHtml(null); setError(null);
    fetch('/api/report?horse=' + encodeURIComponent(horse))
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Could not load the report');
        return body;
      })
      .then((d) => { if (live) setHtml(buildReportHtml(d, window.location.origin + '/report-logo.png')); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [horse]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = () => {
    const w = frame.current && frame.current.contentWindow;
    if (w) { w.focus(); w.print(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#E9E7E0]">
      <div className="flex items-center justify-between gap-3 bg-[#08131F] px-4 py-3 text-white">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-medium text-[#DCE3EA] hover:text-white">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="truncate text-sm font-semibold">{horse}</div>
        <button onClick={download} disabled={!html}
          className="flex items-center gap-1.5 rounded-md bg-[#1BBFA8] px-3 py-1.5 text-sm font-semibold text-[#08131F] disabled:opacity-40">
          <Download size={16} /> PDF
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {error ? (
          <div className="px-6 py-16 text-center text-sm text-[#6B6560]">{error}</div>
        ) : !html ? (
          <div className="px-6 py-16 text-center text-sm text-[#9A9488]">
            <RefreshCw size={20} className="mx-auto mb-3 animate-spin text-[#1BBFA8]" />
            Loading {horse}'s report...
          </div>
        ) : (
          <iframe ref={frame} title={horse + ' report'} srcDoc={html} scrolling="no" style={{ height: frameH }} className="block w-full border-0" />
        )}
      </div>
    </div>
  );
}
