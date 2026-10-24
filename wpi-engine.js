/**
 * FORECOURT WORKS LTD - Work Priority Index (WPI) engine
 * Pure logic, no DOM. Used identically by the Service Request and Work Order registers.
 * Works standalone: needs only wpi-data.js.
 *
 *   Priority = Asset Criticality Score (ACS 1-5) x Condition (D 1-5), then floors, then P1-P5.
 *   ACS = max(S, E, O effective, R, K) from the component class library.
 *   O effective = O baseline + capacity-lost adjustment (topology) + site adjustment (grid / volume).
 */
(function (root) {
  'use strict';
  var DATA = root.FSW_WPI_DATA || (typeof require !== 'undefined' ? require('./wpi-data.js') : null);
  if (!DATA) throw new Error('wpi-data.js must load before wpi-engine.js');

  var VERSION = DATA.version;
  var SETTINGS_KEY = 'fsw_wpi_settings_v1';

  // ---------- reference tables ----------
  var CONDITIONS = [
    { id: 'H', d: 5, label: 'Hazard present', hint: 'Leak, spill, spark, collapse or fall risk right now. Needs an evidence note.' },
    { id: 'P', d: 4, label: 'Protection lost', hint: 'A safety, containment or detection device is not working.' },
    { id: 'O', d: 4, label: 'Out of service', hint: 'The item cannot do its job.' },
    { id: 'G', d: 3, label: 'Degraded / intermittent', hint: 'Works, but unreliably or at reduced performance.' },
    { id: 'N', d: 2, label: 'Nuisance', hint: 'Working, but annoying or cosmetic.' },
    { id: 'A', d: 1, label: 'Advisory', hint: 'Observation from a visit or a preventive item.' }
  ];
  var DATE_KINDS = ['Certificate / licence', 'Audit / report', 'Test record', 'Training', 'Document / record'];
  var DIM_NAMES = { S: 'Safety', E: 'Environment', O: 'Operations', R: 'Regulatory', K: 'Cost' };
  var PRIORITY_STYLE = {
    1: { bg: '#fee2e2', fg: '#991b1b', bd: '#fca5a5' },
    2: { bg: '#ffedd5', fg: '#9a3412', bd: '#fdba74' },
    3: { bg: '#fef3c7', fg: '#92400e', bd: '#fcd34d' },
    4: { bg: '#dbeafe', fg: '#1e40af', bd: '#93c5fd' },
    5: { bg: '#f3f4f6', fg: '#4b5563', bd: '#d1d5db' }
  };
  var OVERRIDE_REASONS = ['Hazard confirmed on site', 'Client SLA / contract term', 'Data-entry error', 'Management directive', 'Parts or access constraint', 'Other'];
  var DAY = 86400000, HOUR = 3600000;

  // ---------- helpers ----------
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function toDate(v) {
    if (v instanceof Date) return isNaN(v) ? null : v;
    if (!v) return null;
    if (typeof v === 'string' && /^\d{1,2}\.\d{1,2}\.\d{2,4}/.test(v)) return parseDisp(v);
    var d = new Date(v); return isNaN(d) ? null : d;
  }
  /** DD.MM.YY or DD.MM.YYYY (register display format) -> Date at 08:00 local, or null */
  function parseDisp(s) {
    var m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{2,4})\s*$/.exec(s || '');
    if (!m) return null;
    var y = parseInt(m[3], 10); if (y < 100) y += 2000;
    var d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10), 8, 0, 0);
    return isNaN(d) ? null : d;
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtDate(d) { d = toDate(d); return d ? pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2) : ''; }
  function fmtDateTime(d) { d = toDate(d); return d ? fmtDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : ''; }
  function toIso(d) { d = toDate(d); return d ? d.toISOString() : ''; }
  function endOfDay(d) { d = new Date(toDate(d)); d.setHours(23, 59, 0, 0); return d; }
  function daysBetween(a, b) { return Math.floor((endOfDay(a).getTime() - endOfDay(b).getTime()) / DAY); }   // a - b in calendar days

  // ---------- settings (site inputs + policy), editable in the app ----------
  var memorySettings = null;
  function defaults() {
    return JSON.parse(JSON.stringify({ siteInputs: DATA.siteInputs, policy: DATA.policy }));
  }
  function getSettings() {
    var s = defaults();
    try {
      var raw = root.localStorage && root.localStorage.getItem(SETTINGS_KEY);
      if (raw) { var o = JSON.parse(raw); if (o.siteInputs) s.siteInputs = Object.assign(s.siteInputs, o.siteInputs); if (Array.isArray(o.policy) && o.policy.length === 5) s.policy = o.policy; }
    } catch (_) { if (memorySettings) return memorySettings; }
    return s;
  }
  function saveSettings(s) {
    memorySettings = s;
    try { root.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (_) {}
  }
  function resetSettings() { memorySettings = null; try { root.localStorage.removeItem(SETTINGS_KEY); } catch (_) {} }

  // ---------- library access ----------
  var SUB_BY_CODE = {}, SUBS_BY_PARENT = {}, PARENT_BY_ID = {};
  DATA.parents.forEach(function (p) { PARENT_BY_ID[p[0]] = { id: p[0], short: p[1], desc: p[2], make: p[3], model: p[4], group: p[5], cat: p[6] }; });
  DATA.subs.forEach(function (s) {
    var o = { code: s[0], parent: s[1], desc: s[2], cls: s[3], product: s[4], key: s[5] };
    SUB_BY_CODE[o.code] = o;
    (SUBS_BY_PARENT[o.parent] = SUBS_BY_PARENT[o.parent] || []).push(o);
  });
  function classInfo(code) {
    var c = DATA.classes[code]; if (!c) return null;
    return { code: code, name: c[0], family: c[1], scope: c[2], S: c[3], E: c[4], O: c[5], R: c[6], K: c[7], conf: c[8], scenario: c[9], kind: c[10], trade: c[11], valid: c[12] };
  }
  function isDateDriven(clsCode) { var c = classInfo(clsCode); return !!c && DATE_KINDS.indexOf(c.kind) >= 0; }

  // ---------- criticality ----------
  function topoAdj(key, O) {
    if (O < 3 || !key) return 0;
    var lost = DATA.topo[key]; if (lost == null) return 0;
    var pct = lost / DATA.lineTotal;
    return pct >= 0.75 ? 1 : (pct <= 0.25 ? -1 : 0);
  }
  function siteAdj(scope, O, si) {
    if (O < 3) return 0;
    si = si || getSettings().siteInputs;
    var g = scope === 'SB' ? (si.grid === 'Low' ? 1 : si.grid === 'High' ? -1 : 0) : 0;
    var v = DATA.volScopes.indexOf(scope) >= 0 ? (si.volume === 'High' ? 1 : si.volume === 'Low' ? -1 : 0) : 0;
    return clamp(g + v, -1, 1);
  }
  /** ACS for a class (with optional topology key and site inputs) */
  function criticality(clsCode, key, si) {
    var c = classInfo(clsCode); if (!c) return null;
    var ta = topoAdj(key, c.O), sa = siteAdj(c.scope, c.O, si);
    var oEff = c.O >= 3 ? clamp(c.O + ta + sa, 1, 5) : c.O;
    var acs = Math.max(c.S, c.E, oEff, c.R, c.K);
    var dims = [c.S, c.E, oEff, c.R, c.K];
    var drivers = ['S', 'E', 'O', 'R', 'K'].filter(function (k, i) { return dims[i] === acs; });
    return { cls: clsCode, name: c.name, family: c.family, kind: c.kind, S: c.S, E: c.E, O: c.O, oEff: oEff, R: c.R, K: c.K, topoAdj: ta, siteAdj: sa,
             acs: acs, acvl: acs >= 5 ? 1 : acs === 4 ? 2 : acs === 3 ? 3 : 4, drivers: drivers,
             dimsHigh: dims.filter(function (x) { return x >= 4; }).length, scenario: c.scenario, conf: c.conf, trade: c.trade };
  }

  // ---------- condition ----------
  function conditionById(id) { return CONDITIONS.filter(function (c) { return c.id === id; })[0] || null; }
  function dateCondition(expiry, now) {
    var e = toDate(expiry), n = toDate(now) || new Date();
    if (!e) return null;
    var days = daysBetween(e, n);
    return { days: days, d: days < 0 ? 4 : days <= 30 ? 3 : days <= 90 ? 2 : 1 };
  }
  /** repeat failure: same sub-asset closed in a WO within the last 90 days */
  function historyFromWo(woRecords) {
    var out = [];
    (woRecords || []).forEach(function (w) {
      if (!w || w.status !== 'Completed' || !w.wpi || !w.wpi.lines) return;
      var ended = toDate(w.end) || toDate(w.wpi.completedAt);
      if (!ended) return;
      w.wpi.lines.forEach(function (l) { out.push({ code: l.code, at: ended.getTime(), wo: w.wo }); });
    });
    return out;
  }
  function isRepeat(code, history, now, selfWo) {
    var n = (toDate(now) || new Date()).getTime();
    return (history || []).some(function (h) { return h.code === code && h.wo !== selfWo && h.at <= n && n - h.at <= 90 * DAY; });
  }

  // ---------- scoring ----------
  function tierFromScore(score) { return score >= 16 ? 2 : score >= 10 ? 3 : score >= 5 ? 4 : 5; }
  /**
   * line: { code?, cls, key?, cond?: 'H'|'P'|'O'|'G'|'N'|'A', expiry?, evidence?, label? }
   * ctx:  { now, siteInputs, history, selfWo }
   */
  function scoreLine(line, ctx) {
    ctx = ctx || {};
    var now = toDate(ctx.now) || new Date();
    var sub = line.code ? SUB_BY_CODE[line.code] : null;
    var cls = line.cls || (sub && sub.cls);
    var key = line.key != null ? line.key : (sub ? sub.key : '');
    var cr = criticality(cls, key, ctx.siteInputs); if (!cr) return { error: 'Unknown class ' + cls };
    var dated = isDateDriven(cls), dRaw = null, days = null, cond = null, warnings = [];
    if (dated) {
      var dc = dateCondition(line.expiry, now);
      if (!dc) warnings.push('Enter the expiry or due date');
      else { dRaw = dc.d; days = dc.days; }
    } else {
      cond = conditionById(line.cond);
      if (!cond) warnings.push('Choose the current condition'); else dRaw = cond.d;
    }
    var repeat = !dated && dRaw != null && isRepeat(line.code, ctx.history, now, ctx.selfWo);
    var d = dRaw == null ? null : Math.min(5, dRaw + (repeat ? 1 : 0));
    var evidenceOk = !!(line.evidence && String(line.evidence).trim().length >= 3);
    if (d === 5 && !evidenceOk && !dated) warnings.push('Hazard needs an evidence note before P1 is applied');
    var score = d == null ? null : cr.acs * d;
    var tier = score == null ? null : tierFromScore(score);
    var floors = [], pr = tier;
    if (score != null) {
      if (d === 5 && Math.max(cr.S, cr.E) >= 4 && evidenceOk) { floors.push('safety_floor'); pr = 1; }
      if (cr.R === 5 && d >= 3 && pr > 2) { floors.push('compliance_floor'); pr = 2; }
      if (dated && cr.R >= 4 && days != null) {
        if (days <= 7 && pr > 2) { floors.push('deadline_floor'); pr = 2; }
        else if (days <= 30 && pr > 3) { floors.push('deadline_floor'); pr = 3; }
      }
    }
    var line2 = {
      code: line.code || '', cls: cls, name: sub ? sub.desc : cr.name, className: cr.name, key: key, product: sub ? sub.product : (line.product || 'NA'),
      cond: cond ? cond.id : '', condLabel: dated ? (days == null ? '' : (days < 0 ? 'Overdue by ' + (-days) + ' d' : 'Due in ' + days + ' d')) : (cond ? cond.label : ''),
      expiry: dated ? toIso(line.expiry) : '', evidence: line.evidence || '', repeat: repeat, d: d, dRaw: dRaw,
      S: cr.S, E: cr.E, O: cr.O, oEff: cr.oEff, R: cr.R, K: cr.K, acs: cr.acs, acvl: cr.acvl, drivers: cr.drivers, dimsHigh: cr.dimsHigh,
      score: score, tier: tier, priority: pr, floors: floors, warnings: warnings, scenario: cr.scenario, trade: cr.trade, dateDriven: dated
    };
    line2.reason = reasonLine(line2);
    return line2;
  }
  function reasonLine(l) {
    if (l.score == null) return '';
    var drv = l.drivers.map(function (k) { return DIM_NAMES[k]; }).join('/');
    var s = l.name + ' (ACS ' + l.acs + ', ' + drv + ') x ' + (l.condLabel || ('D' + l.d)) + ' (' + l.d + (l.repeat ? ', repeat +1' : '') + ') = ' + l.score + ' -> P' + l.priority;
    if (l.floors.length) s += ' by ' + l.floors.join(', ').replace(/_/g, ' ');
    return s;
  }

  // ---------- due dates and aging ----------
  function policyFor(p, settings) { return (settings || getSettings()).policy[p - 1]; }
  function dueTimes(priority, raisedAt, settings, expiry) {
    var pol = policyFor(priority, settings), r = toDate(raisedAt) || new Date();
    var due = new Date(r.getTime() + pol.completeD * DAY);
    var e = toDate(expiry);
    if (e && endOfDay(e) > r && endOfDay(e) < due) due = endOfDay(e);
    return { respondBy: new Date(r.getTime() + pol.respondH * HOUR), makeSafeBy: new Date(r.getTime() + pol.makeSafeH * HOUR), dueAt: due };
  }
  /**
   * lines: array for scoreLine. ctx: { raisedAt, now, siteInputs, history, selfWo, override }
   * Returns the wpi object stored on SR / WO records.
   */
  function scoreRequest(lines, ctx) {
    ctx = ctx || {};
    var now = toDate(ctx.now) || new Date(), raised = toDate(ctx.raisedAt) || now;
    var settings = getSettings();
    var si = ctx.siteInputs || settings.siteInputs;
    var out = (lines || []).map(function (l) { return scoreLine(l, { now: now, siteInputs: si, history: ctx.history, selfWo: ctx.selfWo }); });
    var good = out.filter(function (l) { return l.score != null; });
    var warnings = [];
    out.forEach(function (l) { (l.warnings || []).forEach(function (w) { warnings.push((l.code || l.className) + ': ' + w); }); });
    if (!out.length) warnings.push('Choose at least one sub-asset or component');
    var hdr = null;
    if (good.length) {
      var best = good.slice().sort(function (a, b) { return a.priority - b.priority || b.score - a.score || b.dimsHigh - a.dimsHigh; })[0];
      var expiry = best.dateDriven ? best.expiry : '';
      var calcP = best.priority, ov = ctx.override && ctx.override.priority ? parseInt(String(ctx.override.priority).replace('P', ''), 10) : null;
      var base = ov || calcP;
      var t = dueTimes(base, raised, settings, expiry);
      hdr = {
        calcPriority: calcP, priority: base, score: best.score, acs: best.acs, d: best.d, dimsHigh: best.dimsHigh, topCode: best.code, topName: best.name,
        reason: best.reason, floors: best.floors, evidenceMissing: good.some(function (l) { return l.d === 5 && !(l.evidence && String(l.evidence).trim().length >= 3) && !l.dateDriven; }),
        respondBy: toIso(t.respondBy), makeSafeBy: toIso(t.makeSafeBy), dueAt: toIso(t.dueAt), trade: best.trade
      };
    }
    return {
      v: 1, engine: VERSION, library: DATA.libraryDate, site: ctx.siteMode === 'other' ? 'OTHER' : DATA.site, siteInputs: si,
      parent: ctx.parent || '', parentDesc: ctx.parentDesc || '', raisedAt: toIso(raised), calcAt: toIso(now), lines: out, header: hdr,
      override: ctx.override && ctx.override.priority ? ctx.override : null, warnings: warnings
    };
  }
  /** effective priority including aging escalation. rec state: { closed, started } */
  function effective(wpi, now, state) {
    if (!wpi || !wpi.header) return null;
    state = state || {};
    var n = (toDate(now) || new Date()).getTime(), h = wpi.header;
    var base = h.priority, eff = base, flags = [];
    var respond = toDate(h.respondBy), due = toDate(h.dueAt);
    if (!state.closed) {
      if (!state.started && respond && n > respond.getTime() && base > 1) { eff = base - 1; flags.push('escalated'); }
      if (due && n > due.getTime()) flags.push('overdue');
      else if (!state.started && respond && n > respond.getTime()) flags.push('respond-late');
    }
    if (wpi.override) flags.push('override');
    return { base: base, calc: h.calcPriority, effective: eff, flags: flags, score: h.score, respondBy: respond, makeSafeBy: toDate(h.makeSafeBy), dueAt: due };
  }
  function compare(a, b) {   // a, b: { eff:{effective,score,dueAt,dimsHigh}, raisedAt }
    return (a.effective - b.effective) || ((b.score || 0) - (a.score || 0)) ||
      ((a.dueAt ? a.dueAt.getTime() : 9e15) - (b.dueAt ? b.dueAt.getTime() : 9e15)) || ((b.dimsHigh || 0) - (a.dimsHigh || 0)) ||
      ((a.raisedAt || 0) - (b.raisedAt || 0));
  }
  function badgeHtml(p, opts) {
    opts = opts || {};
    var s = PRIORITY_STYLE[p]; if (!s) return '<span style="color:#9ca3af">&mdash;</span>';
    var txt = 'P' + p + (opts.score != null ? ' \u00b7 ' + opts.score : '');
    return '<span class="wpi-badge" style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:0.7rem;font-weight:700;background:' + s.bg + ';color:' + s.fg + ';border:1px solid ' + s.bd + ';white-space:nowrap">' + txt + '</span>';
  }
  function policyName(p, settings) { return policyFor(p, settings).name; }

  root.FSW_WPI = {
    version: VERSION, data: DATA, conditions: CONDITIONS, overrideReasons: OVERRIDE_REASONS, dimNames: DIM_NAMES, priorityStyle: PRIORITY_STYLE, dateKinds: DATE_KINDS,
    getSettings: getSettings, saveSettings: saveSettings, resetSettings: resetSettings,
    parents: function () { return Object.keys(PARENT_BY_ID).map(function (k) { return PARENT_BY_ID[k]; }); },
    parent: function (id) { return PARENT_BY_ID[id] || null; }, subsOf: function (id) { return SUBS_BY_PARENT[id] || []; }, sub: function (code) { return SUB_BY_CODE[code] || null; },
    classInfo: classInfo, classes: function () { return Object.keys(DATA.classes).map(classInfo); }, isDateDriven: isDateDriven,
    criticality: criticality, conditionById: conditionById, dateCondition: dateCondition, historyFromWo: historyFromWo, isRepeat: isRepeat,
    tierFromScore: tierFromScore, scoreLine: scoreLine, scoreRequest: scoreRequest, dueTimes: dueTimes, effective: effective, compare: compare,
    badgeHtml: badgeHtml, policyName: policyName, policyFor: policyFor,
    util: { toDate: toDate, parseDisp: parseDisp, fmtDate: fmtDate, fmtDateTime: fmtDateTime, toIso: toIso, daysBetween: daysBetween }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FSW_WPI;
})(typeof self !== 'undefined' ? self : this);
