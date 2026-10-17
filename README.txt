FORECOURT WORKS LTD - Service Requests, Work Orders & Quotations (one UI, 3 tabs)
=================================================================================
Run:   cd fsw-platform && python3 -m http.server 8080   ->  http://localhost:8080
(Serve over http so all three tabs share the same browser storage.)

Folders
  index.html, app.js   Shell: Service Request > Quotation > Work Order tabs (process-flow order)
  quotes/              The quotation app. Runs inside the Quotation tab AND on its own
                       (open quotes/index.html directly).

Direct links
  #sr  #wo  #qt                 open that tab
  #sr/00071  #wo/00071          open that record
  #qt/00068                     open that quotation
  quotes/index.html#new&sr=00071&client=ACME      new quotation, standalone
  quotes/index.html#open&qt=00068                 existing quotation, standalone

Workflow
  SR or WO row / detail -> "Quotation" / "Create Quotation" -> Quotation tab, pre-filled.
  The quotation number is written back to the SR / WO record.
  Numbering continues from QT#00067 (next = QT#00068), shared by all three entry points.
  "Quotation Accepted?" on an SR is informational only; Convert to WO needs only
  Qualified (or Emergency).
