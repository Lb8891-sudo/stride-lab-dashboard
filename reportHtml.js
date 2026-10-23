// Jane's master horse-report layout (same as the PDF reports): builds the full HTML page for one horse.
// Kept identical to jane_template.html. Only the horse's content changes.
const CSS = "\n/* Jane's fixed horse-report layout. A4, two pages. Same sections, same order, every horse. */\n@page { size: A4; margin: 0; }\n:root{\n  --navy:#0B131E; --teal:#5AC5AE; --teal-d:#2E8F7B; --gold:#E9BF51;\n  --paper:#FFFFFF; --tint:#F4F3EF; --ink:#0B131E; --muted:#67655D; --line:#E3E1D8; --track:#E7E5DD;\n}\n*{box-sizing:border-box}\nhtml,body{margin:0;padding:0;background:#fff}\nbody{font-family:\"Inter\",system-ui,sans-serif;color:var(--ink);font-size:9.6pt;line-height:1.45;\n  -webkit-print-color-adjust:exact;print-color-adjust:exact;font-feature-settings:\"tnum\" 1,\"cv11\" 1}\n.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:var(--paper)}\n.page:last-child{page-break-after:auto}\n.body{padding:0 15mm}\n\n/* Header */\n.hdr{background:var(--navy);color:#fff;padding:9mm 15mm 7mm;border-bottom:1.6mm solid var(--teal)}\n.hdr .top{display:flex;justify-content:space-between;align-items:flex-start}\n.hdr img{height:13mm;width:auto;display:block;margin-left:-2mm}\n.hdr .doc{text-align:right;font-size:7.6pt;color:#9FB0BF;letter-spacing:.06em;text-transform:uppercase;line-height:1.6}\n.hdr .doc b{color:var(--teal);font-weight:600}\n.hdr h1{font-family:\"Inter Display\",\"Inter\",sans-serif;font-weight:800;font-size:30pt;letter-spacing:-.02em;margin:6mm 0 1mm;line-height:1}\n.hdr .ped{font-size:11pt;color:#DCE3EA}\n.hdr .ped em{font-style:normal;color:#9FB0BF}\n.hdr .meta{display:flex;gap:9mm;margin-top:4mm;font-size:8.2pt;color:#9FB0BF}\n.hdr .meta span b{display:block;color:#fff;font-weight:600;font-size:9.4pt}\n\n/* Verdict tiles */\n.tiles{display:grid;grid-template-columns:1.25fr 1.25fr 1fr 1fr 1fr;gap:0;margin:6mm 0 0;border:1px solid var(--line);border-radius:2.5mm;overflow:hidden}\n.tile{padding:3.4mm 3.6mm;border-right:1px solid var(--line);background:#fff}\n.tile:last-child{border-right:0}\n.tile.key{background:var(--tint)}\n.tile .k{font-size:6.8pt;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.tile .v{font-family:\"Inter Display\",\"Inter\",sans-serif;font-weight:800;font-size:19pt;line-height:1.05;margin-top:1.2mm}\n.tile.key .v{color:var(--teal-d)}\n.tile .s{font-size:7.6pt;color:var(--muted);margin-top:.6mm}\n.tile .v.sm{font-size:12.5pt;padding-top:1.6mm}\n\nh2{font-family:\"Inter Display\",\"Inter\",sans-serif;font-weight:700;font-size:12.5pt;margin:7mm 0 2.2mm;display:flex;align-items:center;gap:2.5mm}\nh2::before{content:\"\";width:1.2mm;height:4.2mm;background:var(--teal);border-radius:.6mm;display:inline-block}\np{margin:0 0 2.2mm}\n.verdict{font-size:10.6pt;line-height:1.5}\n\n/* Profile scales */\n.scales{display:grid;grid-template-columns:1fr 1fr;gap:4.5mm 9mm}\n.scale .lab{display:flex;justify-content:space-between;font-size:8pt;margin-bottom:1.4mm}\n.scale .lab b{font-weight:600}\n.scale .lab span{color:var(--teal-d);font-weight:600}\n.bar{display:grid;gap:1mm}\n.bar .cells{display:grid;gap:.8mm}\n.bar .cell{height:3.4mm;background:var(--track);border-radius:.7mm}\n.bar .cell.on{background:var(--teal)}\n.bar .cell.maybe{background:repeating-linear-gradient(135deg,var(--teal) 0 1.1mm,#BFE8DE 1.1mm 2.2mm)}\n.bar .ticks{display:grid;gap:.8mm;font-size:6.8pt;color:var(--muted);text-align:center}\n.slider{position:relative;height:3.4mm;background:linear-gradient(90deg,var(--track),var(--track));border-radius:.7mm}\n.slider .dot{position:absolute;top:-1mm;width:5.4mm;height:5.4mm;border-radius:50%;background:var(--teal);border:1.1mm solid #fff;box-shadow:0 0 0 .3mm var(--teal-d);transform:translateX(-50%)}\n.slider-ends{display:flex;justify-content:space-between;font-size:6.8pt;color:var(--muted);margin-top:1mm}\n.pips{display:flex;gap:1.2mm}\n.pip{flex:1;height:3.4mm;border-radius:.7mm;background:var(--track)}\n.pip.on{background:var(--teal)}\n.chips{display:flex;flex-wrap:wrap;gap:1.6mm;margin-top:4.5mm}\n.chip{font-size:7.8pt;font-weight:600;padding:1.1mm 2.6mm;border-radius:5mm;background:var(--tint);border:1px solid var(--line)}\n.chip.plus{background:#E3F4EF;border-color:#BFE3D8;color:#1F6B5B}\n.chip.minus{background:#FBEFE9;border-color:#EFD3C6;color:#8E3F27}\n\n/* Tables */\ntable{width:100%;border-collapse:collapse;font-size:8.4pt}\nth{text-align:left;font-size:6.8pt;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;padding:0 2mm 1.6mm 0;border-bottom:1.2px solid var(--ink)}\ntd{padding:2mm 2mm 2mm 0;border-bottom:1px solid var(--line);vertical-align:top}\ntd.pos{font-weight:700;white-space:nowrap}\ntd.note{color:#3A3934}\n.num{white-space:nowrap}\n\n.runnotes{margin-top:3.5mm;display:grid;gap:2.4mm}\n.runnote{display:grid;grid-template-columns:24mm 1fr;gap:3mm;font-size:9pt}\n.runnote b{font-weight:700}\n\n.two{display:grid;grid-template-columns:1fr 1fr;gap:9mm}\n.kv{display:grid;grid-template-columns:24mm 1fr;row-gap:1.6mm;font-size:8.8pt}\n.kv dt{color:var(--muted)}\n.kv dd{margin:0;font-weight:500}\n\n.plan{display:grid;gap:0;border-left:.6mm solid var(--line);margin-left:1.6mm}\n.step{position:relative;padding:0 0 3.6mm 5.5mm}\n.step::before{content:\"\";position:absolute;left:-1.85mm;top:.9mm;width:3.1mm;height:3.1mm;border-radius:50%;background:#fff;border:.6mm solid var(--teal)}\n.step.now::before{background:var(--teal)}\n.step .when{font-size:6.8pt;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.step .what{font-weight:600;font-size:9.2pt}\n.watch{margin:0;padding:0;list-style:none;display:grid;gap:2mm}\n.watch li{display:grid;grid-template-columns:4mm 1fr;gap:1.6mm;font-size:9pt}\n.watch li::before{content:\"\";width:3mm;height:3mm;border:.4mm solid var(--ink);border-radius:.6mm;margin-top:.6mm}\n\n.callout{background:var(--tint);border-radius:2.5mm;padding:4mm 5mm;margin-top:5mm;font-size:8.8pt}\n.callout b{font-weight:700}\n\n.foot{position:absolute;left:15mm;right:15mm;bottom:8mm;display:flex;justify-content:space-between;font-size:6.9pt;color:var(--muted);border-top:1px solid var(--line);padding-top:2.4mm}\n.foot b{color:var(--ink);font-weight:600}\n.pagehdr{background:var(--navy);color:#fff;padding:5mm 15mm;display:flex;justify-content:space-between;align-items:center;border-bottom:1.2mm solid var(--teal)}\n.pagehdr img{height:8mm;margin-left:-1.4mm}\n.pagehdr .t{font-size:9pt;color:#DCE3EA}\n.pagehdr .t b{color:#fff;font-weight:700}\n.empty{color:var(--muted);font-style:italic}\n";
const TRIPS = ["5f", "6f", "7f", "1m", "1m2f", "1m4f+"];
const GOINGS = ["Firm", "Gd/Fm", "Good", "Gd/Sft", "Soft", "Heavy"];
const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildReportHtml(d, logo) {
  const { r = {}, h = {}, v = {}, verdict = [], runs = [], p = {}, ped = {}, plan = [], watch = [] } = d;
  const pip = (n) => Array.from({ length: 5 }, (_, i) => `<div class="pip ${i < n ? 'on' : ''}"></div>`).join('');
  const bar = (list, marks) => `<div class="bar"><div class="cells" style="grid-template-columns:repeat(${list.length},1fr)">${list.map(x => `<div class="cell ${e((marks || {})[x] || '')}"></div>`).join('')}</div><div class="ticks" style="grid-template-columns:repeat(${list.length},1fr)">${list.map(x => `<div>${e(x)}</div>`).join('')}</div></div>`;
  const form = runs.length ? `<table><thead><tr><th>Date</th><th>Course</th><th>Race</th><th>Going</th><th>Result</th><th class="num">SP</th></tr></thead><tbody>${runs.map(x => `<tr><td class="num">${e(x.date)}</td><td>${e(x.course)}</td><td>${e(x.race)}</td><td>${e(x.going)}</td><td class="pos">${e(x.result)}</td><td class="num">${e(x.sp)}</td></tr>`).join('')}</tbody></table><div class="runnotes">${runs.map(x => `<div class="runnote"><b>${e(x.short)}</b><div>${e(x.note)}</div></div>`).join('')}</div>` : `<p class="empty">Unraced.</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(h.name)} · Stride Lab Horse Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}
@media screen { html,body{background:#E9E7E0} .page{margin:0 auto 6mm;box-shadow:0 1px 6px rgba(0,0,0,.15)} }
</style></head><body>
<section class="page">
  <div class="hdr"><div class="top"><img src="${e(logo)}" alt="The Stride Lab"><div class="doc">Horse Report<br><b>${e(r.number)}</b><br>${e(r.date)}</div></div>
    <h1>${e(h.name)}</h1>
    <div class="ped">${e(h.age_sex)} · ${e(h.sire)} <em>out of</em> ${e(h.dam)} <em>(${e(h.damsire)})</em></div>
    <div class="meta"><span>Trainer<b>${e(h.trainer)}</b></span><span>Owner<b>${e(h.owner)}</b></span><span>Runs<b>${e(h.record)}</b></span></div>
  </div>
  <div class="body">
    <div class="tiles">
      <div class="tile key"><div class="k">Current ability</div><div class="v">${e(v.current)}</div><div class="s">${e(v.current_note)}</div></div>
      <div class="tile key"><div class="k">Potential ceiling</div><div class="v">${e(v.ceiling)}</div><div class="s">${e(v.ceiling_note)}</div></div>
      <div class="tile"><div class="k">Official rating</div><div class="v ${String(v.official || '').length > 4 ? 'sm' : ''}">${e(v.official)}</div><div class="s">${e(v.official_note)}</div></div>
      <div class="tile"><div class="k">Best trip</div><div class="v sm">${e(v.trip)}</div><div class="s">${e(v.trip_note)}</div></div>
      <div class="tile"><div class="k">Best ground</div><div class="v sm">${e(v.ground)}</div><div class="s">${e(v.ground_note)}</div></div>
    </div>
    <h2>Our verdict</h2>${verdict.map(x => `<p class="verdict">${e(x)}</p>`).join('')}
    <h2>Form</h2>${form}
  </div>
  <div class="foot"><span><b>The Stride Lab</b> · Prepared by Jane · Confidential to the owner</span><span>Page 1 of 2</span></div>
</section>
<section class="page">
  <div class="pagehdr"><img src="${e(logo)}" alt="The Stride Lab"><div class="t"><b>${e(h.name)}</b> · Horse Report ${e(r.number)}</div></div>
  <div class="body">
    <h2>Racing profile</h2>
    <div class="scales">
      <div class="scale"><div class="lab"><b>Trip</b><span>${e(p.trip_label)}</span></div>${bar(TRIPS, p.trip)}</div>
      <div class="scale"><div class="lab"><b>Ground</b><span>${e(p.ground_label)}</span></div>${bar(GOINGS, p.ground)}</div>
      <div class="scale"><div class="lab"><b>Track type</b><span>${e(p.track_label)}</span></div><div class="slider"><div class="dot" style="left:${Number(p.track_pos) || 50}%"></div></div><div class="slider-ends"><span>Sharp, turning</span><span>Galloping, straight</span></div></div>
      <div class="scale"><div class="lab"><b>Early speed</b><span>${e(p.early_label)}</span></div><div class="pips">${pip(p.early)}</div><div class="slider-ends"><span>Slow to stride</span><span>Fast away</span></div></div>
      <div class="scale"><div class="lab"><b>Finishing effort</b><span>${e(p.finish_label)}</span></div><div class="pips">${pip(p.finish)}</div><div class="slider-ends"><span>Fades</span><span>Strong to the line</span></div></div>
      <div class="scale"><div class="lab"><b>Form direction</b><span>${e(p.direction_label)}</span></div><div class="pips">${pip(p.direction)}</div><div class="slider-ends"><span>Regressing</span><span>Improving fast</span></div></div>
    </div>
    <div class="chips">${(p.plus || []).map(c => `<span class="chip plus">+ ${e(c)}</span>`).join('')}${(p.minus || []).map(c => `<span class="chip minus">− ${e(c)}</span>`).join('')}</div>
    <h2>Pedigree and purchase</h2>
    <div class="two"><dl class="kv"><dt>Sire</dt><dd>${e(ped.sire)}</dd><dt>Dam</dt><dd>${e(ped.dam)}</dd><dt>Damsire</dt><dd>${e(ped.damsire)}</dd><dt>Bred</dt><dd>${e(ped.bred)}</dd></dl>
      <dl class="kv"><dt>Purchased</dt><dd>${e(ped.purchase)}</dd><dt>Family</dt><dd>${e(ped.family)}</dd></dl></div>
    <h2>The plan</h2>
    <div class="two"><div class="plan">${plan.map((s, i) => `<div class="step ${i === 0 ? 'now' : ''}"><div class="when">${e(s.when)}</div><div class="what">${e(s.what)}</div><div>${e(s.why)}</div></div>`).join('')}</div>
      <div><div class="lab" style="font-size:8pt;font-weight:600;margin-bottom:2mm">What to watch for next time</div><ul class="watch">${watch.map(w => `<li>${e(w)}</li>`).join('')}</ul></div></div>
    <div class="callout"><b>How to read this report.</b> ${e(r.howto)}</div>
  </div>
  <div class="foot"><span><b>The Stride Lab</b> · Prepared by Jane · ${e(r.date)} · Confidential to the owner, not for publication</span><span>Page 2 of 2</span></div>
</section>
<script>
  // Fit the A4 pages to the phone or screen width; printing (Download PDF) uses true A4.
  function fit(){ var w = document.documentElement.clientWidth, s = Math.min(1, (w - 8) / 794); document.body.style.zoom = s; }
  window.addEventListener('resize', fit); fit();
  window.addEventListener('beforeprint', function(){ document.body.style.zoom = 1; });
  window.addEventListener('afterprint', fit);
</script>
</body></html>`;
}
