/**
 * FORECOURT WORKS LTD - Work Priority Index interface
 * Reusable by the Service Request and Work Order registers (same panel, same engine, same stored result).
 * Self-contained: injects its own styles; needs wpi-data.js and wpi-engine.js only.
 */
(function (root) {
  'use strict';
  var W = root.FSW_WPI;
  if (!W) { return; }
  var U = W.util;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $(el, sel) { return el.querySelector(sel); }
  function $$(el, sel) { return Array.prototype.slice.call(el.querySelectorAll(sel)); }

  // ---------- styles ----------
  (function injectStyle() {
    if (document.getElementById('wpi-style')) return;
    var css = [
      '.wpi-card{grid-column:1/-1;border:1px solid var(--border,#d1d5db);border-left:5px solid var(--navy,#0d264d);border-radius:10px;background:#fff;padding:14px 16px;margin:4px 0 8px}',
      '.wpi-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:8px}',
      '.wpi-title{font-weight:700;font-size:.82rem;letter-spacing:.04em;color:var(--navy,#0d264d)}',
      '.wpi-sub{display:block;font-weight:500;font-size:.7rem;color:var(--muted,#6b7280);letter-spacing:0;margin-top:2px}',
      '.wpi-note{font-size:.72rem;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;padding:6px 9px;border-radius:6px;margin-bottom:8px}',
      '.wpi-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px}',
      '.wpi-row .wpi-f{display:flex;flex-direction:column;gap:3px;min-width:150px;flex:1}',
      '.wpi-row label,.wpi-f label{font-size:.66rem;font-weight:700;color:var(--muted,#6b7280);text-transform:uppercase;letter-spacing:.04em}',
      '.wpi-card input,.wpi-card select{font:inherit;font-size:.8rem;padding:6px 8px;border:1px solid var(--border,#d1d5db);border-radius:6px;background:#fff;color:inherit;max-width:100%}',
      '.wpi-card select{min-width:0}',
      '.wpi-lines{display:flex;flex-direction:column;gap:6px;margin:6px 0}',
      '.wpi-line{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;background:#fafafa;display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center}',
      '.wpi-line-name{font-weight:600;font-size:.8rem}',
      '.wpi-meta{font-size:.68rem;color:var(--muted,#6b7280)}',
      '.wpi-line-ctl{display:flex;gap:6px;flex-wrap:wrap;align-items:center;grid-column:1/-1}',
      '.wpi-line-ctl input[type=text]{flex:1;min-width:180px}',
      '.wpi-x{border:1px solid #fecaca;background:#fff;color:#b91c1c;border-radius:6px;padding:2px 9px;cursor:pointer;font-weight:700}',
      '.wpi-empty{font-size:.74rem;color:var(--muted,#6b7280);padding:8px 2px}',
      '.wpi-result{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;background:#f8fafc;margin-top:8px}',
      '.wpi-big{display:flex;gap:12px;align-items:center;flex-wrap:wrap}',
      '.wpi-bigbadge{font-size:1.5rem;font-weight:800;padding:4px 16px;border-radius:10px;border:2px solid}',
      '.wpi-times{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px 12px;margin-top:8px;font-size:.74rem}',
      '.wpi-times b{display:block;font-size:.63rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#6b7280)}',
      '.wpi-why{font-size:.74rem;margin-top:8px;color:#1f2937}',
      '.wpi-warn{font-size:.72rem;background:#fef3c7;border:1px solid #fcd34d;color:#92400e;padding:5px 9px;border-radius:6px;margin-top:6px}',
      '.wpi-flag{display:inline-block;font-size:.64rem;font-weight:700;padding:2px 7px;border-radius:999px;margin-left:4px}',
      '.wpi-flag.esc{background:#fee2e2;color:#991b1b}.wpi-flag.over{background:#fef3c7;color:#92400e}.wpi-flag.ovr{background:#e0e7ff;color:#3730a3}',
      '.wpi-table{width:100%;border-collapse:collapse;font-size:.72rem;margin-top:6px}',
      '.wpi-table th,.wpi-table td{text-align:left;padding:3px 6px;border-bottom:1px solid #e5e7eb}',
      '.wpi-override{margin-top:8px;font-size:.76rem}.wpi-override summary{cursor:pointer;font-weight:600;color:var(--navy,#0d264d)}',
      '.wpi-btn{border:1px solid var(--border,#d1d5db);background:#fff;color:var(--navy,#0d264d);border-radius:6px;padding:4px 10px;font-size:.72rem;font-weight:600;cursor:pointer;font-family:inherit}',
      '.wpi-btn:hover{border-color:var(--navy,#0d264d);background:#f8fafc}',
      '.wpi-modal-bd{position:fixed;inset:0;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;z-index:250;padding:12px}',
      '.wpi-modal-bd.open{display:flex}',
      '.wpi-modal{background:#fff;border-radius:12px;max-width:640px;width:100%;max-height:88vh;overflow:auto;padding:18px 20px;box-shadow:0 20px 50px rgba(0,0,0,.3)}',
      '.wpi-modal h3{font-size:1rem;color:var(--navy,#0d264d);margin-bottom:6px}',
      '.wpi-modal table{width:100%;border-collapse:collapse;font-size:.76rem;margin:8px 0}',
      '.wpi-modal th,.wpi-modal td{text-align:left;padding:4px 6px;border-bottom:1px solid #e5e7eb}',
      '.wpi-modal input,.wpi-modal select{font:inherit;font-size:.8rem;padding:5px 7px;border:1px solid #d1d5db;border-radius:6px}',
      '.wpi-modal input[type=number]{width:80px}',
      '.wpi-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}',
      '@media(max-width:600px){.wpi-line{grid-template-columns:1fr}.wpi-x{justify-self:end}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'wpi-style'; st.textContent = css; document.head.appendChild(st);
  })();

  // ---------- panel ----------
  var FAMILY_NAMES = { DSP: 'Fuel dispenser parts', STP: 'Submersible pump', UST: 'Underground tank', PIP: 'Pipework', ATG: 'Tank gauge', INT: 'Interceptor', ESD: 'Emergency shut-off', ELC: 'Electrical', GEN: 'Generator',
    CAN: 'Canopy', TOT: 'Totem', FAC: 'Facility', CCT: 'CCTV', CMP: 'Air compressor', INF: 'Tyre inflator', CGE: 'Inflation cage', LFT: 'Vehicle lift', WAL: 'Wheel aligner', WBL: 'Wheel balancer', LUB: 'Lubrication system', REG: 'Compliance item' };
  function condOptions(sel) {
    return '<option value="">— Condition —</option>' + W.conditions.map(function (c) {
      return '<option value="' + c.id + '"' + (sel === c.id ? ' selected' : '') + ' title="' + esc(c.hint) + '">' + c.d + ' · ' + esc(c.label) + '</option>';
    }).join('');
  }
  function levelOptions(sel) { return ['Low', 'Medium', 'High'].map(function (o) { return '<option' + (sel === o ? ' selected' : '') + '>' + o + '</option>'; }).join(''); }

  /**
   * mount(host, opts)
   *  opts.wpi         stored result (or null)
   *  opts.raisedAt    when the request was raised (keeps the clock when a SR becomes a WO)
   *  opts.selfWo      WO number (to ignore itself in repeat-failure history)
   *  opts.getHistory  () => history array from closed WOs
   *  opts.note        optional info line (e.g. inherited from SR)
   *  opts.state       { closed, started } for aging display
   *  opts.onAssetPick (parent) => void   lets the host fill its own equipment fields
   * returns { value(), dirty(), recompute() }
   */
  function mount(host, opts) {
    opts = opts || {};
    var stored = opts.wpi || null;
    var st = {
      mode: stored && stored.site === 'OTHER' ? 'other' : 'reg',
      parent: stored && stored.parent || '',
      lines: stored ? stored.lines.map(function (l) { return { code: l.code, cls: l.cls, key: l.key, cond: l.cond, evidence: l.evidence, expiry: l.expiry ? l.expiry.slice(0, 10) : '', product: l.product }; }) : [],
      grid: stored && stored.siteInputs ? stored.siteInputs.grid : 'Medium', vol: stored && stored.siteInputs ? stored.siteInputs.volume : 'Medium',
      override: stored && stored.override ? Object.assign({}, stored.override) : null,
      wpi: stored, changed: false
    };
    var raised = opts.raisedAt ? U.toDate(opts.raisedAt) : (stored ? U.toDate(stored.raisedAt) : new Date());
    if (!raised) raised = new Date();

    var parents = W.parents();
    var groups = {};
    parents.forEach(function (p) { (groups[p.group] = groups[p.group] || []).push(p); });
    var parentOpts = '<option value="">— Select parent asset —</option>' + Object.keys(groups).map(function (g) {
      return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.short + ' · ' + p.desc) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    var fams = {};
    W.classes().forEach(function (c) { if (c.family !== 'REG') (fams[c.family] = fams[c.family] || []).push(c); });
    var classOpts = '<option value="">— Select component type —</option>' + Object.keys(fams).map(function (f) {
      return '<optgroup label="' + esc(FAMILY_NAMES[f] || f) + '">' + fams[f].map(function (c) { return '<option value="' + esc(c.code) + '">' + esc(c.name) + '</option>'; }).join('') + '</optgroup>';
    }).join('');

    host.innerHTML =
      '<div class="wpi-card">' +
      '<div class="wpi-head"><div class="wpi-title">WORK PRIORITY INDEX<span class="wpi-sub">Priority is calculated from the asset and its condition, and is the same on the Service Request and the Work Order.</span></div></div>' +
      (opts.note ? '<div class="wpi-note">' + esc(opts.note) + '</div>' : '') +
      '<div class="wpi-row"><div class="wpi-f"><label>Asset source</label><select data-site><option value="reg">PUM-01 asset register</option><option value="other">Other site (choose component type)</option></select></div>' +
      '<div class="wpi-f" data-si style="display:none"><label>Grid reliability</label><select data-grid>' + levelOptions(st.grid) + '</select></div>' +
      '<div class="wpi-f" data-si style="display:none"><label>Volume intensity</label><select data-vol>' + levelOptions(st.vol) + '</select></div></div>' +
      '<div data-reg><div class="wpi-row"><div class="wpi-f" style="flex:2"><label>Parent asset</label><select data-parent>' + parentOpts + '</select></div>' +
      '<div class="wpi-f"><label>Filter sub-assets</label><input type="text" data-filter placeholder="e.g. hose, meter, sump" /></div></div>' +
      '<div class="wpi-row"><div class="wpi-f" style="flex:3"><label>Add sub-asset with the problem or action</label><select data-sub></select></div></div></div>' +
      '<div data-oth style="display:none"><div class="wpi-row"><div class="wpi-f" style="flex:3"><label>Component type</label><select data-class>' + classOpts + '</select></div>' +
      '<div class="wpi-f" style="flex:0;min-width:80px"><button type="button" class="wpi-btn" data-addclass>Add</button></div></div></div>' +
      '<div class="wpi-lines" data-lines></div><div data-result></div>' +
      '<details class="wpi-override" data-ovr><summary>Manual override (needs a reason; logged in the audit trail)</summary>' +
      '<div class="wpi-row" style="margin-top:6px"><div class="wpi-f"><label>Override priority</label><select data-ov-p><option value="">No override</option>' + [1, 2, 3, 4, 5].map(function (p) { return '<option value="P' + p + '">P' + p + ' · ' + esc(W.policyName(p)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="wpi-f"><label>Reason code</label><select data-ov-r><option value="">— Select —</option>' + W.overrideReasons.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
      '<div class="wpi-f" style="flex:2"><label>Note</label><input type="text" data-ov-n placeholder="Optional detail" /></div></div></details>' +
      '<div class="wpi-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" class="wpi-btn" data-recalc>Recalculate with current settings</button></div></div>';

    var el = {
      site: $(host, '[data-site]'), si: $$(host, '[data-si]'), grid: $(host, '[data-grid]'), vol: $(host, '[data-vol]'), reg: $(host, '[data-reg]'), oth: $(host, '[data-oth]'),
      parent: $(host, '[data-parent]'), filter: $(host, '[data-filter]'), sub: $(host, '[data-sub]'), cls: $(host, '[data-class]'), addcls: $(host, '[data-addclass]'),
      lines: $(host, '[data-lines]'), result: $(host, '[data-result]'), ovP: $(host, '[data-ov-p]'), ovR: $(host, '[data-ov-r]'), ovN: $(host, '[data-ov-n]'), ovrBox: $(host, '[data-ovr]'), recalc: $(host, '[data-recalc]')
    };

    function siteInputs() { return st.mode === 'other' ? { grid: st.grid, volume: st.vol } : W.getSettings().siteInputs; }
    function parentInfo() { return st.parent ? W.parent(st.parent) : null; }

    function fillSubs() {
      var q = (el.filter.value || '').trim().toLowerCase();
      var subs = st.parent ? W.subsOf(st.parent) : [];
      var have = {}; st.lines.forEach(function (l) { have[l.code] = 1; });
      var list = subs.filter(function (s) { return !have[s.code] && (!q || (s.desc + ' ' + s.cls + ' ' + s.code).toLowerCase().indexOf(q) >= 0); });
      el.sub.innerHTML = '<option value="">' + (st.parent ? '— Select (' + list.length + ' available) —' : 'Choose a parent asset first') + '</option>' +
        list.map(function (s) { return '<option value="' + esc(s.code) + '">' + esc(s.desc) + '</option>'; }).join('');
    }
    function lineInputs() { return st.lines.map(function (l) { return { code: l.code, cls: l.cls, key: l.key, product: l.product, cond: l.cond, evidence: l.evidence, expiry: l.expiry }; }); }
    function overrideObj() {
      var p = el.ovP.value; if (!p) return null;
      return { priority: p, reason: el.ovR.value, note: el.ovN.value, at: st.override && st.override.priority === p && st.override.at ? st.override.at : new Date().toISOString() };
    }
    function recompute() {
      var pi = parentInfo();
      st.override = overrideObj();
      st.wpi = W.scoreRequest(lineInputs(), {
        raisedAt: raised, now: new Date(), siteInputs: siteInputs(), history: opts.getHistory ? opts.getHistory() : [], selfWo: opts.selfWo || '',
        override: st.override, parent: st.parent, parentDesc: pi ? pi.desc : '', siteMode: st.mode
      });
      if (!st.lines.length) st.wpi = Object.assign(st.wpi, { header: null });
      st.changed = true;
      drawLines(); drawResult();
    }
    function drawLines() {
      if (!st.lines.length) { el.lines.innerHTML = '<div class="wpi-empty">No components chosen yet. Add the sub-asset or component where the problem was reported or where action is required.</div>'; return; }
      var res = st.wpi && st.wpi.lines ? st.wpi.lines : [];
      el.lines.innerHTML = st.lines.map(function (l, i) {
        var r = res[i] || {}, dated = W.isDateDriven(l.cls), ci = W.classInfo(l.cls);
        var sub = l.code ? W.sub(l.code) : null;
        var name = sub ? sub.desc : (ci ? ci.name : l.cls);
        var ctl = dated
          ? '<label class="wpi-meta">Expiry / due date</label><input type="date" data-exp value="' + esc(l.expiry || '') + '" />'
          : '<select data-cond>' + condOptions(l.cond) + '</select>' + (l.cond === 'H' ? '<input type="text" data-ev value="' + esc(l.evidence || '') + '" placeholder="Evidence note or photo reference (required)" />' : '');
        var sc = r.score != null ? W.badgeHtml(r.priority, { score: r.score }) : '<span class="wpi-meta">not scored</span>';
        return '<div class="wpi-line" data-i="' + i + '"><div><div class="wpi-line-name">' + esc(name) + '</div>' +
          '<div class="wpi-meta">' + esc(ci ? ci.name : '') + (r.acs ? ' · ACS ' + r.acs + ' (' + esc((r.drivers || []).map(function (k) { return W.dimNames[k]; }).join('/')) + ')' : '') + (r.repeat ? ' · repeat failure +1' : '') + (r.condLabel && dated ? ' · ' + esc(r.condLabel) : '') + '</div></div>' +
          '<div style="display:flex;gap:8px;align-items:center">' + sc + '<button type="button" class="wpi-x" data-del title="Remove">×</button></div>' +
          '<div class="wpi-line-ctl">' + ctl + '</div></div>';
      }).join('');
    }
    function ts(v) { return v ? U.fmtDateTime(v) : '—'; }
    function drawResult() {
      var w = st.wpi, h = w && w.header;
      if (!h) {
        el.result.innerHTML = '<div class="wpi-result"><div class="wpi-meta">No priority yet.</div>' + warnHtml(w ? w.warnings : []) + '</div>'; return;
      }
      var e = W.effective(w, new Date(), opts.state || {});
      var s = W.priorityStyle[h.priority];
      var flags = (e.effective !== h.priority ? '<span class="wpi-flag esc">Escalated to P' + e.effective + '</span>' : '') + (e.flags.indexOf('overdue') >= 0 ? '<span class="wpi-flag over">Overdue</span>' : '') + (w.override ? '<span class="wpi-flag ovr">Override</span>' : '');
      var over = w.override ? '<div class="wpi-why"><b>Override:</b> calculated P' + h.calcPriority + ' changed to ' + esc(w.override.priority) + ' · ' + esc(w.override.reason || 'reason needed') + (w.override.note ? ' · ' + esc(w.override.note) : '') + '</div>' : '';
      var rows = w.lines.filter(function (l) { return l.score != null; }).map(function (l) {
        return '<tr><td>' + esc(l.name) + '</td><td>' + l.acs + '</td><td>' + l.d + '</td><td>' + l.score + '</td><td>' + W.badgeHtml(l.priority) + '</td></tr>';
      }).join('');
      var top = w.lines.filter(function (l) { return l.code === h.topCode || (!l.code && l.name === h.topName); })[0] || w.lines[0];
      el.result.innerHTML = '<div class="wpi-result"><div class="wpi-big"><span class="wpi-bigbadge" style="background:' + s.bg + ';color:' + s.fg + ';border-color:' + s.bd + '">P' + h.priority + '</span>' +
        '<div><div style="font-weight:700">' + esc(W.policyName(h.priority)) + flags + '</div><div class="wpi-meta">Score ' + h.score + ' = ACS ' + h.acs + ' x condition ' + h.d + (h.calcPriority !== h.priority ? ' · calculated P' + h.calcPriority : '') + (h.trade ? ' · ' + esc(h.trade) : '') + '</div></div></div>' +
        '<div class="wpi-times"><div><b>Respond by</b>' + ts(h.respondBy) + '</div><div><b>Make safe by</b>' + ts(h.makeSafeBy) + '</div><div><b>Complete by (due date)</b>' + ts(h.dueAt) + '</div><div><b>Raised</b>' + ts(w.raisedAt) + '</div></div>' +
        '<div class="wpi-why"><b>Why:</b> ' + esc(h.reason) + '</div>' + (top && top.scenario ? '<div class="wpi-meta" style="margin-top:3px">Consequence driver: ' + esc(top.scenario) + '</div>' : '') + over +
        (w.lines.length > 1 ? '<table class="wpi-table"><thead><tr><th>Component</th><th>ACS</th><th>D</th><th>Score</th><th>Priority</th></tr></thead><tbody>' + rows + '</tbody></table><div class="wpi-meta">The request takes its worst line; lines are never added together.</div>' : '') +
        warnHtml(w.warnings) + (h.evidenceMissing ? '' : '') + '<div class="wpi-meta" style="margin-top:6px">Calculated ' + ts(w.calcAt) + ' · ' + esc(w.engine) + ' · library ' + esc(w.library) + '</div></div>';
    }
    function warnHtml(ws) { return (ws || []).map(function (x) { return '<div class="wpi-warn">' + esc(x) + '</div>'; }).join(''); }

    // ----- events -----
    el.site.value = st.mode;
    function syncMode() {
      el.reg.style.display = st.mode === 'reg' ? '' : 'none'; el.oth.style.display = st.mode === 'other' ? '' : 'none';
      el.si.forEach(function (x) { x.style.display = st.mode === 'other' ? '' : 'none'; });
    }
    el.site.onchange = function () {
      if (st.lines.length && !confirm('Changing the asset source clears the components listed. Continue?')) { el.site.value = st.mode; return; }
      st.mode = el.site.value; st.lines = []; st.parent = ''; el.parent.value = ''; syncMode(); fillSubs(); recompute();
    };
    el.grid.onchange = function () { st.grid = el.grid.value; recompute(); };
    el.vol.onchange = function () { st.vol = el.vol.value; recompute(); };
    el.parent.value = st.parent;
    el.parent.onchange = function () {
      if (st.lines.length && !confirm('Changing the parent asset clears the components listed. Continue?')) { el.parent.value = st.parent; return; }
      st.parent = el.parent.value; st.lines = []; fillSubs(); recompute();
      var p = parentInfo(); if (p && opts.onAssetPick) opts.onAssetPick(p);
    };
    el.filter.oninput = fillSubs;
    el.sub.onchange = function () {
      var s = W.sub(el.sub.value); if (!s) return;
      st.lines.push({ code: s.code, cls: s.cls, key: s.key, cond: '', evidence: '', expiry: '', product: s.product });
      fillSubs(); recompute();
    };
    el.addcls.onclick = function () {
      var c = el.cls.value; if (!c) return;
      st.lines.push({ code: '', cls: c, key: '', cond: '', evidence: '', expiry: '', product: 'NA' }); el.cls.value = ''; recompute();
    };
    el.lines.addEventListener('change', function (e) {
      var row = e.target.closest('.wpi-line'); if (!row) return; var i = parseInt(row.dataset.i, 10), l = st.lines[i]; if (!l) return;
      if (e.target.matches('[data-cond]')) { l.cond = e.target.value; recompute(); }
      if (e.target.matches('[data-exp]')) { l.expiry = e.target.value; recompute(); }
    });
    el.lines.addEventListener('input', function (e) {
      if (!e.target.matches('[data-ev]')) return;
      var row = e.target.closest('.wpi-line'); var l = st.lines[parseInt(row.dataset.i, 10)]; if (!l) return; l.evidence = e.target.value;
      clearTimeout(el._t); el._t = setTimeout(function () { var a = document.activeElement; var pos = a && a.selectionStart; recompute(); var again = el.lines.querySelector('.wpi-line[data-i="' + row.dataset.i + '"] [data-ev]'); if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (_) {} } }, 350);
    });
    el.lines.addEventListener('click', function (e) {
      if (!e.target.matches('[data-del]')) return;
      var row = e.target.closest('.wpi-line'); st.lines.splice(parseInt(row.dataset.i, 10), 1); fillSubs(); recompute();
    });
    [el.ovP, el.ovR, el.ovN].forEach(function (x) { x.onchange = recompute; });
    if (st.override) { el.ovP.value = st.override.priority; el.ovR.value = st.override.reason || ''; el.ovN.value = st.override.note || ''; el.ovrBox.open = true; }
    el.recalc.onclick = function () { if (!st.lines.length) return; raised = U.toDate(raised); recompute(); };

    syncMode(); fillSubs(); drawLines(); drawResult();
    return {
      value: function () { return st.lines.length && st.wpi && st.wpi.header ? st.wpi : (st.lines.length ? st.wpi : null); },
      dirty: function () { return st.changed; },
      validate: function () {
        if (!st.lines.length) return '';
        var w = st.wpi; if (!w) return '';
        if (w.override && !w.override.reason) return 'Choose a reason code for the priority override.';
        if (w.lines.some(function (l) { return l.d === 5 && !l.dateDriven && !(l.evidence && String(l.evidence).trim().length >= 3); })) return 'A hazard needs an evidence note before it can be saved.';
        if (w.lines.some(function (l) { return l.score == null; })) return 'Complete the condition (or date) on every component, or remove it.';
        return '';
      },
      recompute: recompute
    };
  }

  // ---------- table cell ----------
  function cell(rec, state) {
    if (!rec || !rec.wpi || !rec.wpi.header) return '<span style="color:#9ca3af;font-size:.7rem">Not scored</span>';
    var e = W.effective(rec.wpi, new Date(), state || {}), h = rec.wpi.header;
    var out = W.badgeHtml(e.effective, { score: h.score });
    if (e.effective !== h.priority) out += '<span class="wpi-flag esc" title="Response target missed: escalated one level from P' + h.priority + '">&uarr;</span>';
    if (e.flags.indexOf('overdue') >= 0) out += '<span class="wpi-flag over" title="Past due date">overdue</span>';
    if (rec.wpi.override) out += '<span class="wpi-flag ovr" title="Manual override">ovr</span>';
    if (e.dueAt) out += '<div style="font-size:.64rem;color:#6b7280;margin-top:2px">due ' + U.fmtDate(e.dueAt) + '</div>';
    return out;
  }
  function effectiveFor(rec, state) { return rec && rec.wpi ? W.effective(rec.wpi, new Date(), state || {}) : null; }
  /** short text for audit trail */
  function summary(wpi) {
    if (!wpi || !wpi.header) return 'not scored';
    var h = wpi.header; return 'P' + h.priority + ' score ' + h.score + (wpi.override ? ' (override of P' + h.calcPriority + ': ' + (wpi.override.reason || '') + ')' : '') + ' [' + wpi.lines.map(function (l) { return (l.code ? l.code.split('/').pop() : l.className) + '=' + (l.condLabel || ''); }).join(', ') + ']';
  }

  // ---------- settings modal ----------
  function ensureModal(id) {
    var m = document.getElementById(id);
    if (m) return m;
    m = document.createElement('div'); m.id = id; m.className = 'wpi-modal-bd';
    m.innerHTML = '<div class="wpi-modal"></div>';
    m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('open'); });
    document.body.appendChild(m); return m;
  }
  /** opts.authorise(): Promise<admin>;  opts.onSaved(summaryText, admin, changedSiteInputs) */
  function openSettings(opts) {
    opts = opts || {};
    var m = ensureModal('wpi-settings'), box = m.firstChild, s = W.getSettings();
    box.innerHTML = '<h3>Work Priority Settings</h3><div class="wpi-meta">Site inputs and response targets used by every new calculation. Existing records keep their stored result until recalculated.</div>' +
      '<div class="wpi-row" style="display:flex;gap:12px;margin-top:10px"><div class="wpi-f"><label class="wpi-meta">PUM-01 grid reliability</label><select data-g>' + levelOptions(s.siteInputs.grid) + '</select></div>' +
      '<div class="wpi-f"><label class="wpi-meta">PUM-01 volume intensity</label><select data-v>' + levelOptions(s.siteInputs.volume) + '</select></div></div>' +
      '<table><thead><tr><th>Priority</th><th>Respond within (h)</th><th>Make safe within (h)</th><th>Complete within (days)</th></tr></thead><tbody>' +
      s.policy.map(function (p, i) { return '<tr><td><b>' + p.p + '</b> ' + esc(p.name) + '</td><td><input type="number" min="0" data-r="' + i + '" value="' + p.respondH + '"/></td><td><input type="number" min="0" data-m="' + i + '" value="' + p.makeSafeH + '"/></td><td><input type="number" min="0" data-c="' + i + '" value="' + p.completeD + '"/></td></tr>'; }).join('') + '</tbody></table>' +
      '<div class="wpi-meta">Starting values. Tune after about 30 days of running beside your manual priorities.</div>' +
      '<div class="wpi-actions"><button type="button" class="wpi-btn" data-reset>Reset to defaults</button><button type="button" class="wpi-btn" data-close>Close</button><button type="button" class="wpi-btn" style="background:var(--navy,#0d264d);color:#fff" data-save>Save (needs admin)</button></div>';
    m.classList.add('open');
    $(box, '[data-close]').onclick = function () { m.classList.remove('open'); };
    function collect() {
      var n = JSON.parse(JSON.stringify(W.getSettings()));
      n.siteInputs = { grid: $(box, '[data-g]').value, volume: $(box, '[data-v]').value };
      n.policy.forEach(function (p, i) { p.respondH = Math.max(0, +$(box, '[data-r="' + i + '"]').value || 0); p.makeSafeH = Math.max(0, +$(box, '[data-m="' + i + '"]').value || 0); p.completeD = Math.max(0, +$(box, '[data-c="' + i + '"]').value || 0); });
      return n;
    }
    function apply(n, label) {
      var go = opts.authorise ? opts.authorise() : Promise.resolve({ name: 'local' });
      go.then(function (admin) {
        var before = W.getSettings();
        if (label === 'reset') W.resetSettings(); else W.saveSettings(n);
        var after = W.getSettings();
        var parts = [];
        if (before.siteInputs.grid !== after.siteInputs.grid) parts.push('grid ' + before.siteInputs.grid + ' -> ' + after.siteInputs.grid);
        if (before.siteInputs.volume !== after.siteInputs.volume) parts.push('volume ' + before.siteInputs.volume + ' -> ' + after.siteInputs.volume);
        before.policy.forEach(function (p, i) { var q = after.policy[i]; if (p.respondH !== q.respondH || p.makeSafeH !== q.makeSafeH || p.completeD !== q.completeD) parts.push(p.p + ' ' + p.respondH + '/' + p.makeSafeH + '/' + p.completeD + ' -> ' + q.respondH + '/' + q.makeSafeH + '/' + q.completeD); });
        m.classList.remove('open');
        if (opts.onSaved) opts.onSaved(parts.length ? parts.join('; ') : 'saved (no change)', admin, before.siteInputs.grid !== after.siteInputs.grid || before.siteInputs.volume !== after.siteInputs.volume);
      }).catch(function () {});
    }
    $(box, '[data-save]').onclick = function () { apply(collect(), 'save'); };
    $(box, '[data-reset]').onclick = function () { apply(null, 'reset'); };
  }

  root.FSW_WPI_UI = { mount: mount, cell: cell, effectiveFor: effectiveFor, summary: summary, openSettings: openSettings, ensureModal: ensureModal, esc: esc };
})(window);
