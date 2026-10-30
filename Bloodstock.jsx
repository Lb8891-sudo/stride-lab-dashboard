import React, { useEffect, useMemo, useState } from 'react';

// Stride Lab Bloodstock — black and champagne, matching the sheet and the main app.
const C = { ink: '#0E0E0E', champ: '#C8A96A', champDark: '#8C7240', cream: '#F4EFE6', stone: '#8A8A86', sage: '#6FA58C', band: '#EFE4CB' };
const TABS = [['stallions', 'Stallions'], ['nicks', 'Nicks'], ['horses', 'Horses'], ['sales', 'Sales']];

async function api(url, opts) {
  const r = await fetch(url, { credentials: 'same-origin', ...opts });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Something went wrong'); e.status = r.status; throw e; }
  return j;
}

const btClass = bt => bt === 'Group 1' ? 'bg-[#0E0E0E] text-[#C8A96A]' : bt ? 'bg-[#EFE4CB] text-[#0E0E0E]' : '';

function Pill({ children, tone }) {
  const cls = tone === 'sage' ? 'bg-[#E3EFE8] text-[#3F7259]' : tone === 'champ' ? 'bg-[#EFE4CB] text-[#0E0E0E]' : 'bg-[#EEEDEA] text-[#55544F]';
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}
function groundTone(g) { return /soft/i.test(g) ? 'sage' : /good or faster/i.test(g) ? 'champ' : 'grey'; }

