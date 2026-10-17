/**
 * FORECOURT WORKS LTD — SR & WO Registers (Controlled Document)
 * Three-tab shell: Service Request Register + Work Order Register + embedded Quotation Builder
 * Layered: Overview (summary rows) ↔ Detail (Expand)
 * SR Convert → creates WO, lifts data, opens WO detail
 */
(function () {
  'use strict';

  const SR_KEY = 'fsw_sr_register_v1';
  const WO_KEY = 'fsw_wo_register_v2';
  const AUDIT_KEY = 'fsw_registers_audit_v1';

  const WO_STATUS = ['Completed', 'Ongoing', 'Pending', 'Started', 'Stopped', 'Cancelled'];
  const SR_STATUS = ['Received', 'Under Review', 'Qualified', 'Rejected', 'Deferred'];
  const WORK_TYPES = ["Planned Inspection/Service", "Unplanned Inspection/Service", "Repair - Emergency", "Repair - Non Emergency", "Rework", "Calibration", "Site Survey", "Installation", "Others"];
  const TYPE_OPTS = WORK_TYPES; // harmonised work type across SR / WO / Quotation

  const ADMINS = [
    { name: 'Oguta', hash: 'e4dd5bd04b25dd2902a92a4a14217d922dffd0786e2e786d34ae794689871efc' },
    { name: 'Kamando', hash: '27da462fd0cbe25e7b8c04cb674db6a7a7488fcd16c72ccb1bd86135cb2585b7' }
  ];

  // Historical WO seed 0001–0068 (commercial columns purged; title → details)
const WO_SEED = [{"wo":"0001","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Completed","client":"MULTI DEAL","location":"KOMBANI","details":"TYRE INFLATOR INSTALLATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0002","type":"Repair - Non Emergency","entry":"24.12.25","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BUNYALA RD","details":"AST PIPING","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0003","type":"Repair - Non Emergency","entry":"07.01.26","start":"","end":"","status":"Completed","client":"AINUSHAMSI","location":"KALOLENI","details":"FDU#4 (WAYNE 3G) KEYPADS","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0004","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Completed","client":"NOMAD","location":"KISERIAN","details":"PM Inspections & CA","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0005","type":"Repair - Non Emergency","entry":"07.01.26","start":"","end":"","status":"Completed","client":"AINU","location":"PUMWANI","details":"FDU#003 REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0006","type":"Repair - Non Emergency","entry":"07.01.26","start":"","end":"","status":"Completed","client":"AINU","location":"KALOLENI","details":"FDU#01, GILBERCO VEEDER ROOT","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0007","type":"Repair - Non Emergency","entry":"29.11.2025","start":"","end":"","status":"Completed","client":"SALAMA ROADS","location":"MALINDI","details":"FDU#2 REPAIR (TOKHEIM)","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0008","type":"Repair - Non Emergency","entry":"31.07.2025","start":"","end":"","status":"Completed","client":"SALAMA ROADS","location":"SABAKI","details":"COMPRESSED AIR PIPING - Rework","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0009","type":"Repair - Non Emergency","entry":"20.12.2025","start":"","end":"","status":"Completed","client":"MOSHA","location":"MARIAKANI","details":"PM Inspections & CA","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0010","type":"Repair - Non Emergency","entry":"02.12.2025","start":"","end":"","status":"Completed","client":"HAKUUZ","location":"TONONOKA","details":"GARAGE EQUIPMENT SERVICING","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0011","type":"Repair - Non Emergency","entry":"10.10.2025","start":"","end":"","status":"Completed","client":"HAKUUZ","location":"TONONOKA","details":"WHEEL ALIGNMENT MACHINE INSTALLATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0012","type":"Repair - Non Emergency","entry":"07.01.2026","start":"","end":"","status":"Completed","client":"AINUSHAMSI","location":"KALOLENI","details":"GENSET ROOM & M.HOLE REPAIRS","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0013","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Completed","client":"TARABI","location":"NAMANGA","details":"AIR COMPRESSOR REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0014","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Completed","client":"NOMAD","location":"NGONG","details":"FDU CALIBRATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0015","type":"Repair - Non Emergency","entry":"17.01.2026","start":"","end":"","status":"Completed","client":"AINUSHAMSI","location":"PUMWANI","details":"FDU PM Inspections & Servicing","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0016","type":"Repair - Non Emergency","entry":"19.01.2026","start":"","end":"","status":"Completed","client":"MOSHA","location":"MARIAKANI","details":"AIR LINE RELOCATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0017","type":"Repair - Non Emergency","entry":"20.01.2026","start":"","end":"","status":"Completed","client":"MULTI DEAL","location":"KOMBANI","details":"AIR COMPRESSOR RELOCATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0018","type":"Repair - Non Emergency","entry":"21.01.2026","start":"","end":"","status":"Completed","client":"AINUSHAMSI","location":"MARIAKANI","details":"FDU REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0019","type":"Repair - Non Emergency","entry":"31.07.2025","start":"","end":"","status":"Completed","client":"HAKUUZ","location":"MOMBASA","details":"REWORK - AIR COMPRESSOR REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0020","type":"Repair - Non Emergency","entry":"28.01.2026","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BUNYALA","details":"FDU PM","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0021","type":"Repair - Non Emergency","entry":"28.01.2026","start":"","end":"","status":"Ongoing","client":"TAHMEED","location":"BONJE","details":"REMEDIATION OF UST'S","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0022","type":"Repair - Non Emergency","entry":"03.02.2026","start":"","end":"","status":"Completed","client":"KENNYLAX","location":"LONGISA","details":"FDU's HOSE PURCHASE & DELIVERY","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0023","type":"Repair - Non Emergency","entry":"05.02.2026","start":"","end":"","status":"Completed","client":"MASS","location":"UTANGE","details":"FDU MAINTENANCE","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0024","type":"Repair - Non Emergency","entry":"05.02.2026","start":"","end":"","status":"Pending","client":"RADIUS CIRCLE","location":"KILIFI","details":"5T JACK SEALS REPLACEMENT","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0025","type":"Repair - Non Emergency","entry":"05.02.2026","start":"","end":"","status":"Completed","client":"RANWAY","location":"KIKAMBALA","details":"COMPRESSED AIR RETICULATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0026","type":"Repair - Non Emergency","entry":"05.02.2026","start":"","end":"","status":"Pending","client":"MANCO","location":"MIKINDANI","details":"UST FABRICATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0027","type":"Repair - Non Emergency","entry":"18.02.2026","start":"","end":"","status":"Pending","client":"TRIKAKA","location":"UKUNDA","details":"GENSET SERVICE","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0028","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Pending","client":"STARWAYS","location":"PORT REITZ","details":"FUEL SYSTEM PIPING","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0029","type":"Repair - Non Emergency","entry":"07.03.2026","start":"","end":"","status":"Completed","client":"MOSHA","location":"MARIAKANI","details":"AIRGUAGE REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0030","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Pending","client":"MOSHA","location":"MARIAKANI","details":"MANHOLE COVER GASKET","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0031","type":"Repair - Non Emergency","entry":"13.03.2026","start":"","end":"","status":"Completed","client":"NEWLIFE","location":"MAVUENI","details":"SUPPLY AND INSTALLATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0032","type":"Repair - Non Emergency","entry":"16.03.2026","start":"","end":"","status":"Completed","client":"NEWLIFE","location":"MAVUENI","details":"SAFETY DECALS SUPPLY","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0033","type":"Repair - Non Emergency","entry":"02.12.2025","start":"","end":"","status":"Completed","client":"NYALI LINKS RD","location":"MAVUENI","details":"SUPPLY OF STICK ON WEIGHTS","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0034","type":"Repair - Non Emergency","entry":"20.03.2026","start":"","end":"","status":"Pending","client":"NEWLIFE","location":"MAVUENI","details":"GENSET PM SERVICE","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0035","type":"Repair - Non Emergency","entry":"25.03.2026","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BUNYALA","details":"FDU FLOW RATE RECTIFICATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0036","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Completed","client":"MULTIDEAL","location":"KOMBANI","details":"AIR COMPRESSOR MAINTENANCE","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0037","type":"Repair - Non Emergency","entry":"06.04.2026","start":"","end":"","status":"Pending","client":"EAGOL","location":"VIPINGO","details":"GARAGE EQ'PMENT INSTALLATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0038","type":"Repair - Non Emergency","entry":"07.04.2026","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BONJE","details":"AST#004 LADDER FABRICATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0039","type":"Repair - Non Emergency","entry":"08.04.2026","start":"","end":"","status":"Completed","client":"NOMAD","location":"KISERIAN","details":"FDU TROUBLESHOOTING & REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0040","type":"Repair - Non Emergency","entry":"10.04.2026","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BUNYALA","details":"REWORK - CHANGE OF CLOGGED FILTER","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0041","type":"Repair - Non Emergency","entry":"11.04.2026","start":"","end":"","status":"Pending","client":"TAHMEED","location":"BUNYALA","details":"TANK#002 CLEANING","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0042","type":"Repair - Non Emergency","entry":"11.04.2026","start":"","end":"","status":"Pending","client":"TAHMEED","location":"BUNYALA","details":"AGO TRANSFER PUMP SERVICING","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0043","type":"Repair - Non Emergency","entry":"11.04.2026","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BONJE","details":"CALIBRATION OF TANK#004","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0044","type":"Repair - Non Emergency","entry":"11.04.2026","start":"","end":"","status":"Pending","client":"TAHMEED","location":"BONJE","details":"FDU, AST, BLACKMER & STP PM","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0045","type":"Repair - Non Emergency","entry":"18.04.2026","start":"","end":"","status":"Completed","client":"KENNYLAX","location":"LONGISA","details":"SUPPLY OF 2PCS \u00be\" FDU HOSE","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0046","type":"Repair - Non Emergency","entry":"28.04.2026","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BONJE","details":"AST#004 PIPING","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0047","type":"Repair - Non Emergency","entry":"28.04.2026","start":"","end":"","status":"Completed","client":"TAHMEED","location":"BONJE","details":"STP MECH/ELECT INSTALLATION TK#004","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0048","type":"Repair - Non Emergency","entry":"04.05.2026","start":"09.07.2026","end":"09.07.2026","status":"Completed","client":"NOMAD","location":"KISERIAN","details":"WHEEL ALIGNMENT MACHINE REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0049","type":"Repair - Non Emergency","entry":"04.05.2026","start":"09.07.2026","end":"","status":"Ongoing","client":"NOMAD","location":"KISERIAN","details":"4 POST LIFT MAINTENANCE","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0050","type":"Repair - Non Emergency","entry":"21.05.2026","start":"","end":"","status":"Completed","client":"KENNYLAX","location":"LONGISA","details":"SUPPLY 3No. FDU V-Belt","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0051","type":"Repair - Non Emergency","entry":"02.06.2026","start":"","end":"","status":"Completed","client":"NOMAD","location":"KISERIAN","details":"WHIP HOSE REPLACEMENT","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0052","type":"Repair - Non Emergency","entry":"07.06.2026","start":"07.06.2026","end":"07.06.2026","status":"Ongoing","client":"MOSHA","location":"MARIAKANI","details":"REPAIR AIRGAUGE'S UNRESPONSIVE (+) BUTTON","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0053","type":"Repair - Non Emergency","entry":"09.07.2026","start":"09.07.2026","end":"","status":"Ongoing","client":"NEWLIFE","location":"MAVUENI 1","details":"FDU LEAK REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0054","type":"Repair - Non Emergency","entry":"09.07.2026","start":"09.07.2026","end":"","status":"Completed","client":"SALAMA ROADS","location":"MALINDI","details":"SALE OF TWIN TYRE CONNECTOR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0055","type":"Repair - Non Emergency","entry":"10.07.2026","start":"","end":"","status":"Pending","client":"NEWLIFE","location":"MAVUENI","details":"WHEEL ALIGNER DIAGNOSIS & REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0056","type":"Repair - Non Emergency","entry":"13.07.2026","start":"","end":"","status":"","client":"EAGOL-VIPINGO","location":"VIPINGO","details":"UST LID MODIFICATION & STP INSTALLATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0057","type":"Repair - Non Emergency","entry":"13.07.2026","start":"","end":"","status":"","client":"PETROSOMA","location":"SALGAA","details":"AIR COMPRESSOR SERVICE","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0058","type":"Repair - Non Emergency","entry":"27.07.2026","start":"27.07.2026","end":"28.07.2026","status":"Completed","client":"MULTI DEAL","location":"KOMBANI","details":"TYRE INFLATOR HOSE REPLACEMENT","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0059","type":"Repair - Non Emergency","entry":"01.08.2026","start":"","end":"","status":"","client":"MASS","location":"VOI","details":"FUEL SYSTEM PIPING","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0060","type":"Repair - Non Emergency","entry":"13.08.2026","start":"13.08.2026","end":"13.08.2026","status":"Completed","client":"MASS","location":"MAKUPA","details":"SUPPLY OF \u00be\" FDU HOSE - 1PC","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0061","type":"Repair - Non Emergency","entry":"17.08.2026","start":"17.08.2026","end":"17.08.2026","status":"Completed","client":"PMC","location":"NAIROBI","details":"SALES COMMISSION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0062","type":"Repair - Non Emergency","entry":"17.08.2026","start":"21.08.2026","end":"","status":"","client":"MULTI DEAL","location":"KOMBANI","details":"FRP MANHOLE COVER INSTALLATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0063","type":"Repair - Non Emergency","entry":"23.08.2026","start":"","end":"","status":"Completed","client":"MASS","location":"UTANGE","details":"REPAIR OF LLJ08 FLOWMETER","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0064","type":"Repair - Non Emergency","entry":"05.09.2026","start":"05.09.2026","end":"","status":"Completed","client":"AINUSHAMSI","location":"PUMWANI","details":"CONDITION INSPECTION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0065","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Ongoing","client":"MOSHA","location":"MARIAKANI","details":"CARWASH REPAIR","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0066","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"Completed","client":"NEW LIFE","location":"MAVUENI","details":"STP INSTALLATION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0067","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"","client":"AINUSHAMSI","location":"PUMWANI","details":"CONDITION INSPECTION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"},{"wo":"0068","type":"Repair - Non Emergency","entry":"","start":"","end":"","status":"","client":"PETROSOMA","location":"SALGAA","details":"MOTOR PROTECTION","sr":"","aiDone":false,"workType":"Repair - Non Emergency"}];

  let srRecords = [];
  let woRecords = [];
  let auditLog = [];
  let currentSection = 'sr';
  let detailCtx = null; // { kind: 'sr'|'wo', id: string }
  let pendingAuth = null;
  let deleteTarget = null;

  // ---------- utils ----------
  function summarizeEdits(before, after) {
    const keys = Object.keys(after || {});
    const parts = [];
    keys.forEach(k => {
      if (k === 'aiDone') return;
      const a = before && before[k];
      const b = after[k];
      if (String(a ?? '') !== String(b ?? '')) {
        parts.push(k + ': "' + String(a ?? '').slice(0, 40) + '" → "' + String(b ?? '').slice(0, 40) + '"');
      }
    });
    return parts.length ? parts.join('; ') : 'saved (no field changes detected)';
  }

  function statusBadge(status) {
    const s = status || '';
    const map = {
      'Completed': { bg: '#dcfce7', fg: '#166534', bd: '#86efac' },
      'Ongoing':   { bg: '#dbeafe', fg: '#1e40af', bd: '#93c5fd' },
      'Started':   { bg: '#e0e7ff', fg: '#3730a3', bd: '#a5b4fc' },
      'Pending':   { bg: '#fef3c7', fg: '#92400e', bd: '#fcd34d' },
      'Stopped':   { bg: '#fee2e2', fg: '#991b1b', bd: '#fca5a5' },
      'Cancelled': { bg: '#f3f4f6', fg: '#4b5563', bd: '#d1d5db' }
    };
    const c = map[s] || { bg: '#f3f4f6', fg: '#374151', bd: '#d1d5db' };
    return '<span class="status-pill" style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:0.7rem;font-weight:700;background:'+c.bg+';color:'+c.fg+';border:1px solid '+c.bd+';white-space:nowrap;">'+esc(s)+'</span>';
  }

  /** Coloured container for Work Type — used on overview rows and detail panels (all historical + future). */

  function normalizeWorkType(v) {
    if (!v) return 'Repair - Non Emergency';
    if (WORK_TYPES.indexOf(v) >= 0) return v;
    const legacy = {
      'Labour Only': 'Repair - Non Emergency',
      'Parts + Labour': 'Repair - Non Emergency',
      'Parts Only': 'Repair - Non Emergency',
      'Emergency Repair': 'Repair - Emergency',
      'Preventive Maintenance': 'Planned Inspection/Service',
      'Calibration': 'Calibration',
      'Installation / Commissioning': 'Installation',
      'Compliance Inspection': 'Planned Inspection/Service',
      'Other': 'Others',
      'Diagnosis & On-Site Corrective Repair + Calibration Verification': 'Repair - Non Emergency',
      'Preventive Maintenance (PM)': 'Planned Inspection/Service',
      'Calibration / Accuracy Verification': 'Calibration',
      'Compliance Audit / Inspection': 'Planned Inspection/Service',
      'Cleaning / Filter Change': 'Others'
    };
    return legacy[v] || 'Others';
  }

  function workTypeBadge(wt) {
    const s = wt || '';
    const map = {
      'Planned Inspection/Service':   { bg: '#ecfdf5', fg: '#065f46', bd: '#6ee7b7' },
      'Unplanned Inspection/Service': { bg: '#f0fdfa', fg: '#0f766e', bd: '#5eead4' },
      'Repair - Emergency':           { bg: '#fef2f2', fg: '#991b1b', bd: '#fca5a5' },
      'Repair - Non Emergency':       { bg: '#fff7ed', fg: '#9a3412', bd: '#fdba74' },
      'Rework':                       { bg: '#faf5ff', fg: '#6b21a8', bd: '#d8b4fe' },
      'Calibration':                  { bg: '#eff6ff', fg: '#1e40af', bd: '#93c5fd' },
      'Site Survey':                  { bg: '#f8fafc', fg: '#334155', bd: '#cbd5e1' },
      'Installation':                 { bg: '#eef2ff', fg: '#3730a3', bd: '#a5b4fc' },
      'Others':                       { bg: '#f3f4f6', fg: '#4b5563', bd: '#d1d5db' }
    };
    const c = map[s] || { bg: '#f3f4f6', fg: '#374151', bd: '#d1d5db' };
    const label = s || '—';
    return '<span class="worktype-pill" style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:0.68rem;font-weight:700;background:'+c.bg+';color:'+c.fg+';border:1px solid '+c.bd+';white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;">'+esc(label)+'</span>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function toast(msg, type) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => el.classList.remove('show'), 3200);
  }
  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function verifyAdmin(name, password) {
    const n = (name || '').trim().toLowerCase();
    const hash = await sha256Hex(password || '');
    return ADMINS.find(a => a.name.toLowerCase() === n && a.hash === hash) || null;
  }
  function padNum(n) {
    return String(n).padStart(5, '0');
  }
  function nextSrNo() {
    let max = 70; // start at 00071
    srRecords.forEach(r => {
      const n = parseInt(r.sr, 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return padNum(max + 1);
  }
  function nextWoNo() {
    let max = 70;
    woRecords.forEach(r => {
      const n = parseInt(r.wo, 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return padNum(max + 1);
  }
  function todayDisp() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2);
  }

  // ---------- storage ----------
  function loadAll() {
    try {
      const raw = localStorage.getItem(SR_KEY);
      srRecords = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(srRecords)) srRecords = [];
    } catch (_) { srRecords = []; }
    try {
      const raw = localStorage.getItem(WO_KEY);
      if (raw) {
        woRecords = JSON.parse(raw);
        if (!Array.isArray(woRecords)) woRecords = [];
      } else {
        woRecords = JSON.parse(JSON.stringify(WO_SEED));
        saveWo();
      }
    } catch (_) {
      woRecords = JSON.parse(JSON.stringify(WO_SEED));
    }
    // Ensure every WO (seed + stored + future) uses harmonised Work Type labels
    let woNorm = false;
    woRecords.forEach(r => {
      const nt = normalizeWorkType(r.type || r.workType);
      if (r.type !== nt || r.workType !== nt) { r.type = nt; r.workType = nt; woNorm = true; }
    });
    if (woNorm) saveWo();
    srRecords.forEach(r => {
      const nt = normalizeWorkType(r.workType);
      if (r.workType !== nt) r.workType = nt;
    });
    try {
      const raw = localStorage.getItem(AUDIT_KEY);
      auditLog = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(auditLog)) auditLog = [];
    } catch (_) { auditLog = []; }
  }
  function saveSr() {
    try { localStorage.setItem(SR_KEY, JSON.stringify(srRecords)); } catch (_) {}
  }
  function saveWo() {
    try { localStorage.setItem(WO_KEY, JSON.stringify(woRecords)); } catch (_) {}
  }
  function logChange(action, adminName, ref, detail) {
    auditLog.unshift({
      action, admin: adminName, ref: ref || '', detail: detail || '',
      at: new Date().toISOString()
    });
    if (auditLog.length > 500) auditLog = auditLog.slice(0, 500);
    try { localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog)); } catch (_) {}
  }

  // ---------- auth ----------
  function requestAuth(actionLabel, meta) {
    return new Promise((resolve, reject) => {
      pendingAuth = { resolve, reject, meta: meta || {}, actionLabel };
      document.getElementById('auth-title').textContent = 'Admin Authorisation Required';
      document.getElementById('auth-msg').textContent =
        'Authorise to ' + actionLabel + '. Enter Document Control Admin name and password.';
      document.getElementById('auth-name').value = '';
      document.getElementById('auth-pass').value = '';
      document.getElementById('auth-error').classList.remove('show');
      document.getElementById('auth-modal').classList.add('open');
      setTimeout(() => document.getElementById('auth-name').focus(), 50);
    });
  }
  async function onAuthConfirm() {
    const name = document.getElementById('auth-name').value;
    const pass = document.getElementById('auth-pass').value;
    const admin = await verifyAdmin(name, pass);
    if (!admin) {
      document.getElementById('auth-error').classList.add('show');
      return;
    }
    document.getElementById('auth-modal').classList.remove('open');
    const p = pendingAuth;
    pendingAuth = null;
    if (p && p.resolve) p.resolve(admin);
  }
  function onAuthCancel() {
    document.getElementById('auth-modal').classList.remove('open');
    const p = pendingAuth;
    pendingAuth = null;
    if (p && p.reject) p.reject(new Error('cancelled'));
  }

  // ---------- section switch ----------
  const SECTIONS = ['sr', 'qt', 'wo'];  // process flow: Service Request > Quotation > Work Order
  function setHash(h) {
    const want = '#' + h;
    if (location.hash === want) return;
    try { history.pushState(null, '', want); } catch (_) {}
  }
  function setHeaderHeight() {
    const hd = document.querySelector('.app-header');
    if (hd) document.documentElement.style.setProperty('--hdr', hd.offsetHeight + 'px');
  }
  function showSection(sec, opts) {
    opts = opts || {};
    if (SECTIONS.indexOf(sec) < 0) sec = 'sr';
    currentSection = sec;
    try { localStorage.setItem('fsw_register_section', sec); } catch (_) {}
    document.querySelectorAll('.section-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.section === sec);
    });
    SECTIONS.forEach(k => {
      document.getElementById('section-' + k).classList.toggle('active', sec === k);
    });
    if (!opts.noHash) setHash(sec);
    setHeaderHeight();
    if (sec === 'sr') renderSrTable();
    else if (sec === 'wo') renderWoTable();
    else showQuotePanel();
  }

  // ---------- routing: #sr  #wo  #qt  #sr/00071  #wo/00071  #qt/00068 ----------
  function route() {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return false;
    const parts = raw.split('/');
    const sec = parts[0], id = parts[1] || '';
    if (SECTIONS.indexOf(sec) < 0) return false;
    if (sec === 'qt') {
      closeDetail(true);
      showSection('qt', { noHash: true });
      if (id && id !== 'new') quoteCommand({ mode: 'open', qt: 'QT#' + id }, true);
      return true;
    }
    showSection(sec, { noHash: true });
    if (id) { if (sec === 'sr') openSrDetail(id); else openWoDetail(id); }
    else closeDetail(true);
    return true;
  }

  // ---------- Quotation tab bridge (embedded quotation app, same files also run standalone) ----------
  let qtReady = false;
  let qtPending = null;
  function qtFrame() { return document.getElementById('qt-frame'); }
  function ensureQtFrame() {
    const f = qtFrame();
    if (f && !f.getAttribute('src')) f.setAttribute('src', f.dataset.src);
  }
  function showQuotePanel() {
    ensureQtFrame();                       // load only once the panel is visible so signature pads can size themselves
    if (qtReady) {
      const f = qtFrame();
      f.contentWindow.postMessage({ type: 'fsw-quote-visible' }, '*');
      flushQuote();
    }
  }
  function flushQuote() {
    if (!qtPending || !qtReady) return;
    qtFrame().contentWindow.postMessage(qtPending, '*');
    qtPending = null;
  }
  function quoteCommand(cmd, fromRoute) {
    closeDetail(true);
    if (!fromRoute) showSection('qt', { noHash: true });
    if (!fromRoute) setHash(cmd.mode === 'open' && cmd.qt ? 'qt/' + cmd.qt.replace(/\D/g, '') : 'qt');
    qtPending = Object.assign({ type: 'fsw-quote-open' }, cmd);
    ensureQtFrame();
    flushQuote();
  }
  function mapQtType(t) {
    t = t || '';
    if (/labour only/i.test(t)) return 'Labour Only';
    if (/parts only/i.test(t)) return 'Parts Only';
    return 'Labour & Parts';
  }
  function clientLine(rec, siteKey) {
    return [rec.client, rec[siteKey]].filter(Boolean).join(' \u00b7 ');
  }
  function quoteForSr(srNo) {
    const rec = srRecords.find(r => r.sr === srNo);
    if (!rec) return;
    if (rec.quoteNo) quoteCommand({ mode: 'open', qt: rec.quoteNo, link: { srNo } });
    else quoteCommand({
      mode: 'new', link: { srNo },
      prefill: { client: clientLine(rec, 'site'), contact: rec.contact, scope: rec.details, qtType: mapQtType(rec.workType) }
    });
  }
  function quoteForWo(woNo) {
    const rec = woRecords.find(r => r.wo === woNo);
    if (!rec) return;
    const srRec = rec.sr ? srRecords.find(r => r.sr === rec.sr) : null;
    const existing = rec.quoteNo || (srRec && srRec.quoteNo) || '';
    const lnk = { woNo, srNo: rec.sr || '' };
    if (existing) quoteCommand({ mode: 'open', qt: existing, link: lnk });
    else quoteCommand({
      mode: 'new', link: lnk,
      prefill: { client: clientLine(rec, 'location'), contact: rec.contact, scope: rec.details, qtType: mapQtType(rec.type) }
    });
  }
  function onShellMessage(e) {
    const f = qtFrame();
    if (!f || e.source !== f.contentWindow) return;
    const d = e.data || {};
    if (d.type === 'fsw-quote-ready') {
      qtReady = true;
      flushQuote();
      return;
    }
    if (['fsw-quote-created', 'fsw-quote-updated', 'fsw-quote-opened'].indexOf(d.type) < 0 || !d.qt) return;
    // keep the SR / WO record pointing at its quotation
    if (d.srNo) {
      const sr = srRecords.find(r => r.sr === d.srNo);
      if (sr && (sr.quoteNo !== d.qt || sr.quoteTotal !== d.total)) {
        sr.quoteNo = d.qt; sr.quoteTotal = d.total; sr.quoteReq = 'Yes'; saveSr();
      }
    }
    if (d.woNo) {
      const wo = woRecords.find(r => r.wo === d.woNo);
      if (wo && (wo.quoteNo !== d.qt || wo.quoteTotal !== d.total)) { wo.quoteNo = d.qt; wo.quoteTotal = d.total; saveWo(); }
    }
  }

  // ---------- SR filters & render ----------
  function filteredSr() {
    let list = srRecords.slice();
    const clientQ = (document.getElementById('sr-q-client').value || '').trim().toLowerCase();
    const noQ = (document.getElementById('sr-q-no').value || '').trim();
    const statusQ = document.getElementById('sr-q-status').value;
    const convQ = document.getElementById('sr-q-converted').value;
    if (clientQ) list = list.filter(r => (r.client || '').toLowerCase().includes(clientQ));
    if (noQ) list = list.filter(r => (r.sr || '').includes(noQ));
    if (statusQ) list = list.filter(r => r.triage === statusQ);
    if (convQ === 'yes') list = list.filter(r => !!r.convertedWo);
    if (convQ === 'no') list = list.filter(r => !r.convertedWo);
    list.sort((a, b) => parseInt(b.sr, 10) - parseInt(a.sr, 10));
    return list;
  }
  function renderSrTable() {
    const list = filteredSr();
    const tbody = document.getElementById('sr-tbody');
    const empty = document.getElementById('sr-empty');
    document.getElementById('sr-view-info').textContent = list.length + ' of ' + srRecords.length + ' request(s)';
    if (list.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = srRecords.length === 0 ? 'block' : 'block';
      empty.textContent = srRecords.length === 0
        ? 'No service requests yet. Click + ADD SR to create the first entry (SR#00071).'
        : 'No requests match the current filters.';
      return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = list.map(rec => {
      const conv = !!rec.convertedWo;
      const statusClass = 'status-' + (rec.triage || '').replace(/\s/g, '\\ ');
      return `<tr class="${conv ? 'converted-row' : ''}" data-sr="${esc(rec.sr)}">
        <td><strong>SR#${esc(rec.sr)}</strong></td>
        <td>${esc(rec.requestDate || '')}</td>
        <td>${esc(rec.client || '')}</td>
        <td>${esc(rec.site || '')}</td>
        <td class="details-col">${esc(rec.details || '')}</td>
        <td>${workTypeBadge(rec.workType)}</td>
        <td><span class="${statusClass}">${esc(rec.triage || '')}</span></td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn-edit" data-action="expand-sr" data-sr="${esc(rec.sr)}">Edit</button>
            <button type="button" class="btn-quote" data-action="quote-sr" data-sr="${esc(rec.sr)}" title="${rec.quoteNo ? 'Open ' + esc(rec.quoteNo) : 'Create quotation for this request'}">${rec.quoteNo ? esc(rec.quoteNo) : 'Quotation'}</button>
            ${conv
              ? `<span class="mark-converted" title="Converted to WO#${esc(rec.convertedWo)}">✓ Converted</span>`
              : `<button type="button" class="btn-convert" data-action="convert-sr" data-sr="${esc(rec.sr)}"
                   ${(rec.triage === 'Qualified' || rec.emergency) ? '' : 'disabled title="Qualify (or set Emergency) before convert"'}>
                   Convert to WO
                 </button>`}
            <button type="button" class="btn btn-outline btn-sm" data-action="delete-sr" data-sr="${esc(rec.sr)}" style="color:var(--danger);border-color:#fecaca;">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // ---------- WO filters & render ----------
  function filteredWo() {
    let list = woRecords.slice();
    const clientQ = (document.getElementById('wo-q-client').value || '').trim().toLowerCase();
    const noQ = (document.getElementById('wo-q-no').value || '').trim();
    const statusQ = document.getElementById('wo-q-status').value;
    if (clientQ) list = list.filter(r => (r.client || '').toLowerCase().includes(clientQ));
    if (noQ) list = list.filter(r => (r.wo || '').includes(noQ));
    if (statusQ) list = list.filter(r => r.status === statusQ);
    // simple date filter left for later refinement
    list.sort((a, b) => parseInt(b.wo, 10) - parseInt(a.wo, 10));
    return list;
  }
  function renderWoTable() {
    const list = filteredWo();
    const tbody = document.getElementById('wo-tbody');
    document.getElementById('wo-view-info').textContent = list.length + ' of ' + woRecords.length + ' work order(s)';
    tbody.innerHTML = list.map(rec => {
      return `<tr data-wo="${esc(rec.wo)}">
        <td><strong>WO#${esc(rec.wo)}</strong>${rec.sr ? '<div style="font-size:0.65rem;color:#6b7280">from SR#' + esc(rec.sr) + '</div>' : ''}</td>
        <td>${workTypeBadge(rec.type || rec.workType)}</td>
        <td>${esc(rec.entry || '')}</td>
        <td>${esc(rec.start || '')}</td>
        <td>${esc(rec.end || '')}</td>
        <td>${statusBadge(rec.status)}</td>
        <td>${esc(rec.client || '')}</td>
        <td>${esc(rec.location || '')}</td>
        <td class="details-col">${esc(rec.details || '')}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn-edit" data-action="expand-wo" data-wo="${esc(rec.wo)}">Edit</button>
            <button type="button" class="btn-quote" data-action="quote-wo" data-wo="${esc(rec.wo)}" title="${rec.quoteNo ? 'Open ' + esc(rec.quoteNo) : 'Create quotation for this work order'}">${rec.quoteNo ? esc(rec.quoteNo) : 'Quotation'}</button>
            <button type="button" class="btn btn-outline btn-sm" data-action="delete-wo" data-wo="${esc(rec.wo)}" style="color:var(--danger);border-color:#fecaca;">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // ---------- Detail views ----------
  function openSrDetail(srNo) {
    const rec = srRecords.find(r => r.sr === srNo);
    if (!rec) return;
    detailCtx = { kind: 'sr', id: srNo };
    document.getElementById('detail-title').textContent = 'Service Request SR#' + srNo;
    document.getElementById('detail-meta').textContent =
      (rec.convertedWo ? 'Converted to WO#' + rec.convertedWo + ' · ' : '') +
      (rec.triage || '') + ' · ' + (rec.client || '');
    const body = document.getElementById('detail-body');
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-field"><label>SR Number</label><input type="text" id="d-sr" value="${esc(rec.sr)}" readonly /></div>
        <div class="detail-field"><label>Request Date</label><input type="text" id="d-requestDate" value="${esc(rec.requestDate || '')}" placeholder="DD.MM.YYYY" /></div>
        <div class="detail-field"><label>Client / Asset Owner</label><input type="text" id="d-client" value="${esc(rec.client || '')}" /></div>
        <div class="detail-field"><label>Site / Station</label><input type="text" id="d-site" value="${esc(rec.site || '')}" /></div>
        <div class="detail-field"><label>Site Contact Name</label><input type="text" id="d-contact" value="${esc(rec.contact || '')}" /></div>
        <div class="detail-field"><label>Site Contact Phone</label><input type="text" id="d-phone" value="${esc(rec.phone || '')}" /></div>
        <div class="detail-field"><label>Equipment ID</label><input type="text" id="d-equipId" value="${esc(rec.equipId || '')}" /></div>
        <div class="detail-field"><label>Equipment Category</label>
          <select id="d-equipCat">
            ${['','Fuel Dispenser','UST','AST','Piping','Generator','Air Compressor','Other'].map(o =>
              `<option value="${o}" ${rec.equipCat === o ? 'selected' : ''}>${o || '— Select —'}</option>`).join('')}
          </select>
        </div>
        <div class="detail-field full"><label>Equipment Description (all equipment-specific details)</label>
          <textarea id="d-equipDesc" rows="2">${esc(rec.equipDesc || '')}</textarea></div>
        <div class="detail-field"><label>Manufacturer / Model</label><input type="text" id="d-mfr" value="${esc(rec.mfr || '')}" /></div>
        <div class="detail-field"><label>Serial Number</label><input type="text" id="d-serial" value="${esc(rec.serial || '')}" /></div>
        <div class="detail-field"><label>Location on Site</label><input type="text" id="d-locOnSite" value="${esc(rec.locOnSite || '')}" /></div>
        <div class="detail-field"><label>Work Type</label>
          <select id="d-workType">
            ${WORK_TYPES.map(o => `<option value="${o}" ${rec.workType === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
          <div style="margin-top:6px" id="d-workType-preview">${workTypeBadge(rec.workType)}</div>
        </div>
        <div class="detail-field full"><label>Job Details / Reported Problem</label>
          <textarea id="d-details" rows="3">${esc(rec.details || '')}</textarea></div>
        <div class="detail-field"><label>Channel Received</label>
          <select id="d-channel">
            ${['Phone','WhatsApp','Email','Walk-in','Portal','Other'].map(o =>
              `<option value="${o}" ${rec.channel === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="detail-field"><label>Triage Status</label>
          <select id="d-triage">
            ${SR_STATUS.map(o => `<option value="${o}" ${rec.triage === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="detail-field"><label>Quotation Required?</label>
          <select id="d-quoteReq">
            <option value="No" ${rec.quoteReq === 'No' ? 'selected' : ''}>No</option>
            <option value="Yes" ${rec.quoteReq === 'Yes' ? 'selected' : ''}>Yes</option>
          </select>
        </div>
        <div class="detail-field"><label>Quotation Accepted?</label>
          <select id="d-quoteAcc">
            <option value="Pending" ${rec.quoteAcc === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Yes" ${rec.quoteAcc === 'Yes' ? 'selected' : ''}>Yes</option>
            <option value="No" ${rec.quoteAcc === 'No' ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="detail-field"><label>Emergency / Direct-to-WO</label>
          <select id="d-emergency">
            <option value="No" ${!rec.emergency ? 'selected' : ''}>No</option>
            <option value="Yes" ${rec.emergency ? 'selected' : ''}>Yes</option>
          </select>
        </div>
        <div class="detail-field"><label>Quotation No</label>
          <input type="text" value="${esc(rec.quoteNo || '\u2014')}" readonly /></div>
        <div class="detail-field"><label>Converted to WO</label>
          <input type="text" value="${esc(rec.convertedWo ? 'WO#' + rec.convertedWo : '—')}" readonly /></div>
      </div>
      <div class="detail-actions">
        <button type="button" class="btn btn-primary" id="detail-btn-save-sr">Save</button>
        <button type="button" class="btn btn-success" id="detail-btn-quote-sr">${rec.quoteNo ? 'Open ' + esc(rec.quoteNo) : 'Create Quotation'}</button>
        ${!rec.convertedWo && (rec.triage === 'Qualified' || rec.emergency)
          ? '<button type="button" class="btn btn-accent" id="detail-btn-convert">Convert to Work Order</button>'
          : ''}
      </div>`;
    document.getElementById('detail-overlay').classList.add('open');
    const qBtnSr = document.getElementById('detail-btn-quote-sr');
    if (qBtnSr) qBtnSr.onclick = () => quoteForSr(srNo);
    setHash('sr/' + srNo);
    const wtSel = document.getElementById('d-workType');
    if (wtSel) wtSel.addEventListener('change', () => {
      const prev = document.getElementById('d-workType-preview');
      if (prev) prev.innerHTML = workTypeBadge(wtSel.value);
    });
    const saveBtn = document.getElementById('detail-btn-save-sr');
    if (saveBtn) saveBtn.onclick = () => saveSrDetail(srNo);
    const convBtn = document.getElementById('detail-btn-convert');
    if (convBtn) convBtn.onclick = () => convertSr(srNo);
  }

  function saveSrDetail(srNo) {
    requestAuth('edit Service Request SR#' + srNo).then(admin => {
      const rec = srRecords.find(r => r.sr === srNo);
      if (!rec) return;
      const before = Object.assign({}, rec);
      rec.requestDate = document.getElementById('d-requestDate').value;
      rec.client = document.getElementById('d-client').value;
      rec.site = document.getElementById('d-site').value;
      rec.contact = document.getElementById('d-contact').value;
      rec.phone = document.getElementById('d-phone').value;
      rec.equipId = document.getElementById('d-equipId').value;
      rec.equipCat = document.getElementById('d-equipCat').value;
      rec.equipDesc = document.getElementById('d-equipDesc').value;
      rec.mfr = document.getElementById('d-mfr').value;
      rec.serial = document.getElementById('d-serial').value;
      rec.locOnSite = document.getElementById('d-locOnSite').value;
      rec.workType = document.getElementById('d-workType').value;
      rec.details = document.getElementById('d-details').value;
      rec.channel = document.getElementById('d-channel').value;
      rec.triage = document.getElementById('d-triage').value;
      rec.quoteReq = document.getElementById('d-quoteReq').value;
      rec.quoteAcc = document.getElementById('d-quoteAcc').value;
      rec.emergency = document.getElementById('d-emergency').value === 'Yes';
      saveSr();
      logChange('EDIT SR', admin.name, 'SR#' + srNo, summarizeEdits(before, rec));
      toast('Service Request saved', 'success');
      renderSrTable();
      openSrDetail(srNo);
    }).catch(() => {});
  }

  function openWoDetail(woNo) {
    const rec = woRecords.find(r => r.wo === woNo);
    if (!rec) return;
    detailCtx = { kind: 'wo', id: woNo };
    document.getElementById('detail-title').textContent = 'Work Order WO#' + woNo;
    document.getElementById('detail-meta').textContent =
      (rec.sr ? 'from SR#' + rec.sr + ' · ' : '') + (rec.status || '') + ' · ' + (rec.client || '');
    const body = document.getElementById('detail-body');
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-field"><label>WO Number</label><input type="text" value="WO#${esc(rec.wo)}" readonly /></div>
        <div class="detail-field"><label>Linked SR</label><input type="text" value="${esc(rec.sr ? 'SR#' + rec.sr : '—')}" readonly /></div>
        <div class="detail-field"><label>Quotation No</label>
          <input type="text" value="${esc(rec.quoteNo || '\u2014')}" readonly /></div>
        <div class="detail-field"><label>Work Type</label>
          <select id="d-type">
            ${WORK_TYPES.map(o => `<option value="${o}" ${(rec.type || rec.workType) === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
          <div style="margin-top:6px" id="d-type-preview">${workTypeBadge(rec.type || rec.workType)}</div>
        </div>
        <div class="detail-field"><label>Status</label>
          <select id="d-status" class="status-select status-select-${esc((rec.status||'').replace(/\s/g,''))}">
            ${WO_STATUS.map(o => `<option value="${o}" ${rec.status === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
          <div style="margin-top:6px">${statusBadge(rec.status)}</div>
        </div>
        <div class="detail-field"><label>Entry Date</label><input type="text" id="d-entry" value="${esc(rec.entry || '')}" placeholder="DD.MM.YYYY" /></div>
        <div class="detail-field"><label>Start Date</label><input type="text" id="d-start" value="${esc(rec.start || '')}" placeholder="DD.MM.YYYY" /></div>
        <div class="detail-field"><label>End Date</label><input type="text" id="d-end" value="${esc(rec.end || '')}" placeholder="DD.MM.YYYY" /></div>
        <div class="detail-field"><label>Client</label><input type="text" id="d-client" value="${esc(rec.client || '')}" /></div>
        <div class="detail-field"><label>Location</label><input type="text" id="d-location" value="${esc(rec.location || '')}" /></div>
        <div class="detail-field full"><label>Job Details</label>
          <textarea id="d-details" rows="3">${esc(rec.details || '')}</textarea></div>
        <div class="detail-field"><label>Equipment ID</label><input type="text" id="d-equipId" value="${esc(rec.equipId || '')}" /></div>
        <div class="detail-field"><label>Equipment Category</label><input type="text" id="d-equipCat" value="${esc(rec.equipCat || '')}" /></div>
        <div class="detail-field full"><label>Equipment Description</label>
          <textarea id="d-equipDesc" rows="2">${esc(rec.equipDesc || '')}</textarea></div>
        <div class="detail-field"><label>Work Type</label><input type="text" id="d-workType" value="${esc(rec.workType || '')}" /></div>
        <div class="detail-field"><label>Site Contact</label><input type="text" id="d-contact" value="${esc(rec.contact || '')}" /></div>
      </div>
      <div class="ai-box">
        <h4>AI-assisted Work Order document</h4>
        <p>AI will read the register data above, categorise by Type of Work, and complete the full Work Order document from the pre-built template. Templates will be embedded in a later stage; this button prepares the framework.</p>
        <button type="button" class="btn btn-accent" id="detail-btn-ai" ${rec.aiDone ? 'disabled' : ''}>
          ${rec.aiDone ? '✓ WO document created with AI' : 'Create WO with AI'}
        </button>
        <button type="button" class="btn btn-success" id="detail-btn-wopdf" style="margin-left:8px;${rec.aiDone ? '' : 'display:none'}">
          Convert to PDF
        </button>
      </div>
      <div class="detail-actions">
        <button type="button" class="btn btn-primary" id="detail-btn-save-wo">Save</button>
        <button type="button" class="btn btn-success" id="detail-btn-quote-wo">${rec.quoteNo ? 'Open ' + esc(rec.quoteNo) : 'Create Quotation'}</button>
      </div>`;
    document.getElementById('detail-overlay').classList.add('open');
    const typeSel = document.getElementById('d-type');
    if (typeSel) typeSel.addEventListener('change', () => {
      const prev = document.getElementById('d-type-preview');
      if (prev) prev.innerHTML = workTypeBadge(typeSel.value);
    });
    const stSel = document.getElementById('d-status');
    if (stSel) stSel.addEventListener('change', () => {
      const wrap = stSel.parentElement;
      const pill = wrap && wrap.querySelector('.status-pill');
      if (pill) pill.outerHTML = statusBadge(stSel.value);
      else {
        const box = document.createElement('div');
        box.style.marginTop = '6px';
        box.innerHTML = statusBadge(stSel.value);
        stSel.insertAdjacentElement('afterend', box);
      }
    });
    document.getElementById('detail-btn-save-wo').onclick = () => saveWoDetail(woNo);
    document.getElementById('detail-btn-quote-wo').onclick = () => quoteForWo(woNo);
    setHash('wo/' + woNo);
    const aiBtn = document.getElementById('detail-btn-ai');
    if (aiBtn && !rec.aiDone) aiBtn.onclick = () => runAiCreateWo(woNo);
    const pdfBtn = document.getElementById('detail-btn-wopdf');
    if (pdfBtn) pdfBtn.onclick = () => exportSingleWoPdf(woNo);
  }

  function saveWoDetail(woNo) {
    requestAuth('edit Work Order WO#' + woNo).then(admin => {
      const rec = woRecords.find(r => r.wo === woNo);
      if (!rec) return;
      const before = Object.assign({}, rec);
      rec.type = document.getElementById('d-type').value;
      rec.status = document.getElementById('d-status').value;
      rec.entry = document.getElementById('d-entry').value;
      rec.start = document.getElementById('d-start').value;
      rec.end = document.getElementById('d-end').value;
      rec.client = document.getElementById('d-client').value;
      rec.location = document.getElementById('d-location').value;
      rec.details = document.getElementById('d-details').value;
      rec.equipId = document.getElementById('d-equipId').value;
      rec.equipCat = document.getElementById('d-equipCat').value;
      rec.equipDesc = document.getElementById('d-equipDesc').value;
      rec.workType = document.getElementById('d-workType').value;
      rec.contact = document.getElementById('d-contact').value;
      saveWo();
      logChange('EDIT WO', admin.name, 'WO#' + woNo, summarizeEdits(before, rec));
      toast('Work Order saved', 'success');
      renderWoTable();
      openWoDetail(woNo);
    }).catch(() => {});
  }

  function runAiCreateWo(woNo) {
    const rec = woRecords.find(r => r.wo === woNo);
    if (!rec) return;
    // Framework placeholder — full AI template fill comes later
    toast('AI framework: categorising work type and preparing WO document…', 'success');
    setTimeout(() => {
      rec.aiDone = true;
      saveWo();
      toast('WO document draft created. Review and use Convert to PDF when ready.', 'success');
      openWoDetail(woNo);
    }, 900);
  }

  // ---------- Convert SR → WO ----------
  function convertSr(srNo) {
    const rec = srRecords.find(r => r.sr === srNo);
    if (!rec) return;
    if (rec.convertedWo) {
      toast('Already converted to WO#' + rec.convertedWo, 'error');
      return;
    }
    // Rule: only triage = Qualified (or Emergency) is required.
    // "Quotation Accepted?" is informational and must NOT block conversion.
    if (rec.triage !== 'Qualified' && !rec.emergency) {
      toast('SR must be Qualified (or Emergency) before conversion', 'error');
      return;
    }
    requestAuth('convert SR#' + srNo + ' to Work Order').then(admin => {
      const woNo = nextWoNo();
      const newWo = {
        wo: woNo,
        type: rec.workType || 'Repair - Non Emergency',
        entry: todayDisp(),
        start: '',
        end: '',
        status: 'Pending',
        client: rec.client || '',
        location: rec.site || '',
        details: rec.details || '',
        sr: rec.sr,
        quoteNo: rec.quoteNo || '',
        quoteTotal: rec.quoteTotal || 0,
        equipId: rec.equipId || '',
        equipCat: rec.equipCat || '',
        equipDesc: rec.equipDesc || '',
        mfr: rec.mfr || '',
        serial: rec.serial || '',
        locOnSite: rec.locOnSite || '',
        workType: rec.workType || '',
        contact: rec.contact || '',
        phone: rec.phone || '',
        aiDone: false
      };
      woRecords.push(newWo);
      rec.convertedWo = woNo;
      rec.convertedAt = new Date().toISOString();
      saveSr();
      saveWo();
      logChange('CONVERT SR→WO', admin.name, 'SR#' + srNo + ' → WO#' + woNo, rec.client);
      toast('Created WO#' + woNo + ' from SR#' + srNo, 'success');
      // Switch to WO section and open detail
      showSection('wo');
      closeDetail();
      openWoDetail(woNo);
    }).catch(() => {});
  }

  // ---------- ADD ----------
  function addSr() {
    requestAuth('add new Service Request').then(admin => {
      const no = nextSrNo();
      srRecords.push({
        sr: no,
        requestDate: todayDisp(),
        client: '',
        site: '',
        contact: '',
        phone: '',
        equipId: '',
        equipCat: '',
        equipDesc: '',
        mfr: '',
        serial: '',
        locOnSite: '',
        workType: 'Repair - Non Emergency',
        details: '',
        channel: 'Phone',
        triage: 'Received',
        quoteReq: 'No',
        quoteAcc: 'Pending',
        emergency: false,
        convertedWo: '',
        registeredBy: admin.name
      });
      saveSr();
      logChange('ADD SR', admin.name, 'SR#' + no, '');
      toast('Created SR#' + no, 'success');
      renderSrTable();
      openSrDetail(no);
    }).catch(() => {});
  }
  function addWo() {
    requestAuth('add new Work Order').then(admin => {
      const no = nextWoNo();
      woRecords.push({
        wo: no,
        type: '',
        entry: todayDisp(),
        start: '',
        end: '',
        status: 'Pending',
        client: '',
        location: '',
        details: '',
        sr: '',
        aiDone: false
      });
      saveWo();
      logChange('ADD WO', admin.name, 'WO#' + no, '');
      toast('Created WO#' + no, 'success');
      renderWoTable();
      openWoDetail(no);
    }).catch(() => {});
  }

  // ---------- Delete ----------
  function askDelete(kind, id) {
    deleteTarget = { kind, id };
    document.getElementById('delete-title').textContent =
      kind === 'sr' ? 'Delete Service Request SR#' + id + '?' : 'Delete Work Order WO#' + id + '?';
    document.getElementById('delete-modal').classList.add('open');
  }
  function confirmDelete() {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    document.getElementById('delete-modal').classList.remove('open');
    requestAuth('delete ' + (kind === 'sr' ? 'SR#' : 'WO#') + id).then(admin => {
      if (kind === 'sr') {
        srRecords = srRecords.filter(r => r.sr !== id);
        saveSr();
        logChange('DELETE SR', admin.name, 'SR#' + id, '');
        renderSrTable();
      } else {
        woRecords = woRecords.filter(r => r.wo !== id);
        saveWo();
        logChange('DELETE WO', admin.name, 'WO#' + id, '');
        renderWoTable();
      }
      closeDetail();
      toast('Deleted', 'success');
      deleteTarget = null;
    }).catch(() => { deleteTarget = null; });
  }

  function closeDetail(keepHash) {
    const was = detailCtx;
    document.getElementById('detail-overlay').classList.remove('open');
    detailCtx = null;
    if (was && keepHash !== true && SECTIONS.indexOf(currentSection) >= 0) setHash(currentSection);
  }

  // ---------- PDF (register overview) ----------
  async function exportRegisterPdf(kind) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 10;
    const navy = [13, 38, 77];
    let y = M;

    doc.setDrawColor(...navy);
    doc.setLineWidth(0.6);
    doc.rect(6, 6, pageW - 12, pageH - 12);
    doc.setLineWidth(0.2);
    doc.rect(7.2, 7.2, pageW - 14.4, pageH - 14.4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...navy);
    doc.text('FORECOURT WORKS LIMITED', M, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60);
    doc.text(kind === 'sr' ? 'SERVICE REQUEST REGISTER' : 'WORK ORDER REGISTER', M, y + 9);
    doc.setFontSize(7);
    doc.text('CONTROLLED DOCUMENT  ·  ' + new Date().toLocaleString('en-GB'), M, y + 13);
    y += 18;

    const rows = kind === 'sr' ? filteredSr() : filteredWo();
    if (kind === 'sr') {
      const cols = [
        { k: 'sr', l: 'SR No', w: 18 },
        { k: 'requestDate', l: 'Date', w: 22 },
        { k: 'client', l: 'Client', w: 40 },
        { k: 'site', l: 'Site', w: 32 },
        { k: 'details', l: 'Job Details', w: 70 },
        { k: 'workType', l: 'Work Type', w: 40 },
        { k: 'triage', l: 'Triage', w: 28 },
        { k: 'convertedWo', l: 'WO', w: 18 }
      ];
      drawPdfTable(doc, cols, rows, y, M, pageW, pageH, navy, r => [
        'SR#' + (r.sr || ''), r.requestDate || '', r.client || '', r.site || '',
        r.details || '', r.workType || '', r.triage || '',
        r.convertedWo ? 'WO#' + r.convertedWo : '—'
      ]);
    } else {
      const cols = [
        { k: 'wo', l: 'WO No', w: 18 },
        { k: 'type', l: 'Type', w: 28 },
        { k: 'entry', l: 'Entry', w: 20 },
        { k: 'status', l: 'Status', w: 22 },
        { k: 'client', l: 'Client', w: 36 },
        { k: 'location', l: 'Location', w: 30 },
        { k: 'details', l: 'Job Details', w: 70 },
        { k: 'sr', l: 'From SR', w: 18 }
      ];
      drawPdfTable(doc, cols, rows, y, M, pageW, pageH, navy, r => [
        'WO#' + (r.wo || ''), r.type || '', r.entry || '', r.status || '',
        r.client || '', r.location || '', r.details || '',
        r.sr ? 'SR#' + r.sr : '—'
      ]);
    }
    const fname = (kind === 'sr' ? 'Service-Request-Register' : 'Work-Order-Register') + '-' +
      new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(fname);
    toast('PDF exported: ' + fname, 'success');
  }

  function drawPdfTable(doc, cols, rows, startY, M, pageW, pageH, navy, mapRow) {
    let y = startY;
    const rowH = 6;
    function header() {
      doc.setFillColor(...navy);
      doc.rect(M, y, pageW - 2 * M, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255);
      let x = M + 1;
      cols.forEach(c => { doc.text(c.l, x, y + 4); x += c.w; });
      y += 7;
      doc.setTextColor(30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
    }
    header();
    rows.forEach((r, i) => {
      if (y > pageH - 14) {
        doc.addPage();
        doc.setDrawColor(...navy);
        doc.setLineWidth(0.6);
        doc.rect(6, 6, pageW - 12, pageH - 12);
        y = M + 4;
        header();
      }
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(M, y - 1, pageW - 2 * M, rowH, 'F');
      }
      const vals = mapRow(r);
      let x = M + 1;
      vals.forEach((v, j) => {
        const t = String(v || '').substring(0, Math.floor(cols[j].w / 1.6));
        doc.text(t, x, y + 3.5);
        x += cols[j].w;
      });
      y += rowH;
    });
  }

  function exportSingleEntryPdf() {
    if (!detailCtx) return;
    if (detailCtx.kind === 'sr') {
      // simple single-entry export via register style filtered conceptually
      toast('Single-entry PDF: use register Export for now; dedicated single layout in next iteration', 'success');
    } else {
      exportSingleWoPdf(detailCtx.id);
    }
  }
  function exportSingleWoPdf(woNo) {
    const rec = woRecords.find(r => r.wo === woNo);
    if (!rec) return;
    if (!rec.aiDone) {
      toast('Create WO with AI first, then Convert to PDF', 'error');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const M = 14;
    const navy = [13, 71, 140];
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.6);
    doc.rect(8, 8, pageW - 16, doc.internal.pageSize.getHeight() - 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...navy);
    doc.text('FORECOURT WORKS LIMITED', M, 20);
    doc.setFontSize(11);
    doc.text('WORK ORDER  WO#' + rec.wo, M, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40);
    let y = 38;
    const lines = [
      ['Client', rec.client],
      ['Location', rec.location],
      ['Status', rec.status],
      ['Type', rec.type],
      ['Work Type', rec.workType],
      ['Job Details', rec.details],
      ['Equipment ID', rec.equipId],
      ['Equipment Category', rec.equipCat],
      ['Equipment Description', rec.equipDesc],
      ['From SR', rec.sr ? 'SR#' + rec.sr : '—'],
      ['Entry', rec.entry],
      ['Start', rec.start],
      ['End', rec.end]
    ];
    lines.forEach(([lab, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...navy);
      doc.text(lab.toUpperCase(), M, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30);
      doc.setFontSize(9);
      const split = doc.splitTextToSize(String(val || '—'), pageW - 2 * M);
      doc.text(split, M, y + 4);
      y += 4 + split.length * 4.5 + 3;
    });
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('AI-assisted draft · Review before issue · CONTROLLED DOCUMENT', M, y + 6);
    doc.save('WO#' + rec.wo + '-document.pdf');
    toast('WO document PDF saved', 'success');
  }

  // ---------- events ----------
  function init() {
    loadAll();
    // tabs
    document.querySelectorAll('.section-tab').forEach(t => {
      t.addEventListener('click', () => showSection(t.dataset.section));
    });
    // SR toolbar
    ['sr-q-client', 'sr-q-no', 'sr-q-status', 'sr-q-converted'].forEach(id => {
      document.getElementById(id).addEventListener('input', renderSrTable);
      document.getElementById(id).addEventListener('change', renderSrTable);
    });
    document.getElementById('sr-btn-reset').onclick = () => {
      ['sr-q-client', 'sr-q-no'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('sr-q-status').value = '';
      document.getElementById('sr-q-converted').value = '';
      renderSrTable();
    };
    document.getElementById('sr-btn-add').onclick = addSr;
    document.getElementById('sr-btn-export').onclick = () => exportRegisterPdf('sr');
    // WO toolbar
    ['wo-q-client', 'wo-q-no', 'wo-q-status', 'wo-q-from', 'wo-q-to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', renderWoTable);
        el.addEventListener('change', renderWoTable);
      }
    });
    document.getElementById('wo-btn-reset').onclick = () => {
      ['wo-q-client', 'wo-q-no', 'wo-q-from', 'wo-q-to'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('wo-q-status').value = '';
      renderWoTable();
    };
    document.getElementById('wo-btn-add').onclick = addWo;
    document.getElementById('wo-btn-export').onclick = () => exportRegisterPdf('wo');

    // delegated row actions
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'expand-sr') openSrDetail(btn.dataset.sr);
      if (action === 'expand-wo') openWoDetail(btn.dataset.wo);
      if (action === 'convert-sr') convertSr(btn.dataset.sr);
      if (action === 'quote-sr') quoteForSr(btn.dataset.sr);
      if (action === 'quote-wo') quoteForWo(btn.dataset.wo);
      if (action === 'delete-sr') askDelete('sr', btn.dataset.sr);
      if (action === 'delete-wo') askDelete('wo', btn.dataset.wo);
    });

    document.getElementById('detail-btn-home').onclick = () => closeDetail();
    document.getElementById('detail-btn-pdf').onclick = exportSingleEntryPdf;
    document.getElementById('auth-confirm').onclick = onAuthConfirm;
    document.getElementById('auth-cancel').onclick = onAuthCancel;
    document.getElementById('auth-pass').addEventListener('keydown', e => {
      if (e.key === 'Enter') onAuthConfirm();
    });
    document.getElementById('delete-cancel').onclick = () => {
      document.getElementById('delete-modal').classList.remove('open');
      deleteTarget = null;
    };
    document.getElementById('delete-confirm').onclick = confirmDelete;
    document.getElementById('btn-audit').onclick = () => {
      const c = document.getElementById('audit-content');
      if (!auditLog.length) c.innerHTML = '<p style="color:#6b7280">No audit entries yet.</p>';
      else {
        c.innerHTML = '<table style="width:100%;font-size:0.75rem;border-collapse:collapse"><thead><tr>' +
          '<th style="text-align:left;padding:4px">When</th><th style="text-align:left;padding:4px">Action</th>' +
          '<th style="text-align:left;padding:4px">Ref</th><th style="text-align:left;padding:4px">Admin</th></tr></thead><tbody>' +
          auditLog.slice(0, 80).map(a => `<tr>
            <td style="padding:3px 4px;border-bottom:1px solid #e5e7eb">${esc(new Date(a.at).toLocaleString('en-GB'))}</td>
            <td style="padding:3px 4px;border-bottom:1px solid #e5e7eb">${esc(a.action)}</td>
            <td style="padding:3px 4px;border-bottom:1px solid #e5e7eb">${esc(a.ref)}</td>
            <td style="padding:3px 4px;border-bottom:1px solid #e5e7eb">${esc(a.admin)}</td>
          </tr>`).join('') + '</tbody></table>';
      }
      document.getElementById('audit-modal').classList.add('open');
    };
    document.getElementById('audit-close').onclick = () =>
      document.getElementById('audit-modal').classList.remove('open');

    window.addEventListener('message', onShellMessage);
    window.addEventListener('hashchange', route);
    window.addEventListener('popstate', route);
    window.addEventListener('resize', setHeaderHeight);
    setHeaderHeight();
    // A link such as #wo or #qt opens that tab directly; otherwise restore the last tab used
    if (!route()) {
      let savedSec = 'sr';
      try { savedSec = localStorage.getItem('fsw_register_section') || 'sr'; } catch (_) {}
      showSection(SECTIONS.indexOf(savedSec) >= 0 ? savedSec : 'sr');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
