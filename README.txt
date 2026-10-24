FORECOURT WORKS - OPERATIONS PLATFORM v2 (Service Request, Quotation, Work Order + Work Priority Index)
=====================================================================================================

WHAT CHANGED IN v2
- The Work Priority Index (WPI) is built into the Service Request (SR) and Work Order (WO) registers.
  The user picks the parent asset and the sub-asset(s) with the problem, sets the condition, and the app
  calculates the score and the priority level (P1 Emergency ... P5 Planned), with respond-by, make-safe-by
  and due dates. The priority is the SAME on the SR and on the WO.
- SR and WO share data and can also run standalone (see MODES).
- A Priority Queue ranks open SRs and WOs and pushes Work Orders to a scheduler (see SCHEDULER).

FILES TO UPLOAD (all in the repo root, same folder as before)
  index.html            3-tab shell (SR, Quotation, WO). Also the standalone SR and WO apps via ?app=
  registers-app.js      SR + WO logic (now WPI-aware)
  wpi-data.js           component class library + PUM-01 asset register + topology (generated from the master workbook)
  wpi-engine.js         scoring engine (pure logic, no screen code)
  wpi-ui.js             priority panel, table badges, settings screen
  wpi-scheduler.js      priority queue, scheduler outbox and push
  sr.html, wo.html      short links that open the standalone apps
  wpi-selftest.html/.js engine self-test (open wpi-selftest.html; it should say PASS)
  quotation.html, quotation-app.js, fsw-pdf-theme.js, logos, fonts, signatures: unchanged
Files from the old upload that are NOT needed and were left out: app.js, "app (1).js", "index (2).html",
"index (3).html", START-SERVER.sh, README.md, duplicate logo copies. Delete them from the repo if present.

MODES (same files, no duplicate code)
  index.html            all three tabs
  index.html?app=sr     Service Request app on its own (Quotation tab stays); also sr.html
  index.html?app=wo     Work Order app on its own (Quotation tab stays); also wo.html
  Each runs without the other. A WO can be created directly (no SR) and scored in the WO panel; an SR can
  be raised and scored without ever converting. Both read and write the same browser storage, so records
  appear in the other app straight away, including when the two apps are open in separate windows.
  In a standalone app, links to the other register open the other app in a new window.

HOW A PRIORITY IS CALCULATED
  ACS (1-5) = highest of Safety, Environment, Operations, Regulatory, Cost for the component class.
  Operations is adjusted for capacity lost (nozzle lines of the product affected) and for the site inputs
  (grid reliability, volume intensity; PUM-01 is Low grid reliability, High volume).
  Condition D: 5 Hazard present (evidence note required), 4 Protection lost, 4 Out of service,
  3 Degraded/intermittent, 2 Nuisance, 1 Advisory. Certificates, licences and records use their expiry date.
  A repeat failure of the same sub-asset within 90 days adds 1 to D.
  Score = ACS x D: 16-25 P2, 10-15 P3, 5-9 P4, 1-4 P5. Floors: hazard on a Safety/Environment 4+ component = P1;
  Regulatory 5 with D 3+ = at least P2; deadline within 7 days = at least P2, within 30 days = at least P3.
  A request with several components takes its worst line; lines are never added.
  If the response target is missed the priority shows one level higher ("escalated"); the calculated score is kept.
  Manual override needs a reason code, admin authorisation and is written to the audit trail.
  A P1 sets Emergency / Direct-to-WO on the SR automatically.
  Other sites: choose "Other site" in the panel, pick the component type and set that site's grid/volume.

SETTINGS (header button: Priority Settings, admin only, audited)
  Grid reliability and volume intensity for PUM-01, and the response targets per priority. After changing the
  site inputs the app offers to recalculate all open SRs and WOs. Records keep their stored result until recalculated.

SCHEDULER HAND-OFF
  Priority Queue (button on both registers): open SRs and WOs ranked by priority, score, due date, number of
  high dimensions, then age. Only WOs are pushed. A WO is queued automatically when converted from an SR, when
  saved with a changed priority/status/parts/duration, and when it is escalated for a missed response target.
  Each push is a versioned message (WO#00073@v2); a newer version supersedes the older one. Three ways to receive it:
    1. HTTPS endpoint: set it under Priority Queue > Scheduler endpoint; the app POSTs JSON (Idempotency-Key header).
    2. Browser: listen for the "fsw:scheduler-push" event or the BroadcastChannel "fsw-scheduler" (scheduler open in another tab).
    3. File/storage: "Export outbox JSON", or read localStorage key fsw_scheduler_outbox_v1.
  Fields per WO: wo_id, version, site_code, parent_asset_id, subasset_codes, lines, priority, calculated_priority,
  effective_priority, escalated, reason, floors_applied, respond_by, make_safe_by, due_at, work_type, trade_required,
  location_hint, parts_ready, estimated_duration_h, access_window, status (Ready/In progress/On hold/Done/Cancelled).
  New WO fields: Parts ready?, Estimated duration (hours), Access window / site constraints.

KEEPING THE LIBRARY CURRENT
  The class scores and asset register live in PUM-01_Asset_Register_Master_v2.xlsx. After refining them there,
  wpi-data.js must be regenerated (ask for the regeneration script run) and re-uploaded. Make/model and nameplate
  data you add to the workbook flow into the next regeneration.

STORAGE KEYS (browser, per device)
  fsw_sr_register_v1, fsw_wo_register_v2, fsw_registers_audit_v1 (unchanged); new: fsw_wpi_settings_v1,
  fsw_scheduler_outbox_v1, fsw_scheduler_config_v1. Records are stored on the device, as before; use Export PDF for copies.

----- previous README follows -----

FORECOURT WORKS - Service Requests > Quotations > Work Orders (flat folder, GitHub Pages ready)
==========================================================================================
Upload ALL files into the repository root (same folder). Open index.html (the site root).

index.html          3-tab shell (Service Request | Quotation | Work Order)
registers-app.js    shell logic
registers-logo-mark.png   white logo for the shell header
quotation.html      Quotation Builder (also opens on its own)
quotation-app.js    quotation logic
fsw-pdf-theme.js, forecourt-logo-mark.png, Roboto-*.ttf, sig-*.png   quotation PDF assets

Links:  #sr  #wo  #qt  #sr/00071  #wo/00071  #qt/00068
        quotation.html#new&sr=00071&client=ACME   |   quotation.html#open&qt=00068
Quote numbers continue from QT#00067 (next QT#00068).