function Login({ onDone }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('/api/bs-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }); onDone(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <img src="/bs-logo.png" alt="The Stride Lab" className="w-64 mx-auto mb-3" />
        <p className="text-center text-[#C8A96A] tracking-[0.3em] text-xs mb-10">BLOODSTOCK</p>
        <label htmlFor="pw" className="block text-[#8A8A86] text-xs uppercase tracking-widest mb-2">Password</label>
        <input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus
          className="w-full rounded-md bg-[#1A1A1A] border border-[#2E2E2E] text-[#F4EFE6] px-4 py-3 focus:outline-none focus:border-[#C8A96A]" />
        {err && <p className="text-[#C8A96A] text-sm mt-3">{err}</p>}
        <button disabled={busy || !pw} className="mt-5 w-full rounded-md bg-[#C8A96A] text-[#0E0E0E] font-semibold py-3 disabled:opacity-50">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function Search({ value, onChange, placeholder, id }) {
  return <input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full rounded-md bg-white border border-[#E4DDD0] px-4 py-2.5 text-[#0E0E0E] focus:outline-none focus:border-[#C8A96A]" />;
}

function Table({ head, rows, onRow }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[#E4DDD0] bg-white">
      <table className="w-full text-sm">
        <thead><tr className="bg-[#0E0E0E] text-[#C8A96A] text-left">{head.map(h => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} onClick={onRow ? () => onRow(i) : undefined}
            className={`${i % 2 ? 'bg-[#EFE4CB]' : 'bg-[#F9F6F0]'} ${onRow ? 'cursor-pointer hover:bg-[#E6D7B4]' : ''}`}>
            {r.map((c, j) => <td key={j} className="px-3 py-2 align-top text-[#0E0E0E]">{c}</td>)}
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}

function CrossTables({ data, showSire }) {
  const [open, setOpen] = useState(null);
  if (!data) return <p className="text-[#6E6D69]">Loading…</p>;
  return (
    <div className="grid grid-cols-1 gap-6">
      <section>
        <h3 className="font-semibold mb-1">Our records</h3>
        <p className="text-xs text-[#6E6D69] mb-2">Every horse Nancy has logged in Britain, Ireland and France. Tap a cross to see the horses.</p>
        {data.ours.length ? <Table head={[...(showSire ? ['Sire'] : []), 'Damsire', 'Runners', 'Winners', 'Black-type', 'Best horse']}
          onRow={i => setOpen(open === i ? null : i)}
          rows={data.ours.map(c => [...(showSire ? [c.sire] : []), c.damsire, c.runners, c.winners, c.btWinners,
            c.best ? <span>{c.best.horse}{c.best.bt && <> <span className={`ml-1 rounded px-1.5 text-xs ${btClass(c.best.bt)}`}>{c.best.bt}</span></>}</span> : '—'])} />
          : <p className="text-sm text-[#6E6D69]">No horses from this cross in our records yet.</p>}
        {open !== null && data.ours[open] && (
          <div className="mt-3 rounded-md border border-[#C8A96A] bg-white p-3">
            <p className="font-semibold mb-2">{data.ours[open].sire} × {data.ours[open].damsire}</p>
            <ul className="text-sm grid gap-1">{data.ours[open].horses.map(h =>
              <li key={h.horse}><b>{h.horse}</b> · {h.runs} runs, {h.wins} wins{h.bt && ` · ${h.bt} winner`}{h.highOR && ` · best OR ${h.highOR}`}{h.trainer && ` · ${h.trainer}`}</li>)}</ul>
          </div>)}
      </section>
      <section>
        <h3 className="font-semibold mb-1">Stallion Guide (career)</h3>
        {data.guide.length ? <Table head={[...(showSire ? ['Sire'] : []), 'Damsire', "Damsire's sire", 'Runners', 'Winners', 'Black-type', 'Best horse']}
          rows={data.guide.map(c => [...(showSire ? [c.sire] : []), c.damsire, c.damsiresSire, c.runners, c.winners, c.btWinners, c.best || '—'])} />
          : <p className="text-sm text-[#6E6D69]">Not in the Stallion Guide copy.</p>}
      </section>
    </div>
  );
}

function Stallions({ list }) {
  const [q, setQ] = useState(''); const [pick, setPick] = useState(null); const [crosses, setCrosses] = useState(null);
  const shown = useMemo(() => (list || []).filter(s => s.name.toLowerCase().includes(q.toLowerCase())), [list, q]);
  useEffect(() => { if (!pick) return; setCrosses(null); api('/api/bs-data?view=nicks&sire=' + encodeURIComponent(pick.name)).then(setCrosses).catch(() => setCrosses({ ours: [], guide: [] })); }, [pick]);
  if (!list) return <p className="text-[#6E6D69]">Loading stallions…</p>;
  if (pick) {
    const latest = pick.years[0];
    return (
      <div className="grid grid-cols-1 gap-5">
        <button onClick={() => setPick(null)} className="text-left text-sm text-[#8C7240] font-semibold">← All stallions</button>
        <div>
          <h2 className="text-2xl font-semibold">{pick.name}</h2>
          <p className="text-[#55544F]">{[pick.born && `Foaled ${pick.born}`, pick.sireOfSire && `by ${pick.sireOfSire}`, pick.dam && `out of ${pick.dam}${pick.damsire ? ` (${pick.damsire})` : ''}`].filter(Boolean).join(' · ')}</p>
          {pick.ground && <div className="mt-2"><Pill tone={groundTone(pick.ground)}>Ground: {pick.ground}</Pill></div>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 rounded-md border border-[#E4DDD0] overflow-hidden bg-white">
          {[['Runners (all years)', pick.totals.runners], ['Winners', pick.totals.winners], ['Winners %', pick.totals.pct + '%'],
            ['Black-type horses', pick.totals.btH]].map(([k, v], i) => (
            <div key={k} className={`p-3 ${i < 2 ? 'bg-[#EFE4CB]' : ''} border-r border-[#E4DDD0] last:border-r-0`}>
              <div className="text-[10px] uppercase tracking-widest text-[#6E6D69] font-semibold">{k}</div>
              <div className="text-2xl font-semibold mt-1">{v}</div></div>))}
        </div>
        {latest && <p className="text-sm text-[#55544F]">{latest.year}: {latest.runners} runners, {latest.winners} winners ({latest.pct}%), {latest.btH} black-type horses.</p>}
        <section>
          <h3 className="font-semibold mb-2">Year by year</h3>
          <Table head={['Year', 'Runners', 'Winners', '%', 'Group winners', 'Black-type winners', 'BT horses %']}
            rows={pick.years.map(y => [y.year, y.runners, y.winners, y.pct, y.groupW, y.btW, y.btPct])} />
        </section>
        <section><h3 className="font-semibold text-lg mb-2">His crosses</h3><CrossTables data={crosses} /></section>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      <Search id="sq" value={q} onChange={setQ} placeholder={`Search ${list.length} stallions…`} />
      <Table head={['Stallion', 'By', 'Latest year', 'Ground']} onRow={i => setPick(shown[i])}
        rows={shown.map(s => [<b>{s.name}</b>, s.sireOfSire || '—',
          s.years[0] ? `${s.years[0].year}: ${s.years[0].winners}/${s.years[0].runners} (${s.years[0].pct}%)` : '—',
          s.ground ? <Pill tone={groundTone(s.ground)}>{s.ground.replace(/\s*\(.*\)/, '')}</Pill> : '—'])} />
    </div>
  );
}

function Nicks({ names }) {
  const [sire, setSire] = useState(''); const [dam, setDam] = useState(''); const [data, setData] = useState(null); const [err, setErr] = useState('');
  const go = e => {
    e.preventDefault(); if (!sire.trim() && !dam.trim()) return; setErr(''); setData(null);
    api(`/api/bs-data?view=nicks&sire=${encodeURIComponent(sire)}&damsire=${encodeURIComponent(dam)}`).then(setData).catch(x => setErr(x.message));
  };
  return (
    <div className="grid grid-cols-1 gap-4">
      <form onSubmit={go} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input list="sires" value={sire} onChange={e => setSire(e.target.value)} placeholder="Sire, e.g. Frankel" id="ns"
          className="rounded-md bg-white border border-[#E4DDD0] px-4 py-2.5 focus:outline-none focus:border-[#C8A96A]" />
        <input value={dam} onChange={e => setDam(e.target.value)} placeholder="Damsire, e.g. Galileo" id="nd"
          className="rounded-md bg-white border border-[#E4DDD0] px-4 py-2.5 focus:outline-none focus:border-[#C8A96A]" />
        <button className="rounded-md bg-[#0E0E0E] text-[#C8A96A] font-semibold px-5 py-2.5">Look up</button>
        <datalist id="sires">{(names || []).map(n => <option key={n} value={n} />)}</datalist>
      </form>
      <p className="text-xs text-[#6E6D69]">Fill in one or both. Sire only shows all his crosses; damsire only shows every stallion crossed with his daughters.</p>
      {err && <p className="text-[#8C7240]">{err}</p>}
      {data && <CrossTables data={data} showSire={!sire.trim()} />}
    </div>
  );
}

function Horses() {
  const [q, setQ] = useState(''); const [rows, setRows] = useState(null);
  useEffect(() => {
    if (q.trim().length < 2) { setRows(null); return; }
    const t = setTimeout(() => api('/api/bs-data?view=horses&q=' + encodeURIComponent(q)).then(setRows).catch(() => setRows([])), 350);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="grid grid-cols-1 gap-4">
      <Search id="hq" value={q} onChange={setQ} placeholder="Horse name, or a sire, dam or damsire" />
      {rows === null ? <p className="text-sm text-[#6E6D69]">Type at least two letters. Nancy's register holds every runner she has logged since September.</p>
        : rows.length ? <Table head={['Horse', 'Pedigree', 'Runs', 'Wins', 'Best win', 'Best OR', 'Trainer']}
          rows={rows.map(h => [<b>{h.horse}</b>, `${h.sire} × ${h.dam}${h.damsire ? ` (${h.damsire})` : ''}`, h.runs, h.wins,
            h.bt ? <span className={`rounded px-1.5 text-xs ${btClass(h.bt)}`}>{h.bt}</span> : '—', h.highOR || '—', h.trainer || '—'])} />
        : <p className="text-sm text-[#6E6D69]">No horses found.</p>}
    </div>
  );
}

function Sales() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api('/api/bs-data?view=shortlists').then(setRows).catch(() => setRows([])); }, []);
  if (!rows) return <p className="text-[#6E6D69]">Loading shortlists…</p>;
  if (!rows.length) return (
    <div className="rounded-md border border-dashed border-[#C8A96A] bg-white p-6">
      <p className="font-semibold">No shortlists yet</p>
      <p className="text-sm text-[#55544F] mt-1">Send Nancy a sale catalogue (PDF) and her picks for foals, mares and yearlings will appear here, grouped by sale, with her view on each lot.</p>
    </div>);
  const bySale = rows.reduce((m, r) => ((m[r['Sale'] || 'Other'] ||= []).push(r), m), {});
  return (
    <div className="grid grid-cols-1 gap-8">
      {Object.entries(bySale).map(([sale, lots]) => (
        <section key={sale}>
          <h3 className="text-lg font-semibold">{sale}</h3>
          <p className="text-xs text-[#6E6D69] mb-3">{lots[0]['Sale Date']} · {lots.length} lots on Nancy's list</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lots.map((l, i) => (
              <div key={i} className="rounded-md bg-white border border-[#E4DDD0] p-4">
                <div className="flex justify-between gap-2"><b>Lot {l['Lot']}{l['Name'] ? ` · ${l['Name']}` : ''}</b>{l['Priority'] && <Pill tone="champ">{l['Priority']}</Pill>}</div>
                <p className="text-sm text-[#55544F]">{[l['Type'], l['Sex']].filter(Boolean).join(', ')} · {l['Sire']} × {l['Dam']}{l['Damsire'] ? ` (${l['Damsire']})` : ''}</p>
                {l['Covering Sire'] && <p className="text-sm text-[#55544F]">Carrying to {l['Covering Sire']}</p>}
                {l["Nancy's View"] && <p className="text-sm mt-2">{l["Nancy's View"]}</p>}
                {l['Notes'] && <p className="text-xs text-[#6E6D69] mt-1">{l['Notes']}</p>}
              </div>))}
          </div>
        </section>))}
    </div>
  );
}

export default function Bloodstock() {
  const [auth, setAuth] = useState(null); const [tab, setTab] = useState('stallions'); const [list, setList] = useState(null); const [err, setErr] = useState('');
  const check = () => api('/api/bs-login').then(s => setAuth(s.signedIn)).catch(() => setAuth(false));
  useEffect(() => { check(); }, []);
  useEffect(() => { if (auth) api('/api/bs-data?view=stallions').then(setList).catch(x => { if (x.status === 401) setAuth(false); else setErr(x.message); }); }, [auth]);
  if (auth === null) return <div className="min-h-screen bg-[#0E0E0E]" />;
  if (!auth) return <Login onDone={() => setAuth(true)} />;
  const signOut = () => api('/api/bs-login', { method: 'DELETE' }).finally(() => setAuth(false));
  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#0E0E0E]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header className="bg-[#0E0E0E] border-b-4 border-[#C8A96A]">
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-3 flex items-center justify-between gap-4">
          <div><img src="/bs-logo.png" alt="The Stride Lab" className="h-10 w-auto" /><p className="text-[#C8A96A] tracking-[0.3em] text-[10px] mt-1 ml-1">BLOODSTOCK</p></div>
          <button onClick={signOut} className="text-xs text-[#8A8A86] hover:text-[#C8A96A]">Sign out</button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-md ${tab === k ? 'bg-[#F4EFE6] text-[#0E0E0E]' : 'text-[#F4EFE6] hover:text-[#C8A96A]'}`}>{label}</button>))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 min-w-0">
        {err && <p className="mb-4 text-[#8C7240]">{err}</p>}
        {tab === 'stallions' && <Stallions list={list} />}
        {tab === 'nicks' && <Nicks names={(list || []).map(s => s.name)} />}
        {tab === 'horses' && <Horses />}
        {tab === 'sales' && <Sales />}
      </main>
    </div>
  );
}
