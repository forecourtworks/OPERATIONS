/* FSW WPI self-test: edge cases for the priority engine. Runs in the browser (wpi-selftest.html) or Node. */
(function (root) {
  'use strict';
  function run(W) {
    var T = [];
    function eq(name, got, want) { T.push({ name: name, ok: JSON.stringify(got) === JSON.stringify(want), got: got, want: want }); }
    var NOW = new Date('2026-10-20T08:30:00');
    var H = { grid: 'Low', volume: 'High' }, M = { grid: 'Medium', volume: 'Medium' };
    function line(code, cond, extra) { return Object.assign({ code: code, cond: cond }, extra || {}); }
    function sc(l, si, hist) { return W.scoreLine(l, { now: NOW, siteInputs: si || H, history: hist || [] }); }
    var hose = 'PUM-01/DISP#002-ACVL2-HSE-AGO2';
    var r1 = sc(line(hose, 'H', { evidence: 'Photo: diesel weeping at hose end' }));
    eq('Hose leak with evidence: score', r1.score, 20); eq('Hose leak with evidence: P1 by safety floor', [r1.priority, r1.floors], [1, ['safety_floor']]);
    var r2 = sc(line(hose, 'H', {}));
    eq('Hazard without evidence: no P1 floor', [r2.priority, r2.warnings.length > 0], [2, true]);
    eq('Hose leak ACS and O effective (capacity -1, volume +1)', [r1.acs, r1.oEff], [4, 3]);
    var emerg = W.subsOf('AINU/047/PUM-01/DISP#002').filter(function (s) { return s.cls === 'DSP-EST'; })[0];
    var r3 = sc(line(emerg.code, 'P'));
    eq('Emergency stop, protection lost: 4 x 4 = 16 -> P2', [r3.score, r3.priority], [16, 2]);
    var mtr = W.subsOf('AINU/047/PUM-01/DISP#002').filter(function (s) { return s.cls === 'DSP-MTR'; })[0];
    var r4 = sc(line(mtr.code, 'G'));
    eq('Meter intermittent: 5 x 3 = 15 is P3 by score, P2 by compliance floor', [r4.score, r4.tier, r4.priority, r4.floors], [15, 3, 2, ['compliance_floor']]);
    var pul = W.subsOf('AINU/047/PUM-01/DISP#002').filter(function (s) { return s.cls === 'DSP-PUL'; })[0];
    var r5 = sc(line(pul.code, 'G'));
    eq('Pulser intermittent: R4 so no compliance floor', [r5.acs, r5.score, r5.priority], [4, 12, 3]);
    var stp = W.subsOf('AINU/047/PUM-01/STP-AGO').filter(function (s) { return s.cls === 'STP-MOT'; })[0];
    var r6 = sc(line(stp.code, 'O'));
    eq('AGO pump motor out of service: single pump gives O 5, ACS 5, 5 x 4 = 20 -> P2', [r6.oEff, r6.acs, r6.score, r6.priority], [5, 5, 20, 2]);
    eq('Boundary scores to tiers', [4, 5, 9, 10, 15, 16, 25].map(W.tierFromScore), [5, 4, 4, 3, 3, 2, 2]);
    var dd = [-1, 0, 30, 31, 90, 91].map(function (n) { return W.dateCondition(new Date(NOW.getTime() + n * 86400000), NOW).d; });
    eq('Compliance date to condition (-1, 0, 30, 31, 90, 91 days)', dd, [4, 3, 3, 2, 2, 1]);
    var cal = 'PUM-01/COMP-EPRA-ACVL1-CAL-DISP-ALL';
    var c1 = sc({ code: cal, expiry: new Date(NOW.getTime() + 5 * 86400000) });
    eq('Dispenser calibration due in 5 days: compliance floor gives P2', [c1.d, c1.priority], [3, 2]);
    var fire = 'PUM-01/COMP-FIRE-ACVL2-RA-FIRE';
    var f1 = sc({ code: fire, expiry: new Date(NOW.getTime() + 5 * 86400000) }), f2 = sc({ code: fire, expiry: new Date(NOW.getTime() + 20 * 86400000) }), f3 = sc({ code: fire, expiry: new Date(NOW.getTime() + 200 * 86400000) });
    eq('Fire risk assessment deadline floors (5 d, 20 d, 200 d)', [f1.priority, f2.priority, f3.priority], [2, 3, 5]);
    var other = W.scoreLine({ cls: 'DSP-HSE', cond: 'G' }, { now: NOW, siteInputs: M });
    eq('Other-site mode: class only, medium site', [other.acs, other.oEff, other.score, other.priority], [4, 3, 12, 3]);
    var hist = [{ code: hose, at: NOW.getTime() - 30 * 86400000, wo: '00099' }];
    var rep = sc(line(hose, 'G'), H, hist), norep = sc(line(hose, 'G'), H, [{ code: hose, at: NOW.getTime() - 120 * 86400000, wo: '00098' }]);
    eq('Repeat failure within 90 days adds 1 to D (3 to 4)', [rep.d, rep.repeat, norep.d], [4, true, 3]);
    var req = W.scoreRequest([line(hose, 'G'), line(emerg.code, 'P')], { raisedAt: NOW, now: NOW });
    eq('Multi-line request: header takes the worst line, not the sum', [req.header.priority, req.header.score, req.header.topCode], [2, 16, emerg.code]);
    var ov = W.scoreRequest([line(hose, 'G')], { raisedAt: NOW, now: NOW, override: { priority: 'P1', reason: 'Hazard confirmed on site' } });
    eq('Override keeps calculated priority and sets P1 clock', [ov.header.calcPriority, ov.header.priority, new Date(ov.header.respondBy) - NOW], [3, 1, 3600000]);
    var base = W.scoreRequest([line(emerg.code, 'P')], { raisedAt: NOW, now: NOW });
    var late = W.effective(base, new Date(NOW.getTime() + 5 * 3600000), {}), early = W.effective(base, new Date(NOW.getTime() + 1 * 3600000), {}), started = W.effective(base, new Date(NOW.getTime() + 5 * 3600000), { started: true });
    eq('Aging: P2 escalates to P1 after the 4 h response target; not if started', [late.effective, late.flags.indexOf('escalated') >= 0, early.effective, started.effective], [1, true, 2, 2]);
    var settingsOk = W.getSettings().policy.length === 5 && W.getSettings().siteInputs.grid === 'Low';
    eq('Default site inputs for PUM-01 (grid Low, volume High)', settingsOk, true);
    return T;
  }
  root.FSW_WPI_RUN_TESTS = run;
  if (typeof module !== 'undefined' && module.exports) module.exports = run;
})(typeof self !== 'undefined' ? self : this);
