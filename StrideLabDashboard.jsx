import React, { useState, useEffect, useMemo } from 'react';
import ReportViewer from './ReportViewer.jsx';
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Minus, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

const LOGO_SRC = "/logo-wide.png"; // new logo, 20 Nov 2026 (old embedded image removed)

const STATUS_STYLE = {
  'Improving': { dot: 'bg-[#6FA58C]', text: 'text-[#6FA58C]', bg: 'bg-[#EAF3EE]' },
  'Untapped': { dot: 'bg-[#C8A96A]', text: 'text-[#A88B4E]', bg: 'bg-[#F6EFE0]' },
  'Exposed': { dot: 'bg-[#8A8A86]', text: 'text-[#8A8A86]', bg: 'bg-[#F4EFE6]' },
  'Plateauing': { dot: 'bg-[#8A8A86]', text: 'text-[#0E0E0E]', bg: 'bg-[#EEEAE2]' },
  'Regression Risk': { dot: 'bg-[#8A8A86]', text: 'text-[#555555]', bg: 'bg-[#F4EFE6]' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || { dot: 'bg-stone-400', text: 'text-[#0E0E0E]', bg: 'bg-[#F4EFE6]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function RankBadge({ rank }) {
  if (rank == null) return <div className="w-9 h-9 flex items-center justify-center text-[#8A8A86] text-xs">—</div>;
  const isElite = rank <= 20;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 flex-shrink-0
      ${isElite ? 'bg-[#C8A96A] border-[#C8A96A] text-[#0E0E0E]' : 'bg-[#F4EFE6] border-[#E4DDD0] text-[#333333]'}`}>
      {rank}
    </div>
  );
}

function ValueIndicator({ value }) {
  if (value == null) return <span className="text-[#8A8A86] text-sm">—</span>;
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 1;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral ? 'text-[#8A8A86]' : isPositive ? 'text-[#6FA58C]' : 'text-[#8A8A86]';
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm ${color}`}>
      <Icon size={13} />
      {value > 0 ? '+' : ''}{value}
    </span>
  );
}

