# Forecourt Works Ltd — DAILY FIELD OP's APP

**CONTROLLED DOCUMENT**

**Tagline:** *Engineering Reliability Into Every Forecourt*

Standalone digital register for all technical service work orders.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Application UI and styles |
| `app.js` | Application logic, admin auth, audit trail, PDF export |
| `forecourt-logo-mark.png` | Official FSW logo used in header & PDF export |

## How to run
1. Open `index.html` in Chrome, Edge, or any modern browser.
2. No server or install required — works offline after first load of fonts/CDN.
3. Data is stored in the browser’s **localStorage** (keys: `fsw_wo_register_v1`, `fsw_wo_register_audit_v1`).

## Document control
This is a **controlled document**. Any of the following actions require Document Control Admin authorisation:

- **+ ADD** (create a new work order)
- **Edit** any field on an existing work order
- **Delete** a work order

### Document Control Admins
| Admin | Role |
|-------|------|
| **Oguta** | Document Control Admin 1 |
| **Kamando** | Document Control Admin 2 |

When prompted, enter the admin **name** and **password**. Passwords are verified against SHA-256 hashes stored in the app (plain-text passwords are not stored).

### Audit trail
Every authorised ADD, EDIT and DELETE is logged with:
- Action type
- Work order number
- Admin name who authorised the change
- Date and time
- Field-level detail (for edits)

Open **Audit Trail** in the header to view the log.

## Features
- **Default view** — last 5 work orders only
- **+ ADD** — next sequential WO number (requires admin auth)
- **Editable grid** — all fields editable after admin auth
- **Auto Balance** — Inv Amt − Paid
- **Status dropdown** — Completed · Ongoing · Pending · Started · Stopped · Cancelled
- **Query** — Client Name, Work Order No, Date range, Status
- **Reset** — clear filters, return to last-5 view
- **Export PDF** — landscape A4, CONTROLLED DOCUMENT stamp, official logo
- **Delete** — confirmation + admin auth
- **Auto-save** — changes persist across reloads

## Historical data
Work orders **0001–0068** from the original register are pre-loaded.  
The next authorised **+ ADD** will create **0069**.

## PDF export style
Matches Forecourt Works Ltd document guidelines:
- Double navy boundary
- Company header left + official logo top-right
- **CONTROLLED DOCUMENT** stamp
- Landscape A4 so all columns fit
- Status colour coding

## Security note
Admin credentials provide operational document control suitable for staff use.  
Because the app runs in the browser, this is not cryptographic protection against a determined user inspecting the source. A shared backend (planned via GitHub) will provide stronger controls later.

---
Forecourt Works Limited · Ramco Court, GT 3B, South C, Nairobi  
+254 729-002-087 · sales@forecourtworks.co.ke
