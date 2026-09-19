# Patient Risk & Follow-Up Dashboard

A prototype web app for clinicians that stratifies patients into **High /
Medium / Low risk** using the **LACE Index**, and flags patients whose
post-discharge follow-up is **overdue** or **due soon** so care teams can
prioritize outreach.

> This is a demo/prototype: it runs entirely in the browser, uses no real
> patient data by default, and is not a certified clinical decision tool.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL, then either upload a CSV of patient encounters
or click **Load sample data** to try it with synthetic patients.

## How it works

1. Upload a CSV of patient encounters (see schema below).
2. Each patient's **LACE score** is computed client-side:
   - **L** — Length of stay
   - **A** — Acuity of admission (emergent vs. elective)
   - **C** — Comorbidity burden, via the Charlson Comorbidity Index
     (derived from a `comorbidities` list, or a supplied `charlson_score`)
   - **E** — Number of ED visits in the 6 months before admission
3. The total LACE score (0–19) buckets each patient into a risk tier:
   High (≥10), Medium (5–9), Low (0–4).
4. Follow-up status is derived from `follow_up_due_date` /
   `follow_up_completed_date`. If no due date is supplied, one is inferred
   from the discharge date and risk tier (High: 7 days, Medium: 14 days,
   Low: 30 days) — the higher the risk, the sooner follow-up is expected.
5. The dashboard shows summary counts, and a sortable/filterable table you
   can drill into for a per-patient score breakdown.

All data stays in the browser — nothing is uploaded to a server.

## CSV schema

| Column | Required | Notes |
| --- | --- | --- |
| `patient_id` (or `id`, `mrn`) | recommended | falls back to a generated ID |
| `name` | recommended | |
| `age`, `sex` | optional | display only |
| `admission_date`, `discharge_date` | optional | used to derive length of stay and default follow-up due date |
| `length_of_stay_days` | optional | overrides the date-derived value |
| `admission_type` | optional | `emergent` / `urgent` / `elective` — only `emergent` scores acuity points |
| `comorbidities` | optional | semicolon-separated conditions, e.g. `chf;copd;diabetes` |
| `charlson_score` | optional | overrides the comorbidity list if you already have a computed score |
| `ed_visits_6mo` | optional | ED visits in the 6 months before admission |
| `follow_up_due_date` | optional | explicit due date; inferred from discharge date + risk tier if omitted |
| `follow_up_completed_date` | optional | marks follow-up as completed |

See [`public/sample-patients.csv`](public/sample-patients.csv) for an example.

## Tech stack

React + TypeScript + Vite + Tailwind CSS. Risk/follow-up logic lives in
`src/lib/` as plain, unit-testable functions, independent of the UI.

## Roadmap ideas

- Persist uploaded data (currently in-memory only, cleared on refresh)
- CSV export of the filtered/flagged list for outreach worklists
- Configurable risk cutoffs and follow-up windows per care team
- Support for additional risk models beyond LACE