export default function StrideLabDashboard() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('Horse');
  const [sortDir, setSortDir] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [reportHorse, setReportHorse] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setHorses(data.filter(h => h.Runs && h.Runs > 0));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const ages = ['All', '2yo', '3yo', '4yo+'];
  const [trainer, setTrainer] = useState('All');
  const trainers = useMemo(() => ['All', ...Array.from(new Set(horses.map(h => h.Trainer).filter(Boolean))).sort()], [horses]);
  const ageOk = (h, a) => a === 'All' || (a === '4yo+' ? h.Age >= 4 : h.Age === parseInt(a, 10));

  const filtered = useMemo(() => {
    let rows = horses.filter(h => (h.Horse || '').toLowerCase().includes(search.toLowerCase()));
    rows = rows.filter(h => ageOk(h, statusFilter));
    if (trainer !== 'All') rows = rows.filter(h => h.Trainer === trainer);
    rows = [...rows].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av == null) av = sortDir === 'asc' ? Infinity : -Infinity;
      if (bv == null) bv = sortDir === 'asc' ? Infinity : -Infinity;
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [horses, search, sortKey, sortDir, statusFilter, trainer]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortHeader = ({ label, sortField }) => (
    <th
      onClick={() => toggleSort(sortField)}
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8A8A86] cursor-pointer select-none hover:text-[#0E0E0E] transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={11} className={sortKey === sortField ? 'text-[#A88B4E]' : 'text-[#8A8A86]'} />
      </span>
    </th>
  );

  const topRated = [...horses].filter(h => h.Rank).sort((a,b) => a.Rank - b.Rank)[0];

  return (
    <div className="min-h-screen bg-[#F4EFE6]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="bg-[#0E0E0E] text-[#F4EFE6] border-b-4 border-[#C8A96A]">
        <div className="max-w-6xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <img src={LOGO_SRC} alt="The Stride Lab" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#F4EFE6] text-[#F4EFE6] text-xs hover:bg-[#122436] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="flex gap-6 text-sm">
                <div className="text-right">
                  <div className="text-[#F4EFE6] text-[10px] uppercase tracking-wide">Top Rated</div>
                  <div className="text-[#F4EFE6] font-bold">{topRated?.Horse || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 pb-3 flex items-center justify-between">
          <p className="text-[#F4EFE6] text-xs">Dashboard &mdash; {horses.length} horses tracked</p>
          {lastUpdated && (
            <p className="text-[#F4EFE6] text-xs">Last updated {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto px-5 pt-4">
          <div className="flex items-start gap-2 bg-[#F4EFE6] border border-[#E4DDD0] text-[#8A8A86] text-sm rounded-lg px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Could not load live data</p>
              <p className="text-[#8A8A86] text-xs mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-5 pt-5 pb-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A86]" />
            <input
              type="text"
              placeholder="Search horses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded border border-[#E4DDD0] bg-white text-[#0E0E0E] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96A] focus:border-transparent"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ages.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${statusFilter === s
                    ? 'bg-[#0E0E0E] text-[#F4EFE6] border-[#C8A96A]'
                    : 'bg-white text-[#333333] border-[#E4DDD0] hover:border-[#C8A96A]'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={trainer}
            onChange={e => setTrainer(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#E4DDD0] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
          >
            {trainers.map(t => <option key={t} value={t}>{t === 'All' ? 'All trainers' : t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-5 pb-10">
        <div className="bg-white rounded-lg border border-[#E4DDD0] overflow-hidden shadow-sm">
          {loading && horses.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-[#8A8A86]">
              <RefreshCw size={20} className="animate-spin mx-auto mb-3 text-[#A88B4E]" />
              Loading live data from your Stride Lab sheet...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F4EFE6] border-b-2 border-[#E4DDD0]">
                  <tr>
                    <SortHeader label="Rank" sortField="Rank" />
                    <SortHeader label="Horse" sortField="Horse" />
                    <SortHeader label="Runs" sortField="Runs" />
                    <SortHeader label="Current OR" sortField="Current OR" />
                    <SortHeader label="Stride Lab Rating" sortField="Stride Lab Rating" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8A8A86]">Ceiling</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8A8A86]">Status</th>
                    <SortHeader label="Value" sortField="Value Index" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8A8A86]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE6DA]">
                  {filtered.map((h) => (
                    <React.Fragment key={h.Horse}>
                      <tr
                        onClick={() => setSelected(selected === h.Horse ? null : h.Horse)}
                        className={`cursor-pointer transition-colors odd:bg-[#F9F6F0] even:bg-[#EFE4CB] hover:bg-[#E6D7B4] ${selected === h.Horse ? '!bg-[#E6D7B4]' : ''}`}
                      >
                        <td className="px-4 py-2.5"><RankBadge rank={h.Rank} /></td>
                        <td className="px-4 py-2.5 font-semibold text-[#0E0E0E]">{h.Horse}</td>
                        <td className="px-4 py-2.5 text-sm text-[#8A8A86] font-mono">{h.Runs}</td>
                        <td className="px-4 py-2.5 text-sm font-mono text-[#0E0E0E]">
                          {h['Current OR'] ?? <span className="text-[#8A8A86]">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-[#0E0E0E] font-mono">
                          {h['Stride Lab Rating'] ?? <span className="text-[#8A8A86]">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-[#8A8A86] font-mono">{h['Projected Ceiling']}</td>
                        <td className="px-4 py-2.5"><StatusPill status={h['Development Status']} /></td>
                        <td className="px-4 py-2.5"><ValueIndicator value={h['Value Index']} /></td>
                        <td className="px-4 py-2.5">
                          <ChevronRight size={16} className={`text-[#8A8A86] transition-transform ${selected === h.Horse ? 'rotate-90' : ''}`} />
                        </td>
                      </tr>
                      {selected === h.Horse && (
                        <tr className="bg-[#FAF7F1]">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
                              <div>
                                <div className="text-xs uppercase tracking-wide text-[#8A8A86]">Current Ability</div>
                                <div className="font-mono text-sm text-[#0E0E0E] mt-0.5">{h['Current Ability']}</div>
                              </div>
                              <div>
                                <div className="text-xs uppercase tracking-wide text-[#8A8A86]">Confidence</div>
                                <div className="font-mono text-sm text-[#0E0E0E] mt-0.5">{h['Confidence']}</div>
                              </div>
                              <div>
                                <div className="text-xs uppercase tracking-wide text-[#8A8A86]">Suggested Trip</div>
                                <div className="font-mono text-sm text-[#0E0E0E] mt-0.5">{h['Suggested Trip']}</div>
                              </div>
                              <div>
                                <div className="text-xs uppercase tracking-wide text-[#8A8A86]">Suggested Ground</div>
                                <div className="font-mono text-sm text-[#0E0E0E] mt-0.5">{h['Suggested Ground']}</div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setReportHorse(h.Horse); }}
                              className="mt-4 rounded-md bg-[#0E0E0E] px-4 py-2 text-sm font-semibold text-[#F4EFE6] hover:bg-[#1B2A3A]"
                            >
                              Open full report
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && !loading && (
                <div className="px-4 py-10 text-center text-sm text-[#8A8A86]">
                  No horses match &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {reportHorse && <ReportViewer horse={reportHorse} onClose={() => setReportHorse(null)} />}
    </div>
  );
}
