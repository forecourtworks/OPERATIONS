/**
 * FORECOURT WORKS LTD - Scheduler hand-off
 * Ranks open Service Requests and Work Orders by Work Priority Index and pushes Work Orders to a scheduler.
 * Three ways to receive a push (use any): HTTPS endpoint (POST JSON), browser event / BroadcastChannel
 * ('fsw-scheduler') for a scheduler open in another tab, or reading the outbox in localStorage / exported JSON.
 * Works from the SR app alone, the WO app alone, or both together (reads shared localStorage).
 */
(function (root) {
  'use strict';
  var W = root.FSW_WPI, UI = root.FSW_WPI_UI;
  if (!W || !UI) { return; }
  var U = W.util, esc = UI.esc;
  var OUTBOX_KEY = 'fsw_scheduler_outbox_v1', CONFIG_KEY = 'fsw_scheduler_config_v1';
  var SR_KEY = 'fsw_sr_register_v1', WO_KEY = 'fsw_wo_register_v2';
  var chan = null;
  try { chan = new BroadcastChannel('fsw-scheduler'); } catch (_) {}

  function read(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (_) { return fb; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (_) {} }
  function config() { return Object.assign({ endpoint: '' }, read(CONFIG_KEY, {})); }
  function outbox() { var o = read(OUTBOX_KEY, []); return Array.isArray(o) ? o : []; }
  function saveOutbox(o) { write(OUTBOX_KEY, o.slice(-300)); }

  var STATUS_MAP = { Pending: 'Ready', Started: 'In progress', Ongoing: 'In progress', Stopped: 'On hold', Completed: 'Done', Cancelled: 'Cancelled' };
  function isOpenWo(w) { return w.status !== 'Completed' && w.status !== 'Cancelled'; }
  function stateOf(w) { return { closed: !isOpenWo(w), started: ['Started', 'Ongoing', 'Stopped'].indexOf(w.status) >= 0 }; }

  function signature(wo) {
    var w = wo.wpi, h = w && w.header;
    return JSON.stringify([h ? h.priority : null, h ? h.dueAt : null, w ? w.lines.map(function (l) { return l.code + ':' + l.cond + ':' + l.expiry; }) : [], wo.status, wo.partsReady || '', wo.estHours || '', wo.accessWindow || '', wo.type || '', wo.locOnSite || wo.location || '']);
  }
  function buildPayload(wo, version) {
    var w = wo.wpi || {}, h = w.header || {}, e = W.effective(w, new Date(), stateOf(wo)) || {};
    return {
      wo_id: 'WO#' + wo.wo, version: version, site_code: w.site === 'OTHER' ? 'OTHER' : 'PUM-01', linked_sr: wo.sr ? 'SR#' + wo.sr : '',
      client: wo.client || '', parent_asset_id: w.parent || wo.equipId || '', subasset_codes: (w.lines || []).map(function (l) { return l.code || l.cls; }),
      lines: (w.lines || []).map(function (l) { return { code: l.code, class: l.cls, acs: l.acs, condition_d: l.d, score: l.score, priority: l.priority ? 'P' + l.priority : '' }; }),
      priority: h.priority ? 'P' + h.priority : '', calculated_priority: h.calcPriority ? 'P' + h.calcPriority : '', effective_priority: e.effective ? 'P' + e.effective : '',
      escalated: !!(e.flags && e.flags.indexOf('escalated') >= 0), override: w.override || null, score: h.score == null ? null : h.score, reason: h.reason || '', floors_applied: h.floors || [],
      respond_by: h.respondBy || '', make_safe_by: h.makeSafeBy || '', due_at: h.dueAt || '', work_type: wo.type || wo.workType || '', trade_required: h.trade || '',
      location_hint: wo.locOnSite || wo.location || '', job_details: wo.details || '', parts_ready: wo.partsReady === 'Yes' ? true : wo.partsReady === 'No' ? false : null,
      estimated_duration_h: wo.estHours ? +wo.estHours : null, access_window: wo.accessWindow || '', status: STATUS_MAP[wo.status] || wo.status || '', raised_at: w.raisedAt || '', created_at: new Date().toISOString()
    };
  }
  function notify(env) {
    try { root.dispatchEvent(new CustomEvent('fsw:scheduler-push', { detail: env })); } catch (_) {}
    try { if (chan) chan.postMessage(env); } catch (_) {}
  }
  /** Adds a versioned envelope to the outbox. Caller must save the WO afterwards (wo.sch changes). */
  function enqueue(wo, why) {
    if (!wo || !wo.wpi || !wo.wpi.header) return null;
    wo.sch = wo.sch || { version: 0 };
    wo.sch.version += 1;
    var e = W.effective(wo.wpi, new Date(), stateOf(wo));
    wo.sch.lastEff = e ? e.effective : null; wo.sch.lastSig = signature(wo);
    var env = { id: 'WO#' + wo.wo + '@v' + wo.sch.version, wo: wo.wo, version: wo.sch.version, why: why || '', createdAt: new Date().toISOString(), status: 'queued', attempts: 0, lastError: '', payload: buildPayload(wo, wo.sch.version) };
    var ob = outbox();
    ob.forEach(function (x) { if (x.wo === wo.wo && x.status === 'queued') x.status = 'superseded'; });
    ob.push(env); saveOutbox(ob); notify(env);
    return env;
  }
  function enqueueIfChanged(wo, beforeSig, why) {
    if (!wo || !wo.wpi || !wo.wpi.header) return null;
    if (beforeSig && beforeSig === signature(wo)) return null;
    return enqueue(wo, why);
  }
  function flush() {
    var cfg = config();
    var ob = outbox(), queued = ob.filter(function (x) { return x.status === 'queued' || x.status === 'failed'; });
    if (!cfg.endpoint) return Promise.resolve({ mode: 'outbox', pending: queued.length });
    var sent = 0, failed = 0;
    return queued.reduce(function (p, env) {
      return p.then(function () {
        return fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': env.id }, body: JSON.stringify(env.payload) })
          .then(function (r) { env.attempts++; if (r.ok) { env.status = 'sent'; env.lastError = ''; sent++; } else { env.status = 'failed'; env.lastError = 'HTTP ' + r.status; failed++; } })
          .catch(function (err) { env.attempts++; env.status = 'failed'; env.lastError = String(err && err.message || err); failed++; });
      });
    }, Promise.resolve()).then(function () { saveOutbox(ob); return { mode: 'endpoint', sent: sent, failed: failed }; });
  }
  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportJson() {
    var items = outbox().filter(function (x) { return x.status === 'queued' || x.status === 'failed'; });
    download('fsw-scheduler-outbox-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ exportedAt: new Date().toISOString(), site: 'PUM-01', items: items.map(function (x) { return x.payload; }) }, null, 2));
    return items.length;
  }

  // ---------- escalation watcher: re-push pushed WOs whose effective priority has changed ----------
  function watch(getWo, saveWo, onPush) {
    function tick() {
      var list = getWo(), changed = false;
      list.forEach(function (w) {
        if (!w.sch || !w.wpi || !w.wpi.header || !isOpenWo(w)) return;
        var e = W.effective(w.wpi, new Date(), stateOf(w));
        if (e && e.effective !== w.sch.lastEff) { enqueue(w, 'priority escalated to P' + e.effective + ' (response target missed)'); changed = true; }
      });
      if (changed) { saveWo(); if (onPush) onPush(); }
    }
    tick(); return setInterval(tick, 60000);
  }

  // ---------- queue modal ----------
  function items(srList, woList) {
    var now = new Date(), out = [];
    srList.forEach(function (s) {
      if (s.convertedWo || ['Rejected', 'Deferred'].indexOf(s.triage) >= 0) return;
      out.push(item('sr', s.sr, s, { closed: false, started: false }, now));
    });
    woList.forEach(function (w) { if (isOpenWo(w)) out.push(item('wo', w.wo, w, stateOf(w), now)); });
    return out.sort(function (a, b) {
      if (!a.eff && !b.eff) return 0; if (!a.eff) return 1; if (!b.eff) return -1;
      return W.compare({ effective: a.eff.effective, score: a.eff.score, dueAt: a.eff.dueAt, dimsHigh: a.rec.wpi.header.dimsHigh, raisedAt: U.toDate(a.rec.wpi.raisedAt) },
                       { effective: b.eff.effective, score: b.eff.score, dueAt: b.eff.dueAt, dimsHigh: b.rec.wpi.header.dimsHigh, raisedAt: U.toDate(b.rec.wpi.raisedAt) });
    });
  }
  function item(kind, id, rec, state, now) {
    return { kind: kind, id: id, rec: rec, state: state, eff: rec.wpi && rec.wpi.header ? W.effective(rec.wpi, now, state) : null };
  }
  /** opts: getSr, getWo, saveWo, onOpen(kind,id), toast(msg,type), authorise() optional */
  function openQueue(opts) {
    opts = opts || {};
    var getSr = opts.getSr || function () { return read(SR_KEY, []); }, getWo = opts.getWo || function () { return read(WO_KEY, []); };
    var saveWo = opts.saveWo || function () { write(WO_KEY, getWo()); };
    var toast = opts.toast || function () {};
    var m = UI.ensureModal('wpi-queue'), box = m.firstChild; box.style.maxWidth = '980px';
    function draw() {
      var list = items(getSr(), getWo()), ob = outbox(), pend = ob.filter(function (x) { return x.status === 'queued' || x.status === 'failed'; }).length, cfg = config();
      var rows = list.map(function (it, i) {
        var h = it.rec.wpi && it.rec.wpi.header, e = it.eff, ref = (it.kind === 'sr' ? 'SR#' : 'WO#') + it.id;
        var flags = e ? (e.effective !== h.priority ? '<span class="wpi-flag esc">escalated</span>' : '') + (e.flags.indexOf('overdue') >= 0 ? '<span class="wpi-flag over">overdue</span>' : '') : '';
        var pushed = it.kind === 'wo' ? (it.rec.sch ? 'v' + it.rec.sch.version : '—') : 'convert first';
        return '<tr><td>' + (it.kind === 'wo' && e ? '<input type="checkbox" data-push="' + esc(it.id) + '"/>' : '') + '</td><td>' + (e ? i + 1 : '—') + '</td>' +
          '<td><a href="#" data-open="' + it.kind + ':' + esc(it.id) + '"><b>' + ref + '</b></a></td><td>' + esc(it.rec.client || '') + '<div class="wpi-meta">' + esc(it.rec.site || it.rec.location || '') + '</div></td>' +
          '<td>' + esc(h ? (it.rec.wpi.lines[0] ? it.rec.wpi.lines[0].name : '') : (it.rec.details || '').slice(0, 50)) + '</td><td>' + (e ? W.badgeHtml(e.effective, { score: h.score }) + flags : '<span class="wpi-meta">Not scored</span>') + '</td>' +
          '<td>' + (e ? U.fmtDateTime(e.respondBy) : '') + '</td><td>' + (e ? U.fmtDate(e.dueAt) : '') + '</td><td>' + esc(it.rec.status || it.rec.triage || '') + '</td><td>' + pushed + '</td></tr>';
      }).join('');
      box.innerHTML = '<h3>Priority Queue</h3><div class="wpi-meta">Open service requests and work orders ranked by priority, then score, then due date, then number of high dimensions, then age. Only work orders are pushed to the scheduler.</div>' +
        '<div style="overflow:auto"><table><thead><tr><th></th><th>#</th><th>Ref</th><th>Client / site</th><th>Item</th><th>Priority</th><th>Respond by</th><th>Due</th><th>Status</th><th>Pushed</th></tr></thead><tbody>' + (rows || '<tr><td colspan="10" class="wpi-meta">Nothing open.</td></tr>') + '</tbody></table></div>' +
        '<div class="wpi-meta">Outbox: ' + pend + ' waiting · ' + (cfg.endpoint ? 'endpoint ' + esc(cfg.endpoint) : 'no endpoint set (export JSON or listen for the browser event)') + '</div>' +
        '<div class="wpi-actions"><button class="wpi-btn" data-all>Select all work orders</button><button class="wpi-btn" data-push-sel>Push selected</button><button class="wpi-btn" data-send>Send outbox now</button>' +
        '<button class="wpi-btn" data-export>Export outbox JSON</button><button class="wpi-btn" data-cfg>Scheduler endpoint</button><button class="wpi-btn" data-close>Close</button></div>';
      box.querySelector('[data-close]').onclick = function () { m.classList.remove('open'); };
      box.querySelector('[data-all]').onclick = function () { box.querySelectorAll('[data-push]').forEach(function (c) { c.checked = true; }); };
      box.querySelector('[data-push-sel]').onclick = function () {
        var ids = Array.prototype.map.call(box.querySelectorAll('[data-push]:checked'), function (c) { return c.dataset.push; });
        if (!ids.length) { toast('Tick at least one work order', 'error'); return; }
        var wos = getWo(); ids.forEach(function (id) { var w = wos.filter(function (x) { return x.wo === id; })[0]; if (w) enqueue(w, 'manual push from priority queue'); });
        saveWo(); toast(ids.length + ' work order(s) queued for the scheduler', 'success');
        flush().then(function (r) { if (r.mode === 'endpoint') toast('Sent ' + r.sent + (r.failed ? ', failed ' + r.failed : ''), r.failed ? 'error' : 'success'); draw(); });
      };
      box.querySelector('[data-send]').onclick = function () {
        flush().then(function (r) { toast(r.mode === 'endpoint' ? 'Sent ' + r.sent + (r.failed ? ', failed ' + r.failed : '') : 'No endpoint set: use Export outbox JSON', r.failed ? 'error' : 'success'); draw(); });
      };
      box.querySelector('[data-export]').onclick = function () { var n = exportJson(); toast(n + ' payload(s) exported', 'success'); };
      box.querySelector('[data-cfg]').onclick = function () {
        var go = opts.authorise ? opts.authorise() : Promise.resolve();
        go.then(function () {
          var v = prompt('Scheduler endpoint URL (HTTPS, accepts POST JSON). Leave empty for outbox only.', config().endpoint || '');
          if (v === null) return; write(CONFIG_KEY, { endpoint: v.trim() }); if (opts.onConfig) opts.onConfig(v.trim()); draw();
        }).catch(function () {});
      };
      box.querySelectorAll('[data-open]').forEach(function (a) { a.onclick = function (ev) { ev.preventDefault(); var p = a.dataset.open.split(':'); m.classList.remove('open'); if (opts.onOpen) opts.onOpen(p[0], p[1]); }; });
    }
    draw(); m.classList.add('open');
  }

  root.FSW_SCHED = { enqueue: enqueue, enqueueIfChanged: enqueueIfChanged, signature: signature, buildPayload: buildPayload, flush: flush, exportJson: exportJson, outbox: outbox, config: config,
                     openQueue: openQueue, items: items, watch: watch, statusMap: STATUS_MAP, isOpenWo: isOpenWo };
})(window);
